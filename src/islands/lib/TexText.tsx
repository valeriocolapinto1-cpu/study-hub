/** @jsxImportSource preact */
/**
 * Testo breve con matematica già resa a build-time (`html`, KaTeX leggero da `shortText` in
 * src/lib/course-data.ts); senza `html` è testo semplice. Nessun KaTeX nel browser.
 */
export function TexText({ text, html }: { text: string; html?: string | undefined }) {
  return html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : <>{text}</>;
}
