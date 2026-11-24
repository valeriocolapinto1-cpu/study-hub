/**
 * Contesto della pagina per il tutor, letto dal DOM al momento della domanda (nessuna isola toccata).
 *
 * Il testo si ricava dall'HTML già reso: ogni formula KaTeX torna al suo sorgente TeX (l'annotazione
 * MathML `application/x-tex`) tra `$…$` o `$$…$$`, così il modello legge la matematica esatta e non
 * il doppio testo HTML+MathML. Pulsanti, figure SVG, testi solo per lettori di schermo e campi si
 * tolgono.
 */
import type { ExerciseData, TopicData } from '../../engine/course-data';

export type TutorKind = 'exercise' | 'card' | 'theory';

export interface PageContext {
  kind: TutorKind;
  title: string;
  text: string;
  answer?: string;
  solution?: string;
  /** Chiave della conversazione nella cronologia (stesso esercizio → stessa conversazione). */
  key: string;
}

/** Limiti del Worker (tools/ai-worker/src/validate.ts): il testo si taglia prima di inviarlo. */
export const MAX = { title: 200, text: 6000, answer: 2000, solution: 6000 } as const;

const BLOCK =
  /^(P|DIV|LI|UL|OL|H[1-6]|PRE|TABLE|TR|SECTION|ARTICLE|FIGURE|FIGCAPTION|BLOCKQUOTE|DL|DT|DD|FIELDSET|LEGEND|LABEL|BR)$/;
const DROP =
  'button, svg, script, style, input, textarea, select, .sh-visually-hidden, .visually-hidden, .sh-note-btn, [data-tutor-skip], [aria-hidden="true"]';

export const clip = (s: string, max: number): string => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

/** Testo con la matematica in TeX. Funziona su elementi della pagina e su frammenti di DOMParser. */
export function domToText(el: Element): string {
  const root = el.cloneNode(true) as Element;
  const doc = root.ownerDocument;
  for (const k of [...root.querySelectorAll('.katex')]) {
    // HTML+MathML: sorgente nell'annotazione; solo HTML (dati delle isole): nell'aria-label.
    const tex = (
      k.querySelector('annotation[encoding="application/x-tex"]')?.textContent ??
      k.getAttribute('aria-label') ??
      k.textContent ??
      ''
    ).trim();
    const display = !!k.closest('.katex-display');
    const host = display ? (k.closest('.katex-display') ?? k) : k;
    host.replaceWith(doc.createTextNode(display ? `\n$$${tex}$$\n` : `$${tex}$`));
  }
  for (const d of [...root.querySelectorAll(DROP)]) d.remove();
  let out = '';
  // I blocchi di codice tengono rientri e spazi: segnaposto durante la pulizia delle righe.
  const pres: string[] = [];
  const walk = (n: Node) => {
    if (n.nodeType === 3) {
      out += (n.textContent ?? '').replace(/\s+/g, ' ');
      return;
    }
    if (n.nodeType !== 1) return;
    const tag = (n as Element).tagName;
    const block = BLOCK.test(tag);
    if (tag === 'PRE') {
      pres.push(n.textContent ?? '');
      out += `\n\uE000${pres.length - 1}\uE000\n`;
      return;
    }
    if (block) out += '\n';
    if (tag === 'LI') out += '- ';
    for (const c of n.childNodes) walk(c);
    if (block) out += '\n';
  };
  walk(root);
  return out
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .replace(/\uE000(\d+)\uE000/g, (_, i: string) => `\`\`\`\n${pres[Number(i)]}\n\`\`\``);
}

