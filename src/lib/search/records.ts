/**
 * Ricerca globale (Pagefind): classificazione delle pagine e record aggiuntivi.
 *
 * Le pagine HTML vengono indicizzate da Pagefind a build-time (tools/integrations/pagefind.mjs)
 * con i filtri `corso` e `tipo` scritti da BaseLayout. Formule ed esercizi hanno anche
 * un record proprio che punta all'ancora nella pagina, e le flashcard (che non hanno una
 * pagina) un record che porta al ripasso del corso: così un risultato apre il punto esatto.
 */
import { proseText as plainText } from '../../engine/rich';

export const SEARCH_TYPES = ['teoria', 'esercizio', 'formula', 'flashcard', 'pagina'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/**
 * Sezioni del corso escluse dall'indice HTML: ripasso, esame e progressi sono interfacce
 * dinamiche; esercizi e formulario sono coperti dai record di `buildRecords` (uno per
 * esercizio o formula, con l'ancora), che eviterebbero doppioni.
 */
const EXCLUDED_COURSE_SECTIONS = new Set(['ripasso', 'esame', 'progressi', 'esercizi', 'formulario']);
/** Pagine globali escluse (dati personali locali, strumenti, stampa). */
const EXCLUDED_GLOBAL = new Set(['ripasso', 'appunti', 'i-miei-dati', 'stampa', 'stile']);

/**
 * Tipo di una pagina dal percorso senza base né lingua (`anno-2/teoria-circuiti/teoria/resistori`),
 * oppure `null` se la pagina non va indicizzata.
 */
export function pageSearchType(rest: string, course?: string): SearchType | null {
  const parts = rest.split('/').filter(Boolean);
  if (!course) {
    if (parts[0] && EXCLUDED_GLOBAL.has(parts[0])) return null;
    return 'pagina';
  }
  const section = parts[2];
  if (!section) return 'pagina';
  if (EXCLUDED_COURSE_SECTIONS.has(section)) return null;
  if (section === 'teoria') return 'teoria';
  return 'pagina';
}

/** Valore di `data-pagefind-filter` per un filtro (sintassi Pagefind: `nome:valore`, uno per elemento). */
export const pagefindFilter = (name: 'tipo' | 'corso', value: string): string => `${name}:${value}`;

export interface SearchRecord {
  url: string;
  language: 'it' | 'en';
  content: string;
  meta: { title: string };
  filters: { tipo: SearchType[]; corso: string[] };
}

interface Localized {
  it: string;
  en?: string | undefined;
}
const pickText = (l: Localized | undefined, lang: 'it' | 'en') =>
  !l ? '' : lang === 'en' && l.en?.trim() ? l.en : l.it;

export interface RecordSources {
  lang: 'it' | 'en';
  courses: { id: string; paths: { overview: string; exercises: string; review: string } }[];
  formulas: {
    id: string;
    course: string;
    latex: string;
    latexEn?: string | undefined;
    label: Localized;
    note?: Localized | undefined;
  }[];
  exercises: {
    id: string;
    course: string;
    topic: string;
    statement?: Localized | undefined;
    steps: { title: Localized; body: Localized }[];
  }[];
  cards: { id: string; course: string; front: Localized; back: Localized }[];
}

const clip = (s: string, max = 2000) => (s.length > max ? `${s.slice(0, max)}…` : s);

/** Record aggiuntivi (formule, esercizi, flashcard) per una lingua. */
export function buildRecords(src: RecordSources): SearchRecord[] {
  const { lang } = src;
  const paths = new Map(src.courses.map((c) => [c.id, c.paths]));
  const out: SearchRecord[] = [];
  for (const f of src.formulas) {
    const p = paths.get(f.course);
    if (!p) continue;
    const label = plainText(pickText(f.label, lang));
    out.push({
      url: `${p.overview}formulario/#f-${f.id}`,
      language: lang,
      content: clip([label, plainText(pickText(f.note, lang))].filter(Boolean).join(' — ')),
      meta: { title: label },
      filters: { tipo: ['formula'], corso: [f.course] },
    });
  }
  for (const e of src.exercises) {
    const p = paths.get(e.course);
    if (!p || !e.statement) continue;
    const statement = plainText(pickText(e.statement, lang));
    const steps = e.steps.map(
      (s) => `${plainText(pickText(s.title, lang))}: ${plainText(pickText(s.body, lang))}`,
    );
    out.push({
      url: `${p.exercises}${e.topic}/#${e.id}`,
      language: lang,
      content: clip([statement, ...steps].join(' ')),
      meta: { title: clip(statement, 90) },
      filters: { tipo: ['esercizio'], corso: [e.course] },
    });
  }
  for (const c of src.cards) {
    const p = paths.get(c.course);
    if (!p) continue;
    const front = plainText(pickText(c.front, lang));
    out.push({
      url: `${p.review}#${c.id}`,
      language: lang,
      content: clip(`${front} — ${plainText(pickText(c.back, lang))}`),
      meta: { title: clip(front, 90) },
      filters: { tipo: ['flashcard'], corso: [c.course] },
    });
  }
  return out;
}
