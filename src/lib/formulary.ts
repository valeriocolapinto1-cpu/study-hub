/**
 * Capitoli del formulario: una pagina per capitolo (`formulario/<capitolo>/`), indice dei capitoli in
 * `formulario/` e formulario completo solo nella pagina di stampa (`formulario/stampa/`).
 *
 * Il capitolo è il gruppo degli argomenti (`topic.group`, come nell'indice della teoria); gli argomenti
 * senza formule e i capitoli rimasti vuoti non compaiono. Lo slug viene dal titolo italiano del gruppo
 * (uguale nelle due lingue, come gli id degli argomenti); senza gruppo, dall'id del primo argomento.
 * Modulo puro (niente `astro:content`): le pagine e la ricerca gli passano argomenti e formule.
 */

interface Localized {
  it: string;
  en?: string | undefined;
}
interface ChapterTopic {
  id: string;
  order: number;
  group?: Localized | undefined;
}
interface ChapterFormula {
  id: string;
  topic: string;
}

export interface FormularyChapter<T extends ChapterTopic, F extends ChapterFormula> {
  slug: string;
  /** Gruppo degli argomenti (titolo del capitolo), assente per gli argomenti senza gruppo. */
  group: Localized | undefined;
  items: { topic: T; formulas: F[] }[];
  count: number;
}

/** Segmenti riservati sotto `formulario/`: non possono essere lo slug di un capitolo. */
const RESERVED = new Set(['stampa']);

/** Slug leggibile: minuscole senza accenti, parole separate da `-`, al massimo 60 caratteri a parola intera. */
export function chapterSlug(s: string): string {
  const words = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  let out = '';
  for (const w of words) {
    if (out && out.length + 1 + w.length > 60) break;
    out = out ? `${out}-${w}` : w;
  }
  return out;
}

export function formularyChapters<T extends ChapterTopic, F extends ChapterFormula>(
  topics: T[],
  formulas: F[],
): FormularyChapter<T, F>[] {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const out: FormularyChapter<T, F>[] = [];
  for (const topic of sorted) {
    const last = out.at(-1);
    const fs = formulas.filter((f) => f.topic === topic.id);
    if (last && (last.group?.it ?? null) === (topic.group?.it ?? null)) {
      last.items.push({ topic, formulas: fs });
    } else {
      out.push({ slug: '', group: topic.group, items: [{ topic, formulas: fs }], count: 0 });
    }
  }
  const chapters = out
    .map((c) => ({ ...c, items: c.items.filter((x) => x.formulas.length > 0) }))
    .filter((c) => c.items.length > 0);
  const used = new Set<string>();
  for (const c of chapters) {
    c.count = c.items.reduce((n, x) => n + x.formulas.length, 0);
    const base = chapterSlug(c.group?.it ?? '') || c.items[0]!.topic.id;
    let slug = base;
    for (let i = 2; used.has(slug) || RESERVED.has(slug); i++) slug = `${base}-${i}`;
    used.add(slug);
    c.slug = slug;
  }
  return chapters;
}

/** Capitolo di ogni formula (id formula → slug), per i collegamenti diretti (ricerca, extra dei corsi). */
export function chapterOfFormula<T extends ChapterTopic, F extends ChapterFormula>(
  chapters: FormularyChapter<T, F>[],
): Map<string, string> {
  return new Map(
    chapters.flatMap((c) => c.items.flatMap((x) => x.formulas.map((f) => [f.id, c.slug] as const))),
  );
}
