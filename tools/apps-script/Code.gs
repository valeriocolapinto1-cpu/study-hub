/**
 * study-hub · contributi — web app Google Apps Script.
 *
 * Riceve i contributi inviati dal modulo /<lingua>/contribuisci/ del sito,
 * li verifica (Turnstile, limiti, validazione), salva una riga nel foglio,
 * salva gli allegati su Drive e avvisa il proprietario via email.
 *
 * Protocollo (POST con corpo text/plain contenente JSON, così il browser non
 * invia una richiesta preliminare CORS):
 *   { action: 'submit',   payload, turnstileToken }        → { ok, id, uploadToken, chunkBytes }
 *   { action: 'chunk',    id, uploadToken, fileIndex, chunkIndex, data(base64) } → { ok, done }
 *   { action: 'finalize', id, uploadToken }                  → { ok, id }
 * Gli errori rispondono { ok: false, error: '<codice>', fields? }.
 *
 * Configurazione (Impostazioni progetto → Proprietà script):
 *   TURNSTILE_SECRET   chiave segreta di Cloudflare Turnstile (obbligatoria)
 *   DRIVE_FOLDER_ID    cartella "study-hub-contributi" (la crea inizializza())
 *   SHEET_ID           foglio dei contributi (lo crea inizializza())
 *   NOTIFY_EMAIL       destinatario delle notifiche (predefinito: proprietario dello script)
 *   ALLOWED_HOSTNAMES  host accettati da Turnstile, separati da virgola (facoltativo)
 *
 * La logica pura sta in Logic.gs.
 */

const UPLOAD_TTL_SECONDS = 6 * 60 * 60;
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_ACTION = 'contribute';

/* ------------------------------------------------------------------ ingresso */

function doGet() {
  return json_(result(true, { service: 'study-hub-contributi' }));
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '');
  } catch (err) {
    return json_(result(false, { error: 'bad_request' }));
  }
  try {
    switch (body && body.action) {
      case 'submit':
        return json_(handleSubmit_(body));
      case 'chunk':
        return json_(handleChunk_(body));
      case 'finalize':
        return json_(handleFinalize_(body));
      default:
        return json_(result(false, { error: 'bad_request' }));
    }
  } catch (err) {
    console.error('Errore non gestito', err && err.stack ? err.stack : err);
    return json_(result(false, { error: 'server' }));
  }
}

/* ------------------------------------------------------------------ azioni */

function handleSubmit_(body) {
  const payload = body.payload || {};
  if (isLikelySpam(payload)) {
    // Al bot rispondiamo come se fosse andata bene: nessun segnale da sfruttare.
    return result(true, { id: 'ok', uploadToken: null });
  }

  const cfg = config_();
  if (!cfg.turnstileSecret || !cfg.folderId || !cfg.sheetId) return result(false, { error: 'config' });

  const v = validateSubmission(payload);
  if (!v.ok) return result(false, { error: 'validation', fields: v.errors });
  const data = v.data;

  const ts = verifyTurnstile_(String(body.turnstileToken || ''), cfg);
  if (!ts.ok) return result(false, { error: 'turnstile', reason: ts.reason });

  const rl = consumeRateLimit_(data.email, payload.clientId);
  if (!rl.allowed) return result(false, { error: 'rate_limited' });

  const now = new Date();
  const id = makeSubmissionId(now, Utilities.getUuid().replace(/-/g, ''));
  const root = DriveApp.getFolderById(cfg.folderId);
  let folder = null;
  if (data.files.length) folder = root.createFolder(id);

  const hasFiles = data.files.length > 0;
  const sheet = sheet_(cfg);
  const row = appendRow_(sheet, buildSheetRow(id, now.toISOString(), data, hasFiles ? STATUS.uploading : STATUS.new, [], folder ? folder.getUrl() : ''));

  if (!hasFiles) {
    notify_(cfg, id, data, [], folder);
    return result(true, { id: id, uploadToken: null });
  }

  const uploadToken = Utilities.getUuid();
  saveUpload_(id, {
    token: uploadToken,
    row: row,
    folderId: folder.getId(),
    data: data,
    files: data.files.map(function (f) {
      return { name: f.name, mimeType: f.mimeType, ext: f.ext, size: f.size, chunks: f.chunks, received: 0, sessionUrl: '', fileId: '' };
    }),
  });
  return result(true, { id: id, uploadToken: uploadToken, chunkBytes: LIMITS.chunkBytes });
}

