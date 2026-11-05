/**
 * Algebra lineare densa per l'MNA: fattorizzazione LU complessa con pivoting
 * parziale. Le matrici dei circuiti didattici sono piccole (decine di
 * incognite): la forma densa è più semplice e abbastanza veloce. La
 * fattorizzazione si riusa su molti termini noti (passi del transitorio).
 */
import { Complex } from './complex';

export class SingularMatrixError extends Error {
  constructor(readonly column: number) {
    super(`Matrice singolare (colonna ${column})`);
    this.name = 'SingularMatrixError';
  }
}

/** Matrice complessa densa n×n, parti reale e immaginaria separate. */
export class CMatrix {
  readonly re: Float64Array;
  readonly im: Float64Array;
  constructor(readonly n: number) {
    this.re = new Float64Array(n * n);
    this.im = new Float64Array(n * n);
  }
  add(r: number, c: number, v: Complex | number): void {
    if (r < 0 || c < 0) return;
    const k = r * this.n + c;
    if (typeof v === 'number') this.re[k] = (this.re[k] ?? 0) + v;
    else {
      this.re[k] = (this.re[k] ?? 0) + v.re;
      this.im[k] = (this.im[k] ?? 0) + v.im;
    }
  }
  get(r: number, c: number): Complex {
    const k = r * this.n + c;
    return new Complex(this.re[k] ?? 0, this.im[k] ?? 0);
  }
}

/** Vettore complesso. */
export class CVector {
  readonly re: Float64Array;
  readonly im: Float64Array;
  constructor(readonly n: number) {
    this.re = new Float64Array(n);
    this.im = new Float64Array(n);
  }
  add(i: number, v: Complex | number): void {
    if (i < 0) return;
    if (typeof v === 'number') this.re[i] = (this.re[i] ?? 0) + v;
    else {
      this.re[i] = (this.re[i] ?? 0) + v.re;
      this.im[i] = (this.im[i] ?? 0) + v.im;
    }
  }
  get(i: number): Complex {
    return new Complex(this.re[i] ?? 0, this.im[i] ?? 0);
  }
}

/** Fattorizzazione LU (PA = LU) riutilizzabile. */
export class LU {
  private readonly re: Float64Array;
  private readonly im: Float64Array;
  private readonly perm: Int32Array;
  readonly n: number;

  constructor(A: CMatrix, tol = 1e-13) {
    const n = A.n;
    this.n = n;
    const re = Float64Array.from(A.re);
    const im = Float64Array.from(A.im);
    const perm = new Int32Array(n);
    for (let i = 0; i < n; i++) perm[i] = i;
    // Scala di riferimento per la tolleranza di singolarità.
    let scale = 0;
    for (let k = 0; k < n * n; k++) scale = Math.max(scale, Math.hypot(re[k]!, im[k]!));
    const eps = tol * (scale || 1);
    for (let c = 0; c < n; c++) {
      let p = c;
      let best = Math.hypot(re[c * n + c]!, im[c * n + c]!);
      for (let r = c + 1; r < n; r++) {
        const m = Math.hypot(re[r * n + c]!, im[r * n + c]!);
        if (m > best) {
          best = m;
          p = r;
        }
      }
      if (best <= eps) throw new SingularMatrixError(c);
      if (p !== c) {
        for (let k = 0; k < n; k++) {
          const a = c * n + k;
          const b = p * n + k;
          [re[a], re[b]] = [re[b]!, re[a]!];
          [im[a], im[b]] = [im[b]!, im[a]!];
        }
        [perm[c], perm[p]] = [perm[p]!, perm[c]!];
      }
      const pr = re[c * n + c]!;
      const pi = im[c * n + c]!;
      const den = pr * pr + pi * pi;
      for (let r = c + 1; r < n; r++) {
        const ar = re[r * n + c]!;
        const ai = im[r * n + c]!;
        if (ar === 0 && ai === 0) continue;
        // f = a / pivot
        const fr = (ar * pr + ai * pi) / den;
        const fi = (ai * pr - ar * pi) / den;
        re[r * n + c] = fr;
        im[r * n + c] = fi;
        for (let k = c + 1; k < n; k++) {
          const br = re[c * n + k]!;
          const bi = im[c * n + k]!;
          if (br === 0 && bi === 0) continue;
          re[r * n + k] = re[r * n + k]! - (fr * br - fi * bi);
          im[r * n + k] = im[r * n + k]! - (fr * bi + fi * br);
        }
      }
    }
    this.re = re;
    this.im = im;
    this.perm = perm;
  }

  /** Risolve A x = b. */
  solve(b: CVector): CVector {
    const { n, re, im, perm } = this;
    const x = new CVector(n);
    const yr = x.re;
    const yi = x.im;
    for (let i = 0; i < n; i++) {
      let sr = b.re[perm[i]!]!;
      let si = b.im[perm[i]!]!;
      for (let k = 0; k < i; k++) {
        const lr = re[i * n + k]!;
        const li = im[i * n + k]!;
        sr -= lr * yr[k]! - li * yi[k]!;
        si -= lr * yi[k]! + li * yr[k]!;
      }
      yr[i] = sr;
      yi[i] = si;
    }
    for (let i = n - 1; i >= 0; i--) {
      let sr = yr[i]!;
      let si = yi[i]!;
      for (let k = i + 1; k < n; k++) {
        const ur = re[i * n + k]!;
        const ui = im[i * n + k]!;
        sr -= ur * yr[k]! - ui * yi[k]!;
        si -= ur * yi[k]! + ui * yr[k]!;
      }
      const dr = re[i * n + i]!;
      const di = im[i * n + i]!;
      const den = dr * dr + di * di;
      yr[i] = (sr * dr + si * di) / den;
      yi[i] = (si * dr - sr * di) / den;
    }
    return x;
  }
}
