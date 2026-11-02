// Generatore di istanze: parametri casuali con seed, vincoli di «bellezza», doppia verifica.
import { makeRng } from './rng.js';
import { TEMPLATES } from './templates/index.js';
import { analyze, InvalidInstance } from './solver/exercise.js';
import { crossCheck } from './solver/simulator.js';
import { SingularError } from './solver/linalg.js';
import { validate } from './solver/netlist.js';

export function isBeautiful(sol, level) {
  const vals = [sol.pre.dc, sol.pre.cos, sol.pre.sin, sol.x0, sol.k, sol.tau, sol.req];
  if (vals.some((q) => q.d > 120n || (q.n < 0n ? -q.n : q.n) > 999n || Math.abs(q.toNumber()) > 300)) return false;
  if (sol.k.isZero()) return false;
  const t = sol.tau.toNumber();
  if (t < 0.1 || t > 20) return false;
  if (sol.hasAc && sol.pre.cos.isZero() && sol.pre.sin.isZero()) return false;
  if (level === 1 && sol.pre.dc.isZero()) return false;
  if (level === 3 && (sol.pre.dc.isZero() || (sol.pre.cos.isZero() && sol.pre.sin.isZero()))) return false;
  return true;
}

/**
 * genera({template, level, seed, variant, verify}) → {seed, inst, sol, check, attempts}
 * Con `verify` (default true) ogni istanza è confrontata con il simulatore indipendente: se differisce, è scartata.
 */
export function generate({ template = 'A', level = 1, seed = 1, variant, verify = true, maxAttempts = 200 } = {}) {
  const T = TEMPLATES[template];
  if (!T) throw new Error('template ignoto: ' + template);
  const rng = makeRng(`${template}|${level}|${variant || ''}|${seed}`);
  let rejected = 0;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const inst = T.build(rng, { level, variant });
    try {
      validate(inst.circuit);
      const sol = analyze(inst);
      if (!isBeautiful(sol, level)) { rejected++; continue; }
      let check = null;
      if (verify) {
        check = crossCheck(inst, sol);
        if (!check.ok) { rejected++; continue; }
      }
      return { seed, inst, sol, check, attempts: attempt, rejected };
    } catch (e) {
      if (e instanceof InvalidInstance || e instanceof SingularError || e instanceof RangeError) { rejected++; continue; }
      throw e;
    }
  }
  throw new Error(`Nessuna istanza valida dopo ${maxAttempts} tentativi (template ${template}, livello ${level})`);
}