const htmlToText = (html: string): string =>
  html
    ? domToText(new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html').body.firstElementChild!)
    : '';

const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Esercizio: enunciato, alternative, campi; risposta dello studente dai campi compilati. */
export function exerciseContext(article: Element): Omit<PageContext, 'solution' | 'key'> {
  const title = article.querySelector('.sh-exercise__title')?.textContent?.trim() ?? '';
  const statement = article.querySelector('.sh-exercise__statement');
  const parts = [statement ? domToText(statement) : ''];
  const choices = [...article.querySelectorAll('.sh-choice')];
  if (choices.length) {
    parts.push(
      'Alternative / Choices:',
      ...choices.map((c, i) => {
        const clone = c.cloneNode(true) as Element;
        clone.querySelector('.sh-choice__why')?.remove();
        return `${String.fromCharCode(65 + i)}. ${norm(domToText(clone))}`;
      }),
    );
  }
  const fields = [...article.querySelectorAll('.sh-field')];
  const labelOf = (f: Element) => norm(domToText(f.querySelector('label') ?? f));
  const unitOf = (f: Element) => norm(f.querySelector('.sh-field__unit')?.textContent ?? '');
  if (fields.length)
    parts.push(
      'Da trovare / To find:',
      ...fields.map((f) => `- ${labelOf(f)}${unitOf(f) ? ` [${unitOf(f)}]` : ''}`),
    );

  const answers: string[] = [];
  for (const f of fields) {
    const v = (f.querySelector('input') as HTMLInputElement | null)?.value.trim();
    if (v) answers.push(`${labelOf(f)} = ${v}${unitOf(f) ? ` ${unitOf(f)}` : ''}`);
  }
  choices.forEach((c, i) => {
    if ((c.querySelector('input') as HTMLInputElement | null)?.checked)
      answers.push(`${String.fromCharCode(65 + i)} (scelta / chosen)`);
  });
  const result = article.querySelector('.sh-result')?.textContent?.trim();
  if (answers.length && result)
    answers.push(`Esito della correzione automatica / Automatic check: ${result}`);
  return {
    kind: 'exercise',
    title: clip(title, MAX.title),
    text: clip(parts.filter(Boolean).join('\n'), MAX.text),
    ...(answers.length ? { answer: clip(answers.join('\n'), MAX.answer) } : {}),
  };
}

/**
 * Soluzione di riferimento da `dati/<argomento>.json`. Per i generati vale solo se la variante
 * mostrata è quella pregenerata (enunciato uguale): altrimenti niente soluzione (il tutor lo sa).
 */
export function exerciseSolution(ex: ExerciseData, shownStatement: string): string | undefined {
  if (ex.kind === 'generated' && norm(htmlToText(ex.statementHtml ?? '')) !== norm(shownStatement))
    return undefined;
  const lines: string[] = [];
  ex.steps.forEach((s, i) => {
    lines.push(`${i + 1}. ${norm(htmlToText(s.titleHtml))}`, htmlToText(s.bodyHtml));
  });
  if (ex.answer.length)
    lines.push(
      'Risultati / Results:',
      ...ex.answer.map((a) => `- ${a.label} = ${a.value}${a.unit ? ` ${a.unit}` : ''}`),
    );
  const right = (ex.choices ?? []).flatMap((c, i) => (c.correct ? [String.fromCharCode(65 + i)] : []));
  if (right.length)
    lines.push(
      `Alternative corrette (ordine d'autore) / Correct choices (author order): ${right.join(', ')}`,
    );
  const out = lines.filter(Boolean).join('\n').trim();
  return out ? clip(out, MAX.solution) : undefined;
}

/** Scheda di ripasso visibile: fronte e, se già girata, retro (come soluzione). */
export function cardContext(root: ParentNode): Omit<PageContext, 'key'> | null {
  const card = root.querySelector('.sh-flashcard');
  if (!card) return null;
  const faces = [...card.querySelectorAll('.sh-flashcard__face .prose')];
  const front = faces[0] ? domToText(faces[0]) : '';
  if (!front) return null;
  const back = faces[1] ? domToText(faces[1]) : '';
  return {
    kind: 'card',
    title: clip(norm(card.querySelector('.sh-flashcard__meta')?.textContent ?? ''), MAX.title),
    text: clip(front, MAX.text),
    ...(back ? { solution: clip(back, MAX.solution) } : {}),
  };
}

/**
 * Teoria: il testo selezionato nell'articolo, se c'è; altrimenti la sezione (strato o titolo h2)
 * che occupa il terzo superiore della finestra; altrimenti l'inizio dell'articolo.
 */
export function theoryContext(
  article: Element,
  pageTitle: string,
  win: Window = window,
): Omit<PageContext, 'key'> {
  const sel = win.getSelection?.();
  if (
    sel &&
    !sel.isCollapsed &&
    sel.rangeCount &&
    article.contains(sel.getRangeAt(0).commonAncestorContainer)
  ) {
    const box = article.ownerDocument.createElement('div');
    box.append(sel.getRangeAt(0).cloneContents());
    const text = domToText(box);
    if (text) return { kind: 'theory', title: clip(pageTitle, MAX.title), text: clip(text, MAX.text) };
  }
  const sections = [...article.querySelectorAll<HTMLElement>('section.layer, h2')];
  const y = win.innerHeight / 3;
  let pick: Element | undefined;
  for (const s of sections) if (s.getBoundingClientRect().top <= y) pick = s;
  let text = '';
  let heading = '';
  if (pick?.tagName === 'H2') {
    heading = norm(pick.textContent ?? '');
    const box = article.ownerDocument.createElement('div');
    for (let n = pick.nextElementSibling; n && n.tagName !== 'H2'; n = n.nextElementSibling)
      box.append(n.cloneNode(true));
    text = domToText(box);
  } else if (pick) {
    heading = norm(pick.querySelector('h2, .layer__label')?.textContent ?? '');
    text = domToText(pick);
  }
  if (!text) text = domToText(article);
  const title = heading ? `${pageTitle} — ${heading}` : pageTitle;
  return { kind: 'theory', title: clip(title, MAX.title), text: clip(text, MAX.text) };
}

/** Scaletta del corso dall'indice (titoli e obiettivi): stessi byte a ogni domanda → in cache. */
export function courseOutline(index: {
  topics: { title: string; group?: string; objectives: { text: string; tex?: string }[] }[];
}): string {
  const lines = index.topics.map(
    (t, i) =>
      `${i + 1}. ${t.title}${t.group ? ` (${t.group})` : ''}: ${t.objectives.map((o) => o.tex ?? o.text).join('; ')}`,
  );
  let out = lines.join('\n');
  // Troppo lunga: solo i titoli.
  if (out.length > 6000) out = index.topics.map((t, i) => `${i + 1}. ${t.title}`).join('\n');
  return clip(out, 6000);
}

export type { TopicData };
