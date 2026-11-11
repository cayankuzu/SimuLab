/**
 * Verification & validation experiments.
 *
 * Each case runs the production solver on a problem whose answer is known
 * independently (closed-form solution, conservation law, exact special-function
 * result or an alternative derivation) and reports measured value, reference
 * value, error and tolerance. The same functions back
 *   - the automated test-suite (tests/validation.test.ts),
 *   - the generated report docs/VALIDATION.md (scripts/report.docs.ts), and
 *   - the "Verification" panel inside the application.
 *
 * Methodology follows the code-verification practice of [roache1998,
 * oberkampf2010]: observed order of accuracy from systematic step refinement,
 * comparison with exact solutions, and conservation checks.
 */

import { DEFAULT_SOLVER, OSC_GEOMETRY, STANDARD_GRAVITY } from "./constants";
import { createAdvancer, INTEGRATORS, type IntegratorId } from "./integrators";
import { BenettinEstimator } from "./lyapunov";
import { CRITICAL_SETTLING_FACTOR, OscillationMeter, StepResponseMeter } from "./measure";
import {
  exactOscillatorState,
  OSC,
  OscillatorSystem,
  oscillatorDerivative,
  oscillatorTheory,
  type OscillatorParams,
} from "./oscillator";
import { linearModes, PendulumModel, PendulumTrajectory, type PendulumParams } from "./pendulum";
import { BESSEL_J0_ZEROS, exactPendulumPeriod, laguerreZeros } from "./special";
import { amplitudeSpectrum, dominantPeak } from "./spectrum";

export type ValidationMetric = "relative" | "absolute" | "atMost" | "atLeast";

export interface ValidationRow {
  label: string;
  measured: number;
  /** Independent reference value, or null for bound-type checks. */
  reference: number | null;
  /** |measured - reference| (absolute), divided by |reference| (relative), or the measured value itself for bounds. */
  error: number;
  metric: ValidationMetric;
  tolerance: number;
  unit: string;
  pass: boolean;
}

export type ValidationCaseId =
  | "convergence"
  | "freeResponse"
  | "steadyState"
  | "criticalDamping"
  | "impact"
  | "energyLedger"
  | "pendulumPeriod"
  | "energyDrift"
  | "normalModes"
  | "newtonEuler"
  | "lyapunov"
  | "reversibility"
  | "crossIntegrator"
  | "spectrum";

export interface ValidationCase {
  id: ValidationCaseId;
  run(): ValidationRow[];
}

function row(
  label: string,
  measured: number,
  reference: number | null,
  metric: ValidationMetric,
  tolerance: number,
  unit = "",
): ValidationRow {
  let error: number;
  let pass: boolean;
  switch (metric) {
    case "relative":
      error = Math.abs(measured - (reference as number)) / Math.abs(reference as number);
      pass = error <= tolerance;
      break;
    case "absolute":
      error = Math.abs(measured - (reference as number));
      pass = error <= tolerance;
      break;
    case "atMost":
      error = measured;
      pass = measured <= tolerance;
      break;
    case "atLeast":
      error = measured;
      pass = measured >= tolerance;
      break;
  }
  return { label, measured, reference, error, metric, tolerance, unit, pass: pass && Number.isFinite(measured) };
}

const H = 1 / DEFAULT_SOLVER.rateHz;

const INTEGRATOR_LABEL: Record<IntegratorId, string> = {
  euler: "Euler",
  symplecticEuler: "Symplectic Euler",
  midpoint: "Midpoint (RK2)",
  rk4: "RK4",
  dopri5: "Dormand-Prince 5",
};

/* ------------------------------------------------------------------ */
/* 1. Observed order of accuracy                                        */
/* ------------------------------------------------------------------ */

