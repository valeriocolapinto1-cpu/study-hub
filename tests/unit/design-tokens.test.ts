/**
 * Verifica WCAG 2.2 AA dei token colore in entrambi i temi e per ogni accento di corso.
 * Legge direttamente i file CSS: se un token cambia, il test lo ricontrolla.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const STYLES = join(process.cwd(), 'src/styles');
type Vars = Record<string, string>;

function block(raw: string, selector: string): Vars {
  const css = raw.replaceAll("'", '"');
  const i = css.indexOf(selector + ' {');
  if (i < 0) throw new Error(`selettore non trovato: ${selector}`);
  const body = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  const out: Vars = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) out[m[1]!] = m[2]!.toLowerCase();
  return out;
}
function lum(hex: string): number {
  const c = [1, 3, 5].map((k) => parseInt(hex.slice(k, k + 2), 16) / 255);
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

const tokens = readFileSync(join(STYLES, 'tokens.css'), 'utf8');
// Scuro di default (:root), chiaro solo con l'interruttore (data-theme="light").
const themes = { dark: block(tokens, ':root'), light: block(tokens, ':root[data-theme="light"]') };

// [primo piano, sfondo, minimo]
const TEXT_PAIRS: [string, string, number][] = [
  ['--text', '--bg', 7],
  ['--text', '--surface', 7],
  ['--text', '--surface-2', 4.5],
  ['--text-muted', '--bg', 4.5],
  ['--text-muted', '--surface', 4.5],
  ['--text-muted', '--surface-2', 4.5],
  ['--success', '--bg', 4.5],
  ['--warning', '--bg', 4.5],
  ['--danger', '--bg', 4.5],
  ['--info', '--bg', 4.5],
  ['--success', '--surface', 4.5],
  ['--warning', '--surface', 4.5],
  ['--danger', '--surface', 4.5],
  ['--info', '--surface', 4.5],
  ['--border-strong', '--bg', 3],
  ['--border-strong', '--surface', 3],
  ['--focus', '--bg', 3],
  ['--focus', '--surface', 3],
];
const ACCENT_PAIRS: [string, string, number][] = [
  ['--accent-strong', '--bg', 4.5],
  ['--accent-strong', '--surface', 4.5],
  ['--accent-strong', '--accent-soft', 4.5],
  ['--accent', '--bg', 3],
  ['--accent', '--surface', 3],
  ['--on-accent', '--accent', 4.5],
  ['--text', '--accent-soft', 7],
];

describe('token colore — contrasto AA', () => {
  for (const [name, v] of Object.entries(themes)) {
    it(`tema ${name}: definisce tutti i colori del contratto`, () => {
      for (const k of [
        '--bg',
        '--surface',
        '--surface-2',
        '--text',
        '--text-muted',
        '--border',
        '--border-strong',
        '--accent',
        '--accent-strong',
        '--accent-soft',
        '--on-accent',
        '--success',
        '--warning',
        '--danger',
        '--info',
        '--focus',
      ])
        expect(v[k], k).toBeDefined();
    });
    for (const [f, b, min] of [...TEXT_PAIRS, ...ACCENT_PAIRS]) {
      it(`tema ${name}: ${f} su ${b} ≥ ${min}`, () =>
        expect(ratio(v[f]!, v[b]!)).toBeGreaterThanOrEqual(min));
    }
  }
});

describe('accenti di corso — contrasto AA', () => {
  const files = readdirSync(join(STYLES, 'courses')).filter((f) => f.endsWith('.css'));
  it('esistono i quattro corsi', () => {
    expect(files.sort()).toEqual([
      'fisica-1.css',
      'fisica-2.css',
      'fondamenti-informatica.css',
      'teoria-circuiti.css',
    ]);
  });
  for (const f of files) {
    const id = f.replace('.css', '');
    const css = readFileSync(join(STYLES, 'courses', f), 'utf8');
    it(`${id}: ridefinisce solo superfici, testo e accento`, () => {
      for (const m of css.matchAll(/(--[\w-]+)\s*:/g))
        expect(m[1]).toMatch(
          /^--(accent(-strong|-soft|-2)?|on-accent|bg|surface(-2|-3)?|text(-muted)?|border(-strong)?|header-bg)$/,
        );
    });
    const acc = {
      dark: block(css, `html[data-course="${id}"]:not([data-theme="light"])`),
      light: block(css, `html[data-course="${id}"][data-theme="light"]`),
    };
    for (const t of ['light', 'dark'] as const) {
      const v = { ...themes[t], ...acc[t] };
      for (const [fg, bg, min] of [...TEXT_PAIRS, ...ACCENT_PAIRS]) {
        it(`${id} ${t}: ${fg} su ${bg} ≥ ${min}`, () =>
          expect(ratio(v[fg]!, v[bg]!)).toBeGreaterThanOrEqual(min));
      }
    }
  }
});
