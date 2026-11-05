/**
 * Esercizio d'analisi del sito originale: «determinare v_out(t) per tutto l'asse dei tempi».
 * Template A (nullore), B (doppio bipolo Z/Y con Thevenin/Norton), C (trasformatore ideale),
 * ciascuno a tre livelli (continua, sinusoidale, misto). Soluzione esatta in 8 passi; la
 * verifica indipendente (simulazione nel tempo e Laplace) è nei test.
 */
import { registerGenerator, type GeneratedExercise, type Lang } from '../../../engine/generators/registry';
import { createRng } from '../../../engine/random';
import { generateInstance } from '../lib/generate';
import { statement, steps } from '../lib/explain';
import { instanceNetlist } from '../lib/kit';
import type { Level, TemplateId } from '../lib/templates';
import type { AnalysisSolution } from '../lib/exercise';

const LBL = {
  it: {
    dc: 'componente continua di $v_{out}$ per $t<0$',
    cos: 'coefficiente di $\\cos(\\omega_0 t)$ per $t<0$',
    sin: 'coefficiente di $\\sin(\\omega_0 t)$ per $t<0$',
    req: '$R_{eq}$ vista dalla memoria',
    tau: '$\\tau$',
    k: '$K=v_{out}(0^+)$',
  },
  en: {
    dc: 'DC component of $v_{out}$ for $t<0$',
    cos: 'coefficient of $\\cos(\\omega_0 t)$ for $t<0$',
    sin: 'coefficient of $\\sin(\\omega_0 t)$ for $t<0$',
    req: '$R_{eq}$ seen by the memory element',
    tau: '$\\tau$',
    k: '$K=v_{out}(0^+)$',
  },
};

export function analysisAnswer(sol: AnalysisSolution, lang: Lang) {
  const l = LBL[lang];
  const x = sol.xKind === 'vC' ? '$v_C(0^-)$' : '$i_L(0^-)$';
  const ans: GeneratedExercise['answer'] = [];
  if (sol.hasDc) ans.push({ label: l.dc, value: sol.pre.dc.toNumber(), unit: 'V' });
  if (sol.hasAc)
    ans.push(
      { label: l.cos, value: sol.pre.cos.toNumber(), unit: 'V' },
      { label: l.sin, value: sol.pre.sin.toNumber(), unit: 'V' },
    );
  ans.push(
    { label: x, value: sol.x0.toNumber(), unit: sol.xKind === 'vC' ? 'V' : 'A' },
    { label: l.req, value: sol.req.toNumber(), unit: 'Ω' },
    { label: l.tau, value: sol.tau.toNumber(), unit: 's' },
    { label: l.k, value: sol.k.toNumber(), unit: 'V' },
  );
  return ans;
}

export function analysisExercise(
  template: TemplateId | 'any',
  level: Level,
  seed: number,
  lang: Lang,
): GeneratedExercise {
  const tpl: TemplateId = template === 'any' ? createRng(seed).pick(['A', 'B', 'C'] as const) : template;
  const { inst, sol } = generateInstance(tpl, level, seed);
  return {
    statement: statement(inst, sol, lang),
    figure: { netlist: instanceNetlist(inst) },
    steps: steps(inst, sol, lang),
    answer: analysisAnswer(sol, lang),
  };
}

const DEFS: { name: string; template: TemplateId | 'any'; topic: string; objectives: string[] }[] = [
  {
    name: 'analisi-nullore',
    template: 'A',
    topic: 'nullore-e-amplificatore-operazionale',
    objectives: ['nullore-e-amplificatore-operazionale.3'],
  },
  {
    name: 'analisi-doppio-bipolo',
    template: 'B',
    topic: 'doppi-bipoli-z-y',
    objectives: ['doppi-bipoli-z-y.1', 'doppi-bipoli-z-y.2'],
  },
  {
    name: 'analisi-trasformatore',
    template: 'C',
    topic: 'trasformatore-ideale',
    objectives: ['trasformatore-ideale.3'],
  },
  {
    name: 'analisi-primo-ordine',
    template: 'any',
    topic: 'circuiti-primo-ordine',
    objectives: ['circuiti-primo-ordine.1', 'circuiti-primo-ordine.3'],
  },
];
for (const d of DEFS)
  for (const level of [1, 2, 3] as const)
    registerGenerator({
      id: `teoria-circuiti/${d.name}-${level}`,
      topic: d.topic,
      objectives: d.objectives,
      generate: (seed, lang) => analysisExercise(d.template, level, seed, lang),
    });