/** Global error of one integrator on a driven damped oscillator with known solution. */
export function oscillatorGlobalError(method: IntegratorId, steps: number): number {
  const params: OscillatorParams = {
    mass: 1,
    stiffness: 4 * Math.PI * Math.PI,
    damping: 0.4,
    driveAmplitude: 3,
    driveFrequency: 4,
  };
  const tEnd = 2;
  const f = oscillatorDerivative(params);
  const y = new Float64Array(OSC.SIZE);
  y[OSC.X] = 1;
  // An enormous tolerance turns the embedded pair into a plain fixed-step fifth-order method.
  const advancer = createAdvancer(method, OSC.SIZE, { positions: 1, rtol: 1e300, atol: 1e300 });
  const h = tEnd / steps;
  for (let i = 0; i < steps; i++) advancer.advance(f, i * h, y, h);
  const exact = exactOscillatorState(params, 1, 0, 0, tEnd);
  const omega0 = Math.sqrt(params.stiffness / params.mass);
  return Math.hypot(y[OSC.X] - exact.x, (y[OSC.V] - exact.v) / omega0);
}

const REFINEMENT: Record<IntegratorId, [number, number]> = {
  euler: [4000, 8000],
  symplecticEuler: [4000, 8000],
  midpoint: [800, 1600],
  rk4: [100, 200],
  dopri5: [50, 100],
};

function convergence(): ValidationRow[] {
  return (Object.keys(INTEGRATORS) as IntegratorId[]).map((method) => {
    const [coarse, fine] = REFINEMENT[method];
    const e1 = oscillatorGlobalError(method, coarse);
    const e2 = oscillatorGlobalError(method, fine);
    const observed = Math.log(e1 / e2) / Math.log(fine / coarse);
    return row(INTEGRATOR_LABEL[method], observed, INTEGRATORS[method].order, "absolute", 0.1, "");
  });
}

/* ------------------------------------------------------------------ */
/* 2. Free response against the closed-form solution                    */
/* ------------------------------------------------------------------ */

function freeResponse(): ValidationRow[] {
  const cases: Array<[string, number]> = [
    ["zeta = 0", 0],
    ["zeta = 0.1", 0.1],
    ["zeta = 1", 1],
    ["zeta = 2.5", 2.5],
  ];
  const exact = { x: 0, v: 0 };
  return cases.map(([label, zeta]) => {
    const mass = 2;
    const stiffness = 24;
    const params: OscillatorParams = {
      mass,
      stiffness,
      damping: zeta * 2 * Math.sqrt(stiffness * mass),
      driveAmplitude: 0,
      driveFrequency: 1,
    };
    const system = new OscillatorSystem(params);
    system.reset(2, 0);
    const advancer = createAdvancer("rk4", OSC.SIZE);
    let worst = 0;
    const steps = Math.round(20 / H);
    for (let i = 1; i <= steps; i++) {
      system.step(advancer, H);
      exactOscillatorState(params, 2, 0, 0, i * H, exact);
      worst = Math.max(worst, Math.abs(system.x - exact.x));
    }
    return row(label, worst, null, "atMost", 1e-9, "m");
  });
}

/* ------------------------------------------------------------------ */
/* 3. Driven steady state: amplitude and phase                          */
/* ------------------------------------------------------------------ */

export interface SteadyStateMeasurement {
  omega: number;
  amplitude: number;
  phaseLag: number;
  impacts: number;
}

/**
 * Numerical frequency-response measurement: drive the oscillator at omega
 * until transients have decayed by exp(-settle), then read amplitude and
 * phase lag with the virtual instruments. Used by the validation suite and by
 * the interactive "frequency sweep" experiment.
 */
export function measureSteadyState(
  params: OscillatorParams,
  omega: number,
  h: number = H,
  settle = 16,
  method: IntegratorId = "rk4",
): SteadyStateMeasurement {
  const driven = { ...params, driveFrequency: omega };
  const system = new OscillatorSystem(driven);
  system.reset(0, 0);
  const advancer = createAdvancer(method, OSC.SIZE, { positions: 1 });
  const gamma = driven.damping / (2 * driven.mass);
  const period = (2 * Math.PI) / omega;
  // Without damping there is no steady state: fall back to a fixed observation time.
  const waitTime = gamma > 0 ? Math.min(settle / gamma, 2000 * period) : 60 * period;
  const waitSteps = Math.ceil(waitTime / h);
  for (let i = 0; i < waitSteps; i++) system.step(advancer, h);

  const meter = new OscillationMeter();
  const measureSteps = Math.ceil((6 * period) / h);
  for (let i = 0; i < measureSteps; i++) {
    system.step(advancer, h);
    meter.push(system.t, system.x, system.v, true, system.phase);
  }
  const maximum = meter.lastMaximum;
  const twoPi = 2 * Math.PI;
  const lag = maximum ? ((maximum.aux % twoPi) + twoPi) % twoPi : Number.NaN;
  return {
    omega,
    amplitude: meter.amplitude ?? Number.NaN,
    phaseLag: lag,
    impacts: system.impactCount,
  };
}

