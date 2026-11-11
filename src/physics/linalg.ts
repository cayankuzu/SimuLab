/**
 * Small dense linear-algebra kernels (n <= 6 in this project).
 * Matrices are stored row-major in a flat Float64Array.
 * Algorithms follow [golub2013]: Cholesky factorisation (Alg. 4.2.1) and the
 * cyclic Jacobi eigenvalue method for symmetric matrices (section 8.5).
 */

/**
 * In-place Cholesky factorisation A = L L^T of a symmetric positive-definite
 * matrix. Only the lower triangle is read and it is overwritten by L.
 * @returns false if the matrix is not numerically positive definite.
 */
export function choleskyFactor(a: Float64Array, n: number): boolean {
  for (let j = 0; j < n; j++) {
    let d = a[j * n + j];
    for (let k = 0; k < j; k++) {
      const l = a[j * n + k];
      d -= l * l;
    }
    if (!(d > 0)) return false;
    const ljj = Math.sqrt(d);
    a[j * n + j] = ljj;
    for (let i = j + 1; i < n; i++) {
      let s = a[i * n + j];
      for (let k = 0; k < j; k++) s -= a[i * n + k] * a[j * n + k];
      a[i * n + j] = s / ljj;
    }
  }
  return true;
}

/** Solves L L^T x = b in place given the Cholesky factor L (lower triangle of l). */
export function choleskySolve(l: Float64Array, n: number, b: Float64Array): void {
  for (let i = 0; i < n; i++) {
    let s = b[i];
    for (let k = 0; k < i; k++) s -= l[i * n + k] * b[k];
    b[i] = s / l[i * n + i];
  }
  for (let i = n - 1; i >= 0; i--) {
    let s = b[i];
    for (let k = i + 1; k < n; k++) s -= l[k * n + i] * b[k];
    b[i] = s / l[i * n + i];
  }
}

export interface EigenSystem {
  /** Eigenvalues in ascending order. */
  values: Float64Array;
  /** Eigenvectors as matrix columns (row-major n x n), same order as values. */
  vectors: Float64Array;
}

/** Eigen-decomposition of a real symmetric matrix by cyclic Jacobi rotations. */
export function symmetricEigen(matrix: Float64Array, n: number): EigenSystem {
  const a = Float64Array.from(matrix);
  const v = new Float64Array(n * n);
  for (let i = 0; i < n; i++) v[i * n + i] = 1;

  let scale = 0;
  for (let i = 0; i < n * n; i++) scale += a[i] * a[i];
  const tolerance = 1e-30 * Math.max(scale, Number.MIN_VALUE);

  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) off += a[p * n + q] * a[p * n + q];
    }
    if (off <= tolerance) break;

    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const apq = a[p * n + q];
        if (apq === 0) continue;
        const theta = (a[q * n + q] - a[p * n + p]) / (2 * apq);
        const t = theta === 0 ? 1 : Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1);
        const s = t * c;
        for (let k = 0; k < n; k++) {
          const akp = a[k * n + p];
          const akq = a[k * n + q];
          a[k * n + p] = c * akp - s * akq;
          a[k * n + q] = s * akp + c * akq;
        }
        for (let k = 0; k < n; k++) {
          const apk = a[p * n + k];
          const aqk = a[q * n + k];
          a[p * n + k] = c * apk - s * aqk;
          a[q * n + k] = s * apk + c * aqk;
        }
        for (let k = 0; k < n; k++) {
          const vkp = v[k * n + p];
          const vkq = v[k * n + q];
          v[k * n + p] = c * vkp - s * vkq;
          v[k * n + q] = s * vkp + c * vkq;
        }
      }
    }
  }

  const order = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[i * n + i] - a[j * n + j]);
  const values = new Float64Array(n);
  const vectors = new Float64Array(n * n);
  for (let col = 0; col < n; col++) {
    const src = order[col];
    values[col] = a[src * n + src];
    for (let row = 0; row < n; row++) vectors[row * n + col] = v[row * n + src];
  }
  return { values, vectors };
}

/**
 * Generalised symmetric-definite eigenproblem  K x = lambda M x  with M
 * symmetric positive definite. Reduced to standard form through the Cholesky
 * factor M = L L^T:  (L^-1 K L^-T) w = lambda w,  x = L^-T w.
 * Eigenvectors are M-orthonormal.
 */
export function generalizedSymmetricEigen(k: Float64Array, m: Float64Array, n: number): EigenSystem {
  const l = Float64Array.from(m);
  if (!choleskyFactor(l, n)) throw new RangeError("generalizedSymmetricEigen: M is not positive definite");

  // X = L^-1 K  (forward substitution, column by column)
  const x = Float64Array.from(k);
  for (let col = 0; col < n; col++) {
    for (let i = 0; i < n; i++) {
      let s = x[i * n + col];
      for (let j = 0; j < i; j++) s -= l[i * n + j] * x[j * n + col];
      x[i * n + col] = s / l[i * n + i];
    }
  }
  // C = X L^-T  <=>  C^T = L^-1 X^T  (forward substitution on the rows of X)
  const c = new Float64Array(n * n);
  for (let row = 0; row < n; row++) {
    for (let i = 0; i < n; i++) {
      let s = x[row * n + i];
      for (let j = 0; j < i; j++) s -= l[i * n + j] * c[row * n + j];
      c[row * n + i] = s / l[i * n + i];
    }
  }
  // Symmetrise to remove round-off asymmetry before Jacobi.
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const mean = 0.5 * (c[i * n + j] + c[j * n + i]);
      c[i * n + j] = mean;
      c[j * n + i] = mean;
    }
  }

  const { values, vectors: w } = symmetricEigen(c, n);
  // Back-substitute x = L^-T w for every eigenvector column.
  const vectors = new Float64Array(n * n);
  for (let col = 0; col < n; col++) {
    for (let i = n - 1; i >= 0; i--) {
      let s = w[i * n + col];
      for (let j = i + 1; j < n; j++) s -= l[j * n + i] * vectors[j * n + col];
      vectors[i * n + col] = s / l[i * n + i];
    }
  }
  return { values, vectors };
}
