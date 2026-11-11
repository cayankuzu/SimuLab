/**
 * Module 1 - damped, harmonically driven linear oscillator with rigid end stops.
 *
 *   m x'' + c x' + k x = F0 cos(phi),     phi' = omega
 *
 * The drive phase phi is a state variable, so changing the drive frequency
 * during a run never produces a force discontinuity (a real function
 * generator is phase-continuous too).
 *
 * Energy ledger (every term in joules, all integrated with the same scheme as
 * the motion):
 *   E_k + E_p + Q_damper + Q_impact - W_drive = E_0
 * The residual of this balance is a direct, always-on measure of the
 * numerical error and is displayed to the user.
 *
 * Stops: x is confined to [xMin, xMax]. A stop is treated as a rigid
 * unilateral constraint with Newton's kinematic restitution law
 * v+ = -e v- [stronge2000]; the instant of contact is located by bisection on
 * the step, and the kinetic energy removed, (1 - e^2) m v-^2 / 2, is booked
 * in Q_impact. If the applied force keeps pressing the carriage against the
 * stop it rests there until the force changes sign.
 */

import type { Advancer, Derivative } from "./integrators";
import { OSC_GEOMETRY } from "./constants";

export interface OscillatorParams {
  /** m [kg] */
  mass: number;
  /** k [N/m] */
  stiffness: number;
  /** c [N s/m] */
  damping: number;
  /** F0 [N] */
  driveAmplitude: number;
  /** omega [rad/s] */
  driveFrequency: number;
}

/** State-vector layout. */
export const OSC = { X: 0, V: 1, PHI: 2, Q: 3, W: 4, SIZE: 5 } as const;

export type Regime = "undamped" | "underdamped" | "critical" | "overdamped";

export interface OscillatorTheory {
  /** Undamped natural angular frequency sqrt(k/m) [rad/s]. */
  omega0: number;
  /** Natural period 2 pi / omega0 [s]. */
  period0: number;
  /** Critical damping coefficient 2 sqrt(k m) [N s/m]. */
  criticalDamping: number;
  /** Damping ratio zeta = c / c_crit. */
  zeta: number;
  /** Amplitude decay rate gamma = c / (2m) = zeta omega0 [1/s]. */
  gamma: number;
  regime: Regime;
  /** Damped angular frequency omega0 sqrt(1 - zeta^2) (underdamped only). */
  omegaD: number | null;
  periodD: number | null;
  /** Logarithmic decrement 2 pi zeta / sqrt(1 - zeta^2) (underdamped only). */
  logDecrement: number | null;
  /** Quality factor 1 / (2 zeta); null for c = 0. */
  qualityFactor: number | null;
  /** Amplitude e-folding time 1 / gamma [s]; null for c = 0. */
  decayTime: number | null;
  /** Static deflection F0 / k [m]. */
  staticDeflection: number;
  /** Steady-state amplitude at the current drive frequency [m] (Infinity at undamped resonance). */
  steadyAmplitude: number;
  /** Phase lag of displacement behind the force at the current drive frequency [rad], in [0, pi]. */
  phaseLag: number;
  /** Frequency of maximum displacement amplitude omega0 sqrt(1 - 2 zeta^2); null if zeta >= 1/sqrt(2). */
  omegaPeak: number | null;
  /** Maximum steady-state displacement amplitude [m]; null if there is no peak. */
  peakAmplitude: number | null;
  /** Half-power (full width at half maximum of absorbed power) bandwidth c/m [rad/s]. */
  bandwidth: number;
  /** Time-averaged power absorbed in steady state at the current drive frequency [W]. */
  meanPower: number;
}

const CRITICAL_TOLERANCE = 0.02;
const UNDAMPED_TOLERANCE = 1e-9;

