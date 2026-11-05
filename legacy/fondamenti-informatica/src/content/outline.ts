/**
 * Indice interno di un modulo di studio.
 *
 * I moduli sono lunghi: senza un indice si perde il segno, e tornare al punto
 * giusto dopo un ripasso costa più della lettura. Le sezioni si ricavano dai
 * titoli `<h4>` del corpo, così l'indice non è un dato da tenere allineato a
 * mano: è il testo stesso.
 */
export interface Section {
  id: string;
  title: string;
}

/** «Regole di raggruppamento» → «regole-di-raggruppamento». */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

const HEADING = /<h4[^>]*>([\s\S]*?)<\/h4>/g;

/** Titolo pulito dal markup inline. */
function plainTitle(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

export function outline(body: string): Section[] {
  const sections: Section[] = [];
  const seen = new Set<string>();
  for (const match of body.matchAll(HEADING)) {
    const title = plainTitle(match[1] ?? '');
    if (!title) continue;
    // Due sezioni con lo stesso titolo avrebbero lo stesso ancoraggio e il
    // salto finirebbe sempre sulla prima: si numera la seconda.
    let id = slugify(title);
    let n = 2;
    while (seen.has(id)) id = `${slugify(title)}-${n++}`;
    seen.add(id);
    sections.push({ id, title });
  }
  return sections;
}

/** Lo stesso corpo, con un `id` su ogni titolo: è il bersaglio dell'indice. */
export function anchored(body: string): string {
  const ids = outline(body).map((section) => section.id);
  let i = 0;
  return body.replace(HEADING, (whole, inner: string) => {
    if (!plainTitle(inner)) return whole;
    const id = ids[i++];
    return `<h4 id="${id}">${inner}</h4>`;
  });
}

/**
 * Minuti di lettura stimati.
 *
 * ~900 caratteri al minuto: è una velocità da testo tecnico, cioè con le
 * pause per rileggere una formula, non da romanzo. Serve a decidere se il
 * modulo entra nella mezz'ora che hai, non a cronometrare.
 */
export function readingMinutes(body: string): number {
  const plain = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return Math.max(2, Math.round(plain.length / 900));
}
