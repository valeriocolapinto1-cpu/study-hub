/** @jsxImportSource preact */
/**
 * Ricerca globale: dialogo modale sopra l'indice Pagefind (dist/pagefind/<lingua>/).
 * Non è un'isola di Astro: lo monta src/scripts/search.ts alla prima apertura
 * ("/", Ctrl+K o il pulsante dell'intestazione), così nessuna pagina paga il suo peso
 * finché non serve. Filtri: corso, tipo (teoria, esercizio, formula, flashcard, pagina)
 * e lingua (quella della pagina o entrambe). Funziona offline: il service worker tiene
 * l'indice nella cache della shell.
 */
import { render } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import './platform.css';

export interface SearchConfig {
  lang: 'it' | 'en';
  base: string;
  courses: { id: string; title: string }[];
  texts: Record<string, string>;
}

interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: { title?: string };
  filters: Record<string, string[]>;
  sub_results?: { title: string; url: string; excerpt: string }[];
}
interface PagefindResult {
  id: string;
  score: number;
  data(): Promise<PagefindResultData>;
}
interface Pagefind {
  options(o: Record<string, unknown>): Promise<void>;
  init(): Promise<void>;
  search(q: string, o?: Record<string, unknown>): Promise<{ results: PagefindResult[] } | null>;
}

const TYPES = ['teoria', 'esercizio', 'formula', 'flashcard', 'pagina'] as const;
const PAGE = 8;

const loaded = new Map<string, Promise<Pagefind>>();
function loadPagefind(base: string, lang: string): Promise<Pagefind> {
  let p = loaded.get(lang);
  if (!p) {
    const url = `${base}pagefind/${lang}/pagefind.js`;
    p = (import(/* @vite-ignore */ url) as Promise<Pagefind>).then(async (pf) => {
      await pf.options({ baseUrl: base, excerptLength: 22 });
      await pf.init();
      return pf;
    });
    p.catch(() => loaded.delete(lang));
    loaded.set(lang, p);
  }
  return p;
}

const fmt = (s: string | undefined, params: Record<string, string | number>) =>
  (s ?? '').replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));

interface Hit {
  key: string;
  lang: string;
  score: number;
  result: PagefindResult;
}