export function oscillatorTheory(p: OscillatorParams): OscillatorTheory {
  const { mass: m, stiffness: k, damping: c, driveAmplitude: f0, driveFrequency: w } = p;
  const omega0 = Math.sqrt(k / m);
  const criticalDamping = 2 * Math.sqrt(k * m);
  const zeta = c / criticalDamping;
  const gamma = c / (2 * m);

  let regime: Regime;
  if (zeta <= UNDAMPED_TOLERANCE) regime = "undamped";
  else if (Math.abs(zeta - 1) <= CRITICAL_TOLERANCE) regime = "critical";
  else if (zeta < 1) regime = "underdamped";
  else regime = "overdamped";

  const oscillatory = zeta < 1;
  const omegaD = oscillatory ? omega0 * Math.sqrt(1 - zeta * zeta) : null;

  const detune = omega0 * omega0 - w * w;
  const loss = 2 * gamma * w;
  const denominator = Math.hypot(detune, loss);
  const steadyAmplitude = f0 === 0 ? 0 : denominator === 0 ? Number.POSITIVE_INFINITY : f0 / m / denominator;
  const phaseLag = Math.atan2(loss, detune);

  const hasPeak = zeta < Math.SQRT1_2;
  const omegaPeak = hasPeak ? omega0 * Math.sqrt(1 - 2 * zeta * zeta) : null;
  const peakAmplitude = !hasPeak
    ? null
    : zeta === 0
      ? Number.POSITIVE_INFINITY
      : f0 / k / (2 * zeta * Math.sqrt(1 - zeta * zeta));

  // <P> = (1/2) c omega^2 A^2
  const meanPower = Number.isFinite(steadyAmplitude) ? 0.5 * c * w * w * steadyAmplitude * steadyAmplitude : 0;

  return {
    omega0,
    period0: (2 * Math.PI) / omega0,
    criticalDamping,
    zeta,
    gamma,
    regime,
    omegaD,
    periodD: omegaD && omegaD > 0 ? (2 * Math.PI) / omegaD : null,
    logDecrement: oscillatory && zeta > 0 ? (2 * Math.PI * zeta) / Math.sqrt(1 - zeta * zeta) : null,
    qualityFactor: zeta > 0 ? 1 / (2 * zeta) : null,
    decayTime: gamma > 0 ? 1 / gamma : null,
    staticDeflection: f0 / k,
    steadyAmplitude,
    phaseLag,
    omegaPeak,
    peakAmplitude,
    bandwidth: c / m,
    meanPower,
  };
}

/** Steady-state displacement amplitude A(omega) of the linear model [m]. */
export function steadyStateAmplitude(p: OscillatorParams, omega: number): number {
  const omega0sq = p.stiffness / p.mass;
  const denominator = Math.hypot(omega0sq - omega * omega, (p.damping / p.mass) * omega);
  if (p.driveAmplitude === 0) return 0;
  return denominator === 0 ? Number.POSITIVE_INFINITY : p.driveAmplitude / p.mass / denominator;
}

/** Phase lag delta(omega) of displacement behind the driving force, in [0, pi]. */
export function steadyStatePhaseLag(p: OscillatorParams, omega: number): number {
  return Math.atan2((p.damping / p.mass) * omega, p.stiffness / p.mass - omega * omega);
}

/** Dynamic magnification factor M(r, zeta) = A / (F0/k), r = omega / omega0. */
export function magnification(r: number, zeta: number): number {
  const denominator = Math.hypot(1 - r * r, 2 * zeta * r);
  return denominator === 0 ? Number.POSITIVE_INFINITY : 1 / denominator;
}

export interface ExactState {
  x: number;
  v: number;
}

/**
 * Closed-form solution of the unconstrained linear model at time t >= 0 for
 * initial data x(0) = x0, x'(0) = v0 and drive phase phi(t) = phi0 + omega t.
 * Used as ground truth by the validation suite and as the "theory" trace.
 */
