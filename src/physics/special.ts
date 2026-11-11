/**
 * Special functions needed for exact pendulum periods and chain spectra.
 * References: [dlmf] section 19.8 (arithmetic-geometric mean), [carvalhaes2008].
 */

import { symmetricEigen } from "./linalg";

/** Arithmetic-geometric mean of two non-negative numbers (quadratically convergent). */
export function agm(a: number, b: number): number {
  if (a < 0 || b < 0 || Number.isNaN(a) || Number.isNaN(b)) return Number.NaN;
  let x = a;
  let y = b;
  for (let i = 0; i < 64; i++) {
    if (Math.abs(x - y) <= 4 * Number.EPSILON * Math.max(Math.abs(x), Math.abs(y))) break;
    const mean = 0.5 * (x + y);
    y = Math.sqrt(x * y);
    x = mean;
  }
  return 0.5 * (x + y);
}

/**
 * Complete elliptic integral of the first kind as a function of the
 * modulus k (not the parameter m = k^2):
 *   K(k) = int_0^{pi/2} dphi / sqrt(1 - k^2 sin^2 phi) = pi / (2 AGM(1, sqrt(1 - k^2))).
 * Returns +Infinity at |k| = 1 (the pendulum separatrix) and NaN beyond.
 */
export function ellipticK(k: number): number {
  const k2 = k * k;
  if (k2 > 1) return Number.NaN;
  if (k2 === 1) return Number.POSITIVE_INFINITY;
  return Math.PI / (2 * agm(1, Math.sqrt(1 - k2)));
}

/** Wraps an angle to the interval (-pi, pi]. */
export function wrapAngle(theta: number): number {
  const twoPi = 2 * Math.PI;
  let a = theta % twoPi;
  if (a > Math.PI) a -= twoPi;
  else if (a <= -Math.PI) a += twoPi;
  return a;
}

export type PendulumMotion = "rest" | "libration" | "separatrix" | "rotation";

export interface ExactPendulumPeriod {
  motion: PendulumMotion;
  /**
   * Energy parameter kappa = sqrt(E / (2 m g L)) with E measured from the
   * hanging equilibrium. kappa < 1: libration with amplitude 2 asin(kappa);
   * kappa > 1: continuous rotation.
   */
  kappa: number;
  /** Small-angle (Huygens) period 2 pi sqrt(L/g). */
  smallAngle: number;
  /**
   * Exact period: time of one full swing cycle for libration,
   * time of one revolution for rotation. Infinity on the separatrix or when g = 0.
   */
  period: number;
  /** Libration amplitude in radians (pi for rotation). */
  amplitude: number;
}

/**
 * Exact period of the undamped mathematical pendulum from its instantaneous
 * state, valid for any amplitude [nelson1986, belendez2007]:
 *   libration (kappa < 1):  T = 4 sqrt(L/g) K(kappa)
 *   rotation  (kappa > 1):  T = (2 / kappa) sqrt(L/g) K(1 / kappa)
 * where kappa^2 = sin^2(theta/2) + L omega^2 / (4 g).
 */
export function exactPendulumPeriod(length: number, gravity: number, theta: number, omega: number): ExactPendulumPeriod {
  if (!(gravity > 0) || !(length > 0)) {
    return {
      motion: omega === 0 ? "rest" : "rotation",
      kappa: Number.POSITIVE_INFINITY,
      smallAngle: Number.POSITIVE_INFINITY,
      period: omega === 0 ? Number.POSITIVE_INFINITY : (2 * Math.PI) / Math.abs(omega),
      amplitude: Math.PI,
    };
  }
  const root = Math.sqrt(length / gravity);
  const smallAngle = 2 * Math.PI * root;
  const half = Math.sin(0.5 * theta);
  const kappa2 = half * half + (length * omega * omega) / (4 * gravity);
  const kappa = Math.sqrt(kappa2);

  if (kappa2 < 1e-24) {
    return { motion: "rest", kappa, smallAngle, period: smallAngle, amplitude: 0 };
  }
  if (Math.abs(kappa2 - 1) < 1e-12) {
    return { motion: "separatrix", kappa, smallAngle, period: Number.POSITIVE_INFINITY, amplitude: Math.PI };
  }
  if (kappa2 < 1) {
    return {
      motion: "libration",
      kappa,
      smallAngle,
      period: 4 * root * ellipticK(kappa),
      amplitude: 2 * Math.asin(kappa),
    };
  }
  return {
    motion: "rotation",
    kappa,
    smallAngle,
    period: (2 / kappa) * root * ellipticK(1 / kappa),
    amplitude: Math.PI,
  };
}

/** Value of the Laguerre polynomial L_n(x) by the three-term recurrence. */
export function laguerre(n: number, x: number): number {
  let previous = 1;
  if (n === 0) return previous;
  let current = 1 - x;
  for (let j = 2; j <= n; j++) {
    const next = ((2 * j - 1 - x) * current - (j - 1) * previous) / j;
    previous = current;
    current = next;
  }
  return current;
}

/**
 * Zeros x_1 < ... < x_n of the Laguerre polynomial L_n, computed as the
 * eigenvalues of its symmetric tridiagonal Jacobi matrix (Golub-Welsch):
 * diagonal 2i + 1 (i = 0..n-1), off-diagonal i (i = 1..n-1).
 *
 * Physical meaning here: the small-oscillation frequencies of a hanging chain
 * of n equal point masses on n equal massless links of length l are
 *   omega_k^2 = (g / l) x_k,
 * and for n -> infinity they converge to the Bessel-zero spectrum of the
 * continuous hanging rope, omega_k = (j_{0,k} / 2) sqrt(g / (n l)).
 */
export function laguerreZeros(n: number): Float64Array {
  const jacobi = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    jacobi[i * n + i] = 2 * i + 1;
    if (i > 0) {
      jacobi[i * n + (i - 1)] = i;
      jacobi[(i - 1) * n + i] = i;
    }
  }
  return symmetricEigen(jacobi, n).values;
}

/**
 * First zeros j_{0,k} of the Bessel function J_0 (defined in [dlmf10], section
 * 10.21, which lists no numerical values). The digits below are verified in
 * tests/physics.test.ts by evaluating the power series of J_0 at each of them.
 */
export const BESSEL_J0_ZEROS: readonly number[] = [
  2.404825557695773, 5.520078110286311, 8.653727912911013, 11.791534439014281, 14.930917708487787,
  18.071063967910924,
];
