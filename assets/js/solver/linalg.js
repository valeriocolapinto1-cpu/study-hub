// Eliminazione di Gauss esatta su Cx (o qualunque campo con add/sub/mul/div/isZero).
export class SingularError extends Error { constructor(msg = 'Sistema singolare') { super(msg); this.name = 'SingularError'; } }

export function solveLinear(M, b, zero) {
  const n = b.length;
  const A = M.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = -1;
    for (let r = c; r < n; r++) if (!A[r][c].isZero()) { p = r; break; }
    if (p < 0) throw new SingularError();
    if (p !== c) [A[p], A[c]] = [A[c], A[p]];
    const piv = A[c][c];
    for (let r = c + 1; r < n; r++) {
      if (A[r][c].isZero()) continue;
      const f = A[r][c].div(piv);
      for (let k = c; k <= n; k++) A[r][k] = A[r][k].sub(f.mul(A[c][k]));
    }
  }
  const x = new Array(n).fill(zero);
  for (let r = n - 1; r >= 0; r--) {
    let s = A[r][n];
    for (let k = r + 1; k < n; k++) s = s.sub(A[r][k].mul(x[k]));
    x[r] = s.div(A[r][r]);
  }
  return x;
}
