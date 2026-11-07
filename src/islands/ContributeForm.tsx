/** @jsxImportSource preact */
/**
 * Modulo "Contribuisci": suggerimenti, segnalazioni di errori, appunti e materiali.
 *
 * - Con endpoint e sitekey configurati (SITE.contribute) invia al Google Apps Script
 *   (tools/apps-script): POST text/plain con JSON, quindi senza preflight CORS;
 *   gli allegati viaggiano in blocchi base64 da 4 MiB dopo la verifica Turnstile.
 * - Senza configurazione (o se l'invio fallisce) prepara un'email precompilata.
 *
 * Turnstile si carica solo alla prima interazione con il modulo: chi legge
 * la pagina senza compilarla non scarica nulla da terze parti.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  ACCEPT,
  CONTRIB_TYPES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  MESSAGE_MAX,
  NAME_MAX,
  buildMailto,
  chunksOf,
  formatBytes,
  prefillFromQuery,
  validateFields,
  validateFiles,
  type ContribFields,
  type ContribType,
  type FieldErrors,
} from '../lib/contribute/rules';
import './platform.css';

type Texts = Record<string, string>;

export interface ContributeFormProps {
  lang: 'it' | 'en';
  endpoint: string;
  siteKey: string;
  email: string;
  issuesUrl: string;
  privacyHref: string;
  courses: { id: string; title: string; year: number }[];
  texts: Texts;
}

declare global {
  interface Window {
    turnstile?: {
      render(el: HTMLElement, opts: Record<string, unknown>): string;
      reset(id?: string): void;
      remove(id?: string): void;
    };
    /** Solo per i test end-to-end: sostituisce endpoint e sitekey della build. */
    __SH_CONTRIBUTE__?: { endpoint: string; siteKey: string };
  }
}

type Status =
  | { kind: 'idle' }
  | { kind: 'sending'; sent: number; total: number }
  | { kind: 'done'; id: string }
  | { kind: 'mail' }
  | { kind: 'error'; code: string };

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const CLIENT_KEY = 'sh:v1:global:contribClient';

const fmt = (s: string, params: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));

function clientId(): string {
  try {
    const saved = JSON.parse(localStorage.getItem(CLIENT_KEY) ?? 'null');
    if (typeof saved === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(saved)) return saved;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_KEY, JSON.stringify(id));
    return id;
  } catch {
    return '';
  }
}

let turnstileLoading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  turnstileLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = TURNSTILE_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      turnstileLoading = null;
      reject(new Error('turnstile'));
    };
    document.head.appendChild(s);
  });
  return turnstileLoading;
}

async function call(endpoint: string, body: unknown): Promise<Record<string, any>> {
  const res = await fetch(endpoint, {
    method: 'POST',
    // text/plain: richiesta "semplice", nessun preflight (Apps Script non risponde a OPTIONS).
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`http_${res.status}`);
  return (await res.json()) as Record<string, any>;
}

async function callWithRetry(endpoint: string, body: unknown, tries = 3): Promise<Record<string, any>> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await call(endpoint, body);
      if (r.ok || r.error !== 'server') return r;
      last = new Error('server');
    } catch (err) {
      last = err;
    }
    await new Promise((r) => setTimeout(r, 600 * 2 ** i));
  }
  throw last;
}

const EMPTY: ContribFields = {
  tipo: 'errore',
  corso: '',
  pagina: '',
  messaggio: '',
  email: '',
  nome: '',
  consensoPrivacy: false,
  consensoDiritti: false,
  consensoPubblicazione: false,
};

const FIELD_ORDER: (keyof FieldErrors)[] = [
  'tipo',
  'corso',
  'pagina',
  'messaggio',
  'email',
  'nome',
  'files',
  'consensoPrivacy',
  'consensoDiritti',
  'consensoPubblicazione',
];

