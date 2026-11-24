import { describe, expect, it } from 'vitest';
import { theoryOutline } from '../../src/lib/theory-outline';

describe('theoryOutline: parole per il tempo di lettura', () => {
  it('una formula vale una parola; tag ed espressioni JSX non contano', () => {
    const body = "---\ntopic: x\n---\n<div data-note-id=\"a\">\n\nTre parole qui $v=R\\,i$.\n\n</div>\n{'nascosto'}";
    expect(theoryOutline(body, []).words).toBe(4);
  });

  it('un `<` dentro una formula non nasconde il testo che segue', () => {
    const body = '<div>\n\nSe $n-1<b-n+1$ conviene il metodo dei nodi.\n\n</div>\n\n<div>\n\nAltro testo.\n\n</div>';
    expect(theoryOutline(body, []).words).toBe(9);
  });
});
