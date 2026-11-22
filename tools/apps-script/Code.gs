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
 *   { action: 'chunk',    id, uploadToken, fileIndex, chunkIndex, data(base64) } → { ok, done, received }
 *   { action: 'finalize', id, uploadToken }                  → { ok, id }
 *   { action: 'cancel',   id, uploadToken }                  → { ok }
 * Gli errori rispondono { ok: false, error: '<codice>', fields? }. Un blocco
 * fuori sequenza risponde { ok: false, error: 'chunk', received }: il browser
 * riprende da `received`. Un blocco già ricevuto risponde come se fosse nuovo
 * (il browser può ripeterlo se la risposta si è persa). `busy` vuol dire che
 * un'altra richiesta sullo stesso upload è ancora in corso: si ritenta.
 *
 * Configurazione (Impostazioni progetto → Proprietà script):
 *   TURNSTILE_SECRET   chiave segreta di Cloudflare Turnstile (obbligatoria)
 *   DRIVE_FOLDER_ID    cartella "study-hub-contributi" (la crea inizializza())
 *   SHEET_ID           foglio dei contributi (lo crea inizializza())
 *   NOTIFY_EMAIL       destinatario delle notifiche (predefinito: proprietario dello script)
 *   ALLOWED_HOSTNAMES  host accettati da Turnstile, separati da virgola (facoltativo)
 *
 * Stato degli upload: proprietà dello script `up:<id>` (persistenti, a
 * differenza di CacheService che può scartarle prima del tempo). La funzione
 * pulizia(), con un attivatore orario creato da inizializza(), scarta gli
 * upload abbandonati da più di 6 ore.
 *
 * La logica pura sta in Logic.gs.
 */

const UPLOAD_TTL_MS = 6 * 60 * 60 * 1000;
/** Dopo questo tempo una richiesta rimasta «in corso» su un upload si considera persa. */
const UPLOAD_BUSY_MS = 2 * 60 * 1000;
/** Limite di Apps Script per un valore delle proprietà (9 KB), con margine. */
const UPLOAD_STATE_MAX = 8500;
const LOCK_WAIT_MS = 10000;
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
      case 'cancel':
        return json_(handleCancel_(body));
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
  const hasFiles = data.files.length > 0;
  const folder = hasFiles ? DriveApp.getFolderById(cfg.folderId).createFolder(id) : null;

  const sheet = sheet_(cfg);
  // appendRow è atomica: il numero di riga non serve, la riga si ritrova per ID.
  sheet.appendRow(
    buildSheetRow(
      id,
      now.toISOString(),
      data,
      hasFiles ? STATUS.uploading : STATUS.new,
      [],
      folder ? folder.getUrl() : '',
    ),
  );

  if (!hasFiles) {
    notifySafe_(cfg, sheet, id, data, [], null);
    return result(true, { id: id, uploadToken: null });
  }

  const uploadToken = Utilities.getUuid();
  saveUpload_(id, {
    token: uploadToken,
    folderId: folder.getId(),
    files: data.files.map(function (f) {
      // Nome, tipo e dimensione bastano: il messaggio resta nel foglio.
      return { name: f.name, size: f.size, chunks: f.chunks, received: 0, sessionUrl: '', fileId: '' };
    }),
  });
  return result(true, { id: id, uploadToken: uploadToken, chunkBytes: LIMITS.chunkBytes });
}