function handleChunk_(body) {
  const id = String(body.id || '');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const state = loadUpload_(id);
    if (!state || state.token !== body.uploadToken) return result(false, { error: 'upload_state' });
    const fi = Number(body.fileIndex);
    const ci = Number(body.chunkIndex);
    const file = state.files[fi];
    if (!file || ci !== file.received) return result(false, { error: 'chunk' });

    const bytes = Utilities.base64Decode(String(body.data || ''));
    if (bytes.length !== expectedChunkBytes(file.size, ci)) return result(false, { error: 'chunk' });
    if (ci === 0 && !sniffMatches(file.ext, bytes)) return result(false, { error: 'file_content' });

    if (file.chunks === 1) {
      const created = DriveApp.getFolderById(state.folderId).createFile(Utilities.newBlob(bytes, file.mimeType, file.name));
      file.fileId = created.getId();
    } else {
      if (ci === 0) file.sessionUrl = startResumableUpload_(file, state.folderId);
      const res = UrlFetchApp.fetch(file.sessionUrl, {
        method: 'put',
        contentType: file.mimeType,
        headers: { 'Content-Range': contentRange(file.size, ci, bytes.length) },
        payload: bytes,
        muteHttpExceptions: true,
      });
      const code = res.getResponseCode();
      const last = ci === file.chunks - 1;
      if (last) {
        if (code !== 200 && code !== 201) throw new Error('Upload Drive non completato: HTTP ' + code);
        file.fileId = JSON.parse(res.getContentText()).id;
      } else if (code !== 308) {
        throw new Error('Upload Drive interrotto: HTTP ' + code);
      }
    }
    file.received = ci + 1;
    saveUpload_(id, state);
    return result(true, { done: file.received === file.chunks });
  } finally {
    lock.releaseLock();
  }
}

function handleFinalize_(body) {
  const id = String(body.id || '');
  const cfg = config_();
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const state = loadUpload_(id);
    if (!state || state.token !== body.uploadToken) return result(false, { error: 'upload_state' });
    const incomplete = state.files.some(function (f) {
      return f.received !== f.chunks || !f.fileId;
    });
    if (incomplete) return result(false, { error: 'upload_incomplete' });

    const links = state.files.map(function (f) {
      return 'https://drive.google.com/file/d/' + f.fileId + '/view';
    });
    const folder = DriveApp.getFolderById(state.folderId);
    const sheet = sheet_(cfg);
    const statusCol = SHEET_HEADERS.indexOf('Stato') + 1;
    const filesCol = SHEET_HEADERS.indexOf('File') + 1;
    sheet.getRange(state.row, statusCol).setValue(STATUS.new);
    sheet.getRange(state.row, filesCol).setValue(sheetSafe(links.join('\n')));
    CacheService.getScriptCache().remove('up:' + id);
    notify_(cfg, id, state.data, links, folder);
    return result(true, { id: id });
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ servizi */

function config_() {
  const p = PropertiesService.getScriptProperties();
  return {
    turnstileSecret: p.getProperty('TURNSTILE_SECRET') || '',
    folderId: p.getProperty('DRIVE_FOLDER_ID') || '',
    sheetId: p.getProperty('SHEET_ID') || '',
    notifyEmail: p.getProperty('NOTIFY_EMAIL') || Session.getEffectiveUser().getEmail(),
    allowedHosts: parseAllowedHosts(p.getProperty('ALLOWED_HOSTNAMES')),
  };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function verifyTurnstile_(token, cfg) {
  if (!token || token.length > 2048) return { ok: false, reason: 'missing' };
  const res = UrlFetchApp.fetch(TURNSTILE_VERIFY_URL, {
    method: 'post',
    payload: { secret: cfg.turnstileSecret, response: token, idempotency_key: Utilities.getUuid() },
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) return { ok: false, reason: 'http_' + res.getResponseCode() };
  let parsed;
  try {
    parsed = JSON.parse(res.getContentText());
  } catch (err) {
    return { ok: false, reason: 'parse' };
  }
  return checkTurnstileResult(parsed, cfg.allowedHosts, TURNSTILE_ACTION);
}

function sha256Hex_(text) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return digest
    .map(function (b) {
      const v = (b & 0xff).toString(16);
      return v.length === 1 ? '0' + v : v;
    })
    .join('')
    .slice(0, 32);
}

function consumeRateLimit_(email, clientId) {
  const cache = CacheService.getScriptCache();
  const keys = rateLimitKeys(email, clientId, sha256Hex_);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const names = Object.keys(keys);
    const stored = cache.getAll(names.map(function (n) {
      return keys[n];
    }));
    const counts = {};
    names.forEach(function (n) {
      counts[n] = Number(stored[keys[n]] || 0);
    });
    const decision = evaluateRateLimit(counts);
    if (!decision.allowed) return decision;
    const next = {};
    names.forEach(function (n) {
      next[keys[n]] = String(counts[n] + 1);
    });
    cache.putAll(next, RATE_LIMITS.windowSeconds);
    return decision;
  } finally {
    lock.releaseLock();
  }
}

function sheet_(cfg) {
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(SHEET_HEADERS);
  return sheet;
}

/** Aggiunge la riga e ne restituisce il numero (sotto lock, per non confondere invii simultanei). */
function appendRow_(sheet, values) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet.appendRow(values);
    return sheet.getLastRow();
  } finally {
    lock.releaseLock();
  }
}