function steadyState(): ValidationRow[] {
  const params: OscillatorParams = {
    mass: 2,
    stiffness: 24.5,
    damping: 0.55,
    driveAmplitude: 1,
    driveFrequency: 3.5,
  };
  const omega0 = Math.sqrt(params.stiffness / params.mass);
  const rows: ValidationRow[] = [];
  for (const ratio of [0.5, 0.9, 1.0, 1.1, 1.5]) {
    const omega = ratio * omega0;
    const measured = measureSteadyState(params, omega);
    const theory = oscillatorTheory({ ...params, driveFrequency: omega });
    rows.push(row(`A(${ratio} w0)`, measured.amplitude, theory.steadyAmplitude, "relative", 1e-5, "m"));
    rows.push(row(`delta(${ratio} w0)`, measured.phaseLag, theory.phaseLag, "absolute", 1e-3, "rad"));
  }
  return rows;
}

/* ------------------------------------------------------------------ */
/* 4. Critical damping: no overshoot, known settling time               */
/* ------------------------------------------------------------------ */

function criticalDamping(): ValidationRow[] {
  const mass = 4;
  const stiffness = 36;
  const critical = 2 * Math.sqrt(mass * stiffness);
  const omega0 = Math.sqrt(stiffness / mass);
  const run = (damping: number) => {
    const system = new OscillatorSystem({ mass, stiffness, damping, driveAmplitude: 0, driveFrequency: 1 });
    system.reset(2, 0);
    const advancer = createAdvancer("rk4", OSC.SIZE);
    const meter = new StepResponseMeter(0.02);
    meter.reset(0, 2);
    const steps = Math.round(12 / H);
    for (let i = 0; i < steps; i++) {
      system.step(advancer, H);
      meter.push(system.t, system.x);
    }
    return meter;
  };
  const atCritical = run(critical);
  const under = run(0.5 * critical);
  // Overshoot of the underdamped step response released from rest: exp(-pi zeta / sqrt(1 - zeta^2)).
  const zeta = 0.5;
  const expectedOvershoot = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
  return [
    row("overshoot (zeta = 1)", atCritical.overshoot, null, "atMost", 1e-9, ""),
    row(
      "t_s 2% (zeta = 1)",
      atCritical.settlingTime ?? Number.NaN,
      CRITICAL_SETTLING_FACTOR / omega0,
      "relative",
      2e-3,
      "s",
    ),
    row("overshoot (zeta = 0.5)", under.overshoot, expectedOvershoot, "relative", 1e-4, ""),
  ];
}

/* ------------------------------------------------------------------ */
/* 5. Impact with a stop: timing and restitution                        */
/* ------------------------------------------------------------------ */

function impact(): ValidationRow[] {
  const params: OscillatorParams = { mass: 2, stiffness: 24, damping: 0, driveAmplitude: 0, driveFrequency: 1 };
  const x0 = 6;
  const { xMin, restitution: e } = OSC_GEOMETRY;
  const omega0 = Math.sqrt(params.stiffness / params.mass);
  const system = new OscillatorSystem(params);
  system.reset(x0, 0);
  const advancer = createAdvancer("rk4", OSC.SIZE);
  let guard = 0;
  while (system.impactCount === 0 && guard++ < 100_000) system.step(advancer, H);

  const tExact = Math.acos(xMin / x0) / omega0;
  const vExact = omega0 * Math.sqrt(x0 * x0 - xMin * xMin);
  const eBefore = 0.5 * params.stiffness * x0 * x0;
  const lossExact = 0.5 * params.mass * vExact * vExact * (1 - e * e);
  const energy = system.energy();
  return [
    row("impact time", system.lastImpactTime, tExact, "absolute", 1e-8, "s"),
    row("impact speed", system.lastImpactSpeed, vExact, "relative", 1e-8, "m/s"),
    row("energy lost", energy.impactHeat, lossExact, "relative", 1e-8, "J"),
    row("mechanical energy after", energy.mechanical, eBefore - lossExact, "relative", 1e-8, "J"),
  ];
}

