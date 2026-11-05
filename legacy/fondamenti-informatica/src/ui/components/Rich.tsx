import type { JSX } from 'preact';

/**
 * I contenuti di studio e i testi dei quesiti contengono markup inline
 * (<b>, <code>, <pre>, tabelle di verità) come nel prototipo. Questo è
 * l'unico punto dell'app che inietta HTML: la sorgente è il content layer
 * del repository, scritto a mano, non input esterno o di rete.
 */
export function Rich({
  html,
  as: Tag = 'div',
  class: className,
}: {
  html: string;
  as?: 'div' | 'span' | 'p';
  class?: string;
}): JSX.Element {
  return <Tag class={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
