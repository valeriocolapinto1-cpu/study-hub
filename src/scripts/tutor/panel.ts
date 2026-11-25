/**
 * Pannello del tutor AI (R12), scaricato solo al primo clic su «Chiedi al tutor» (Tutor.astro).
 * DOM semplice, niente Preact: sulle pagine di teoria non c'è nessuna isola da riusare.
 *
 * Flusso di una domanda: contesto della pagina (context.ts) + cronologia del browser (history.ts)
 * → POST al Worker con il gettone di sessione o, la prima volta, con un token di Turnstile → stream
 * SSE (sse.ts) reso a pezzi con lo stesso renderer delle isole (rich-client: Markdown ridotto e
 * KaTeX caricato solo se serve). Un rifiuto scarta il testo parziale; un errore lo dice e lascia la
 * domanda nel campo per riprovare.
 */
// CSS come file a parte, collegato all'apertura: con `import './tutor.css'` Astro lo metterebbe
// nell'HTML di ogni pagina col pulsante, anche senza clic.
import cssUrl from './tutor.css?url';
import { renderRichClient } from '../../islands/lib/rich-client';
import { loadTurnstile } from '../../islands/contribute/turnstile';
import type { CourseIndex, TopicData } from '../../engine/course-data';
import {
  cardContext,
  courseOutline,
  domToText,
  exerciseContext,
  exerciseSolution,
  theoryContext,
  type PageContext,
} from './context';
import { getSession, loadChat, outgoing, saveChat, setSession, type ChatMessage } from './history';
import { readEvents } from './sse';

interface Config {
  endpoint: string;
  siteKey: string;
  lang: 'it' | 'en';
  course: { id: string; title: string };
  indexUrl: string;
  dataUrl: string;
  privacyUrl: string;
  texts: Record<string, string>;
}

export const MAX_QUESTION = 2000;

function readConfig(): Config {
  const el = document.getElementById('sh-tutor-config');
  return JSON.parse(el?.textContent ?? '{}') as Config;
}

/** Codici d'errore del Worker a risposta iniziata → messaggio del pannello. */
const STREAM_ERRORS: Record<string, string> = {
  overloaded: 'err.overloaded',
  quota: 'err.quota',
  timeout: 'err.timeout',
  invalid: 'err.invalid',
  unconfigured: 'err.unconfigured',
};

const h = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text !== undefined) el.textContent = text;
  return el;
};

/** Hash breve di una stringa (chiave della conversazione di una scheda). */
const hash = (s: string): string => {
  let x = 5381;
  for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0;
  return (x >>> 0).toString(36);
};

const jsonCache = new Map<string, Promise<unknown>>();
function fetchJson<T>(url: string): Promise<T> {
  let p = jsonCache.get(url);
  if (!p) {
    p = fetch(url).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    p.catch(() => jsonCache.delete(url));
    jsonCache.set(url, p);
  }
  return p as Promise<T>;
}

class TutorPanel {
  private readonly cfg: Config;
  private readonly root: HTMLElement;
  private readonly about: HTMLElement;
  private readonly log: HTMLElement;
  private readonly chips: HTMLElement;
  private readonly tsBox: HTMLElement;
  private readonly input: HTMLTextAreaElement;
  private readonly count: HTMLElement;
  private readonly send: HTMLButtonElement;
  private readonly status: HTMLElement;
  private ctx: PageContext | null = null;
  private opener: HTMLElement | null = null;
  private refresh: (() => Partial<PageContext>) | null = null;
  private history: ChatMessage[] = [];
  private busy: AbortController | null = null;
  private widget: string | undefined;