function handleChunk_(body) {
  const id = String(body.id || '');
  const fi = Number(body.fileIndex);
  const ci = Number(body.chunkIndex);

  // 1. Sotto lock, solo il tempo di leggere e segnare lo stato: l'upload è «occupato».
  const claim = withScriptLock_(function () {
    const state = loadUpload_(id);
    if (!state || state.token !== body.uploadToken)
      return { response: result(false, { error: 'upload_state' }) };
    const file = state.files[fi];
    if (!file || !Number.isInteger(ci) || ci < 0 || ci >= file.chunks)
      return { response: result(false, { error: 'chunk' }) };
    if (ci < file.received)
      // Già ricevuto (la risposta precedente si è persa): nessun lavoro da rifare.
      return { response: result(true, { done: file.received === file.chunks, received: file.received }) };
    if (ci > file.received) return { response: result(false, { error: 'chunk', received: file.received }) };
    if (isBusy_(state)) return { response: result(false, { error: 'busy' }) };
    state.busy = { by: Utilities.getUuid(), at: Date.now() };
    saveUpload_(id, state);
    return { by: state.busy.by, folderId: state.folderId, file: file };
  });
  if (claim.response) return claim.response;

  // 2. Fuori dal lock: decodifica, controlli e trasferimento verso Drive.
  let update = null;
  let response;
  try {
    const out = storeChunk_(claim.file, claim.folderId, ci, String(body.data || ''));
    if (out.error) response = result(false, { error: out.error });
    else update = out;
  } finally {
    // 3. Di nuovo sotto lock: registra il blocco e libera l'upload (anche se il trasferimento è fallito).
    response =
      withScriptLock_(function () {
        const state = loadUpload_(id);
        if (!state) return response || result(false, { error: 'upload_state' });
        if (state.busy && state.busy.by === claim.by) delete state.busy;
        const file = state.files[fi];
        if (update && file.received === ci) {
          if (update.sessionUrl) file.sessionUrl = update.sessionUrl;
          if (update.fileId) file.fileId = update.fileId;
          file.received = ci + 1;
        }
        saveUpload_(id, state);
        return update
          ? result(true, { done: file.received === file.chunks, received: file.received })
          : response;
      }) || response;
  }
  return response;
}

/**
 * Salva un blocco su Drive. Restituisce { error } per i blocchi non accettabili,
 * altrimenti { sessionUrl?, fileId? } da registrare nello stato.
 */
