/** @jsxImportSource preact */
/**
 * Modulo "Contribuisci": suggerimenti, segnalazioni di errori, appunti e materiali.
 *
 * - Con endpoint e sitekey configurati (SITE.contribute) invia al Google Apps Script
 *   (tools/apps-script) con il protocollo di src/lib/contribute/upload.ts: allegati
 *   in blocchi da 4 MiB dopo la verifica Turnstile, ritentativi con attesa
 *   crescente, ripresa dall'ultimo blocco ricevuto, annullamento.
 * - Senza configurazione (o se l'invio fallisce) prepara un'email precompilata.
 *
 * Turnstile si carica solo alla prima interazione con il modulo: chi legge
 * la pagina senza compilarla non scarica nulla da terze parti.
 */
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  MAX_FILES,
  MAX_TOTAL_BYTES,
  MESSAGE_MAX,
  NAME_MAX,
  buildMailto,
  formatBytes,
  prefillFromQuery,
  validateFields,
  validateFiles,
  type ContribFields,
  type FieldErrors,
} from '../lib/contribute/rules';
import { ContributeError, sendContribution } from '../lib/contribute/upload';
import {
  Consents,
  ContactFields,
  FilesField,
  MessageField,
  TypeField,
  WhereFields,
  fmt,
  type FieldCtx,
  type Texts,
} from './contribute/Fields';
import { Done, ErrorSummary, Failure, MailReady, Progress } from './contribute/Status';
import { clientId, loadTurnstile } from './contribute/turnstile';
import './platform.css';

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

type Status =
  | { kind: 'idle' }
  | { kind: 'sending'; sent: number; total: number }
  | { kind: 'done'; id: string }
  | { kind: 'mail' }
  | { kind: 'error'; code: string };

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
  const abort = useRef<AbortController | null>(null);

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
    const ctrl = new AbortController();
    abort.current = ctrl;
    try {
      const sub = await sendContribution(
        {
          turnstileToken: token,
          payload: {
            ...f,
            lingua: lang,
            website: honeypot.current?.value ?? '',
            elapsedMs: Date.now() - startedAt.current,
            clientId: clientId(),
            files: files.map((x) => ({ name: x.name, size: x.size, type: x.type })),
          },
          files,
        },
        {
          endpoint,
          signal: ctrl.signal,
          onProgress: (sent, all) => setStatus({ kind: 'sending', sent: Math.min(sent, all), total: all }),
        },
      );
      setStatus({ kind: 'done', id: String(sub.id) });
      setF({ ...EMPTY, corso: f.corso, pagina: f.pagina, tipo: f.tipo });
      setFiles([]);
      setShowErrors(false);
      requestAnimationFrame(() => result.current?.focus());
    } catch (err) {
      const code = err instanceof ContributeError ? err.code : 'network';
      if (code === 'validation' && err instanceof ContributeError && err.fields)
        setErrors(err.fields as FieldErrors);
      setStatus({ kind: 'error', code });
      requestAnimationFrame(() => result.current?.focus());
    } finally {
      abort.current = null;
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
  const c: FieldCtx = { T, lang, f, set, err, describedBy, errorText };

  if (status.kind === 'done') {
    return <Done T={T} id={status.id} onAgain={() => setStatus({ kind: 'idle' })} resultRef={result} />;
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
        <ErrorSummary T={T} fields={errorList} errors={errors} errorText={errorText} summaryRef={summary} />
      )}

      <TypeField c={c} />
      <WhereFields c={c} courses={courses} />
      <MessageField c={c} />
      <FilesField
        c={c}
        files={files}
        busy={busy}
        online={online}
        inputRef={fileInput}
        onAdd={addFiles}
        onRemove={removeFile}
      />
      <ContactFields c={c} />

      {/* Campo trappola per i bot: invisibile e fuori dal tab order. */}
      <div class="pf-cf__trap" aria-hidden="true">
        <label>
          Website
          <input ref={honeypot} type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Consents c={c} privacyHref={privacyHref} />

      {online && (
        <div class="pf-cf__captcha">
          <div ref={widget} />
          {tsState === 'failed' && <p class="pf-note">{T.turnstileFailed}</p>}
        </div>
      )}

      {status.kind === 'mail' && <MailReady T={T} email={email} mailto={mailto} resultRef={result} />}
      {status.kind === 'error' && (
        <Failure T={T} code={status.code} mailto={mailto} issuesUrl={issuesUrl} resultRef={result} />
      )}
      {busy && <Progress T={T} lang={lang} sent={status.sent} total={status.total} />}

      <div class="btn-row pf-cf__actions">
        <button type="submit" class="btn btn--primary" disabled={busy}>
          {online ? (busy ? T.sending : T.submit) : T.submitMail}
        </button>
        {busy && (
          <button type="button" class="btn" onClick={() => abort.current?.abort()}>
            {T.cancel}
          </button>
        )}
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