function SearchUI({ config, dialog }: { config: SearchConfig; dialog: HTMLDialogElement }) {
  const { lang, base, courses, texts: T } = config;
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [allLangs, setAllLangs] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [shown, setShown] = useState(PAGE);
  const [data, setData] = useState<Record<string, PagefindResultData>>({});
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const seq = useRef(0);
  const courseTitle = useMemo(() => new Map(courses.map((c) => [c.id, c.title])), [courses]);
  const otherLang = lang === 'it' ? 'en' : 'it';

  useEffect(() => {
    const onOpen = () => {
      requestAnimationFrame(() => input.current?.select());
      // Avvia il caricamento dell'indice mentre si scrive.
      loadPagefind(base, lang).catch(() => undefined);
    };
    dialog.addEventListener('sh:opened', onOpen);
    onOpen();
    return () => dialog.removeEventListener('sh:opened', onOpen);
  }, []);

  useEffect(() => {
    const q = query.trim();
    const my = ++seq.current;
    if (!q) {
      setHits([]);
      setState('idle');
      return;
    }
    setState('loading');
    const timer = setTimeout(async () => {
      const filters: Record<string, unknown> = {};
      if (course) filters.corso = course;
      if (types.length) filters.tipo = { any: types };
      try {
        const langs = allLangs ? [lang, otherLang] : [lang];
        const all = await Promise.all(
          langs.map(async (l) => {
            const pf = await loadPagefind(base, l);
            const r = await pf.search(q, { filters });
            return (r?.results ?? []).map((result) => ({
              key: `${l}:${result.id}`,
              lang: l,
              score: result.score,
              result,
            }));
          }),
        );
        if (my !== seq.current) return;
        setHits(all.flat().sort((a, b) => b.score - a.score));
        setShown(PAGE);
        setState('ready');
      } catch {
        if (my === seq.current) setState('error');
      }
    }, 140);
    return () => clearTimeout(timer);
  }, [query, course, types.join(','), allLangs]);

  // Carica i dettagli solo dei risultati visibili.
  useEffect(() => {
    let alive = true;
    const missing = hits.slice(0, shown).filter((h) => !data[h.key]);
    if (missing.length === 0) return;
    Promise.all(missing.map(async (h) => [h.key, await h.result.data()] as const))
      .then((pairs) => alive && setData((d) => ({ ...d, ...Object.fromEntries(pairs) })))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [hits, shown]);

  const toggleType = (k: string) =>
    setTypes((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  const links = () =>
    Array.from(list.current?.querySelectorAll<HTMLAnchorElement>('a.pf-search__link') ?? []);
  const onKeyInput = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Nel campo di ricerca Esc svuoterebbe il testo: qui chiude sempre il dialogo.
      e.preventDefault();
      dialog.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      links()[0]?.focus();
    } else if (e.key === 'Enter') {
      const first = links()[0];
      if (first) {
        e.preventDefault();
        first.click();
      }
    }
  };
  const onKeyList = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = links();
    const i = all.indexOf(document.activeElement as HTMLAnchorElement);
    if (i === -1) return;
    e.preventDefault();
    if (e.key === 'ArrowUp' && i === 0) input.current?.focus();
    else all[Math.max(0, Math.min(all.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]?.focus();
  };

  const visible = hits.slice(0, shown);
  const statusText =
    state === 'loading'
      ? T.loading
      : state === 'error'
        ? T.unavailable
        : state === 'ready'
          ? hits.length === 0
            ? T.none
            : fmt(hits.length === 1 ? T.one : T.many, { n: hits.length })
          : '';

  return (
    <div class="pf-search">
      <div class="dialog__head pf-search__head">
        <label class="visually-hidden" for="pf-search-q">
          {T.label}
        </label>
        <input
          ref={input}
          id="pf-search-q"
          class="input pf-search__input"
          type="search"
          autoComplete="off"
          spellcheck={false}
          enterKeyHint="search"
          placeholder={T.placeholder}
          value={query}
          aria-describedby="pf-search-status"
          aria-controls="pf-search-results"
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={onKeyInput}
        />
        <button type="button" class="btn btn--ghost btn--sm" onClick={() => dialog.close()}>
          {T.close}
          <kbd aria-hidden="true">Esc</kbd>
        </button>
      </div>
      <div class="pf-search__filters" role="group" aria-label={T.filters}>
        {courses.length > 0 && (
          <label class="pf-search__course">
            <span class="visually-hidden">{T.course}</span>
            <select class="select" value={course} onChange={(e) => setCourse(e.currentTarget.value)}>
              <option value="">{T.allCourses}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div class="pf-search__types" role="group" aria-label={T.type}>
          {TYPES.map((k) => (
            <button
              key={k}
              type="button"
              class="chip"
              aria-pressed={types.includes(k) ? 'true' : 'false'}
              onClick={() => toggleType(k)}
            >
              {T[`type.${k}`]}
            </button>
          ))}
        </div>
        <button
          type="button"
          class="chip"
          aria-pressed={allLangs ? 'true' : 'false'}
          onClick={() => setAllLangs((v) => !v)}
        >
          {T.bothLangs}
        </button>
      </div>
      <div class="dialog__body pf-search__body">
        <p id="pf-search-status" class="pf-search__status" role="status" aria-live="polite">
          {statusText}
        </p>
        {state === 'idle' && <p class="pf-search__hint muted">{T.hint}</p>}
        {visible.length > 0 && (
          <ol id="pf-search-results" ref={list} class="pf-search__results" onKeyDown={onKeyList}>
            {visible.map((h) => {
              const d = data[h.key];
              if (!d)
                return <li key={h.key} class="pf-search__item pf-search__item--loading" aria-hidden="true" />;
              const tipo = d.filters.tipo?.[0];
              const corso = d.filters.corso?.[0];
              const subs = (d.sub_results ?? [])
                .filter((s) => s.url !== d.url && s.url.includes('#'))
                .slice(0, 2);
              return (
                <li key={h.key} class="pf-search__item" lang={h.lang === lang ? undefined : h.lang}>
                  <a class="pf-search__link" href={d.url}>
                    <span class="pf-search__title">{d.meta.title ?? d.url}</span>
                    <span class="pf-search__meta">
                      {tipo && <span class="badge">{T[`type.${tipo}`] ?? tipo}</span>}
                      {corso && <span>{courseTitle.get(corso) ?? corso}</span>}
                      {h.lang !== lang && <span>{h.lang.toUpperCase()}</span>}
                    </span>
                    <span class="pf-search__excerpt" dangerouslySetInnerHTML={{ __html: d.excerpt }} />
                  </a>
                  {subs.length > 0 && (
                    <ul class="pf-search__subs">
                      {subs.map((s) => (
                        <li key={s.url}>
                          <a class="pf-search__link pf-search__sub" href={s.url}>
                            {s.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
        {hits.length > shown && (
          <p>
            <button type="button" class="btn btn--sm" onClick={() => setShown((n) => n + PAGE)}>
              {fmt(T.more, { n: Math.min(PAGE, hits.length - shown) })}
            </button>
          </p>
        )}
      </div>
      <div class="dialog__foot pf-search__foot">
        <span class="muted">{T.keys}</span>
      </div>
    </div>
  );
}

/** Crea il dialogo (una volta) e lo restituisce pronto per showModal(). */
export function mountSearch(config: SearchConfig): HTMLDialogElement {
  const dialog = document.createElement('dialog');
  dialog.className = 'dialog pf-search-dialog';
  dialog.setAttribute('aria-label', config.texts.label ?? '');
  // Clic sullo sfondo: chiude.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  render(<SearchUI config={config} dialog={dialog} />, dialog);
  return dialog;
}