export function exactOscillatorState(
  p: OscillatorParams,
  x0: number,
  v0: number,
  phi0: number,
  t: number,
  out: ExactState = { x: 0, v: 0 },
): ExactState {
  const { mass: m, stiffness: k, damping: c, driveAmplitude: f0, driveFrequency: w } = p;
  const omega0sq = k / m;
  const omega0 = Math.sqrt(omega0sq);
  const gamma = c / (2 * m);
  const phase = phi0 + w * t;

  // Particular solution x_p and its derivative, at time t and at time 0.
  let xp = 0;
  let vp = 0;
  let xp0 = 0;
  let vp0 = 0;
  if (f0 !== 0) {
    const detune = omega0sq - w * w;
    const loss = 2 * gamma * w;
    const d = detune * detune + loss * loss;
    if (d > 1e-18 * omega0sq * omega0sq) {
      const a = ((f0 / m) * detune) / d;
      const b = ((f0 / m) * loss) / d;
      xp = a * Math.cos(phase) + b * Math.sin(phase);
      vp = w * (-a * Math.sin(phase) + b * Math.cos(phase));
      xp0 = a * Math.cos(phi0) + b * Math.sin(phi0);
      vp0 = w * (-a * Math.sin(phi0) + b * Math.cos(phi0));
    } else {
      // Undamped resonance: secular growth x_p = (F0 / (2 m omega0)) t sin(phase).
      const s = f0 / (2 * m * omega0);
      xp = s * t * Math.sin(phase);
      vp = s * (Math.sin(phase) + omega0 * t * Math.cos(phase));
      xp0 = 0;
      vp0 = s * Math.sin(phi0);
    }
  }

  // Homogeneous solution fitted to the remaining initial data.
  const xh0 = x0 - xp0;
  const vh0 = v0 - vp0;
  const disc = gamma * gamma - omega0sq;
  let xh: number;
  let vh: number;
  if (Math.abs(disc) <= 1e-12 * omega0sq) {
    const d1 = vh0 + gamma * xh0;
    const decay = Math.exp(-gamma * t);
    xh = decay * (xh0 + d1 * t);
    vh = decay * (d1 - gamma * (xh0 + d1 * t));
  } else if (disc < 0) {
    const wd = Math.sqrt(-disc);
    const s1 = (vh0 + gamma * xh0) / wd;
    const decay = Math.exp(-gamma * t);
    const cs = Math.cos(wd * t);
    const sn = Math.sin(wd * t);
    xh = decay * (xh0 * cs + s1 * sn);
    vh = decay * ((-gamma * xh0 + wd * s1) * cs + (-gamma * s1 - wd * xh0) * sn);
  } else {
    const root = Math.sqrt(disc);
    const r1 = -gamma + root;
    const r2 = -gamma - root;
    const c1 = (vh0 - r2 * xh0) / (r1 - r2);
    const c2 = xh0 - c1;
    const e1 = Math.exp(r1 * t);
    const e2 = Math.exp(r2 * t);
    xh = c1 * e1 + c2 * e2;
    vh = r1 * c1 * e1 + r2 * c2 * e2;
  }

  out.x = xh + xp;
  out.v = vh + vp;
  return out;
}

/** Builds dy/dt for the state [x, v, phi, Q_damper, W_drive]. */
export function oscillatorDerivative(p: OscillatorParams): Derivative {
  const { mass: m, stiffness: k, damping: c, driveAmplitude: f0, driveFrequency: w } = p;
  return (_t, y, dydt) => {
    const v = y[OSC.V];
    const drive = f0 * Math.cos(y[OSC.PHI]);
    dydt[OSC.X] = v;
    dydt[OSC.V] = (drive - k * y[OSC.X] - c * v) / m;
    dydt[OSC.PHI] = w;
    dydt[OSC.Q] = c * v * v;
    dydt[OSC.W] = drive * v;
  };
}

export interface OscillatorForces {
  spring: number;
  damper: number;
  drive: number;
  /** Reaction of a stop on the carriage (non-zero only while resting against it). */
  contact: number;
  net: number;
}

export interface OscillatorEnergy {
  kinetic: number;
  potential: number;
  /** Heat generated in the damper, integral of c v^2. */
  damperHeat: number;
  /** Energy dissipated in inelastic impacts with the stops. */
  impactHeat: number;
  /** Work done on the carriage by the external drive, integral of F v. */
  driveWork: number;
  /** kinetic + potential */
  mechanical: number;
  /** mechanical + damperHeat + impactHeat - driveWork - E0 (zero for an exact solver). */
  residual: number;
}

export type Contact = -1 | 0 | 1;

const REST_SPEED = 1e-6;
const MAX_IMPACTS_PER_STEP = 6;
const BISECTION_ITERATIONS = 52;

/**
 * Mutable simulation state of the oscillator plus the event logic for the
 * stops. All methods are allocation-free after construction.
 */
