// @ts-check
/**
 * Plugin rehype per le pagine MDX di teoria (src/content/theory/<corso>/<topic>.<lang>.mdx):
 * aggiunge `data-note-id` stabile a titoli, paragrafi ed elenchi (pulsante appunti, docs/ENGINE.md)
 * e un `id` leggibile ai titoli h2/h3 che non ne hanno uno.
 *
 * Gli id degli appunti sono ordinali e non dipendono dal testo, così coincidono tra italiano e
 * inglese (stessa struttura) e non cambiano correggendo una parola:
 *   teoria/<topic>/s<k>        k-esimo titolo h2 della pagina (s0 = prima del primo h2)
 *   teoria/<topic>/s<k>-<n>    n-esimo blocco (h3, p, ul, ol) della sezione k
 *   teoria/<topic>/s<k>-<n>.<i> i-esima voce di un elenco: l'id va sulle <li>, perché il pulsante
 *                              degli appunti inserito in un <ul> violerebbe la struttura dell'elenco
 */

const BLOCKS = new Set(['p', 'ul', 'ol', 'h3']);

/** @param {string} s */
export const slugify = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sezione';

/** @param {any} node */
const textOf = (node) =>
  node.type === 'text' ? node.value : Array.isArray(node.children) ? node.children.map(textOf).join('') : '';

export default function rehypeNoteIds() {
  /** @param {any} tree @param {any} file */
  return (tree, file) => {
    const path = String(file?.path ?? file?.history?.[0] ?? '').replace(/\\/g, '/');
    const m = path.match(/\/content\/theory\/[^/]+\/([a-z0-9-]+)\.(?:it|en)\.mdx$/);
    if (!m) return;
    const base = `teoria/${m[1]}`;
    let section = 0;
    let block = 0;
    const used = new Set();
    /** @param {any} node @param {boolean} nested */
    const visit = (node, nested) => {
      if (node.type === 'element') {
        const tag = node.tagName;
        const props = (node.properties ??= {});
        if (tag === 'h2' || tag === 'h3') {
          if (!props.id) {
            let id = slugify(textOf(node));
            for (let i = 2; used.has(id); i++) id = `${slugify(textOf(node))}-${i}`;
            props.id = id;
          }
          used.add(String(props.id));
        }
        if (!nested && tag === 'h2') {
          section += 1;
          block = 0;
          props.dataNoteId = `${base}/s${section}`;
          return;
        }
        if (!nested && BLOCKS.has(tag)) {
          block += 1;
          if (tag === 'ul' || tag === 'ol') {
            let i = 0;
            for (const li of node.children ?? []) {
              if (li.type !== 'element' || li.tagName !== 'li') continue;
              i += 1;
              (li.properties ??= {}).dataNoteId = `${base}/s${section}-${block}.${i}`;
            }
          } else {
            props.dataNoteId = `${base}/s${section}-${block}`;
          }
          return; // niente id annidati (p dentro li, ecc.)
        }
        // dentro elenchi, tabelle, matematica e richiami non si numerano blocchi interni
        const inner =
          nested ||
          tag === 'li' ||
          tag === 'table' ||
          tag === 'aside' ||
          /katex/.test(String(props.className ?? ''));
        for (const c of node.children ?? []) visit(c, inner);
        return;
      }
      for (const c of node.children ?? []) visit(c, nested);
    };
    visit(tree, false);
  };
}