/* ------------------------------------------------------------------ */
/* 6. Closure of the energy ledger (damper + drive + impacts)           */
/* ------------------------------------------------------------------ */

export function ledgerResidual(method: IntegratorId, h: number, seconds: number): { residual: number; impacts: number } {
  const params: OscillatorParams = {
    mass: 2,
    stiffness: 24.5,
    damping: 0.55,
    driveAmplitude: 12,
    driveFrequency: 3.5,
  };
  const system = new OscillatorSystem(params);
  system.reset(0.2, 0);
  const advancer = createAdvancer(method, OSC.SIZE, { positions: 1 });
  const energy = system.energy();
  let worst = 0;
  const steps = Math.round(seconds / h);
  for (let i = 0; i < steps; i++) {
    system.step(advancer, h);
    system.energy(energy);
    worst = Math.max(worst, Math.abs(energy.residual) / system.energyScale());
  }
  return { residual: worst, impacts: system.impactCount };
}

function energyLedger(): ValidationRow[] {
  const reference = ledgerResidual("rk4", H, 60);
  const coarse = ledgerResidual("rk4", 1 / 300, 60);
  return [
    row(`RK4 ${DEFAULT_SOLVER.rateHz} Hz, ${reference.impacts} impacts`, reference.residual, null, "atMost", 1e-8, ""),
    row(`RK4 300 Hz, ${coarse.impacts} impacts`, coarse.residual, null, "atMost", 1e-6, ""),
  ];
}

/* ------------------------------------------------------------------ */
/* 7. Simple pendulum at finite amplitude: exact period                 */
/* ------------------------------------------------------------------ */

export function measurePendulumPeriod(theta0: number, omega0: number, h: number = H, cycles = 3): number {
  const model = new PendulumModel({ count: 1, masses: [1], lengths: [1], gravity: STANDARD_GRAVITY, jointDamping: 0 });
  const trajectory = new PendulumTrajectory(model);
  trajectory.reset([theta0], [omega0]);
  const advancer = createAdvancer("rk4", model.size);
  const meter = new OscillationMeter();
  const y = trajectory.y;
  let t = 0;
  for (let guard = 0; guard < 5_000_000 && meter.cycles < 2 * cycles; guard++) {
    advancer.advance(model.derivative, t, y, h);
    t += h;
    // sin(theta) vanishes at the bottom and at the top; the gate keeps the bottom only.
    meter.push(t, Math.sin(y[0]), Math.cos(y[0]) * y[1], Math.cos(y[0]) > 0);
  }
  return meter.period ?? Number.NaN;
}

function pendulumPeriod(): ValidationRow[] {
  const rows: ValidationRow[] = [];
  for (const degrees of [10, 45, 90, 135, 170]) {
    const theta0 = (degrees * Math.PI) / 180;
    const exact = exactPendulumPeriod(1, STANDARD_GRAVITY, theta0, 0);
    rows.push(row(`theta0 = ${degrees} deg`, measurePendulumPeriod(theta0, 0), exact.period, "relative", 1e-7, "s"));
  }
  // Over-the-top rotation with kappa = 1.2.
  const kappa = 1.2;
  const spin = 2 * kappa * Math.sqrt(STANDARD_GRAVITY / 1);
  const exactRotation = exactPendulumPeriod(1, STANDARD_GRAVITY, 0, spin);
  rows.push(row("rotation, kappa = 1.2", measurePendulumPeriod(0, spin), exactRotation.period, "relative", 1e-7, "s"));
  return rows;
}