export class OscillatorSystem {
  readonly y = new Float64Array(OSC.SIZE);
  t = 0;
  /** -1: resting on the coil-bind stop, +1: resting on the rail end stop, 0: free. */
  contact: Contact = 0;
  impactHeat = 0;
  impactCount = 0;
  /** Time of the most recent impact (for UI feedback), or -Infinity. */
  lastImpactTime = Number.NEGATIVE_INFINITY;
  /** Speed |v-| just before the most recent impact [m/s]. */
  lastImpactSpeed = 0;
  /** Reference value of the energy ledger. */
  private e0 = 0;
  private f: Derivative;
  private readonly start = new Float64Array(OSC.SIZE);
  private readonly trial = new Float64Array(OSC.SIZE);
  /** Total derivative evaluations since the last reset (performance telemetry). */
  evaluations = 0;

  constructor(
    public params: OscillatorParams,
    public readonly xMin: number = OSC_GEOMETRY.xMin,
    public readonly xMax: number = OSC_GEOMETRY.xMax,
    public readonly restitution: number = OSC_GEOMETRY.restitution,
  ) {
    this.f = oscillatorDerivative(params);
  }

  get x(): number {
    return this.y[OSC.X];
  }
  get v(): number {
    return this.y[OSC.V];
  }
  get phase(): number {
    return this.y[OSC.PHI];
  }

  /** Places the carriage at x0 with velocity v0 and restarts all ledgers. */
  reset(x0: number, v0 = 0, phi0 = 0): void {
    const x = Math.min(this.xMax, Math.max(this.xMin, x0));
    this.y[OSC.X] = x;
    this.y[OSC.V] = (x === this.xMin && v0 < 0) || (x === this.xMax && v0 > 0) ? 0 : v0;
    this.y[OSC.PHI] = phi0;
    this.y[OSC.Q] = 0;
    this.y[OSC.W] = 0;
    this.t = 0;
    this.contact = 0;
    this.impactHeat = 0;
    this.impactCount = 0;
    this.lastImpactTime = Number.NEGATIVE_INFINITY;
    this.lastImpactSpeed = 0;
    this.evaluations = 0;
    this.rebaseLedger();
  }

  /**
   * Replaces the physical parameters. Changing m, k or F0 alters the stored
   * energy by external intervention, so the ledger reference is re-based to
   * keep the residual a pure measure of numerical error.
   */
  setParams(next: OscillatorParams): void {
    this.params = next;
    this.f = oscillatorDerivative(next);
    this.rebaseLedger();
  }

  /** Overwrites position and velocity (direct manipulation) and re-bases the ledger. */
  setState(x: number, v: number): void {
    this.y[OSC.X] = Math.min(this.xMax, Math.max(this.xMin, x));
    this.y[OSC.V] = v;
    this.contact = 0;
    this.rebaseLedger();
  }

  rebaseLedger(): void {
    const { mass: m, stiffness: k } = this.params;
    const x = this.y[OSC.X];
    const v = this.y[OSC.V];
    this.e0 = 0.5 * m * v * v + 0.5 * k * x * x + this.y[OSC.Q] + this.impactHeat - this.y[OSC.W];
  }

  /** Force applied by spring and drive at the current state with v = 0. */
  private staticForce(): number {
    const { stiffness: k, driveAmplitude: f0 } = this.params;
    return f0 * Math.cos(this.y[OSC.PHI]) - k * this.y[OSC.X];
  }

