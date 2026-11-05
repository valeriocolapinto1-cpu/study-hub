/**
 * Etichette con pedici in markup semplice: "V_R", "v_{out}", "i_L(t)".
 * In HTML usa <sub>, in SVG <tspan> con baseline spostata.
 */
import type { JSX } from 'preact';

export function splitSub(text: string): Array<{ t: string; sub: boolean }> {
  const out: Array<{ t: string; sub: boolean }> = [];
  const re = /_\{([^}]*)\}|_([A-Za-z0-9]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ t: text.slice(last, m.index), sub: false });
    out.push({ t: m[1] ?? m[2] ?? '', sub: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last), sub: false });
  return out;
}

/** Testo semplice (per aria-label e letture). */
export const plain = (text: string): string =>
  splitSub(text)
    .map((p) => p.t)
    .join('');

export function RichText({ text, svg = false }: { text: string; svg?: boolean }): JSX.Element {
  const parts = splitSub(text);
  if (!svg) return <>{parts.map((p) => (p.sub ? <sub>{p.t}</sub> : p.t))}</>;
  let down = false;
  return (
    <>
      {parts.map((p) => {
        if (p.sub) {
          const dy = down ? undefined : '0.3em';
          down = true;
          return (
            <tspan dy={dy} font-size="0.75em">
              {p.t}
            </tspan>
          );
        }
        const dy = down ? '-0.3em' : undefined;
        down = false;
        return <tspan dy={dy}>{p.t}</tspan>;
      })}
    </>
  );
}
