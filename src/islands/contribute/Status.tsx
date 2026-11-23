/** @jsxImportSource preact */
/** Stati del modulo «Contribuisci»: riepilogo degli errori, invio in corso, esito, email pronta. */
import type { Ref } from 'preact';
import { formatBytes, type FieldErrors } from '../../lib/contribute/rules';
import { fmt, type Texts } from './Fields';

export function ErrorSummary(p: {
  T: Texts;
  fields: (keyof FieldErrors)[];
  errors: FieldErrors;
  errorText: (field: keyof FieldErrors, code: string) => string;
  summaryRef: Ref<HTMLDivElement>;
}) {
  const { T, fields } = p;
  return (
    <div
      class="pf-cf-summary"
      role="alert"
      tabIndex={-1}
      ref={p.summaryRef}
      aria-labelledby="cf-summary-title"
    >
      <p id="cf-summary-title" class="pf-cf-summary__title">
        {fmt(T.summary ?? '', { n: fields.length })}
      </p>
      <ul>
        {fields.map((k) => (
          <li key={k}>
            <a href={`#cf-${k}`}>
              {T[`field.${k}`]}: {p.errorText(k, p.errors[k]!)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Done(p: { T: Texts; id: string; onAgain: () => void; resultRef: Ref<HTMLDivElement> }) {
  const { T } = p;
  return (
    <div class="pf-cf-result" data-tone="success" role="status" tabIndex={-1} ref={p.resultRef}>
      <h2 class="pf-cf-result__title">{T.doneTitle}</h2>
      <p>{T.doneBody}</p>
      <p class="muted">
        {T.doneId} <code>{p.id}</code>
      </p>
      <div class="btn-row">
        <button type="button" class="btn" onClick={p.onAgain}>
          {T.again}
        </button>
      </div>
    </div>
  );
}

export function MailReady(p: { T: Texts; email: string; mailto: string; resultRef: Ref<HTMLDivElement> }) {
  const { T } = p;
  return (
    <div class="pf-cf-result" data-tone="success" role="status" tabIndex={-1} ref={p.resultRef}>
      <p class="pf-cf-result__title">{T.mailReady}</p>
      <p>{fmt(T.mailReadyBody ?? '', { email: p.email })}</p>
      <p>
        <a class="btn btn--sm" href={p.mailto} data-contribute-mailto>
          {T.mailOpen}
        </a>
      </p>
    </div>
  );
}

export function Failure(p: {
  T: Texts;
  code: string;
  mailto: string;
  issuesUrl: string;
  resultRef: Ref<HTMLDivElement>;
}) {
  const { T } = p;
  return (
    <div class="pf-cf-result" data-tone="danger" role="alert" tabIndex={-1} ref={p.resultRef}>
      <p class="pf-cf-result__title">{T[`fail.${p.code}`] ?? T['fail.generic']}</p>
      <p>
        {T.failFallback} <a href={p.mailto}>{T.failMail}</a> · <a href={p.issuesUrl}>{T.failIssue}</a>
      </p>
    </div>
  );
}

export function Progress(p: { T: Texts; lang: 'it' | 'en'; sent: number; total: number }) {
  const { T, lang, sent, total } = p;
  return (
    <div class="pf-cf-progress" role="status">
      <span>
        {total > 0
          ? fmt(T.uploading ?? '', { sent: formatBytes(sent, lang), total: formatBytes(total, lang) })
          : T.sending}
      </span>
      {total > 0 && <progress class="progress__bar" max={total} value={sent} aria-label={T.progressLabel} />}
    </div>
  );
}