function saveUpload_(id, state) {
  CacheService.getScriptCache().put('up:' + id, JSON.stringify(state), UPLOAD_TTL_SECONDS);
}

function loadUpload_(id) {
  if (!/^[0-9]{8}-[0-9]{6}-[a-f0-9]{1,6}$/.test(id)) return null;
  const raw = CacheService.getScriptCache().get('up:' + id);
  return raw ? JSON.parse(raw) : null;
}

/** Apre una sessione di upload ripristinabile di Drive e ne restituisce l'URL. */
function startResumableUpload_(file, folderId) {
  const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true', {
    method: 'post',
    contentType: 'application/json; charset=UTF-8',
    headers: {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': file.mimeType,
      'X-Upload-Content-Length': String(file.size),
    },
    payload: JSON.stringify({ name: file.name, parents: [folderId], mimeType: file.mimeType }),
    muteHttpExceptions: true,
  });
  const headers = res.getHeaders();
  const location = headers.Location || headers.location;
  if (res.getResponseCode() !== 200 || !location) throw new Error('Sessione di upload non aperta: HTTP ' + res.getResponseCode());
  return location;
}

function notify_(cfg, id, data, links, folder) {
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const msg = buildNotification(id, data, links, ss.getUrl(), folder ? folder.getUrl() : '');
  const options = { name: 'study-hub · contributi' };
  if (data.email) options.replyTo = data.email;
  MailApp.sendEmail(cfg.notifyEmail, msg.subject, msg.body, options);
}

/* ------------------------------------------------------------------ manutenzione (da eseguire dall'editor) */

/**
 * Crea (se mancano) la cartella Drive "study-hub-contributi" e il foglio dei
 * contributi al suo interno, scrive le intestazioni e salva gli ID nelle
 * proprietà dello script. Si può rieseguire senza danni.
 */
function inizializza() {
  const props = PropertiesService.getScriptProperties();
  let folderId = props.getProperty('DRIVE_FOLDER_ID');
  let folder;
  if (folderId) {
    folder = DriveApp.getFolderById(folderId);
  } else {
    const it = DriveApp.getFoldersByName('study-hub-contributi');
    folder = it.hasNext() ? it.next() : DriveApp.createFolder('study-hub-contributi');
    folderId = folder.getId();
    props.setProperty('DRIVE_FOLDER_ID', folderId);
  }
  let sheetId = props.getProperty('SHEET_ID');
  if (!sheetId) {
    const ss = SpreadsheetApp.create('study-hub-contributi');
    DriveApp.getFileById(ss.getId()).moveTo(folder);
    sheetId = ss.getId();
    props.setProperty('SHEET_ID', sheetId);
  }
  const sheet = SpreadsheetApp.openById(sheetId).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, SHEET_HEADERS.length).setFontWeight('bold');
  }
  verificaConfigurazione();
}

/** Scrive nel log lo stato della configurazione, senza mostrare i segreti. */
function verificaConfigurazione() {
  const cfg = config_();
  const report = [
    'TURNSTILE_SECRET: ' + (cfg.turnstileSecret ? 'impostata' : 'MANCANTE'),
    'DRIVE_FOLDER_ID: ' + (cfg.folderId ? DriveApp.getFolderById(cfg.folderId).getName() : 'MANCANTE'),
    'SHEET_ID: ' + (cfg.sheetId ? SpreadsheetApp.openById(cfg.sheetId).getUrl() : 'MANCANTE'),
    'NOTIFY_EMAIL: ' + cfg.notifyEmail,
    'ALLOWED_HOSTNAMES: ' + cfg.allowedHosts.join(', '),
  ];
  console.log(report.join('\n'));
  return report;
}