export default function ContributeForm(props: ContributeFormProps) {
  const { lang, email, issuesUrl, privacyHref, courses, texts: T } = props;
  const override = typeof window !== 'undefined' ? window.__SH_CONTRIBUTE__ : undefined;
  const endpoint = override?.endpoint ?? props.endpoint;
  const siteKey = override?.siteKey ?? props.siteKey;
  const online = endpoint !== '' && siteKey !== '';

  const [f, setF] = useState<ContribFields>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [token, setToken] = useState('');
  const [tsState, setTsState] = useState<'off' | 'loading' | 'ready' | 'failed'>('off');
  const startedAt = useRef(Date.now());
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const summary = useRef<HTMLDivElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pre = prefillFromQuery(
      location.search,
      courses.map((c) => c.id),
    );
    if (Object.keys(pre).length) setF((cur) => ({ ...cur, ...pre }));
    startedAt.current = Date.now();
  }, []);

  const set = <K extends keyof ContribFields>(k: K, v: ContribFields[K]) => {
    setF((cur) => {
      const next = { ...cur, [k]: v };
      if (showErrors) setErrors(validateFields(next, files));
      return next;
    });
  };

  const ensureTurnstile = () => {
    if (!online || tsState !== 'off') return;
    setTsState('loading');
    loadTurnstile()
      .then(() => {
        if (!widget.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(widget.current, {
          sitekey: siteKey,
          action: 'contribute',
          language: lang,
          theme: document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
          appearance: 'interaction-only',
          callback: (tk: string) => setToken(tk),
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        });
        setTsState('ready');
      })
      .catch(() => setTsState('failed'));
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!next.some((x) => x.name === file.name && x.size === file.size)) next.push(file);
    }
    setFiles(next);
    setErrors((e) => {
      const fe = validateFiles(next);
      const copy = { ...e };
      if (fe) copy.files = fe;
      else delete copy.files;
      return copy;
    });
    if (fileInput.current) fileInput.current.value = '';
  };

  const removeFile = (i: number) => {
    const next = files.filter((_, j) => j !== i);
    setFiles(next);
    setErrors((e) => {
      const fe = validateFiles(next);
      const copy = { ...e };
      if (fe) copy.files = fe;
      else delete copy.files;
      return copy;
    });
  };

  const totalBytes = files.reduce((s, x) => s + x.size, 0);

  const mailto = useMemo(
    () =>
      buildMailto(
        email,
        T.subject ?? '',
        f,
        {
          type: T.typeLabel ?? '',
          course: T.courseLabel ?? '',
          page: T.pageLabel ?? '',
          name: T.nameLabel ?? '',
          attach: T.mailAttach ?? '',
        },
        files.length > 0,
      ),
    [f, files.length, email],
  );

  const errorText = (field: keyof FieldErrors, code: string) => {
    const specific = T[`err.${field}.${code}`];
    if (specific) return specific;
    return fmt(T[`err.${code}`] ?? T['err.invalid'] ?? '', {
      min: 10,
      max: field === 'nome' ? NAME_MAX : MESSAGE_MAX,
      files: MAX_FILES,
      size: formatBytes(MAX_TOTAL_BYTES, lang),
    });
  };

  const onSubmit = async (ev: Event) => {
    ev.preventDefault();
    const errs = validateFields(f, files);
    setErrors(errs);
    setShowErrors(true);
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    if (!online) {
      setStatus({ kind: 'mail' });
      requestAnimationFrame(() => result.current?.focus());
      location.href = mailto;
      return;
    }
    if (!token) {
      setStatus({ kind: 'error', code: tsState === 'failed' ? 'turnstile_load' : 'turnstile_wait' });
      ensureTurnstile();
      return;
    }
    const total = totalBytes;
    setStatus({ kind: 'sending', sent: 0, total });
    try {
      const sub = await call(endpoint, {
        action: 'submit',
        turnstileToken: token,
        payload: {
          ...f,
          lingua: lang,
          website: honeypot.current?.value ?? '',
          elapsedMs: Date.now() - startedAt.current,
          clientId: clientId(),
          files: files.map((x) => ({ name: x.name, size: x.size, type: x.type })),
        },
      });
      if (!sub.ok) {
        if (sub.error === 'validation' && sub.fields) setErrors(sub.fields as FieldErrors);
        throw Object.assign(new Error(String(sub.error)), { code: String(sub.error) });
      }
      if (sub.uploadToken) {
        let sent = 0;
        const size = Number(sub.chunkBytes) || undefined;
        for (let fi = 0; fi < files.length; fi++) {
          const file = files[fi]!;
          const buf = await file.arrayBuffer();
          let ci = 0;
          for (const data of chunksOf(buf, size)) {
            const r = await callWithRetry(endpoint, {
              action: 'chunk',
              id: sub.id,
              uploadToken: sub.uploadToken,
              fileIndex: fi,
              chunkIndex: ci,
              data,
            });
            if (!r.ok) throw Object.assign(new Error(String(r.error)), { code: String(r.error) });
            sent +=
              Math.round((data.length * 3) / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
            setStatus({ kind: 'sending', sent: Math.min(sent, total), total });
            ci++;
          }
        }
        const fin = await callWithRetry(endpoint, {
          action: 'finalize',
          id: sub.id,
          uploadToken: sub.uploadToken,
        });
        if (!fin.ok) throw Object.assign(new Error(String(fin.error)), { code: String(fin.error) });
      }
      setStatus({ kind: 'done', id: String(sub.id) });
      setF({ ...EMPTY, corso: f.corso, pagina: f.pagina, tipo: f.tipo });
      setFiles([]);
      setShowErrors(false);
      requestAnimationFrame(() => result.current?.focus());
    } catch (err) {
      const code = (err as { code?: string }).code ?? 'network';
      setStatus({ kind: 'error', code });
      requestAnimationFrame(() => result.current?.focus());
    } finally {
      setToken('');
      if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current);
    }
  };

  const busy = status.kind === 'sending';
  const err = (k: keyof FieldErrors) => (showErrors || k === 'files' ? errors[k] : undefined);
  const describedBy = (k: string, hint?: boolean) =>
    [hint ? `cf-${k}-hint` : '', err(k as keyof FieldErrors) ? `cf-${k}-err` : '']
      .filter(Boolean)
      .join(' ') || undefined;
  const errorList = FIELD_ORDER.filter((k) => showErrors && errors[k]);
  const years = [...new Set(courses.map((c) => c.year))];

  if (status.kind === 'done') {
    return (
      <div class="pf-cf-result" data-tone="success" role="status" tabIndex={-1} ref={result}>
        <h2 class="pf-cf-result__title">{T.doneTitle}</h2>
        <p>{T.doneBody}</p>
        <p class="muted">
          {T.doneId} <code>{status.id}</code>
        </p>
        <div class="btn-row">
          <button type="button" class="btn" onClick={() => setStatus({ kind: 'idle' })}>
            {T.again}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      class="pf-cf"
      noValidate
      onSubmit={onSubmit}
      onFocusIn={ensureTurnstile}
      onPointerDown={ensureTurnstile}
      aria-describedby="cf-intro"
    >
      <p id="cf-intro" class="pf-cf__intro">
        {online ? T.introOnline : T.introOffline} <span class="muted">{T.required}</span>
      </p>

      {errorList.length > 0 && (
        <div
          class="pf-cf-summary"
          role="alert"
          tabIndex={-1}
          ref={summary}
          aria-labelledby="cf-summary-title"
        >
          <p id="cf-summary-title" class="pf-cf-summary__title">
            {fmt(T.summary ?? '', { n: errorList.length })}
          </p>
          <ul>
            {errorList.map((k) => (
              <li key={k}>
                <a href={`#cf-${k}`}>
                  {T[`field.${k}`]}: {errorText(k, errors[k]!)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <fieldset class="pf-cf__types">
        <legend class="field__label">{T.typeLabel} *</legend>
        <div class="segmented pf-cf__segmented" id="cf-tipo">
          {CONTRIB_TYPES.map((k) => (
            <label key={k} class="pf-cf__type">
              <input
                type="radio"
                name="tipo"
                value={k}
                checked={f.tipo === k}
                onChange={() => set('tipo', k as ContribType)}
              />
              <span>{T[`type.${k}`]}</span>
            </label>
          ))}
        </div>
        <p class="field__hint">{T[`typeHint.${f.tipo}`]}</p>
      </fieldset>

      <div class="pf-cf__row">
        <div class="field">
          <label class="field__label" for="cf-corso">
            {T.courseLabel}
          </label>
          <select
            id="cf-corso"
            class="select"
            value={f.corso}
            onChange={(e) => set('corso', e.currentTarget.value)}
          >
            <option value="">{T.courseGeneral}</option>
            {years.map((y) => (
              <optgroup key={y} label={fmt(T.year ?? '', { year: y })}>
                {courses
                  .filter((c) => c.year === y)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div class="field">
          <label class="field__label" for="cf-pagina">
            {T.pageLabel}
          </label>
          <input
            id="cf-pagina"
            class="input input--mono"
            type="text"
            inputMode="url"
            autoComplete="off"
            spellcheck={false}
            placeholder={T.pagePlaceholder}
            value={f.pagina}
            aria-invalid={err('pagina') ? 'true' : undefined}
            aria-describedby={describedBy('pagina', true)}
            onInput={(e) => set('pagina', e.currentTarget.value)}
          />
          <p class="field__hint" id="cf-pagina-hint">
            {T.pageHint}
          </p>
          {err('pagina') && (
            <p class="field__error" id="cf-pagina-err">
              {errorText('pagina', err('pagina')!)}
            </p>
          )}
        </div>
      </div>

      <div class="field">
        <label class="field__label" for="cf-messaggio">
          {T.messageLabel} *
        </label>
        <textarea
          id="cf-messaggio"
          class="textarea"
          rows={7}
          maxLength={MESSAGE_MAX}
          required
          value={f.messaggio}
          placeholder={T[`placeholder.${f.tipo}`]}
          aria-invalid={err('messaggio') ? 'true' : undefined}
          aria-describedby={describedBy('messaggio', true)}
          onInput={(e) => set('messaggio', e.currentTarget.value)}
        />
        <p class="field__hint pf-cf__counter" id="cf-messaggio-hint">
          {T.messageHint}{' '}
          <span class="pf-cf__count">
            {f.messaggio.length.toLocaleString(lang)} / {MESSAGE_MAX.toLocaleString(lang)}
          </span>
        </p>
        {err('messaggio') && (
          <p class="field__error" id="cf-messaggio-err">
            {errorText('messaggio', err('messaggio')!)}
          </p>
        )}
      </div>

      <div class="field">
        <span class="field__label" id="cf-files-label">
          {T.filesLabel}
        </span>
        <p class="field__hint" id="cf-files-hint">
          {fmt(T.filesHint ?? '', { files: MAX_FILES, size: formatBytes(MAX_TOTAL_BYTES, lang) })}
        </p>
        <div class="pf-cf-drop" id="cf-files">
          <input
            ref={fileInput}
            id="cf-files-input"
            class="visually-hidden"
            type="file"
            multiple
            accept={ACCEPT}
            disabled={busy}
            aria-labelledby="cf-files-label"
            aria-describedby={describedBy('files', true)}
            onChange={(e) => addFiles(e.currentTarget.files)}
          />
          <label class="btn btn--sm" for="cf-files-input">
            {T.filesAdd}
          </label>
          <span class="muted">
            {files.length === 0
              ? T.filesNone
              : fmt(T.filesTotal ?? '', { n: files.length, size: formatBytes(totalBytes, lang) })}
          </span>
        </div>
        {files.length > 0 && (
          <ul class="pf-cf-files" aria-label={T.filesLabel}>
            {files.map((x, i) => (
              <li key={`${x.name}-${x.size}`}>
                <span class="pf-cf-files__name">{x.name}</span>
                <span class="pf-cf-files__size">{formatBytes(x.size, lang)}</span>
                <button
                  type="button"
                  class="btn btn--ghost btn--sm"
                  disabled={busy}
                  aria-label={fmt(T.filesRemove ?? '', { name: x.name })}
                  onClick={() => removeFile(i)}
                >
                  {T.remove}
                </button>
              </li>
            ))}
          </ul>
        )}
        {err('files') && (
          <p class="field__error" id="cf-files-err" role="alert">
            {errorText('files', err('files')!)}
          </p>
        )}
        {!online && files.length > 0 && <p class="pf-note">{T.filesOffline}</p>}
      </div>

      <div class="pf-cf__row">
        <div class="field">
          <label class="field__label" for="cf-email">
            {T.emailLabel}
          </label>
          <input
            id="cf-email"
            class="input"
            type="email"
            autoComplete="email"
            maxLength={254}
            value={f.email}
            aria-invalid={err('email') ? 'true' : undefined}
            aria-describedby={describedBy('email', true)}
            onInput={(e) => set('email', e.currentTarget.value)}
          />
          <p class="field__hint" id="cf-email-hint">
            {T.emailHint}
          </p>
          {err('email') && (
            <p class="field__error" id="cf-email-err">
              {errorText('email', err('email')!)}
            </p>
          )}
        </div>
        <div class="field">
          <label class="field__label" for="cf-nome">
            {T.nameLabel}
          </label>
          <input
            id="cf-nome"
            class="input"
            type="text"
            autoComplete="nickname"
            maxLength={NAME_MAX}
            value={f.nome}
            aria-invalid={err('nome') ? 'true' : undefined}
            aria-describedby={describedBy('nome', true)}
            onInput={(e) => set('nome', e.currentTarget.value)}
          />
          <p class="field__hint" id="cf-nome-hint">
            {T.nameHint}
          </p>
          {err('nome') && (
            <p class="field__error" id="cf-nome-err">
              {errorText('nome', err('nome')!)}
            </p>
          )}
        </div>
      </div>

      {/* Campo trappola per i bot: invisibile e fuori dal tab order. */}
      <div class="pf-cf__trap" aria-hidden="true">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset class="pf-cf__consents">
        <legend class="field__label">{T.consentsLabel}</legend>
        {(['consensoPrivacy', 'consensoDiritti', 'consensoPubblicazione'] as const).map((k) => (
          <div key={k} class="pf-cf__consent">
            <label class="check pf-cf__check">
              <input
                id={`cf-${k}`}
                type="checkbox"
                checked={f[k]}
                required
                aria-invalid={err(k) ? 'true' : undefined}
                aria-describedby={err(k) ? `cf-${k}-err` : undefined}
                onChange={(e) => set(k, e.currentTarget.checked)}
              />
              <span>
                {T[`consent.${k}`]}
                {k === 'consensoPrivacy' && (
                  <>
                    {' '}
                    <a href={privacyHref}>{T.privacyLink}</a>
                  </>
                )}{' '}
                *
              </span>
            </label>
            {err(k) && (
              <p class="field__error" id={`cf-${k}-err`}>
                {errorText(k, err(k)!)}
              </p>
            )}
          </div>
        ))}
      </fieldset>

      {online && (
        <div class="pf-cf__captcha">
          <div ref={widget} />
          {tsState === 'failed' && <p class="pf-note">{T.turnstileFailed}</p>}
        </div>
      )}

      {status.kind === 'mail' && (
        <div class="pf-cf-result" data-tone="success" role="status" tabIndex={-1} ref={result}>
          <p class="pf-cf-result__title">{T.mailReady}</p>
          <p>{fmt(T.mailReadyBody ?? '', { email })}</p>
          <p>
            <a class="btn btn--sm" href={mailto} data-contribute-mailto>
              {T.mailOpen}
            </a>
          </p>
        </div>
      )}

      {status.kind === 'error' && (
        <div class="pf-cf-result" data-tone="danger" role="alert" tabIndex={-1} ref={result}>
          <p class="pf-cf-result__title">{T[`fail.${status.code}`] ?? T['fail.generic']}</p>
          <p>
            {T.failFallback} <a href={mailto}>{T.failMail}</a> · <a href={issuesUrl}>{T.failIssue}</a>
          </p>
        </div>
      )}

      {busy && (
        <div class="pf-cf-progress" role="status">
          <span>
            {status.total > 0
              ? fmt(T.uploading ?? '', {
                  sent: formatBytes(status.sent, lang),
                  total: formatBytes(status.total, lang),
                })
              : T.sending}
          </span>
          {status.total > 0 && (
            <progress
              class="progress__bar"
              max={status.total}
              value={status.sent}
              aria-label={T.progressLabel}
            />
          )}
        </div>
      )}

      <div class="btn-row pf-cf__actions">
        <button type="submit" class="btn btn--primary" disabled={busy}>
          {online ? (busy ? T.sending : T.submit) : T.submitMail}
        </button>
        {!online && (
          <a class="btn" href={issuesUrl} rel="noopener">
            {T.openIssue}
          </a>
        )}
      </div>
      {!online && <p class="field__hint">{fmt(T.mailNote ?? '', { email })}</p>}
    </form>
  );
}
