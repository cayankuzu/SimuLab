/**
 * Explicit one-step integrators for first-order ODE systems  dy/dt = f(t, y).
 *
 * Design constraints
 *  - Zero allocation in the hot path: every method works in place on a
 *    Float64Array and owns its scratch storage.
 *  - Determinism: a step depends only on (t, y, dt). Nothing here reads the
 *    wall clock, so a run is reproducible bit for bit on a given machine.
 *
 * Methods (reference keys resolve in src/content/references.ts)
 *  euler            explicit Euler, order 1                         [hairer1993]
 *  symplecticEuler  semi-implicit "kick-drift" Euler, order 1;
 *                   symplectic for separable Hamiltonians            [hairer2006]
 *  midpoint         explicit midpoint rule (RK2), order 2            [hairer1993]
 *  rk4              classical Runge-Kutta, order 4                   [runge1895, kutta1901]
 *  dopri5           Dormand-Prince 5(4) embedded pair with
 *                   automatic step-size control                      [dormand1980]
 *
 * None of the explicit Runge-Kutta schemes is symplectic: for the undamped
 * harmonic oscillator classical RK4 has |R(iz)|^2 = 1 - z^6/72 + z^8/576
 * (z = h*omega), i.e. it very slowly *dissipates* energy. The validation suite
 * measures this drift instead of asserting "perfect" conservation.
 */

export type Derivative = (t: number, y: Float64Array, dydt: Float64Array) => void;

export type IntegratorId = "euler" | "symplecticEuler" | "midpoint" | "rk4" | "dopri5";

export interface IntegratorInfo {
  readonly id: IntegratorId;
  /** Formal order of accuracy p (global error = O(h^p)). */
  readonly order: number;
  /** Derivative evaluations per (attempted) step. */
  readonly stages: number;
  readonly adaptive: boolean;
  readonly symplectic: boolean;
}

export const INTEGRATORS: Readonly<Record<IntegratorId, IntegratorInfo>> = {
  euler: { id: "euler", order: 1, stages: 1, adaptive: false, symplectic: false },
  symplecticEuler: { id: "symplecticEuler", order: 1, stages: 1, adaptive: false, symplectic: true },
  midpoint: { id: "midpoint", order: 2, stages: 2, adaptive: false, symplectic: false },
  rk4: { id: "rk4", order: 4, stages: 4, adaptive: false, symplectic: false },
  dopri5: { id: "dopri5", order: 5, stages: 7, adaptive: true, symplectic: false },
};

export const INTEGRATOR_IDS = Object.keys(INTEGRATORS) as IntegratorId[];

export interface AdvancerOptions {
  /**
   * Number of generalised coordinates nq. The state is laid out as
   * [q(0..nq-1), v(0..nq-1), auxiliary quadratures...] with dq_i/dt = v_i.
   * Only the semi-implicit Euler method needs this.
   */
  positions?: number;
  /** Relative / absolute local error tolerances for adaptive methods. */
  rtol?: number;
  atol?: number;
}

export interface Advancer {
  readonly info: IntegratorInfo;
  /**
   * Integrates y in place from t to t + dt.
   * Fixed-step methods take exactly one step of size dt; the adaptive method
   * takes as many internal steps as its error controller requires.
   * @returns number of derivative evaluations used.
   */
  advance(f: Derivative, t: number, y: Float64Array, dt: number): number;
  /** Forget step-size history (call after a discontinuity in y or f). */
  reset(): void;
}

class EulerAdvancer implements Advancer {
  readonly info = INTEGRATORS.euler;
  private readonly k: Float64Array;

  constructor(n: number) {
    this.k = new Float64Array(n);
  }

  advance(f: Derivative, t: number, y: Float64Array, dt: number): number {
    const k = this.k;
    f(t, y, k);
    for (let i = 0; i < y.length; i++) y[i] += dt * k[i];
    return 1;
  }

  reset(): void {}
}

/**
 * Semi-implicit Euler in kick-drift form:
 *   v_{n+1} = v_n + h a(q_n, v_n, t_n)
 *   q_{n+1} = q_n + h v_{n+1}
 * Auxiliary quadratures (dissipated energy, drive work, drive phase) are
 * advanced with the explicit Euler rule.
 */
class SymplecticEulerAdvancer implements Advancer {
  readonly info = INTEGRATORS.symplecticEuler;
  private readonly k: Float64Array;

  constructor(
    n: number,
    private readonly nq: number,
  ) {
    if (2 * nq > n) throw new RangeError("symplecticEuler: 2*positions exceeds the state size");
    this.k = new Float64Array(n);
  }