function storeChunk_(file, folderId, ci, base64) {
  const bytes = Utilities.base64Decode(base64);
  if (bytes.length !== expectedChunkBytes(file.size, ci)) return { error: 'chunk' };
  const ext = fileExtension(file.name);
  if (ci === 0 && !sniffMatches(ext, bytes)) return { error: 'file_content' };
  const mimeType = ALLOWED_EXTENSIONS[ext];

  if (file.chunks === 1) {
    const created = DriveApp.getFolderById(folderId).createFile(
      Utilities.newBlob(bytes, mimeType, file.name),
    );
    return { fileId: created.getId() };
  }
  const sessionUrl = ci === 0 ? startResumableUpload_(file, mimeType, folderId) : file.sessionUrl;
  const res = UrlFetchApp.fetch(sessionUrl, {
    method: 'put',
    contentType: mimeType,
    headers: { 'Content-Range': contentRange(file.size, ci, bytes.length) },
    payload: bytes,
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (ci === file.chunks - 1) {
    if (code !== 200 && code !== 201) throw new Error('Upload Drive non completato: HTTP ' + code);
    return { sessionUrl: sessionUrl, fileId: JSON.parse(res.getContentText()).id };
  }
  if (code !== 308) throw new Error('Upload Drive interrotto: HTTP ' + code);
  return { sessionUrl: sessionUrl };
}

function handleFinalize_(body) {
  const id = String(body.id || '');
  const cfg = config_();
  const claim = withScriptLock_(function () {
    const state = loadUpload_(id);
    if (!state || state.token !== body.uploadToken)
      return { response: result(false, { error: 'upload_state' }) };
    const incomplete = state.files.some(function (f) {
      return f.received !== f.chunks || !f.fileId;
    });
    if (incomplete) return { response: result(false, { error: 'upload_incomplete' }) };
    if (isBusy_(state)) return { response: result(false, { error: 'busy' }) };
    state.busy = { by: Utilities.getUuid(), at: Date.now() };
    saveUpload_(id, state);
    return { by: state.busy.by, state: state };
  });
  if (claim.response) return claim.response;

  const state = claim.state;
  let done = false;
  try {
    const sheet = sheet_(cfg);
    const row = findRowById_(sheet, id);
    // Riga cancellata a mano o già scartata: l'invio non esiste più.
    if (!row || sheet.getRange(row, col_('Stato')).getValue() !== STATUS.uploading) {
      done = true;
      return result(false, { error: 'upload_state' });
    }
    const links = state.files.map(function (f) {
      return 'https://drive.google.com/file/d/' + f.fileId + '/view';
    });
    const values = sheet.getRange(row, 1, 1, SHEET_HEADERS.length).getValues()[0];
    sheet.getRange(row, col_('Stato')).setValue(STATUS.new);
    sheet.getRange(row, col_('File')).setValue(sheetSafe(links.join('\n')));
    done = true;
    notifySafe_(cfg, sheet, id, dataFromSheetRow(values), links, DriveApp.getFolderById(state.folderId));
    return result(true, { id: id });
  } finally {
    withScriptLock_(function () {
      if (done) return deleteUpload_(id);
      const current = loadUpload_(id);
      if (current && current.busy && current.busy.by === claim.by) {
        delete current.busy;
        saveUpload_(id, current);
      }
    });
  }
}

/** Annullamento dal browser: la riga diventa «scartato», la cartella va nel cestino. */
function handleCancel_(body) {
  const id = String(body.id || '');
  const state = withScriptLock_(function () {
    const s = loadUpload_(id);
    if (!s || s.token !== body.uploadToken) return null;
    deleteUpload_(id);
    return s;
  });
  if (!state) return result(false, { error: 'upload_state' });
  discardSubmission_(sheet_(config_()), id, state.folderId, 'Invio annullato da chi lo stava inviando.');
  return result(true);
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
  const now = Date.now();
  const keys = rateLimitKeys(email, clientId, sha256Hex_, rateLimitBucket(now));
  return withScriptLock_(function () {
    const names = Object.keys(keys);
    const stored = cache.getAll(
      names.map(function (n) {
        return keys[n];
      }),
    );
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
    // Scadenza alla fine del secchio orario: riscrivere non allunga la finestra.
    cache.putAll(next, rateLimitTtlSeconds(now));
    return decision;
  });
}

/** Esegue `fn` sotto lo ScriptLock, da tenere solo per letture e scritture brevi dello stato. */
function withScriptLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(LOCK_WAIT_MS);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

/** Vero se un'altra richiesta sta lavorando sullo stesso upload (mutex per singolo upload). */
function isBusy_(state) {
  return !!state.busy && Date.now() - state.busy.at < UPLOAD_BUSY_MS;
}

function sheet_(cfg) {
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(SHEET_HEADERS);
  return sheet;
}

/** Colonna (da 1) di un'intestazione del foglio. */
function col_(name) {
  return SHEET_HEADERS.indexOf(name) + 1;
}

/**
 * Numero di riga dell'invio `id`, cercato nella colonna ID (0 se non c'è).
 * Non si memorizza il numero all'invio: il foglio può essere ordinato o
 * avere righe cancellate mentre gli allegati arrivano.
 */
function findRowById_(sheet, id) {
  const last = sheet.getLastRow();
  if (!id || last < 2) return 0;
  const cell = sheet
    .getRange(2, col_('ID'), last - 1, 1)
    .createTextFinder(id)
    .matchCase(true)
    .matchEntireCell(true)
    .findNext();
  return cell ? cell.getRow() : 0;
}

function saveUpload_(id, state) {
  const raw = JSON.stringify(state);
  if (raw.length > UPLOAD_STATE_MAX) throw new Error('Stato di upload troppo grande: ' + raw.length);
  PropertiesService.getScriptProperties().setProperty('up:' + id, raw);
}

function loadUpload_(id) {
  if (!/^[0-9]{8}-[0-9]{6}-[a-f0-9]{1,6}$/.test(id)) return null;
  // Oltre le 6 ore l'upload non è più valido, anche prima che pulizia() lo rimuova.
  if (isUploadStale(id, Date.now(), UPLOAD_TTL_MS)) return null;
  const raw = PropertiesService.getScriptProperties().getProperty('up:' + id);
  return raw ? JSON.parse(raw) : null;
}

function deleteUpload_(id) {
  PropertiesService.getScriptProperties().deleteProperty('up:' + id);
}

/** Apre una sessione di upload ripristinabile di Drive e ne restituisce l'URL. */
function startResumableUpload_(file, mimeType, folderId) {
  const res = UrlFetchApp.fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true',
    {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(file.size),
      },
      payload: JSON.stringify({ name: file.name, parents: [folderId], mimeType: mimeType }),
      muteHttpExceptions: true,
    },
  );
  const headers = res.getHeaders();
  const location = headers.Location || headers.location;
  if (res.getResponseCode() !== 200 || !location)
    throw new Error('Sessione di upload non aperta: HTTP ' + res.getResponseCode());
  return location;
}

function notify_(cfg, id, data, links, folder) {
  const ss = SpreadsheetApp.openById(cfg.sheetId);
  const msg = buildNotification(id, data, links, ss.getUrl(), folder ? folder.getUrl() : '');
  const options = { name: 'study-hub · contributi' };
  if (data.email) options.replyTo = data.email;
  MailApp.sendEmail(cfg.notifyEmail, msg.subject, msg.body, options);
}

