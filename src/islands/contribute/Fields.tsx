/** @jsxImportSource preact */
/** Campi del modulo «Contribuisci»: tipo, corso e pagina, messaggio, allegati, contatti, consensi. */
import {
  ACCEPT,
  CONTRIB_TYPES,
  MAX_FILES,
  MAX_TOTAL_BYTES,
  MESSAGE_MAX,
  NAME_MAX,
  formatBytes,
  type ContribFields,
  type ContribType,
  type FieldError,
  type FieldErrors,
} from '../../lib/contribute/rules';
import type { Ref } from 'preact';

export type Texts = Record<string, string>;

export const fmt = (s: string, params: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));

/** Stato e funzioni comuni ai campi. */
export interface FieldCtx {
  T: Texts;
  lang: 'it' | 'en';
  f: ContribFields;
  set: <K extends keyof ContribFields>(k: K, v: ContribFields[K]) => void;
  err: (k: keyof FieldErrors) => FieldError | undefined;
  describedBy: (k: string, hint?: boolean) => string | undefined;
  errorText: (field: keyof FieldErrors, code: string) => string;
}

function FieldErr({ c, k, alert }: { c: FieldCtx; k: keyof FieldErrors; alert?: boolean }) {
  const e = c.err(k);
  return e ? (
    <p class="field__error" id={`cf-${k}-err`} role={alert ? 'alert' : undefined}>
      {c.errorText(k, e)}
    </p>
  ) : null;
}

export function TypeField({ c }: { c: FieldCtx }) {
  const { T, f } = c;
  return (
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
              onChange={() => c.set('tipo', k as ContribType)}
            />
            <span>{T[`type.${k}`]}</span>
          </label>
        ))}
      </div>
      <p class="field__hint">{T[`typeHint.${f.tipo}`]}</p>
    </fieldset>
  );
}

export function WhereFields({
  c,
  courses,
}: {
  c: FieldCtx;
  courses: { id: string; title: string; year: number }[];
}) {
  const { T, f } = c;
  const years = [...new Set(courses.map((x) => x.year))];
  return (
    <div class="pf-cf__row">
      <div class="field">
        <label class="field__label" for="cf-corso">
          {T.courseLabel}
        </label>
        <select
          id="cf-corso"
          class="select"
          value={f.corso}
          onChange={(e) => c.set('corso', e.currentTarget.value)}
        >
          <option value="">{T.courseGeneral}</option>
          {years.map((y) => (
            <optgroup key={y} label={fmt(T.year ?? '', { year: y })}>
              {courses
                .filter((x) => x.year === y)
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.title}
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
          aria-invalid={c.err('pagina') ? 'true' : undefined}
          aria-describedby={c.describedBy('pagina', true)}
          onInput={(e) => c.set('pagina', e.currentTarget.value)}
        />
        <p class="field__hint" id="cf-pagina-hint">
          {T.pageHint}
        </p>
        <FieldErr c={c} k="pagina" />
      </div>
    </div>
  );
}

export function MessageField({ c }: { c: FieldCtx }) {
  const { T, f, lang } = c;
  return (
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
        aria-invalid={c.err('messaggio') ? 'true' : undefined}
        aria-describedby={c.describedBy('messaggio', true)}
        onInput={(e) => c.set('messaggio', e.currentTarget.value)}
      />
      <p class="field__hint pf-cf__counter" id="cf-messaggio-hint">
        {T.messageHint}{' '}
        <span class="pf-cf__count">
          {f.messaggio.length.toLocaleString(lang)} / {MESSAGE_MAX.toLocaleString(lang)}
        </span>
      </p>
      <FieldErr c={c} k="messaggio" />
    </div>
  );
}

export interface FilesFieldProps {
  c: FieldCtx;
  files: File[];
  busy: boolean;
  online: boolean;
  inputRef: Ref<HTMLInputElement>;
  onAdd: (list: FileList | null) => void;
  onRemove: (i: number) => void;
}

export function FilesField({ c, files, busy, online, inputRef, onAdd, onRemove }: FilesFieldProps) {
  const { T, lang } = c;
  const totalBytes = files.reduce((s, x) => s + x.size, 0);
  return (
    <div class="field">
      <span class="field__label" id="cf-files-label">
        {T.filesLabel}
      </span>
      <p class="field__hint" id="cf-files-hint">
        {fmt(T.filesHint ?? '', { files: MAX_FILES, size: formatBytes(MAX_TOTAL_BYTES, lang) })}
      </p>
      <div class="pf-cf-drop" id="cf-files">
        <input
          ref={inputRef}
          id="cf-files-input"
          class="visually-hidden"
          type="file"
          multiple
          accept={ACCEPT}
          disabled={busy}
          aria-labelledby="cf-files-label"
          aria-describedby={c.describedBy('files', true)}
          onChange={(e) => onAdd(e.currentTarget.files)}
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
                onClick={() => onRemove(i)}
              >
                {T.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldErr c={c} k="files" alert />
      {!online && files.length > 0 && <p class="pf-note">{T.filesOffline}</p>}
    </div>
  );
}

export function ContactFields({ c }: { c: FieldCtx }) {
  const { T, f } = c;
  return (
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
          aria-invalid={c.err('email') ? 'true' : undefined}
          aria-describedby={c.describedBy('email', true)}
          onInput={(e) => c.set('email', e.currentTarget.value)}
        />
        <p class="field__hint" id="cf-email-hint">
          {T.emailHint}
        </p>
        <FieldErr c={c} k="email" />
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
          aria-invalid={c.err('nome') ? 'true' : undefined}
          aria-describedby={c.describedBy('nome', true)}
          onInput={(e) => c.set('nome', e.currentTarget.value)}
        />
        <p class="field__hint" id="cf-nome-hint">
          {T.nameHint}
        </p>
        <FieldErr c={c} k="nome" />
      </div>
    </div>
  );
}

export function Consents({ c, privacyHref }: { c: FieldCtx; privacyHref: string }) {
  const { T, f } = c;
  return (
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
              aria-invalid={c.err(k) ? 'true' : undefined}
              aria-describedby={c.err(k) ? `cf-${k}-err` : undefined}
              onChange={(e) => c.set(k, e.currentTarget.checked)}
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
          <FieldErr c={c} k={k} />
        </div>
      ))}
    </fieldset>
  );
}
