/**
 * Module 2 - planar chain of N point masses on massless rigid rods (N-link pendulum).
 *
 * Generalised coordinates: theta_i, the absolute angle of rod i measured from
 * the downward vertical (i = 0 .. N-1, rod 0 hangs from the fixed pivot).
 *
 * Lagrangian [goldstein2002, landau1976]
 *   T = 1/2 sum_ij M_ij L_i L_j cos(theta_i - theta_j) w_i w_j
 *   V = g sum_i mu_i L_i (1 - cos theta_i)
 * with the "tail masses" mu_i = sum_{k >= i} m_k and M_ij = mu_max(i,j).
 *
 * Euler-Lagrange equations (one per i):
 *   sum_j M_ij L_i L_j [ cos(theta_i - theta_j) alpha_j + sin(theta_i - theta_j) w_j^2 ]
 *     + mu_i g L_i sin theta_i = Q_i
 *
 * The coefficient matrix A_ij = M_ij L_i L_j cos(theta_i - theta_j) is the
 * symmetric positive-definite mass matrix, so the accelerations are obtained
 * by Cholesky factorisation.
 *
 * Dissipation: viscous bearing friction at every joint, torque
 * -b (w_i - w_{i-1}) with w_{-1} = 0 for the fixed pivot. It derives from the
 * Rayleigh function D = b/2 sum_i (w_i - w_{i-1})^2, giving
 *   Q_i = -b (w_i - w_{i-1}) + b (w_{i+1} - w_i)      (last term absent for i = N-1)
 * and the heating power P = 2 D, which is integrated as an extra state so
 * that  T + V + Q_heat = E_0  can be monitored exactly.
 */

import type { Derivative } from "./integrators";
import { choleskyFactor, choleskySolve, generalizedSymmetricEigen } from "./linalg";
import { MAX_LINKS } from "./constants";

export interface PendulumParams {
  /** Number of links N (1..MAX_LINKS). */
  count: number;
  /** Bob masses m_i [kg]; only the first N entries are used. */
  masses: readonly number[];
  /** Rod lengths L_i [m]; only the first N entries are used. */
  lengths: readonly number[];
  /** Gravitational acceleration g [m/s^2]. */
  gravity: number;
  /** Viscous bearing coefficient b [N m s/rad]. */
  jointDamping: number;
}

export interface PendulumEnergy {
  kinetic: number;
  potential: number;
  /** Heat generated in the bearings, integral of b sum (w_i - w_{i-1})^2. */
  heat: number;
  mechanical: number;
  /** mechanical + heat - E0 (zero for an exact solver). */
  residual: number;
}

export function clampLinkCount(count: number): number {
  return Math.max(1, Math.min(MAX_LINKS, Math.floor(Number.isFinite(count) ? count : 1)));
}

/**
 * Immutable description of an N-link chain with pre-computed coefficients and
 * private scratch storage. Create a new model whenever a parameter changes.
 */
export class PendulumModel {
  readonly n: number;
  /** State dimension: N angles, N angular velocities and the heat integral. */
  readonly size: number;
  readonly gravity: number;
  readonly jointDamping: number;
  readonly masses: Float64Array;
  readonly lengths: Float64Array;
  /** Tail masses mu_i = sum_{k >= i} m_k. */
  readonly mu: Float64Array;
  readonly totalLength: number;
  readonly derivative: Derivative;

  private readonly a: Float64Array;
  private readonly alpha: Float64Array;
  private readonly sinT: Float64Array;
  private readonly cosT: Float64Array;
  private readonly accX: Float64Array;
  private readonly accY: Float64Array;

  constructor(params: PendulumParams) {
    const n = clampLinkCount(params.count);
    this.n = n;
    this.size = 2 * n + 1;
    this.gravity = params.gravity;
    this.jointDamping = params.jointDamping;
    this.masses = new Float64Array(n);
    this.lengths = new Float64Array(n);
    this.mu = new Float64Array(n);
    let total = 0;
    for (let i = 0; i < n; i++) {
      const m = params.masses[i];
      const l = params.lengths[i];
      if (!(m > 0) || !(l > 0)) throw new RangeError(`PendulumModel: link ${i} needs positive mass and length`);
      this.masses[i] = m;
      this.lengths[i] = l;
      total += l;
    }
    this.totalLength = total;
    let tail = 0;
    for (let i = n - 1; i >= 0; i--) {
      tail += this.masses[i];
      this.mu[i] = tail;
    }
    this.a = new Float64Array(n * n);
    this.alpha = new Float64Array(n);
    this.sinT = new Float64Array(n);
    this.cosT = new Float64Array(n);
    this.accX = new Float64Array(n);
    this.accY = new Float64Array(n);

    this.derivative = (_t, y, dydt) => {
      this.accelerations(y, this.alpha);
      const b = this.jointDamping;
      let power = 0;
      for (let i = 0; i < n; i++) {
        const w = y[n + i];
        dydt[i] = w;
        dydt[n + i] = this.alpha[i];
        const relative = i > 0 ? w - y[n + i - 1] : w;
        power += relative * relative;
      }
      dydt[2 * n] = b * power;
    };
  }

