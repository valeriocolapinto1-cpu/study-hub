/** Generazione di istanze dell'esercizio d'analisi: parametri con seme, vincoli di «bellezza», soluzione esatta. */
import { createRng, deriveSeed } from '../../../engine/random';
import { analyze, InvalidInstance, type AnalysisSolution, type Instance } from './exercise';
import { SingularError } from './linalg';
import { validate } from './netlist';
import { BUILD, type Level, type TemplateId } from './templates';

export function isBeautiful(sol: AnalysisSolution, level: Level): boolean {
  const vals = [sol.pre.dc, sol.pre.cos, sol.pre.sin, sol.x0, sol.k, sol.tau, sol.req];
  if (vals.some((q) => q.d > 120n || (q.n < 0n ? -q.n : q.n) > 999n || Math.abs(q.toNumber()) > 300))
    return false;
  if (sol.k.isZero()) return false;
  const t = sol.tau.toNumber();
  if (t < 0.1 || t > 20) return false;
  if (sol.hasAc && sol.pre.cos.isZero() && sol.pre.sin.isZero()) return false;
  if (level === 1 && (sol.pre.dc.isZero() || vals.some((q) => q.d > 60n))) return false;
  if (level === 3 && (sol.pre.dc.isZero() || (sol.pre.cos.isZero() && sol.pre.sin.isZero()))) return false;
  return true;
}

export interface Generated {
  inst: Instance;
  sol: AnalysisSolution;
  attempts: number;
}

export function generateInstance(
  template: TemplateId,
  level: Level,
  seed: number,
  variant?: string,
  maxAttempts = 400,
): Generated {
  const rng = createRng(deriveSeed('tdc', template, level, variant ?? '', seed));
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const inst = BUILD[template](rng, level, variant);
    try {
      validate(inst.circuit);
      const sol = analyze(inst);
      if (isBeautiful(sol, level)) return { inst, sol, attempts: attempt };
    } catch (e) {
      if (e instanceof InvalidInstance || e instanceof SingularError || e instanceof RangeError) continue;
      throw e;
    }
  }
  throw new Error(
    `Nessuna istanza valida dopo ${maxAttempts} tentativi (template ${template}, livello ${level})`,
  );
}
