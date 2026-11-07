/**
 * Figure dei generatori costruite dai parametri del seme con i tipi del kit: diagrammi di
 * flusso dei mini-programmi assembly, campi di bit IEEE 754 e degli indirizzi, schema della
 * cache, diagramma della pipeline.
 */
import type { ExerciseFigure, Lang } from '../../../engine/generators/registry';

const t = (it: string, en: string) => ({ it, en });

type Node = {
  id: string;
  kind: 'start' | 'end' | 'process' | 'decision' | 'io' | 'call';
  text: string | { it: string; en: string };
};
type Edge = { from: string; to: string; label?: string | { it: string; en: string } };
const flow = (nodes: Node[], edges: Edge[]): ExerciseFigure => ({
  diagram: { type: 'flowchart', params: { nodes, edges } },
});
const START: Node = { id: 's', kind: 'start', text: t('inizio', 'start') };
const END: Node = { id: 'e', kind: 'end', text: t('fine', 'end') };
const YES = t('sì', 'yes');

/** Ciclo con contatore: R1 parte da `start` e scende di `step` finché è > 0, R2 conta i giri. */
export const figLoop = (start: number, step: number): ExerciseFigure =>
  flow(
    [
      START,
      { id: 'i', kind: 'process', text: `R1 ← ${start}; R2 ← 0` },
      { id: 'b', kind: 'process', text: `R1 ← R1 − ${step}; R2 ← R2 + 1` },
      { id: 'c', kind: 'decision', text: 'R1 > 0?' },
      END,
    ],
    [
      { from: 's', to: 'i' },
      { from: 'i', to: 'b' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'e', label: 'no' },
      { from: 'c', to: 'b', label: YES },
    ],
  );

/** Prodotto, confronto e salto: se R3 = cmp si salta l'addizione. */
export const figMulCmp = (a: number, b: number, cmp: number, add: number): ExerciseFigure =>
  flow(
    [
      START,
      { id: 'm', kind: 'process', text: `R3 ← ${a} · ${b}` },
      { id: 'c', kind: 'decision', text: `R3 = ${cmp}?` },
      { id: 'a', kind: 'process', text: `R3 ← R3 + ${add}` },
      END,
    ],
    [
      { from: 's', to: 'm' },
      { from: 'm', to: 'c' },
      { from: 'c', to: 'a', label: 'no' },
      { from: 'c', to: 'e', label: YES },
      { from: 'a', to: 'e' },
    ],
  );

/** Shift a sinistra e poi a destra. */
export const figShift = (value: number, left: number, right: number): ExerciseFigure =>
  flow(
    [
      START,
      { id: 'v', kind: 'process', text: `R1 ← ${value}` },
      { id: 'l', kind: 'process', text: `R1 ← R1 << ${left}` },
      { id: 'r', kind: 'process', text: `R1 ← R1 >> ${right}` },
      END,
    ],
    [
      { from: 's', to: 'v' },
      { from: 'v', to: 'l' },
      { from: 'l', to: 'r' },
      { from: 'r', to: 'e' },
    ],
  );

const IEEE_FIELDS = [
  { msb: 31, lsb: 31, label: 'S' },
  { msb: 30, lsb: 23, label: t('esponente', 'exponent') },
  { msb: 22, lsb: 0, label: t('mantissa', 'fraction') },
];

/** Parola IEEE 754 a 32 bit (bit noti, oppure tutti «?» per il solo formato). */
export const figIeee = (bits?: string): ExerciseFigure => ({
  diagram: { type: 'bitfield', params: { bits: bits ?? '?'.repeat(32), fields: IEEE_FIELDS } },
});

/** Indirizzo virtuale diviso in numero di pagina e offset (bit sconosciuti: si cerca la traduzione). */
export const figVirtualAddress = (pageBits: number, offsetBits: number, page: number): ExerciseFigure => ({
  diagram: {
    type: 'bitfield',
    params: {
      bits: '?'.repeat(pageBits + offsetBits),
      fields: [
        { msb: pageBits + offsetBits - 1, lsb: offsetBits, label: t(`pagina ${page}`, `page ${page}`) },
        { msb: offsetBits - 1, lsb: 0, label: 'offset' },
      ],
    },
  },
});

/** Traduzione di un indirizzo virtuale con TLB e tabella delle pagine. */
export const figTranslation = (vaBits: number, kib: number): ExerciseFigure => ({
  diagram: {
    type: 'block-diagram',
    params: {
      blocks: [
        {
          id: 'va',
          text: t(`indirizzo virtuale (${vaBits} bit)`, `virtual address (${vaBits} bits)`),
          col: 0,
          row: 0,
          span: 2,
        },
        { id: 'tlb', text: 'TLB', col: 0, row: 1 },
        { id: 'pt', text: t('tabella delle pagine', 'page table'), col: 1, row: 1 },
        {
          id: 'pa',
          text: t(`indirizzo fisico (pagine da ${kib} KiB)`, `physical address (${kib} KiB pages)`),
          col: 0,
          row: 2,
          span: 2,
          emphasis: true,
        },
      ],
      links: [
        { from: 'va', to: 'tlb', label: t('pagina', 'page') },
        { from: 'tlb', to: 'pt', label: 'miss' },
        { from: 'tlb', to: 'pa', label: 'hit' },
        { from: 'pt', to: 'pa', label: 'frame' },
      ],
    },
  },
});

/** Organizzazione della cache: campi dell'indirizzo (tag, indice, offset) e vie del gruppo scelto. */
export function figCache(ways: number, sets: number, blockBytes: number, lang: Lang): ExerciseFigure {
  const viaLbl = (i: number) => (lang === 'en' ? `way ${i}` : `via ${i}`);
  const shown = Math.min(ways, 4);
  const blocks = [
    { id: 'tag', text: 'tag', col: 0, row: 0 },
    { id: 'idx', text: t('indice', 'index'), col: 1, row: 0 },
    { id: 'off', text: 'offset', col: 2, row: 0 },
    {
      id: 'set',
      text: t(`gruppo (1 di ${sets})`, `set (1 of ${sets})`),
      col: 0,
      row: 1,
      span: 3,
      emphasis: true,
    },
    ...Array.from({ length: shown }, (_, i) => ({
      id: `w${i}`,
      text: ways > shown && i === shown - 1 ? `… ${viaLbl(ways - 1)}` : `${viaLbl(i)} · ${blockBytes} B`,
      col: i,
      row: 2,
    })),
  ];
  return {
    diagram: {
      type: 'block-diagram',
      params: {
        blocks,
        links: [
          { from: 'idx', to: 'set' },
          ...Array.from({ length: shown }, (_, i) => ({ from: 'set', to: `w${i}` })),
        ],
      },
    },
  };
}

/** Prime tre istruzioni in una pipeline a k stadi senza stalli. */
export const figPipeline = (k: number): ExerciseFigure => {
  const stages = Array.from({ length: k }, (_, i) => `S${i + 1}`);
  return {
    diagram: {
      type: 'pipeline',
      params: { rows: [1, 2, 3].map((i) => ({ label: `i${i}`, start: i, stages })) },
    },
  };
};