  /** Angular accelerations alpha_i for the state y = [theta, omega, ...]. */
  accelerations(y: Float64Array, alpha: Float64Array): void {
    const { n, mu, lengths, a, sinT, cosT, gravity: g, jointDamping: b } = this;
    for (let i = 0; i < n; i++) {
      sinT[i] = Math.sin(y[i]);
      cosT[i] = Math.cos(y[i]);
    }
    for (let i = 0; i < n; i++) {
      const li = lengths[i];
      let r = -mu[i] * g * li * sinT[i];
      for (let j = 0; j < n; j++) {
        const mij = mu[i > j ? i : j] * li * lengths[j];
        const cosD = cosT[i] * cosT[j] + sinT[i] * sinT[j];
        const sinD = sinT[i] * cosT[j] - cosT[i] * sinT[j];
        if (j <= i) a[i * n + j] = mij * cosD;
        const wj = y[n + j];
        r -= mij * sinD * wj * wj;
      }
      if (b !== 0) {
        const wi = y[n + i];
        r -= b * (i > 0 ? wi - y[n + i - 1] : wi);
        if (i < n - 1) r += b * (y[n + i + 1] - wi);
      }
      alpha[i] = r;
    }
    if (!choleskyFactor(a, n)) throw new Error("PendulumModel: mass matrix is not positive definite");
    choleskySolve(a, n, alpha);
  }

  kineticEnergy(y: Float64Array): number {
    const { n, mu, lengths } = this;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const wi = y[n + i];
      const li = lengths[i];
      sum += mu[i] * li * li * wi * wi;
      for (let j = 0; j < i; j++) {
        sum += 2 * mu[i] * li * lengths[j] * Math.cos(y[i] - y[j]) * wi * y[n + j];
      }
    }
    return 0.5 * sum;
  }

  /** Potential energy measured from the hanging equilibrium (always >= 0). */
  potentialEnergy(y: Float64Array): number {
    const { n, mu, lengths, gravity } = this;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += mu[i] * lengths[i] * (1 - Math.cos(y[i]));
    return gravity * sum;
  }

  /** Largest possible potential energy (chain pointing straight up). */
  maxPotentialEnergy(): number {
    let sum = 0;
    for (let i = 0; i < this.n; i++) sum += this.mu[i] * this.lengths[i];
    return 2 * this.gravity * sum;
  }

  /** Canonical momentum p_i = dL/dw_i = sum_j M_ij L_i L_j cos(theta_i - theta_j) w_j. */
  canonicalMomentum(y: Float64Array, i: number): number {
    const { n, mu, lengths } = this;
    let p = 0;
    for (let j = 0; j < n; j++) {
      p += mu[i > j ? i : j] * lengths[i] * lengths[j] * Math.cos(y[i] - y[j]) * y[n + j];
    }
    return p;
  }

  /**
   * Cartesian positions of the bobs relative to the pivot (x to the right,
   * y upwards) and their velocities. Arrays must have length >= N.
   */
  kinematics(
    y: Float64Array,
    px: Float64Array,
    py: Float64Array,
    vx?: Float64Array,
    vy?: Float64Array,
  ): void {
    const { n, lengths } = this;
    let x = 0;
    let h = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < n; i++) {
      const s = Math.sin(y[i]);
      const c = Math.cos(y[i]);
      const l = lengths[i];
      const w = y[n + i];
      x += l * s;
      h -= l * c;
      dx += l * w * c;
      dy += l * w * s;
      px[i] = x;
      py[i] = h;
      if (vx && vy) {
        vx[i] = dx;
        vy[i] = dy;
      }
    }
  }

  /**
   * Rod forces from Newton's second law applied to every bob (an independent
   * route from the Lagrangian equations, used as a consistency check):
   *   R_i = sum_{k >= i} m_k (a_k - g),    g = (0, -g)
   * is the force rod i exerts on bob i. Its axial part is the tension
   * (positive = rod in tension, negative = compression, where a string would
   * go slack); its transverse part vanishes identically when b = 0.
   * Also returns the net force m_i a_i on every bob.
   */
  rodForces(
    y: Float64Array,
    tension: Float64Array,
    transverse?: Float64Array,
    netX?: Float64Array,
    netY?: Float64Array,
  ): void {
    const { n, lengths, masses, gravity: g, alpha } = this;
    this.accelerations(y, alpha);
    // Bob accelerations accumulate down the chain; reuse sinT/cosT filled by accelerations().
    const { sinT, cosT, accX, accY } = this;
    let ax = 0;
    let ay = 0;
    for (let i = 0; i < n; i++) {
      const l = lengths[i];
      const w2 = y[n + i] * y[n + i];
      ax += l * (alpha[i] * cosT[i] - w2 * sinT[i]);
      ay += l * (alpha[i] * sinT[i] + w2 * cosT[i]);
      accX[i] = ax;
      accY[i] = ay;
    }
    let rx = 0;
    let ry = 0;
    for (let i = n - 1; i >= 0; i--) {
      rx += masses[i] * accX[i];
      ry += masses[i] * (accY[i] + g);
      tension[i] = ry * cosT[i] - rx * sinT[i];
      if (transverse) transverse[i] = rx * cosT[i] + ry * sinT[i];
      if (netX && netY) {
        netX[i] = masses[i] * accX[i];
        netY[i] = masses[i] * accY[i];
      }
    }
  }
}