  /** Advances the system by exactly h seconds with the supplied integrator. */
  step(advancer: Advancer, h: number): void {
    let remaining = h;

    for (let pass = 0; pass <= MAX_IMPACTS_PER_STEP && remaining > 0; pass++) {
      if (this.contact !== 0) {
        // Resting contact: only the drive phase evolves.
        this.y[OSC.PHI] += this.params.driveFrequency * remaining;
        this.t += remaining;
        const force = this.staticForce();
        if ((this.contact === -1 && force > 0) || (this.contact === 1 && force < 0)) this.contact = 0;
        return;
      }

      const { y, start, trial } = this;
      start.set(y);
      this.evaluations += advancer.advance(this.f, this.t, y, remaining);
      const side: Contact = y[OSC.X] < this.xMin ? -1 : y[OSC.X] > this.xMax ? 1 : 0;
      if (side === 0) {
        this.t += remaining;
        return;
      }

      // Locate the contact instant: largest fraction s of the step for which
      // the carriage is still inside the admissible interval.
      const bound = side === -1 ? this.xMin : this.xMax;
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < BISECTION_ITERATIONS; i++) {
        const mid = 0.5 * (lo + hi);
        trial.set(start);
        this.evaluations += advancer.advance(this.f, this.t, trial, mid * remaining);
        const outside = side === -1 ? trial[OSC.X] < bound : trial[OSC.X] > bound;
        if (outside) hi = mid;
        else lo = mid;
      }
      y.set(start);
      if (lo > 0) this.evaluations += advancer.advance(this.f, this.t, y, lo * remaining);
      advancer.reset();
      this.t += lo * remaining;
      remaining *= 1 - lo;
      y[OSC.X] = bound;
      this.collide(side);
    }

    if (remaining > 0) {
      // Chattering (Zeno) guard: more impacts than allowed within one step.
      this.settle(this.y[OSC.X] <= this.xMin ? -1 : 1);
      this.y[OSC.PHI] += this.params.driveFrequency * remaining;
      this.t += remaining;
    }
  }

  /** Applies Newton's restitution law at a stop and books the dissipated energy. */
  private collide(side: -1 | 1): void {
    const m = this.params.mass;
    const vIn = this.y[OSC.V];
    const approaching = side === -1 ? vIn < 0 : vIn > 0;
    if (approaching) {
      const e = this.restitution;
      this.impactHeat += 0.5 * m * vIn * vIn * (1 - e * e);
      this.impactCount++;
      this.lastImpactTime = this.t;
      this.lastImpactSpeed = Math.abs(vIn);
      this.y[OSC.V] = -e * vIn;
    }
    const pressing = side === -1 ? this.staticForce() < 0 : this.staticForce() > 0;
    if (Math.abs(this.y[OSC.V]) < REST_SPEED && pressing) this.settle(side);
  }

  /** Brings the carriage to rest against a stop (end of a chatter sequence). */
  private settle(side: -1 | 1): void {
    const m = this.params.mass;
    const v = this.y[OSC.V];
    this.impactHeat += 0.5 * m * v * v;
    this.y[OSC.V] = 0;
    this.contact = side;
  }

  forces(out: OscillatorForces = { spring: 0, damper: 0, drive: 0, contact: 0, net: 0 }): OscillatorForces {
    const { stiffness: k, damping: c, driveAmplitude: f0 } = this.params;
    out.spring = -k * this.y[OSC.X];
    out.damper = -c * this.y[OSC.V];
    out.drive = f0 * Math.cos(this.y[OSC.PHI]);
    out.contact = this.contact !== 0 ? -(out.spring + out.drive) : 0;
    out.net = out.spring + out.damper + out.drive + out.contact;
    return out;
  }

  energy(
    out: OscillatorEnergy = {
      kinetic: 0,
      potential: 0,
      damperHeat: 0,
      impactHeat: 0,
      driveWork: 0,
      mechanical: 0,
      residual: 0,
    },
  ): OscillatorEnergy {
    const { mass: m, stiffness: k } = this.params;
    const x = this.y[OSC.X];
    const v = this.y[OSC.V];
    out.kinetic = 0.5 * m * v * v;
    out.potential = 0.5 * k * x * x;
    out.damperHeat = this.y[OSC.Q];
    out.impactHeat = this.impactHeat;
    out.driveWork = this.y[OSC.W];
    out.mechanical = out.kinetic + out.potential;
    out.residual = out.mechanical + out.damperHeat + out.impactHeat - out.driveWork - this.e0;
    return out;
  }

  /** Characteristic energy used to normalise the ledger residual. */
  energyScale(): number {
    const { mass: m, stiffness: k } = this.params;
    const x = this.y[OSC.X];
    const v = this.y[OSC.V];
    return Math.max(
      Math.abs(this.e0),
      0.5 * m * v * v + 0.5 * k * x * x,
      Math.abs(this.y[OSC.Q]) + this.impactHeat + Math.abs(this.y[OSC.W]),
      1e-12,
    );
  }
}