/* ------------------------------------------------------------------ */
/* 8. Energy drift of the frictionless chain                            */
/* ------------------------------------------------------------------ */

const CHAIN_MASSES = [2.0, 1.8, 1.5, 1.2, 1.0, 0.8];
const CHAIN_LENGTHS = [1.2, 1.0, 0.9, 0.8, 0.7, 0.6];
const CHAIN_ANGLES: Record<number, number[]> = {
  1: [1.35],
  2: [2.15, 1.65],
  3: [2.2, 1.7, 1.2],
  4: [2.3, 1.8, 1.4, 1.1],
  5: [2.35, 1.9, 1.5, 1.2, 0.9],
  6: [2.4, 2.0, 1.6, 1.3, 1.0, 0.8],
};

export function chainParams(count: number, jointDamping = 0, gravity = STANDARD_GRAVITY): PendulumParams {
  return { count, masses: CHAIN_MASSES, lengths: CHAIN_LENGTHS, gravity, jointDamping };
}

/** Largest relative deviation of the energy ledger of a chain over `seconds`. */
export function chainEnergyDrift(
  count: number,
  method: IntegratorId,
  h: number,
  seconds: number,
  jointDamping = 0,
): number {
  return energyDriftOf(chainParams(count, jointDamping), CHAIN_ANGLES[count], method, h, seconds);
}

/** Same measurement for an arbitrary chain released from rest at the given angles. */
export function energyDriftOf(
  params: PendulumParams,
  angles: number[],
  method: IntegratorId,
  h: number,
  seconds: number,
): number {
  const count = params.count;
  const model = new PendulumModel(params);
  const trajectory = new PendulumTrajectory(model);
  trajectory.reset(angles);
  const advancer = createAdvancer(method, model.size, { positions: count, rtol: 1e-10, atol: 1e-12 });
  const scale = trajectory.energyScale();
  const energy = trajectory.energy();
  let worst = 0;
  const steps = Math.round(seconds / h);
  let t = 0;
  for (let i = 0; i < steps; i++) {
    advancer.advance(model.derivative, t, trajectory.y, h);
    t += h;
    if (i % 8 === 0 || i === steps - 1) {
      trajectory.energy(energy);
      const deviation = Math.abs(energy.residual) / scale;
      if (!(deviation <= worst)) worst = deviation;
    }
  }
  return worst;
}

