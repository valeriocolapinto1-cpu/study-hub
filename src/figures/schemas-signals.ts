/**
 * Schemi Zod dei tipi «segnali e logica»: diagrammi di Bode, piano dei poli e degli zeri,
 * diagrammi temporali digitali, mappe di Karnaugh, campi di bit, diagrammi di pipeline e
 * grafi. Tenuti in un file a parte per non intrecciarsi con gli altri gruppi; il registro
 * è `DIAGRAM_SCHEMAS` in `schemas.ts`. Guida: docs/FIGURE.md.
 */
import { z } from 'astro/zod';

/** Come `FigText` di `schemas.ts` (ridefinito qui per evitare l'import circolare). */
const FigText = z.union([
  z.string(),
  z.strictObject({ it: z.string().min(1), en: z.string().min(1).optional() }),
]);
const finite = z.number().refine(Number.isFinite, 'numero finito');
const pos = finite.refine((v) => v > 0, 'valore positivo');
const label = z.string().max(24);
const tone = z.enum(['ink', 'muted', 'accent', 'accent2', 'info', 'success', 'warning', 'danger']);

// ------------------------------------------------------------------- Bode
const bodeFactor = z.strictObject({
  /** Pulsazione d'angolo (o naturale, per una coppia complessa) in rad/s. */
  w: pos,
  /** Smorzamento 0 < ζ < 1: coppia complessa coniugata 1 + 2ζ(s/ω) + (s/ω)². */
  zeta: finite.refine((v) => v > 0 && v < 1, 'ζ tra 0 e 1 (esclusi)').optional(),
});

export const Bode = z
  .strictObject({
    /** Guadagno K nella forma K·Π(1+s/z)/Π(1+s/p) (con s^n davanti se ci sono fattori nell'origine). */
    gain: finite.refine((v) => v !== 0, 'guadagno non nullo').optional(),
    zeros: z.array(bodeFactor).max(4).optional(),
    poles: z.array(bodeFactor).max(4).optional(),
    /** Zeri (positivo) o poli (negativo) nell'origine. */
    origin: z.number().int().min(-2).max(2).optional(),
    range: z.strictObject({ min: pos, max: pos }).optional(),
    show: z
      .array(z.enum(['mag', 'phase']))
      .min(1)
      .max(2)
      .optional(),
    asymptotes: z.boolean().optional(),
    markers: z
      .array(z.strictObject({ w: pos, label: label.optional() }))
      .max(4)
      .optional(),
    label: label.optional(),
  })
  .refine((p) => !p.range || p.range.max > p.range.min * 10, 'range: almeno una decade')
  .refine((p) => (p.zeros?.length ?? 0) + (p.poles?.length ?? 0) + Math.abs(p.origin ?? 0) > 0, {
    message: 'serve almeno un polo o uno zero',
  });

// ---------------------------------------------------------- poli e zeri
const root = z.strictObject({ re: finite, im: finite, label: label.optional() });
export const PoleZero = z
  .strictObject({
    poles: z.array(root).max(8).optional(),
    zeros: z.array(root).max(8).optional(),
    /** Semipiano sinistro evidenziato (regione di stabilità). */
    stableRegion: z.boolean().optional(),
    /** Semiampiezza degli assi (default dai punti). */
    range: pos.optional(),
    /** Asse orizzontale/verticale: σ e jω (default). */
    axisLabels: z.tuple([label, label]).optional(),
  })
  .refine((p) => (p.poles?.length ?? 0) + (p.zeros?.length ?? 0) > 0, 'serve almeno un polo o uno zero');

// ------------------------------------------------------ diagramma temporale
const waveStr = z.string().regex(/^[01xz.]{1,32}$/, 'livelli 0, 1, x, z o . (ripeti il precedente)');
export const Timing = z
  .strictObject({
    signals: z
      .array(
        z.union([
          z.strictObject({ label, kind: z.literal('clock'), tone: tone.optional() }),
          z.strictObject({ label, wave: waveStr, tone: tone.optional() }),
          z.strictObject({
            label,
            /** Valori del bus per passo; una stringa uguale alla precedente prolunga il valore. */
            bus: z.array(z.string().max(8)).min(1).max(32),
          }),
        ]),
      )
      .min(1)
      .max(8),
    /** Numero di passi (mezzi periodi del clock); default dalla forma più lunga. */
    steps: z.number().int().min(2).max(32).optional(),
    markers: z
      .array(z.strictObject({ at: finite, label: label.optional() }))
      .max(6)
      .optional(),
  })
  .superRefine((p, ctx) => {
    p.signals.forEach((sg, i) => {
      if ('wave' in sg && sg.wave[0] === '.')
        ctx.addIssue({
          code: 'custom',
          path: ['signals', i, 'wave'],
          message: 'il primo livello non può essere «.»',
        });
    });
  });