/**
 * La notifica è un di più: se MailApp fallisce (quota giornaliera esaurita,
 * indirizzo non valido) il contributo è comunque salvato. L'errore finisce
 * nella colonna Note della riga, così nel foglio si vede cosa rileggere.
 */
function notifySafe_(cfg, sheet, id, data, links, folder) {
  try {
    notify_(cfg, id, data, links, folder);
  } catch (err) {
    console.error('Notifica non inviata', id, err && err.stack ? err.stack : err);
    addNote_(
      sheet,
      id,
      'Email di notifica non inviata: ' + String((err && err.message) || err).slice(0, 200),
    );
  }
}

/** Aggiunge una nota alla riga dell'invio, senza mai far fallire la richiesta. */
function addNote_(sheet, id, text) {
  try {
    const row = findRowById_(sheet, id);
    if (!row) return;
    const cell = sheet.getRange(row, col_('Note'));
    const old = unSheetSafe(cell.getValue());
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    cell.setValue(sheetSafe((old ? old + '\n' : '') + stamp + ' UTC · ' + text));
  } catch (err) {
    console.error('Nota non scritta', id, err);
  }
}

/** Segna l'invio come scartato e mette nel cestino la sua cartella di allegati. */
function discardSubmission_(sheet, id, folderId, note) {
  const row = findRowById_(sheet, id);
  if (row && sheet.getRange(row, col_('Stato')).getValue() === STATUS.uploading) {
    sheet.getRange(row, col_('Stato')).setValue(STATUS.rejected);
    addNote_(sheet, id, note);
  }
  if (!folderId) return;
  try {
    DriveApp.getFolderById(folderId).setTrashed(true);
  } catch (err) {
    console.error('Cartella non spostata nel cestino', id, folderId, err);
  }
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
  // Fogli creati prima della colonna Note: si aggiunge l'intestazione in coda.
  if (sheet.getRange(1, col_('Note')).getValue() !== 'Note') sheet.getRange(1, col_('Note')).setValue('Note');
  installaPulizia();
  verificaConfigurazione();
}

/**
 * Scarta gli upload abbandonati: righe «in-caricamento» più vecchie di 6 ore
 * diventano «scartato» (con una nota), la loro cartella va nel cestino e lo
 * stato viene eliminato. Rimuove anche gli stati rimasti senza riga.
 * Gira ogni ora con l'attivatore creato da installaPulizia().
 */
function pulizia() {
  const cfg = config_();
  if (!cfg.sheetId) return { scartati: 0, stati: 0 };
  const now = Date.now();
  const props = PropertiesService.getScriptProperties();
  const sheet = sheet_(cfg);
  const last = sheet.getLastRow();
  const rows = last > 1 ? sheet.getRange(2, 1, last - 1, SHEET_HEADERS.length).getValues() : [];
  let scartati = 0;
  rows.forEach(function (row) {
    const id = String(row[col_('ID') - 1]);
    if (row[col_('Stato') - 1] !== STATUS.uploading || !isUploadStale(id, now, UPLOAD_TTL_MS)) return;
    const raw = props.getProperty('up:' + id);
    const folderId =
      (raw && JSON.parse(raw).folderId) || folderIdFromUrl(unSheetSafe(row[col_('Cartella') - 1]));
    withScriptLock_(function () {
      deleteUpload_(id);
    });
    discardSubmission_(sheet, id, folderId, 'Allegati non completati entro 6 ore: scartato automaticamente.');
    scartati++;
  });
  let stati = 0;
  Object.keys(props.getProperties()).forEach(function (key) {
    if (key.indexOf('up:') !== 0 || !isUploadStale(key.slice(3), now, UPLOAD_TTL_MS)) return;
    props.deleteProperty(key);
    stati++;
  });
  console.log('Pulizia: ' + scartati + ' invii scartati, ' + stati + ' stati rimossi.');
  return { scartati: scartati, stati: stati };
}

/** Crea (una sola volta) l'attivatore orario di pulizia(). */
function installaPulizia() {
  const exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === 'pulizia';
  });
  if (!exists) ScriptApp.newTrigger('pulizia').timeBased().everyHours(1).create();
  return !exists;
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
    'Pulizia oraria: ' +
      (ScriptApp.getProjectTriggers().some(function (t) {
        return t.getHandlerFunction() === 'pulizia';
      })
        ? 'attiva'
        : 'MANCANTE (esegui installaPulizia)'),
  ];
  console.log(report.join('\n'));
  return report;
}