  advance(f: Derivative, t: number, y: Float64Array, dt: number): number {
    const k = this.k;
    const nq = this.nq;
    f(t, y, k);
    for (let i = nq; i < 2 * nq; i++) y[i] += dt * k[i];
    for (let i = 0; i < nq; i++) y[i] += dt * y[nq + i];
    for (let i = 2 * nq; i < y.length; i++) y[i] += dt * k[i];
    return 1;
  }

  reset(): void {}
}

class MidpointAdvancer implements Advancer {
  readonly info = INTEGRATORS.midpoint;
  private readonly k1: Float64Array;
  private readonly k2: Float64Array;
  private readonly yt: Float64Array;

  constructor(n: number) {
    this.k1 = new Float64Array(n);
    this.k2 = new Float64Array(n);
    this.yt = new Float64Array(n);
  }

  advance(f: Derivative, t: number, y: Float64Array, dt: number): number {
    const { k1, k2, yt } = this;
    const n = y.length;
    const half = 0.5 * dt;
    f(t, y, k1);
    for (let i = 0; i < n; i++) yt[i] = y[i] + half * k1[i];
    f(t + half, yt, k2);
    for (let i = 0; i < n; i++) y[i] += dt * k2[i];
    return 2;
  }

  reset(): void {}
}

/**
 * Classical fourth-order Runge-Kutta method:
 *   k1 = f(t, y)                 k2 = f(t + h/2, y + h/2 k1)
 *   k3 = f(t + h/2, y + h/2 k2)  k4 = f(t + h,   y + h   k3)
 *   y_{n+1} = y_n + h/6 (k1 + 2 k2 + 2 k3 + k4)
 */
class Rk4Advancer implements Advancer {
  readonly info = INTEGRATORS.rk4;
  private readonly k1: Float64Array;
  private readonly k2: Float64Array;
  private readonly k3: Float64Array;
  private readonly k4: Float64Array;
  private readonly yt: Float64Array;

  constructor(n: number) {
    this.k1 = new Float64Array(n);
    this.k2 = new Float64Array(n);
    this.k3 = new Float64Array(n);
    this.k4 = new Float64Array(n);
    this.yt = new Float64Array(n);
  }

  advance(f: Derivative, t: number, y: Float64Array, dt: number): number {
    const { k1, k2, k3, k4, yt } = this;
    const n = y.length;
    const half = 0.5 * dt;
    f(t, y, k1);
    for (let i = 0; i < n; i++) yt[i] = y[i] + half * k1[i];
    f(t + half, yt, k2);
    for (let i = 0; i < n; i++) yt[i] = y[i] + half * k2[i];
    f(t + half, yt, k3);
    for (let i = 0; i < n; i++) yt[i] = y[i] + dt * k3[i];
    f(t + dt, yt, k4);
    const sixth = dt / 6;
    for (let i = 0; i < n; i++) y[i] += sixth * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return 4;
  }

  reset(): void {}
}

// Dormand-Prince 5(4) coefficients [dormand1980].
const C2 = 1 / 5;
const C3 = 3 / 10;
const C4 = 4 / 5;
const C5 = 8 / 9;
const A21 = 1 / 5;
const A31 = 3 / 40;
const A32 = 9 / 40;
const A41 = 44 / 45;
const A42 = -56 / 15;
const A43 = 32 / 9;
const A51 = 19372 / 6561;
const A52 = -25360 / 2187;
const A53 = 64448 / 6561;
const A54 = -212 / 729;
const A61 = 9017 / 3168;
const A62 = -355 / 33;
const A63 = 46732 / 5247;
const A64 = 49 / 176;
const A65 = -5103 / 18656;
// Fifth-order weights (identical to the last row of A: "first same as last").
const B1 = 35 / 384;
const B3 = 500 / 1113;
const B4 = 125 / 192;
const B5 = -2187 / 6784;
const B6 = 11 / 84;
// Error coefficients e = b(5th order) - b*(embedded 4th order).
const E1 = 35 / 384 - 5179 / 57600;
const E3 = 500 / 1113 - 7571 / 16695;
const E4 = 125 / 192 - 393 / 640;
const E5 = -2187 / 6784 + 92097 / 339200;
const E6 = 11 / 84 - 187 / 2100;
const E7 = -1 / 40;

const SAFETY = 0.9;
const MIN_FACTOR = 0.2;
const MAX_FACTOR = 5;
const MAX_INTERNAL_STEPS = 100_000;

class Dopri5Advancer implements Advancer {
  readonly info = INTEGRATORS.dopri5;
  private readonly k1: Float64Array;
  private readonly k2: Float64Array;
  private readonly k3: Float64Array;
  private readonly k4: Float64Array;
  private readonly k5: Float64Array;
  private readonly k6: Float64Array;
  private readonly k7: Float64Array;
  private readonly yt: Float64Array;
  private readonly yn: Float64Array;
  private hNext = 0;