  constructor(cfg: Config) {
    this.cfg = cfg;
    const T = cfg.texts;
    this.root = h('div', { class: 'tutor', role: 'dialog', 'aria-labelledby': 'tutor-h', hidden: '' });
    const head = h('header', { class: 'tutor__head' });
    const titles = h('div');
    titles.append(h('h2', { id: 'tutor-h', class: 'tutor__title' }, T.title));
    this.about = h('p', { class: 'tutor__about' });
    titles.append(this.about);
    const close = h(
      'button',
      { type: 'button', class: 'icon-btn tutor__close', 'aria-label': T.close ?? '' },
      '×',
    );
    close.addEventListener('click', () => this.close());
    head.append(titles, close);

    this.log = h('div', { class: 'tutor__log', tabindex: '0', 'aria-label': T.title ?? '' });
    this.chips = h('div', { class: 'tutor__chips' });
    this.tsBox = h('div', { class: 'tutor__turnstile' });
    this.status = h('p', { class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });

    const form = h('form', { class: 'tutor__form' });
    const label = h('label', { for: 'tutor-q', class: 'visually-hidden' }, T.label);
    this.input = h('textarea', {
      id: 'tutor-q',
      class: 'sh-input tutor__input',
      rows: '2',
      maxlength: String(MAX_QUESTION),
      placeholder: T.placeholder ?? '',
      'aria-describedby': 'tutor-count',
    });
    this.count = h('span', { id: 'tutor-count', class: 'tutor__count' });
    const clear = h('button', { type: 'button', class: 'btn btn--sm btn--ghost' }, T.clear);
    clear.addEventListener('click', () => this.clear());
    this.send = h('button', { type: 'submit', class: 'btn btn--sm btn--primary' }, T.send);
    const row = h('div', { class: 'tutor__row' });
    row.append(this.count, clear, this.send);
    form.append(label, this.input, row);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.busy) this.busy.abort();
      else void this.ask(this.input.value);
    });
    this.input.addEventListener('input', () => this.updateCount());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        form.requestSubmit();
      }
    });

    const privacy = h('p', { class: 'tutor__privacy' }, `${T.privacy} `);
    privacy.append(h('a', { href: cfg.privacyUrl, target: '_blank', rel: 'noopener' }, T.privacyLink));

    this.root.append(head, this.log, this.chips, this.tsBox, form, privacy, this.status);
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        this.close();
      }
    });
    document.body.append(this.root);
    this.updateCount();
  }

  private t(key: string, params: Record<string, string | number> = {}): string {
    return (this.cfg.texts[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? ''));
  }

  private updateCount() {
    this.count.textContent = this.t('counter', { n: this.input.value.length, max: MAX_QUESTION });
  }

  open(ctx: PageContext, opener: HTMLElement, refresh: (() => Partial<PageContext>) | null) {
    this.opener = opener;
    this.refresh = refresh;
    const changed = this.ctx?.key !== ctx.key;
    this.ctx = ctx;
    this.about.textContent = this.t('about', { what: ctx.title || this.t(`kind.${ctx.kind}`) });
    if (changed && !this.busy) {
      this.history = loadChat(this.cfg.course.id, ctx.key);
      this.renderHistory();
    }
    this.renderChips();
    this.root.hidden = false;
    document.documentElement.dataset.tutor = 'open';
    this.input.focus();
  }

  close() {
    this.root.hidden = true;
    delete document.documentElement.dataset.tutor;
    this.opener?.focus();
  }

  private clear() {
    this.busy?.abort();
    this.history = [];
    if (this.ctx) saveChat(this.cfg.course.id, this.ctx.key, []);
    this.renderHistory();
    this.input.focus();
  }

  private renderChips() {
    this.chips.replaceChildren();
    if (this.history.length || !this.ctx) return;
    for (let i = 1; i <= 3; i++) {
      const text = this.cfg.texts[`chip.${this.ctx.kind}.${i}`];
      if (!text) continue;
      const b = h('button', { type: 'button', class: 'btn btn--sm tutor__chip' }, text);
      b.addEventListener('click', () => void this.ask(text));
      this.chips.append(b);
    }
  }

  private renderHistory() {
    this.log.replaceChildren();
    if (!this.history.length) this.log.append(h('p', { class: 'tutor__empty' }, this.t('empty')));
    for (const m of this.history) void this.bubble(m.role, m.content);
    this.renderChips();
  }

  /** Un messaggio nel registro; restituisce il contenitore del testo. */
  private bubble(role: ChatMessage['role'], text: string): HTMLElement {
    this.log.querySelector('.tutor__empty')?.remove();
    const msg = h('div', { class: `tutor__msg tutor__msg--${role}` });
    msg.append(h('p', { class: 'tutor__who' }, this.t(role === 'user' ? 'you' : 'bot')));
    const body = h('div', { class: 'tutor__text prose' });
    msg.append(body);
    this.log.append(msg);
    if (text) void this.paint(body, text);
    this.log.scrollTop = this.log.scrollHeight;
    return body;
  }

  private async paint(body: HTMLElement, text: string) {
    // renderRich fa sempre l'escape dell'HTML: il testo del modello non diventa mai markup.
    const html = await renderRichClient(text).catch(() => null);
    if (html === null) body.textContent = text;
    else body.innerHTML = html;
  }

  private note(body: HTMLElement, key: string, params: Record<string, string | number> = {}, retry?: string) {
    const p = h('p', { class: 'sh-alert sh-alert--danger tutor__note', role: 'alert' }, this.t(key, params));
    if (retry !== undefined) {
      const b = h('button', { type: 'button', class: 'btn btn--sm' }, this.t('retry'));
      b.addEventListener('click', () => {
        p.closest('.tutor__msg')?.remove();
        void this.ask(retry);
      });
      p.append(' ', b);
    }
    body.replaceChildren(p);
  }

  /** Token di Turnstile (widget «solo se serve interazione» dentro il pannello). */
  private async turnstileToken(): Promise<string | undefined> {
    if (!this.cfg.siteKey) return undefined;
    await loadTurnstile();
    const ts = window.turnstile!;
    if (this.widget !== undefined) ts.remove(this.widget);
    this.tsBox.replaceChildren();
    const box = h('div');
    this.tsBox.append(box);
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('turnstile')), 60_000);
      this.widget = ts.render(box, {
        sitekey: this.cfg.siteKey,
        appearance: 'interaction-only',
        size: 'flexible',
        language: this.cfg.lang,
        callback: (token: string) => {
          clearTimeout(timer);
          resolve(token);
        },
        'error-callback': () => {
          clearTimeout(timer);
          reject(new Error('turnstile'));
        },
      });
    });
  }

  private async ask(raw: string) {
    const question = raw.trim();
    if (!question || this.busy || !this.ctx) return;
    if (question.length > MAX_QUESTION) {
      this.status.textContent = this.t('err.tooLong', { max: MAX_QUESTION });
      return;
    }
    const ctx = { ...this.ctx, ...(this.refresh?.() ?? {}) };
    const messages = outgoing(this.history, question);
    this.input.value = '';
    this.updateCount();
    this.chips.replaceChildren();
    this.bubble('user', question);
    const body = this.bubble('assistant', '');
    body.append(h('p', { class: 'tutor__waiting', 'aria-busy': 'true' }, this.t('waiting')));
    this.status.textContent = this.t('waiting');

    const ctrl = new AbortController();
    this.busy = ctrl;
    this.send.textContent = this.t('stop');
    let text = '';
    let stored = false;
    const fail = (key: string, params: Record<string, string | number> = {}) => {
      this.note(body, key, params, question);
      this.status.textContent = this.t(key, params);
    };
    try {
      if (!navigator.onLine) return fail('err.offline');
      const outline = await fetchJson<CourseIndex>(this.cfg.indexUrl)
        .then(courseOutline)
        .catch(() => this.cfg.course.title);
      const session = getSession();
      let turnstile: string | undefined;
      if (!session) {
        try {
          turnstile = await this.turnstileToken();
        } catch {
          return fail('err.turnstile');
        }
      }
      const res = await fetch(this.cfg.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(session ? { 'x-tutor-session': session } : {}) },
        body: JSON.stringify({
          lang: this.cfg.lang,
          course: { ...this.cfg.course, outline },
          context: {
            kind: ctx.kind,
            title: ctx.title,
            text: ctx.text,
            answer: ctx.answer,
            solution: ctx.solution,
          },
          messages,
          turnstile,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => ({}))) as { error?: string; retryAfter?: number };
        if (res.status === 401) setSession('');
        if (err.error === 'rate')
          return fail('err.rate', { min: Math.max(1, Math.ceil((err.retryAfter ?? 60) / 60)) });
        if (err.error === 'budget') return fail('err.budget');
        if (err.error === 'turnstile') return fail('err.turnstile');
        if (err.error === 'too-long') return fail('err.tooLong', { max: MAX_QUESTION });
        if (err.error === 'invalid') return fail('err.invalid');
        if (err.error === 'unconfigured') return fail('err.unconfigured');
        return fail('err.network');
      }
      let pending = 0;
      const repaint = () => {
        pending ||= window.setTimeout(() => {
          pending = 0;
          void this.paint(body, text);
          this.log.scrollTop = this.log.scrollHeight;
        }, 120);
      };
      let ended = false;
      for await (const ev of readEvents(res.body)) {
        if (ev.type === 'session') setSession(ev.token);
        else if (ev.type === 'text') {
          text += ev.text;
          repaint();
        } else if (ev.type === 'refusal') {
          // Rifiuto: il testo parziale non vale, e la coppia non entra nella cronologia.
          clearTimeout(pending);
          text = '';
          ended = true;
          return fail('refusal');
        } else if (ev.type === 'error') {
          clearTimeout(pending);
          ended = true;
          return fail(STREAM_ERRORS[ev.code] ?? 'err.network');
        } else if (ev.type === 'done') {
          clearTimeout(pending);
          ended = true;
          await this.paint(body, text);
          if (ev.stop === 'max_tokens')
            body.append(h('p', { class: 'tutor__note sh-help' }, this.t('truncated')));
        }
      }
      if (!ended || !text) return fail('err.network');
      stored = true;
    } catch {
      if (ctrl.signal.aborted && text) {
        // interrotta dallo studente: si tiene quello che è arrivato
        await this.paint(body, text);
        stored = true;
      } else if (!ctrl.signal.aborted) fail(navigator.onLine ? 'err.network' : 'err.offline');
      else body.closest('.tutor__msg')?.remove();
    } finally {
      this.busy = null;
      this.send.textContent = this.t('send');
      body.querySelector('.tutor__waiting')?.remove();
      if (stored) {
        this.history = [...messages, { role: 'assistant', content: text }];
        if (this.ctx) saveChat(this.cfg.course.id, ctx.key, this.history);
        this.status.textContent = text;
      }
    }
  }
}