function energyDrift(): ValidationRow[] {
  const rows: ValidationRow[] = [];
  for (const count of [1, 2, 3, 6]) {
    rows.push(
      row(`N = ${count}, RK4 ${DEFAULT_SOLVER.rateHz} Hz`, chainEnergyDrift(count, "rk4", H, 60), null, "atMost", 1e-6, ""),
    );
  }
  rows.push(row("N = 2, RK4 300 Hz", chainEnergyDrift(2, "rk4", 1 / 300, 60), null, "atMost", 1e-4, ""));
  rows.push(row("N = 2, Dormand-Prince 5", chainEnergyDrift(2, "dopri5", H, 60), null, "atMost", 1e-7, ""));
  rows.push(row("N = 2, viscous joints (b = 0.3)", chainEnergyDrift(2, "rk4", H, 60, 0.3), null, "atMost", 1e-6, ""));
  // The first-order schemes are included to *show* their failure; they must stay far worse than RK4.
  rows.push(row("N = 2, explicit Euler 1000 Hz", chainEnergyDrift(2, "euler", H, 60), null, "atLeast", 1e-2, ""));

  // Hardest corner of the admissible parameter range: three heavy long links driving three light short
  // ones (angular speeds beyond 140 rad/s). The fixed step is visibly less accurate here, the
  // error-controlled pair is not; the status bar recommends the latter when the residual grows.
  const stiff: PendulumParams = {
    count: 6,
    masses: [6, 6, 6, 0.3, 0.3, 0.3],
    lengths: [1.8, 1.8, 1.8, 0.4, 0.4, 0.4],
    gravity: STANDARD_GRAVITY,
    jointDamping: 0,
  };
  rows.push(
    row(`N = 6 extreme mass ratio, RK4 ${DEFAULT_SOLVER.rateHz} Hz`, energyDriftOf(stiff, CHAIN_ANGLES[6], "rk4", H, 60), null, "atMost", 1e-2, ""),
  );
  rows.push(
    row("N = 6 extreme mass ratio, Dormand-Prince 5", energyDriftOf(stiff, CHAIN_ANGLES[6], "dopri5", H, 60), null, "atMost", 1e-7, ""),
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/* 9. Small-oscillation spectrum                                        */
/* ------------------------------------------------------------------ */

function normalModes(): ValidationRow[] {
  const rows: ValidationRow[] = [];
  const g = STANDARD_GRAVITY;
  const l = 0.5;
  for (const count of [2, 3, 6]) {
    const params: PendulumParams = {
      count,
      masses: new Array<number>(count).fill(1.3),
      lengths: new Array<number>(count).fill(l),
      gravity: g,
      jointDamping: 0,
    };
    const { omega } = linearModes(params);
    const zeros = laguerreZeros(count);
    let worst = 0;
    for (let k = 0; k < count; k++) {
      const reference = Math.sqrt((g / l) * zeros[k]);
      worst = Math.max(worst, Math.abs(omega[k] - reference) / reference);
    }
    rows.push(row(`N = ${count}: eigenvalues vs Laguerre zeros`, worst, null, "atMost", 1e-10, ""));
  }
  // Closed form for the equal double pendulum: omega^2 = (g/l)(2 -+ sqrt 2).
  const double = linearModes({ count: 2, masses: [1, 1], lengths: [l, l], gravity: g, jointDamping: 0 });
  rows.push(row("N = 2: w1", double.omega[0], Math.sqrt((g / l) * (2 - Math.SQRT2)), "relative", 1e-12, "rad/s"));
  rows.push(row("N = 2: w2", double.omega[1], Math.sqrt((g / l) * (2 + Math.SQRT2)), "relative", 1e-12, "rad/s"));

  // Continuum limit: fundamental of an N-link chain of total length Lambda tends to (j01 / 2) sqrt(g / Lambda).
  const total = 3;
  const continuum = (BESSEL_J0_ZEROS[0] / 2) * Math.sqrt(g / total);
  const six = linearModes({
    count: 6,
    masses: new Array<number>(6).fill(1),
    lengths: new Array<number>(6).fill(total / 6),
    gravity: g,
    jointDamping: 0,
  });
  rows.push(row("N = 6 fundamental vs hanging rope (Bessel)", six.omega[0], continuum, "relative", 0.05, "rad/s"));

  // The non-linear simulation must reproduce the lowest linear mode at small amplitude.
  const params = chainParams(2);
  const modes = linearModes(params);
  const model = new PendulumModel(params);
  const trajectory = new PendulumTrajectory(model);
  const scale = 0.01 / Math.max(Math.abs(modes.shapes[0]), Math.abs(modes.shapes[2]));
  trajectory.reset([modes.shapes[0] * scale, modes.shapes[2] * scale]);
  const advancer = createAdvancer("rk4", model.size);
  const meter = new OscillationMeter();
  let t = 0;
  while (meter.cycles < 8 && t < 200) {
    advancer.advance(model.derivative, t, trajectory.y, H);
    t += H;
    meter.push(t, trajectory.y[0], trajectory.y[2]);
  }
  rows.push(row("N = 2: simulated mode-1 period", meter.period ?? Number.NaN, (2 * Math.PI) / modes.omega[0], "relative", 1e-4, "s"));
  return rows;
}

/* ------------------------------------------------------------------ */
/* 10. Lagrange versus Newton-Euler                                      */
/* ------------------------------------------------------------------ */

function pseudoRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function newtonEuler(): ValidationRow[] {
  const random = pseudoRandom(20_261_110);
  const rows: ValidationRow[] = [];
  for (const count of [2, 6]) {
    const model = new PendulumModel(chainParams(count));
    const y = new Float64Array(model.size);
    const tension = new Float64Array(count);
    const transverse = new Float64Array(count);
    let worst = 0;
    for (let trial = 0; trial < 200; trial++) {
      for (let i = 0; i < count; i++) {
        y[i] = (random() - 0.5) * 2 * Math.PI;
        y[count + i] = (random() - 0.5) * 12;
      }
      model.rodForces(y, tension, transverse);
      let tMax = 1e-12;
      let nMax = 0;
      for (let i = 0; i < count; i++) {
        tMax = Math.max(tMax, Math.abs(tension[i]));
        nMax = Math.max(nMax, Math.abs(transverse[i]));
      }
      worst = Math.max(worst, nMax / tMax);
    }
    rows.push(row(`N = ${count}: transverse rod force / tension`, worst, null, "atMost", 1e-10, ""));
  }
  // Single pendulum: T = m (g cos theta + L w^2).
  const single = new PendulumModel({ count: 1, masses: [1.7], lengths: [0.9], gravity: STANDARD_GRAVITY, jointDamping: 0 });
  const y = new Float64Array([0.8, 2.1, 0]);
  const tension = new Float64Array(1);
  single.rodForces(y, tension);
  rows.push(
    row("N = 1: rod tension", tension[0], 1.7 * (STANDARD_GRAVITY * Math.cos(0.8) + 0.9 * 2.1 * 2.1), "relative", 1e-13, "N"),
  );
  return rows;
}

/* ------------------------------------------------------------------ */
/* 11. Largest Lyapunov exponent                                         */
/* ------------------------------------------------------------------ */

export function chainLyapunov(
  count: number,
  angles: number[],
  seconds: number,
  h: number = H,
  d0 = 1e-8,
  renormaliseEvery = 0.01,
): number {
  const model = new PendulumModel(chainParams(count));
  const trajectory = new PendulumTrajectory(model);
  trajectory.reset(angles);
  const shadow = new Float64Array(model.size);
  const estimator = new BenettinEstimator(2 * count, d0);
  estimator.seed(trajectory.y, shadow);
  const advancer = createAdvancer("rk4", model.size);
  const stride = Math.max(1, Math.round(renormaliseEvery / h));
  const steps = Math.round(seconds / h);
  let t = 0;
  for (let i = 1; i <= steps; i++) {
    advancer.advance(model.derivative, t, trajectory.y, h);
    advancer.advance(model.derivative, t, shadow, h);
    t += h;
    if (i % stride === 0) estimator.renormalise(trajectory.y, shadow, stride * h);
  }
  return estimator.exponent;
}

function lyapunov(): ValidationRow[] {
  const chaotic = chainLyapunov(2, [2.15, 1.65], 400);
  const chaoticFine = chainLyapunov(2, [2.15, 1.65], 400, H / 2);
  const chaoticWide = chainLyapunov(2, [2.15, 1.65], 400, H, 1e-7);
  return [
    row("N = 1, theta0 = 120 deg (regular)", chainLyapunov(1, [(120 * Math.PI) / 180], 400), null, "atMost", 0.05, "1/s"),
    row("N = 2, small angles (regular)", chainLyapunov(2, [0.1, 0.1], 400), null, "atMost", 0.05, "1/s"),
    row("N = 2, theta = (2.15, 1.65) rad (chaotic)", chaotic, null, "atLeast", 0.5, "1/s"),
    row("  same, step halved", chaoticFine, chaotic, "relative", 0.25, "1/s"),
    row("  same, d0 = 1e-7", chaoticWide, chaotic, "relative", 0.25, "1/s"),
  ];
}

/* ------------------------------------------------------------------ */
/* 12. Time reversibility                                               */
/* ------------------------------------------------------------------ */

function reversibility(): ValidationRow[] {
  const run = (count: number, angles: number[], seconds: number) => {
    const model = new PendulumModel(chainParams(count));
    const y = new Float64Array(model.size);
    for (let i = 0; i < count; i++) y[i] = angles[i];
    const advancer = createAdvancer("rk4", model.size);
    const steps = Math.round(seconds / H);
    let t = 0;
    for (let i = 0; i < steps; i++) {
      advancer.advance(model.derivative, t, y, H);
      t += H;
    }
    for (let i = 0; i < count; i++) y[count + i] = -y[count + i];
    for (let i = 0; i < steps; i++) {
      advancer.advance(model.derivative, t, y, H);
      t += H;
    }
    let error = 0;
    for (let i = 0; i < count; i++) {
      error = Math.max(error, Math.abs(y[i] - angles[i]), Math.abs(y[count + i]));
    }
    return error;
  };
  return [
    row("N = 2 regular, 20 s out and back", run(2, [0.3, 0.2], 20), null, "atMost", 1e-9, "rad"),
    row("N = 3 regular, 20 s out and back", run(3, [0.2, 0.15, 0.1], 20), null, "atMost", 1e-9, "rad"),
    row("N = 2 chaotic, 5 s out and back", run(2, [2.15, 1.65], 5), null, "atMost", 1e-6, "rad"),
  ];
}

/* ------------------------------------------------------------------ */
/* 13. Independent integrators agree                                    */
/* ------------------------------------------------------------------ */

function crossIntegrator(): ValidationRow[] {
  const count = 3;
  const model = new PendulumModel(chainParams(count));
  const seconds = 5;
  const integrate = (method: IntegratorId, h: number): Float64Array => {
    const y = new Float64Array(model.size);
    for (let i = 0; i < count; i++) y[i] = CHAIN_ANGLES[count][i];
    const advancer = createAdvancer(method, model.size, { rtol: 1e-13, atol: 1e-15 });
    const steps = Math.round(seconds / h);
    for (let i = 0; i < steps; i++) advancer.advance(model.derivative, i * h, y, h);
    return y;
  };
  const difference = (a: Float64Array, b: Float64Array): number => {
    let worst = 0;
    for (let i = 0; i < 2 * count; i++) worst = Math.max(worst, Math.abs(a[i] - b[i]));
    return worst;
  };
  const reference = integrate("dopri5", H);
  const coarse = difference(integrate("rk4", H), reference);
  const fine = difference(integrate("rk4", H / 4), reference);
  return [
    row(`N = 3, 5 s: |RK4 ${DEFAULT_SOLVER.rateHz} Hz - DP5|`, coarse, null, "atMost", 1e-6, "rad"),
    row(`N = 3, 5 s: |RK4 ${4 * DEFAULT_SOLVER.rateHz} Hz - DP5|`, fine, null, "atMost", 1e-8, "rad"),
    row("  error ratio (expect about 4^4 = 256)", coarse / fine, 256, "relative", 0.25, ""),
  ];
}

/* ------------------------------------------------------------------ */
/* 14. Spectrum analyser                                                 */
/* ------------------------------------------------------------------ */

function spectrum(): ValidationRow[] {
  const sampleRate = 100;
  const size = 4096;
  const frequency = 1.2345;
  const amplitude = 0.7;
  const samples = new Float64Array(size);
  for (let i = 0; i < size; i++) samples[i] = 0.3 + amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate + 0.4);
  const peak = dominantPeak(amplitudeSpectrum(samples, sampleRate, size));
  return [
    row("peak frequency", peak?.frequency ?? Number.NaN, frequency, "absolute", 1e-4, "Hz"),
    row("peak amplitude", peak?.amplitude ?? Number.NaN, amplitude, "relative", 1e-3, ""),
  ];
}

export const VALIDATION_SUITE: readonly ValidationCase[] = [
  { id: "convergence", run: convergence },
  { id: "freeResponse", run: freeResponse },
  { id: "steadyState", run: steadyState },
  { id: "criticalDamping", run: criticalDamping },
  { id: "impact", run: impact },
  { id: "energyLedger", run: energyLedger },
  { id: "pendulumPeriod", run: pendulumPeriod },
  { id: "energyDrift", run: energyDrift },
  { id: "normalModes", run: normalModes },
  { id: "newtonEuler", run: newtonEuler },
  { id: "lyapunov", run: lyapunov },
  { id: "reversibility", run: reversibility },
  { id: "crossIntegrator", run: crossIntegrator },
  { id: "spectrum", run: spectrum },
];