  constructor(
    n: number,
    private readonly rtol: number,
    private readonly atol: number,
  ) {
    this.k1 = new Float64Array(n);
    this.k2 = new Float64Array(n);
    this.k3 = new Float64Array(n);
    this.k4 = new Float64Array(n);
    this.k5 = new Float64Array(n);
    this.k6 = new Float64Array(n);
    this.k7 = new Float64Array(n);
    this.yt = new Float64Array(n);
    this.yn = new Float64Array(n);
  }

  reset(): void {
    this.hNext = 0;
  }

  advance(f: Derivative, t: number, y: Float64Array, dt: number): number {
    if (!(dt > 0)) return 0;
    const { k1, k2, k3, k4, k5, k6, k7, yt, yn, rtol, atol } = this;
    const n = y.length;
    const tEnd = t + dt;
    const hMin = 1e-13 * Math.max(1, Math.abs(tEnd));
    let tc = t;
    let h = this.hNext > 0 ? Math.min(this.hNext, dt) : dt;
    let evals = 1;
    f(tc, y, k1);

    for (let guard = 0; guard < MAX_INTERNAL_STEPS; guard++) {
      const proposed = h;
      let last = false;
      if (tc + h >= tEnd - hMin) {
        h = tEnd - tc;
        last = true;
      }

      for (let i = 0; i < n; i++) yt[i] = y[i] + h * A21 * k1[i];
      f(tc + C2 * h, yt, k2);
      for (let i = 0; i < n; i++) yt[i] = y[i] + h * (A31 * k1[i] + A32 * k2[i]);
      f(tc + C3 * h, yt, k3);
      for (let i = 0; i < n; i++) yt[i] = y[i] + h * (A41 * k1[i] + A42 * k2[i] + A43 * k3[i]);
      f(tc + C4 * h, yt, k4);
      for (let i = 0; i < n; i++) {
        yt[i] = y[i] + h * (A51 * k1[i] + A52 * k2[i] + A53 * k3[i] + A54 * k4[i]);
      }
      f(tc + C5 * h, yt, k5);
      for (let i = 0; i < n; i++) {
        yt[i] = y[i] + h * (A61 * k1[i] + A62 * k2[i] + A63 * k3[i] + A64 * k4[i] + A65 * k5[i]);
      }
      f(tc + h, yt, k6);
      for (let i = 0; i < n; i++) {
        yn[i] = y[i] + h * (B1 * k1[i] + B3 * k3[i] + B4 * k4[i] + B5 * k5[i] + B6 * k6[i]);
      }
      f(tc + h, yn, k7);
      evals += 6;

      let sum = 0;
      for (let i = 0; i < n; i++) {
        const scale = atol + rtol * Math.max(Math.abs(y[i]), Math.abs(yn[i]));
        const e = h * (E1 * k1[i] + E3 * k3[i] + E4 * k4[i] + E5 * k5[i] + E6 * k6[i] + E7 * k7[i]);
        const r = e / scale;
        sum += r * r;
      }
      const err = Math.sqrt(sum / n);
      const factor =
        err > 0 ? Math.min(MAX_FACTOR, Math.max(MIN_FACTOR, SAFETY * Math.pow(err, -0.2))) : MAX_FACTOR;

      if (err <= 1 || h <= hMin) {
        y.set(yn);
        k1.set(k7);
        if (last) {
          // A step clipped to land on tEnd says little about the natural step
          // size, so never let it shrink the remembered proposal.
          this.hNext = Math.max(h * factor, proposed);
          return evals;
        }
        tc += h;
        h *= factor;
      } else {
        h *= Math.min(1, factor);
      }
    }
    throw new Error("dopri5: step-size underflow (the system is too stiff for an explicit method)");
  }
}

/** Creates an integrator for a state vector of dimension n. */
export function createAdvancer(id: IntegratorId, n: number, options: AdvancerOptions = {}): Advancer {
  switch (id) {
    case "euler":
      return new EulerAdvancer(n);
    case "symplecticEuler":
      return new SymplecticEulerAdvancer(n, options.positions ?? Math.floor(n / 2));
    case "midpoint":
      return new MidpointAdvancer(n);
    case "rk4":
      return new Rk4Advancer(n);
    case "dopri5":
      return new Dopri5Advancer(n, options.rtol ?? 1e-10, options.atol ?? 1e-12);
  }
}

/**
 * Convenience driver for tests and offline numerical experiments: integrates
 * from t0 to t1 in `steps` equal steps and returns the final time.
 */
export function integrateFixed(
  advancer: Advancer,
  f: Derivative,
  t0: number,
  t1: number,
  steps: number,
  y: Float64Array,
): number {
  const h = (t1 - t0) / steps;
  for (let i = 0; i < steps; i++) advancer.advance(f, t0 + i * h, y, h);
  return t1;
}