export interface LinearModes {
  /** Small-oscillation angular frequencies, ascending [rad/s]. */
  omega: Float64Array;
  /** Mode shapes (angle amplitudes) as matrix columns, row-major N x N. */
  shapes: Float64Array;
}

/**
 * Normal modes of the chain linearised about the hanging equilibrium:
 *   A0 theta'' + K theta = 0,  A0_ij = M_ij L_i L_j,  K = diag(mu_i g L_i).
 */
export function linearModes(params: PendulumParams): LinearModes {
  const model = new PendulumModel(params);
  const { n, mu, lengths, gravity } = model;
  const a0 = new Float64Array(n * n);
  const k = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    k[i * n + i] = mu[i] * gravity * lengths[i];
    for (let j = 0; j < n; j++) a0[i * n + j] = mu[i > j ? i : j] * lengths[i] * lengths[j];
  }
  const { values, vectors } = generalizedSymmetricEigen(k, a0, n);
  const omega = new Float64Array(n);
  for (let i = 0; i < n; i++) omega[i] = Math.sqrt(Math.max(0, values[i]));
  return { omega, shapes: vectors };
}

/**
 * One trajectory of a pendulum chain: state vector, clock and energy ledger.
 */
export class PendulumTrajectory {
  y: Float64Array;
  t = 0;
  private e0 = 0;
  evaluations = 0;

  constructor(public model: PendulumModel) {
    this.y = new Float64Array(model.size);
  }

  get n(): number {
    return this.model.n;
  }

  /** Sets angles and angular velocities, zeroes the clock and the heat integral. */
  reset(thetas: ArrayLike<number>, omegas?: ArrayLike<number>): void {
    const n = this.model.n;
    if (this.y.length !== this.model.size) this.y = new Float64Array(this.model.size);
    for (let i = 0; i < n; i++) {
      this.y[i] = thetas[i] ?? 0;
      this.y[n + i] = omegas?.[i] ?? 0;
    }
    this.y[2 * n] = 0;
    this.t = 0;
    this.evaluations = 0;
    this.rebaseLedger();
  }

  /**
   * Swaps in a model with new parameters while keeping the configuration.
   * If the number of links changed, missing links start hanging straight down at rest.
   */
  setModel(model: PendulumModel): void {
    const previous = this.y;
    const oldN = this.model.n;
    const n = model.n;
    this.model = model;
    if (n !== oldN) {
      const next = new Float64Array(model.size);
      for (let i = 0; i < Math.min(n, oldN); i++) {
        next[i] = previous[i];
        next[n + i] = previous[oldN + i];
      }
      next[2 * n] = previous[2 * oldN];
      this.y = next;
    }
    this.rebaseLedger();
  }

  copyFrom(other: PendulumTrajectory): void {
    this.model = other.model;
    if (this.y.length !== other.y.length) this.y = new Float64Array(other.y.length);
    this.y.set(other.y);
    this.t = other.t;
    this.e0 = other.e0;
  }

  rebaseLedger(): void {
    const { model, y } = this;
    this.e0 = model.kineticEnergy(y) + model.potentialEnergy(y) + y[2 * model.n];
  }

  energy(out: PendulumEnergy = { kinetic: 0, potential: 0, heat: 0, mechanical: 0, residual: 0 }): PendulumEnergy {
    const { model, y } = this;
    out.kinetic = model.kineticEnergy(y);
    out.potential = model.potentialEnergy(y);
    out.heat = y[2 * model.n];
    out.mechanical = out.kinetic + out.potential;
    out.residual = out.mechanical + out.heat - this.e0;
    return out;
  }

  /** Characteristic energy used to normalise the ledger residual. */
  energyScale(): number {
    return Math.max(Math.abs(this.e0), this.model.kineticEnergy(this.y) + this.model.potentialEnergy(this.y), 1e-12);
  }

  get referenceEnergy(): number {
    return this.e0;
  }
}

/** Euclidean distance between two trajectories in (theta, omega) phase space. */
export function phaseSpaceDistance(a: Float64Array, b: Float64Array, n: number): number {
  let sum = 0;
  for (let i = 0; i < 2 * n; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** Euclidean norm of the angle differences only [rad]. */
export function angularSeparation(a: Float64Array, b: Float64Array, n: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}
