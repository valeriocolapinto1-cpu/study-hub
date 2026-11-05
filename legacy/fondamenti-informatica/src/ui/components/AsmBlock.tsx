import type { JSX } from 'preact';
import type { AsmLine } from '~/engine/types';

/** Un pezzo di riga con la sua classe di colore, o senza. */
interface Piece {
  text: string;
  cls?: 'kw' | 'rg';
}

/**
 * Spezza una riga di assembly nei pezzi da colorare: il **mnemonico** in
 * testa e i **registri** ovunque compaiano. Numeri, virgole e parentesi
 * restano del colore del listato.
 *
 * Le classi `.kw` e `.rg` esistevano dal prototipo ma nessuno le emetteva:
 * i listati uscivano tutti dello stesso grigio, e in un quesito come
 * «quale valore contiene R3 alla fine» distinguere a colpo d'occhio i
 * registri dagli immediati è metà del lavoro.
 */
function split(text: string): Piece[] {
  const pieces: Piece[] = [];
  let rest = text;

  // Il mnemonico è la prima parola della riga, spazi di rientro esclusi.
  const head = /^\s*[A-Za-z_]\w*/.exec(rest);
  if (head) {
    const raw = head[0];
    const indent = raw.length - raw.trimStart().length;
    if (indent > 0) pieces.push({ text: raw.slice(0, indent) });
    pieces.push({ text: raw.slice(indent), cls: 'kw' });
    rest = rest.slice(raw.length);
  }

  let cursor = 0;
  for (const match of rest.matchAll(/R\d+/g)) {
    const at = match.index ?? cursor;
    if (at > cursor) pieces.push({ text: rest.slice(cursor, at) });
    pieces.push({ text: match[0], cls: 'rg' });
    cursor = at + match[0].length;
  }
  if (cursor < rest.length) pieces.push({ text: rest.slice(cursor) });

  return pieces;
}

/**
 * Listato assembly. Le righe arrivano già strutturate dal motore
 * (etichetta / istruzione / commento): qui si decide solo come colorarle,
 * senza che la UI debba interpretare il codice.
 */
export function AsmBlock({ lines }: { lines: AsmLine[] }): JSX.Element {
  return (
    <pre>
      {lines.map((line, index) => (
        <span key={index}>
          {line.label ? <span class="lb">{line.label.padEnd(6)}</span> : '      '}
          {split(line.text).map((piece, position) =>
            piece.cls ? (
              <span key={position} class={piece.cls}>
                {piece.text}
              </span>
            ) : (
              piece.text
            ),
          )}
          {line.comment ? <span class="cm">{`  ${line.comment}`}</span> : null}
          {index < lines.length - 1 ? '\n' : ''}
        </span>
      ))}
    </pre>
  );
}