let panel: TutorPanel | null = null;

/** Contesto dal pulsante premuto; per gli esercizi la soluzione arriva da dati/<argomento>.json. */
async function gather(
  btn: HTMLElement,
  cfg: Config,
): Promise<{ ctx: PageContext; refresh: (() => Partial<PageContext>) | null }> {
  const kind = btn.dataset.tutorOpen;
  const pageTitle = document.querySelector('h1')?.textContent?.trim() ?? document.title;
  if (kind === 'exercise') {
    const id = btn.dataset.tutorTarget ?? '';
    const article = document.getElementById(id);
    if (article) {
      const base = exerciseContext(article);
      let solution: string | undefined;
      const topic = btn.dataset.tutorTopic;
      if (topic) {
        const data = await fetchJson<TopicData>(`${cfg.dataUrl}${topic}.json`).catch(() => null);
        const ex = data?.exercises.find((x) => x.id === id);
        const shown = article.querySelector('.sh-exercise__statement');
        if (ex) solution = exerciseSolution(ex, shown ? domToText(shown) : '');
      }
      return {
        ctx: { ...base, title: base.title || pageTitle, ...(solution ? { solution } : {}), key: `ex:${id}` },
        // la risposta dello studente si rilegge a ogni domanda
        refresh: () => {
          const now = exerciseContext(article);
          return { answer: now.answer, text: now.text };
        },
      };
    }
  }
  if (kind === 'card') {
    const card = cardContext(document);
    if (card)
      return {
        ctx: { ...card, title: card.title || pageTitle, key: `card:${hash(card.text)}` },
        refresh: null,
      };
    return {
      ctx: { kind: 'card', title: pageTitle, text: `${cfg.course.title} — ${pageTitle}`, key: 'card:-' },
      refresh: null,
    };
  }
  const article = document.querySelector('article.prose') ?? document.querySelector('main') ?? document.body;
  return { ctx: { ...theoryContext(article, pageTitle), key: `th:${location.pathname}` }, refresh: null };
}

function loadCss(): Promise<void> {
  if (document.querySelector('link[data-tutor-css]')) return Promise.resolve();
  return new Promise((resolve) => {
    const link = h('link', { rel: 'stylesheet', href: cssUrl, 'data-tutor-css': '' });
    link.addEventListener('load', () => resolve());
    link.addEventListener('error', () => resolve());
    document.head.append(link);
  });
}

export async function openTutor(btn: HTMLElement): Promise<void> {
  const cfg = readConfig();
  await loadCss();
  panel ??= new TutorPanel(cfg);
  try {
    const { ctx, refresh } = await gather(btn, cfg);
    panel.open(ctx, btn, refresh);
  } finally {
    btn.removeAttribute('aria-busy');
  }
}