// --------------------------------------------------------- mappa di Karnaugh
const kbit = z.union([z.literal(0), z.literal(1), z.literal('x'), z.literal('-')]);
export const Karnaugh = z
  .strictObject({
    /** Variabili, la prima è la più significativa (2–4). */
    vars: z.array(z.string().min(1).max(4)).min(2).max(4),
    /** Valore per mintermine (indice = numero binario delle variabili). */
    values: z.array(kbit),
    groups: z
      .array(
        z.strictObject({
          cells: z.array(z.number().int().min(0).max(15)).min(1).max(16),
          tone: tone.optional(),
          label: label.optional(),
        }),
      )
      .max(8)
      .optional(),
    output: z.string().max(4).optional(),
  })
  .superRefine((p, ctx) => {
    const n = 2 ** p.vars.length;
    if (p.values.length !== n)
      ctx.addIssue({ code: 'custom', path: ['values'], message: `servono ${n} valori` });
    p.groups?.forEach((g, i) => {
      if (g.cells.some((m) => m >= n))
        ctx.addIssue({
          code: 'custom',
          path: ['groups', i, 'cells'],
          message: `mintermini tra 0 e ${n - 1}`,
        });
      if (![1, 2, 4, 8, 16].includes(new Set(g.cells).size))
        ctx.addIssue({
          code: 'custom',
          path: ['groups', i, 'cells'],
          message: 'un gruppo ha 1, 2, 4, 8 o 16 celle',
        });
    });
  });

// ------------------------------------------------------------- campi di bit
export const Bitfield = z
  .strictObject({
    /** Bit dal più significativo; ammessi 0, 1 e «?» (sconosciuto); spazi ignorati. */
    bits: z.string().regex(/^[01? ]+$/, 'solo 0, 1, ? e spazi'),
    /** Campi in posizioni di bit (msb, lsb), numerate da destra a partire da 0. */
    fields: z
      .array(
        z.strictObject({
          msb: z.number().int().min(0),
          lsb: z.number().int().min(0),
          label: FigText,
          tone: tone.optional(),
        }),
      )
      .max(8)
      .optional(),
    indices: z.boolean().optional(),
    caption: FigText.optional(),
  })
  .superRefine((p, ctx) => {
    const n = p.bits.replace(/ /g, '').length;
    if (n < 1 || n > 32) ctx.addIssue({ code: 'custom', path: ['bits'], message: 'da 1 a 32 bit' });
    p.fields?.forEach((f, i) => {
      if (f.msb < f.lsb || f.msb >= n)
        ctx.addIssue({ code: 'custom', path: ['fields', i], message: `serve ${n - 1} ≥ msb ≥ lsb` });
    });
  });

// --------------------------------------------------------------- pipeline
export const Pipeline = z
  .strictObject({
    rows: z
      .array(
        z.strictObject({
          label: z.string().max(20),
          /** Ciclo d'ingresso (da 1). */
          start: z.number().int().min(1).max(24),
          /** Stadi uno per ciclo; «-» = stallo (bolla). */
          stages: z.array(z.string().max(4)).min(1).max(16),
        }),
      )
      .min(1)
      .max(8),
    /** Inoltri (forwarding): dall'uscita di uno stadio all'ingresso di un altro. */
    forwards: z
      .array(
        z.strictObject({
          from: z.tuple([z.number().int().min(0), z.number().int().min(1)]),
          to: z.tuple([z.number().int().min(0), z.number().int().min(1)]),
        }),
      )
      .max(6)
      .optional(),
    cycleLabel: FigText.optional(),
  })
  .superRefine((p, ctx) => {
    const last = Math.max(...p.rows.map((r) => r.start + r.stages.length - 1));
    if (last > 24) ctx.addIssue({ code: 'custom', path: ['rows'], message: 'al massimo 24 cicli' });
    p.forwards?.forEach((f, i) => {
      for (const k of ['from', 'to'] as const)
        if (f[k][0] >= p.rows.length || f[k][1] > last)
          ctx.addIssue({
            code: 'custom',
            path: ['forwards', i, k],
            message: '[riga, ciclo] fuori dal diagramma',
          });
    });
  });

// ------------------------------------------------------------------ grafo
const gid = z.string().regex(/^[A-Za-z0-9_-]{1,12}$/, 'id: lettere, cifre, - e _');
export const Graph = z
  .strictObject({
    nodes: z
      .array(
        z.strictObject({
          id: gid,
          label: label.optional(),
          /** Posizione facoltativa su una griglia 0–10 (y verso il basso); altrimenti in cerchio. */
          x: finite.refine((v) => v >= 0 && v <= 10, '0–10').optional(),
          y: finite.refine((v) => v >= 0 && v <= 10, '0–10').optional(),
        }),
      )
      .min(2)
      .max(12),
    edges: z
      .array(
        z.strictObject({
          from: gid,
          to: gid,
          label: label.optional(),
          /** Evidenziato (albero, cammino). */
          highlight: z.boolean().optional(),
          dashed: z.boolean().optional(),
        }),
      )
      .min(1)
      .max(24),
    directed: z.boolean().optional(),
  })
  .superRefine((p, ctx) => {
    const ids = new Set(p.nodes.map((n) => n.id));
    if (ids.size !== p.nodes.length)
      ctx.addIssue({ code: 'custom', path: ['nodes'], message: 'id ripetuti' });
    const placed = p.nodes.filter((n) => n.x !== undefined && n.y !== undefined).length;
    if (placed && placed !== p.nodes.length)
      ctx.addIssue({
        code: 'custom',
        path: ['nodes'],
        message: 'posizioni x, y per tutti i nodi o per nessuno',
      });
    p.edges.forEach((e, i) => {
      for (const k of ['from', 'to'] as const)
        if (!ids.has(e[k]))
          ctx.addIssue({ code: 'custom', path: ['edges', i, k], message: `nodo "${e[k]}" inesistente` });
      if (e.from === e.to) ctx.addIssue({ code: 'custom', path: ['edges', i], message: 'niente autoanelli' });
    });
  });
