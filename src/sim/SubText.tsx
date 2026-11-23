/** @jsxImportSource preact */
/**
 * Testo breve delle simulazioni con pedici e apici scritti «da tastiera» (`T_C`, `v_{cm}`, `e^{−γt}`):
 * resi con `<sub>`/`<sup>`, senza KaTeX nel browser (stessa regola delle didascalie, CaptionText.astro).
 */
const PART = /(?<=[\p{L}\d)])(_|\^)(\{[^}]+\}|[\p{L}\d∞]+)/u;

export function SubText({ text }: { text: string }) {
  const parts = text.split(new RegExp(PART.source, 'gu'));
  const out = [];
  for (let i = 0; i < parts.length; i += 3) {
    if (parts[i]) out.push(parts[i]);
    const kind = parts[i + 1];
    const body = parts[i + 2]?.replace(/^\{|\}$/g, '');
    if (kind && body !== undefined)
      out.push(kind === '_' ? <sub key={i}>{body}</sub> : <sup key={i}>{body}</sup>);
  }
  return <>{out}</>;
}
