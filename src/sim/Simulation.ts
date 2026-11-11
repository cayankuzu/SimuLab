/**
 * Simulation runtime: owns the physical state of both experiments, advances
 * it with a fixed time step, records telemetry and feeds the virtual
 * instruments. It is framework-free; React, the 3-D scene and the plots are
 * observers.
 *
 * Time stepping uses an accumulator ("fix your timestep" [fiedler2004]): the
 * wall-clock time of each animation frame is added to a budget that is spent
 * in steps of exactly h = 1 / rateHz. The sequence of states therefore does
 * not depend on the display refresh rate or on frame jitter - an essential
 * property when the system is chaotic.
 */

import {
  DEFAULT_PENDULUM_LENGTHS,
  DEFAULT_PENDULUM_MASSES,
  DEFAULT_SOLVER,
  DEFAULT_TWIN_OFFSET,
  MAX_LINKS,
  OSC_GEOMETRY,
  OSC_RANGES,
  PEND_RANGES,
  STANDARD_GRAVITY,
  TELEMETRY_RATE_HZ,
  type Range,
  type SolverSettings,
} from "@/physics/constants";
import { createAdvancer, type Advancer } from "@/physics/integrators";
import { BenettinEstimator } from "@/physics/lyapunov";
import { OscillationMeter, StepResponseMeter } from "@/physics/measure";
import {
  exactOscillatorState,
  OSC,
  OscillatorSystem,
  type OscillatorEnergy,
  type OscillatorForces,
  type OscillatorParams,
} from "@/physics/oscillator";
import {
  angularSeparation,
  clampLinkCount,
  PendulumModel,
  PendulumTrajectory,
  type PendulumEnergy,
  type PendulumParams,
} from "@/physics/pendulum";
import { wrapAngle } from "@/physics/special";
import { SeriesBuffer } from "./SeriesBuffer";
import {
  DEFAULT_RELEASE_ANGLES,
  OSCILLATOR_PRESETS,
  PENDULUM_PRESETS,
  type OscillatorPresetId,
  type PendulumPresetId,
} from "./presets";

export type ModuleId = "oscillator" | "pendulum";

export interface TwinSettings {
  enabled: boolean;
  /** Initial angular offset of the twin's first link [rad]. */
  offset: number;
}

export interface OscillatorInitial {
  x: number;
  v: number;
}

export interface PendulumInitial {
  thetas: number[];
  omegas: number[];
}

/** Discrete, React-visible state. Replaced immutably on every change. */
export interface SimState {
  module: ModuleId;
  running: boolean;
  timeScale: number;
  solver: SolverSettings;
  oscillator: OscillatorParams;
  pendulum: PendulumParams;
  twin: TwinSettings;
  oscInitial: OscillatorInitial;
  pendInitial: PendulumInitial;
  /** Id of the preset each experiment currently shows, or null once it was edited by hand. */
  scenario: Record<ModuleId, string | null>;
  /** "diverged" if the chosen integrator produced non-finite values and the run was halted. */
  status: "ok" | "diverged";
  /** Incremented whenever a trajectory restarts; plots and instruments clear on change. */
  epoch: number;
}

/** Telemetry channel indices of the oscillator. */
export const OSC_CH = {
  t: 0,
  x: 1,
  v: 2,
  a: 3,
  phi: 4,
  fSpring: 5,
  fDamper: 6,
  fDrive: 7,
  kinetic: 8,
  potential: 9,
  damperHeat: 10,
  impactHeat: 11,
  driveWork: 12,
  residual: 13,
  xExact: 14,
  count: 15,
} as const;

/** Telemetry channel indices of the pendulum (theta/omega occupy MAX_LINKS slots each). */
export const PEND_CH = {
  t: 0,
  theta: 1,
  omega: 1 + MAX_LINKS,
  kinetic: 1 + 2 * MAX_LINKS,
  potential: 2 + 2 * MAX_LINKS,
  heat: 3 + 2 * MAX_LINKS,
  residual: 4 + 2 * MAX_LINKS,
  separation: 5 + 2 * MAX_LINKS,
  lyapunov: 6 + 2 * MAX_LINKS,
  twinTheta: 7 + 2 * MAX_LINKS,
  twinOmega: 8 + 2 * MAX_LINKS,
  count: 9 + 2 * MAX_LINKS,
} as const;

export const POINCARE_CH = { theta: 0, momentum: 1, count: 2 } as const;
export const RESPONSE_CH = { omega: 0, amplitude: 1, phaseLag: 2, count: 3 } as const;

/** Ten minutes of telemetry at 100 Hz. */
const SERIES_CAPACITY = 60_000;
const POINCARE_CAPACITY = 20_000;
const MAX_FRAME_SECONDS = 0.1;
const MAX_STEPS_PER_FRAME = 800;
const LYAPUNOV_INTERVAL = 0.01;
/** Largest velocity a body can be given by throwing it with the pointer. */
const MAX_THROW_SPEED = 12; // m/s for the carriage, rad/s for a pendulum link
/** Twin separation [rad] at which the two pendulums count as "diverged". */
export const DIVERGENCE_THRESHOLD = 1;

export const TIME_SCALES: readonly number[] = [0.1, 0.25, 0.5, 1, 2];

function clampToRange(value: number, range: Range): number {
  if (!Number.isFinite(value)) return range.initial;
  return Math.min(range.max, Math.max(range.min, value));
}

function sanitiseOscillator(p: OscillatorParams): OscillatorParams {
  return {
    mass: clampToRange(p.mass, OSC_RANGES.mass),
    stiffness: clampToRange(p.stiffness, OSC_RANGES.stiffness),
    damping: clampToRange(p.damping, OSC_RANGES.damping),
    driveAmplitude: clampToRange(p.driveAmplitude, OSC_RANGES.driveAmplitude),
    driveFrequency: clampToRange(p.driveFrequency, OSC_RANGES.driveFrequency),
  };
}

function sanitisePendulum(p: PendulumParams): PendulumParams {
  const masses: number[] = [];
  const lengths: number[] = [];
  for (let i = 0; i < MAX_LINKS; i++) {
    masses.push(clampToRange(p.masses[i] ?? DEFAULT_PENDULUM_MASSES[i], PEND_RANGES.mass));
    lengths.push(clampToRange(p.lengths[i] ?? DEFAULT_PENDULUM_LENGTHS[i], PEND_RANGES.length));
  }
  return {
    count: clampLinkCount(p.count),
    masses,
    lengths,
    gravity: clampToRange(p.gravity, PEND_RANGES.gravity),
    jointDamping: clampToRange(p.jointDamping, PEND_RANGES.jointDamping),
  };
}

function padAngles(values: readonly number[] | undefined, fill = 0): number[] {
  const out: number[] = [];
  for (let i = 0; i < MAX_LINKS; i++) {
    const value = values?.[i];
    out.push(typeof value === "number" && Number.isFinite(value) ? value : fill);
  }
  return out;
}

export function defaultSimState(): SimState {
  const oscillator = OSCILLATOR_PRESETS[0];
  return {
    module: "oscillator",
    running: true,
    timeScale: 1,
    solver: DEFAULT_SOLVER,
    oscillator: { ...oscillator.params },
    pendulum: {
      count: 2,
      masses: [...DEFAULT_PENDULUM_MASSES],
      lengths: [...DEFAULT_PENDULUM_LENGTHS],
      gravity: STANDARD_GRAVITY,
      jointDamping: 0,
    },
    twin: { enabled: true, offset: DEFAULT_TWIN_OFFSET },
    oscInitial: { x: oscillator.x0, v: oscillator.v0 },
    pendInitial: { thetas: padAngles(DEFAULT_RELEASE_ANGLES[2]), omegas: padAngles(undefined) },
    scenario: { oscillator: oscillator.id, pendulum: "double" },
    status: "ok",
    epoch: 0,
  };
}

export interface PerformanceStats {
  /** Smoothed display frame rate [1/s]. */
  fps: number;
  /** Solver steps taken in the most recent frame. */
  stepsPerFrame: number;
  /** Smoothed wall-clock cost of physics per frame [ms]. */
  physicsMs: number;
  /** Frames in which the step budget was exhausted and simulated time was dropped. */
  droppedFrames: number;
}

type Listener = () => void;
type FrameListener = (sim: Simulation, dt: number) => void;

export class Simulation {
  private state: SimState;
  private readonly listeners = new Set<Listener>();
  private readonly frameListeners = new Set<FrameListener>();

  /* ---- oscillator ---- */
  readonly osc: OscillatorSystem;
  readonly oscSeries = new SeriesBuffer(OSC_CH.count, SERIES_CAPACITY);
  /** (drive frequency, measured amplitude, measured phase lag) at every new displacement maximum. */
  readonly responseTrail = new SeriesBuffer(RESPONSE_CH.count, 2048);
  readonly oscMeter = new OscillationMeter();
  readonly stepMeter = new StepResponseMeter(0.02);
  /** Largest |x_numerical - x_exact| since the last restart [m]. */
  maxExactError = 0;
  private oscAdvancer!: Advancer;
  private readonly baseline = { t0: 0, x0: 0, v0: 0, phi0: 0 };
  private impactsSeen = 0;
  private contactSeen = 0;
  private lastMaximumTime = Number.NEGATIVE_INFINITY;
  private readonly exact = { x: 0, v: 0 };
  private readonly oscForces: OscillatorForces = { spring: 0, damper: 0, drive: 0, contact: 0, net: 0 };
  private readonly oscEnergy: OscillatorEnergy = {
    kinetic: 0,
    potential: 0,
    damperHeat: 0,
    impactHeat: 0,
    driveWork: 0,
    mechanical: 0,
    residual: 0,
  };

  /* ---- pendulum ---- */
  model: PendulumModel;
  readonly pend: PendulumTrajectory;
  readonly twin: PendulumTrajectory;
  lyapunov: BenettinEstimator;
  readonly pendSeries = new SeriesBuffer(PEND_CH.count, SERIES_CAPACITY);
  readonly poincare = new SeriesBuffer(POINCARE_CH.count, POINCARE_CAPACITY);
  /** Zero crossings of sin(theta_1): period of libration or of one revolution. */
  readonly periodMeter = new OscillationMeter();
  /** Extrema of the unwrapped theta_1: swing amplitude. */
  readonly swingMeter = new OscillationMeter();
  /** Current angular separation of the twin from the reference [rad]. */
  separation = 0;
  /** Simulated time at which the twin separation first exceeded DIVERGENCE_THRESHOLD, or null. */
  divergenceTime: number | null = null;
  private shadow: Float64Array;
  private pendAdvancer!: Advancer;
  private twinAdvancer!: Advancer;
  private shadowAdvancer!: Advancer;
  private advancerSize = 0;
  private previousSection = 0;
  private previousTheta1 = 0;
  private previousMomentum1 = 0;
  private readonly pendEnergy: PendulumEnergy = { kinetic: 0, potential: 0, heat: 0, mechanical: 0, residual: 0 };

  /* ---- loop ---- */
  /** Incremented whenever the continuous state changed (render-on-demand). */
  frame = 0;
  readonly perf: PerformanceStats = { fps: 60, stepsPerFrame: 0, physicsMs: 0, droppedFrames: 0 };
  private dragging = false;
  private accumulator = 0;
  private stepIndex = 0;
  private sampleStride = 1;
  private renormStride = 1;
  private raf = 0;
  private lastFrameTime = 0;
  private readonly sample = new Float64Array(Math.max(OSC_CH.count, PEND_CH.count));

  constructor(initial: Partial<SimState> = {}) {
    const base = { ...defaultSimState(), ...initial };
    this.state = {
      ...base,
      oscillator: sanitiseOscillator(base.oscillator),
      pendulum: sanitisePendulum(base.pendulum),
      pendInitial: { thetas: padAngles(base.pendInitial.thetas), omegas: padAngles(base.pendInitial.omegas) },
      status: "ok",
      epoch: 0,
    };
    this.osc = new OscillatorSystem(this.state.oscillator);
    this.model = new PendulumModel(this.state.pendulum);
    this.pend = new PendulumTrajectory(this.model);
    this.twin = new PendulumTrajectory(this.model);
    this.shadow = new Float64Array(this.model.size);
    this.lyapunov = new BenettinEstimator(2 * this.model.n);
    this.configureSolver();
    this.restartOscillator(false);
    this.restartPendulum(false);
  }

  /* ================================================================ */
  /* Observation                                                       */
  /* ================================================================ */

  getState = (): SimState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Registers a callback invoked once per animation frame, after physics has advanced. */
  onFrame(listener: FrameListener): () => void {
    this.frameListeners.add(listener);
    return () => {
      this.frameListeners.delete(listener);
    };
  }

  /** Scenario map with the entry of one experiment cleared (it no longer matches a preset). */
  private withoutScenario(module: ModuleId): Record<ModuleId, string | null> {
    return this.state.scenario[module] === null ? this.state.scenario : { ...this.state.scenario, [module]: null };
  }

  private update(patch: Partial<SimState>): void {
    this.state = { ...this.state, ...patch };
    this.frame++;
    for (const listener of this.listeners) listener();
  }

  get isDragging(): boolean {
    return this.dragging;
  }

  /** Simulated time of the active experiment [s]. */
  get time(): number {
    return this.state.module === "oscillator" ? this.osc.t : this.pend.t;
  }

  /** Simulated time since the oscillator was last disturbed: restart, parameter change or impact [s]. */
  get oscUndisturbedFor(): number {
    return this.osc.t - this.baseline.t0;
  }

  /** Step size h [s]. */
  get stepSize(): number {
    return 1 / this.state.solver.rateHz;
  }

  /** Actual telemetry sampling interval [s]. */
  get sampleInterval(): number {
    return this.sampleStride * this.stepSize;
  }

  /* ================================================================ */
  /* Loop                                                              */
  /* ================================================================ */

  /** Starts the animation-frame loop (no-op outside the browser). */
  start(): void {
    if (this.raf !== 0 || typeof requestAnimationFrame === "undefined") return;
    this.lastFrameTime = performance.now();
    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick);
      const dt = Math.max(0, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      if (dt > 0) this.perf.fps += 0.08 * (Math.min(240, 1 / dt) - this.perf.fps);
      const before = performance.now();
      this.advance(dt);
      this.perf.physicsMs += 0.08 * (performance.now() - before - this.perf.physicsMs);
      for (const listener of this.frameListeners) listener(this, dt);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.raf !== 0) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  /**
   * Spends `realDt` seconds of wall-clock time (scaled by the time scale) in
   * fixed solver steps. Public so that tests can drive the loop directly.
   */
  advance(realDt: number): void {
    this.perf.stepsPerFrame = 0;
    if (!this.state.running || this.dragging || this.state.status !== "ok") return;
    const h = this.stepSize;
    this.accumulator += Math.min(realDt, MAX_FRAME_SECONDS) * this.state.timeScale;
    let steps = Math.floor(this.accumulator / h + 1e-9);
    if (steps <= 0) return;
    if (steps > MAX_STEPS_PER_FRAME) {
      steps = MAX_STEPS_PER_FRAME;
      this.accumulator = 0;
      this.perf.droppedFrames++;
    } else {
      this.accumulator -= steps * h;
    }
    this.run(steps);
  }

  /** Advances by one display frame (1/60 s of simulated time) while paused. */
  stepFrame(): void {
    if (this.state.status !== "ok") return;
    this.run(Math.max(1, Math.round(this.state.solver.rateHz / 60)));
  }

  private run(steps: number): void {
    const h = this.stepSize;
    if (this.state.module === "oscillator") {
      for (let i = 0; i < steps; i++) this.stepOscillator(h);
      if (!Number.isFinite(this.osc.x) || !(Math.abs(this.osc.v) < 1e6)) this.halt();
    } else {
      for (let i = 0; i < steps; i++) this.stepPendulum(h);
      const y = this.pend.y;
      const n = this.model.n;
      for (let i = 0; i < 2 * n; i++) {
        if (!(Math.abs(y[i]) < 1e7)) {
          this.halt();
          break;
        }
      }
    }
    this.perf.stepsPerFrame = steps;
    this.frame++;
  }

  private halt(): void {
    this.update({ running: false, status: "diverged" });
  }

  private configureSolver(): void {
    const { method, rateHz } = this.state.solver;
    this.sampleStride = Math.max(1, Math.round(rateHz / TELEMETRY_RATE_HZ));
    this.renormStride = Math.max(1, Math.round(LYAPUNOV_INTERVAL * rateHz));
    this.oscAdvancer = createAdvancer(method, OSC.SIZE, { positions: 1 });
    this.advancerSize = 0;
    this.ensurePendulumAdvancers();
    this.accumulator = 0;
  }

  private ensurePendulumAdvancers(): void {
    const size = this.model.size;
    if (size === this.advancerSize) return;
    const { method } = this.state.solver;
    const options = { positions: this.model.n };
    this.pendAdvancer = createAdvancer(method, size, options);
    this.twinAdvancer = createAdvancer(method, size, options);
    this.shadowAdvancer = createAdvancer(method, size, options);
    this.advancerSize = size;
  }

  /* ================================================================ */
  /* Oscillator                                                        */
  /* ================================================================ */

  private stepOscillator(h: number): void {
    const osc = this.osc;
    osc.step(this.oscAdvancer, h);
    if (osc.impactCount !== this.impactsSeen || osc.contact !== this.contactSeen) {
      // The closed-form reference is only valid between discontinuities.
      this.impactsSeen = osc.impactCount;
      this.contactSeen = osc.contact;
      this.rebaseExact();
    }
    this.stepIndex++;
    if (this.stepIndex % this.sampleStride === 0) this.recordOscillator();
  }

  private rebaseExact(): void {
    const osc = this.osc;
    this.baseline.t0 = osc.t;
    this.baseline.x0 = osc.x;
    this.baseline.v0 = osc.v;
    this.baseline.phi0 = osc.phase;
  }

  private recordOscillator(): void {
    const osc = this.osc;
    const s = this.sample;
    const forces = osc.forces(this.oscForces);
    const energy = osc.energy(this.oscEnergy);
    let xExact = osc.x;
    if (osc.contact === 0) {
      const b = this.baseline;
      xExact = exactOscillatorState(this.state.oscillator, b.x0, b.v0, b.phi0, osc.t - b.t0, this.exact).x;
      const error = Math.abs(osc.x - xExact);
      if (error > this.maxExactError) this.maxExactError = error;
    }
    s[OSC_CH.t] = osc.t;
    s[OSC_CH.x] = osc.x;
    s[OSC_CH.v] = osc.v;
    s[OSC_CH.a] = forces.net / this.state.oscillator.mass;
    s[OSC_CH.phi] = osc.phase;
    s[OSC_CH.fSpring] = forces.spring;
    s[OSC_CH.fDamper] = forces.damper;
    s[OSC_CH.fDrive] = forces.drive;
    s[OSC_CH.kinetic] = energy.kinetic;
    s[OSC_CH.potential] = energy.potential;
    s[OSC_CH.damperHeat] = energy.damperHeat;
    s[OSC_CH.impactHeat] = energy.impactHeat;
    s[OSC_CH.driveWork] = energy.driveWork;
    s[OSC_CH.residual] = energy.residual;
    s[OSC_CH.xExact] = xExact;
    this.oscSeries.push(s);

    this.oscMeter.push(osc.t, osc.x, osc.v, true, osc.phase);
    this.stepMeter.push(osc.t, osc.x);

    const maximum = this.oscMeter.lastMaximum;
    if (maximum && maximum.t !== this.lastMaximumTime) {
      this.lastMaximumTime = maximum.t;
      const amplitude = this.oscMeter.amplitude;
      if (this.state.oscillator.driveAmplitude > 0 && amplitude !== null) {
        const twoPi = 2 * Math.PI;
        s[RESPONSE_CH.omega] = this.state.oscillator.driveFrequency;
        s[RESPONSE_CH.amplitude] = amplitude;
        s[RESPONSE_CH.phaseLag] = ((maximum.aux % twoPi) + twoPi) % twoPi;
        this.responseTrail.push(s);
      }
    }
  }

  private restartOscillator(notify = true): void {
    const { x, v } = this.state.oscInitial;
    this.osc.reset(x, v, 0);
    this.oscSeries.clear();
    this.responseTrail.clear();
    this.oscMeter.reset();
    this.stepMeter.reset(0, v === 0 ? this.osc.x : 0);
    this.maxExactError = 0;
    this.impactsSeen = 0;
    this.contactSeen = 0;
    this.lastMaximumTime = Number.NEGATIVE_INFINITY;
    this.rebaseExact();
    this.oscAdvancer.reset();
    this.accumulator = 0;
    this.recordOscillator();
    if (notify) this.update({ epoch: this.state.epoch + 1, status: "ok" });
  }

  /* ================================================================ */
  /* Pendulum                                                          */
  /* ================================================================ */

  private stepPendulum(h: number): void {
    const { model, pend, twin } = this;
    const derivative = model.derivative;
    const n = model.n;

    pend.evaluations += this.pendAdvancer.advance(derivative, pend.t, pend.y, h);
    if (this.state.twin.enabled) {
      this.twinAdvancer.advance(derivative, pend.t, twin.y, h);
      twin.t += h;
    }
    this.shadowAdvancer.advance(derivative, pend.t, this.shadow, h);
    pend.t += h;
    this.stepIndex++;

    if (n === 2) {
      // Poincare section theta_2 = 0 (mod 2 pi), crossed with theta_2 increasing.
      const y = pend.y;
      const section = Math.sin(y[1]);
      const theta1 = y[0];
      const momentum1 = model.canonicalMomentum(y, 0);
      if (this.previousSection < 0 && section >= 0 && Math.cos(y[1]) > 0) {
        const f = -this.previousSection / (section - this.previousSection);
        const s = this.sample;
        s[POINCARE_CH.theta] = wrapAngle(this.previousTheta1 + f * (theta1 - this.previousTheta1));
        s[POINCARE_CH.momentum] = this.previousMomentum1 + f * (momentum1 - this.previousMomentum1);
        this.poincare.push(s);
      }
      this.previousSection = section;
      this.previousTheta1 = theta1;
      this.previousMomentum1 = momentum1;
    }

    if (this.stepIndex % this.renormStride === 0) {
      this.lyapunov.renormalise(pend.y, this.shadow, this.renormStride * h);
    }
    if (this.stepIndex % this.sampleStride === 0) this.recordPendulum();
  }

  private recordPendulum(): void {
    const { model, pend, twin } = this;
    const n = model.n;
    const y = pend.y;
    const s = this.sample;
    const energy = pend.energy(this.pendEnergy);

    if (this.state.twin.enabled) {
      this.separation = angularSeparation(y, twin.y, n);
      if (this.divergenceTime === null && this.separation >= DIVERGENCE_THRESHOLD) this.divergenceTime = pend.t;
    } else {
      this.separation = 0;
    }

    s[PEND_CH.t] = pend.t;
    for (let i = 0; i < MAX_LINKS; i++) {
      s[PEND_CH.theta + i] = i < n ? y[i] : Number.NaN;
      s[PEND_CH.omega + i] = i < n ? y[n + i] : Number.NaN;
    }
    s[PEND_CH.kinetic] = energy.kinetic;
    s[PEND_CH.potential] = energy.potential;
    s[PEND_CH.heat] = energy.heat;
    s[PEND_CH.residual] = energy.residual;
    s[PEND_CH.separation] = this.state.twin.enabled ? this.separation : Number.NaN;
    s[PEND_CH.lyapunov] = this.lyapunov.exponent;
    s[PEND_CH.twinTheta] = this.state.twin.enabled ? twin.y[n - 1] : Number.NaN;
    s[PEND_CH.twinOmega] = this.state.twin.enabled ? twin.y[2 * n - 1] : Number.NaN;
    this.pendSeries.push(s);

    const theta1 = y[0];
    const omega1 = y[n];
    const cos1 = Math.cos(theta1);
    this.periodMeter.push(pend.t, Math.sin(theta1), cos1 * omega1, cos1 > 0);
    this.swingMeter.push(pend.t, theta1, omega1);
  }

  private seedCompanions(): void {
    const { pend, twin, model } = this;
    twin.copyFrom(pend);
    twin.y[0] += this.state.twin.offset;
    twin.rebaseLedger();
    if (this.shadow.length !== model.size) this.shadow = new Float64Array(model.size);
    if (this.lyapunov.dim !== 2 * model.n) this.lyapunov = new BenettinEstimator(2 * model.n);
    this.lyapunov.seed(pend.y, this.shadow);
    this.separation = this.state.twin.enabled ? Math.abs(this.state.twin.offset) : 0;
    this.divergenceTime = null;
    this.previousSection = Math.sin(pend.y[1] ?? 0);
    this.previousTheta1 = pend.y[0];
    this.previousMomentum1 = model.n === 2 ? model.canonicalMomentum(pend.y, 0) : 0;
    this.pendAdvancer.reset();
    this.twinAdvancer.reset();
    this.shadowAdvancer.reset();
  }

  private clearPendulumInstruments(): void {
    this.periodMeter.reset();
    this.swingMeter.reset();
    this.poincare.clear();
  }

  private restartPendulum(notify = true): void {
    this.model = new PendulumModel(this.state.pendulum);
    this.pend.model = this.model;
    this.twin.model = this.model;
    this.ensurePendulumAdvancers();
    const { thetas, omegas } = this.state.pendInitial;
    this.pend.reset(thetas, omegas);
    this.seedCompanions();
    this.pendSeries.clear();
    this.clearPendulumInstruments();
    this.accumulator = 0;
    this.recordPendulum();
    if (notify) this.update({ epoch: this.state.epoch + 1, status: "ok" });
  }

  /* ================================================================ */
  /* Commands                                                          */
  /* ================================================================ */

  setModule(module: ModuleId): void {
    if (module === this.state.module) return;
    this.accumulator = 0;
    this.update({ module });
  }

  setRunning(running: boolean): void {
    if (running === this.state.running) return;
    if (running && this.state.status !== "ok") return;
    this.accumulator = 0;
    this.update({ running });
  }

  toggleRunning(): void {
    this.setRunning(!this.state.running);
  }

  setTimeScale(timeScale: number): void {
    this.update({ timeScale });
  }

  setSolver(solver: SolverSettings): void {
    const diverged = this.state.status !== "ok";
    this.state = { ...this.state, solver };
    this.configureSolver();
    // A run that blew up cannot be continued with a better method: start it again.
    if (diverged) this.reset();
    else this.update({});
  }

  /** Restarts the active experiment from its stored initial conditions. */
  reset(): void {
    if (this.state.module === "oscillator") this.restartOscillator();
    else this.restartPendulum();
  }

  setOscillatorParams(patch: Partial<OscillatorParams>): void {
    const next = sanitiseOscillator({ ...this.state.oscillator, ...patch });
    this.osc.setParams(next);
    this.state = { ...this.state, oscillator: next };
    this.rebaseExact();
    this.oscMeter.reset();
    this.lastMaximumTime = Number.NEGATIVE_INFINITY;
    this.update({ scenario: this.withoutScenario("oscillator") });
  }

  setOscillatorInitial(patch: Partial<OscillatorInitial>): void {
    const { xMin, xMax } = OSC_GEOMETRY;
    const merged = { ...this.state.oscInitial, ...patch };
    const x = Math.min(xMax, Math.max(xMin, Number.isFinite(merged.x) ? merged.x : 0));
    const v = Math.min(30, Math.max(-30, Number.isFinite(merged.v) ? merged.v : 0));
    this.state = { ...this.state, oscInitial: { x, v }, scenario: this.withoutScenario("oscillator") };
    this.restartOscillator();
  }

  applyOscillatorPreset(id: OscillatorPresetId): void {
    const preset = OSCILLATOR_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    const params = sanitiseOscillator(preset.params);
    this.osc.setParams(params);
    this.state = {
      ...this.state,
      module: "oscillator",
      oscillator: params,
      oscInitial: { x: preset.x0, v: preset.v0 },
      scenario: { ...this.state.scenario, oscillator: preset.id },
      running: true,
    };
    if (preset.solver) {
      this.state = { ...this.state, solver: preset.solver };
      this.configureSolver();
    }
    this.restartOscillator();
  }

  setPendulumParams(patch: Partial<PendulumParams>): void {
    const next = sanitisePendulum({ ...this.state.pendulum, ...patch, count: this.state.pendulum.count });
    this.state = { ...this.state, pendulum: next };
    this.model = new PendulumModel(next);
    this.pend.setModel(this.model);
    this.twin.setModel(this.model);
    // The dynamics changed: the tangent-space statistics and period history are no longer meaningful.
    this.lyapunov.seed(this.pend.y, this.shadow);
    this.clearPendulumInstruments();
    this.update({ scenario: this.withoutScenario("pendulum") });
  }

  setLinkCount(count: number): void {
    const n = clampLinkCount(count);
    if (n === this.state.pendulum.count) return;
    this.state = {
      ...this.state,
      pendulum: { ...this.state.pendulum, count: n },
      pendInitial: { thetas: padAngles(DEFAULT_RELEASE_ANGLES[n]), omegas: padAngles(undefined) },
      scenario: this.withoutScenario("pendulum"),
    };
    this.restartPendulum();
  }

  setPendulumInitial(index: number, patch: { theta?: number; omega?: number }): void {
    const thetas = [...this.state.pendInitial.thetas];
    const omegas = [...this.state.pendInitial.omegas];
    if (patch.theta !== undefined && Number.isFinite(patch.theta)) thetas[index] = patch.theta;
    if (patch.omega !== undefined && Number.isFinite(patch.omega)) {
      omegas[index] = Math.min(40, Math.max(-40, patch.omega));
    }
    this.state = { ...this.state, pendInitial: { thetas, omegas }, scenario: this.withoutScenario("pendulum") };
    this.restartPendulum();
  }

  applyPendulumPreset(id: PendulumPresetId): void {
    const preset = PENDULUM_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    this.state = {
      ...this.state,
      module: "pendulum",
      pendulum: sanitisePendulum({
        ...this.state.pendulum,
        count: preset.count,
        gravity: preset.gravity,
        jointDamping: preset.jointDamping,
        masses: [...DEFAULT_PENDULUM_MASSES],
        lengths: [...DEFAULT_PENDULUM_LENGTHS],
      }),
      pendInitial: { thetas: padAngles(preset.thetas), omegas: padAngles(preset.omegas) },
      scenario: { ...this.state.scenario, pendulum: preset.id },
      running: true,
    };
    this.restartPendulum();
  }

  setTwin(patch: Partial<TwinSettings>): void {
    this.state = { ...this.state, twin: { ...this.state.twin, ...patch } };
    // The comparison only makes sense from a common instant: re-launch the twin from the current state.
    this.twin.copyFrom(this.pend);
    this.twin.y[0] += this.state.twin.offset;
    this.separation = this.state.twin.enabled ? Math.abs(this.state.twin.offset) : 0;
    this.divergenceTime = null;
    this.twinAdvancer.reset();
    this.update({});
  }

  /* ---- direct manipulation ---- */

  /**
   * Freezes time without touching the state: the pointer is pressed on a body
   * but has not moved yet. Followed by beginDrag() or release().
   */
  hold(): void {
    this.dragging = true;
    this.frame++;
  }

  /** Ends a hold that did not turn into a drag; the motion continues as if nothing had happened. */
  release(): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.accumulator = 0;
    this.frame++;
  }

  /** Starts moving the held body: the trajectory will restart from wherever it is released. */
  beginDrag(): void {
    this.dragging = true;
    if (this.state.module === "pendulum") {
      // Hold the chain in its current shape, at rest.
      const n = this.model.n;
      const thetas = padAngles(Array.from(this.pend.y.subarray(0, n)));
      this.state = {
        ...this.state,
        pendInitial: { thetas, omegas: padAngles(undefined) },
        scenario: this.withoutScenario("pendulum"),
      };
    } else {
      this.state = { ...this.state, scenario: this.withoutScenario("oscillator") };
    }
  }

  /** Moves the held carriage to x (clamped to the mechanical limits). */
  dragOscillatorTo(x: number): void {
    const { xMin, xMax } = OSC_GEOMETRY;
    this.state = { ...this.state, oscInitial: { x: Math.min(xMax, Math.max(xMin, x)), v: 0 } };
    this.restartOscillator();
  }

  /** Rotates link `index` of the held chain to the absolute angle `theta` (taken on the nearest branch). */
  dragPendulumTo(index: number, theta: number): void {
    const thetas = [...this.state.pendInitial.thetas];
    thetas[index] = thetas[index] + wrapAngle(theta - thetas[index]);
    this.state = { ...this.state, pendInitial: { thetas, omegas: padAngles(undefined) } };
    this.restartPendulum();
  }

  /**
   * Releases the held body. `velocity` is the throw velocity estimated from
   * the pointer motion: m/s for the carriage, rad/s for pendulum link `index`.
   */
  endDrag(velocity = 0, index = 0): void {
    if (!this.dragging) return;
    this.dragging = false;
    const v = Number.isFinite(velocity) ? velocity : 0;
    if (this.state.module === "oscillator") {
      this.state = {
        ...this.state,
        oscInitial: { x: this.state.oscInitial.x, v: Math.min(MAX_THROW_SPEED, Math.max(-MAX_THROW_SPEED, v)) },
      };
      this.restartOscillator();
    } else {
      const omegas = padAngles(undefined);
      omegas[index] = Math.min(MAX_THROW_SPEED, Math.max(-MAX_THROW_SPEED, v));
      this.state = { ...this.state, pendInitial: { thetas: this.state.pendInitial.thetas, omegas } };
      this.restartPendulum();
    }
  }

  /* ---- persistence helpers ---- */

  /** Replaces the full experiment definition (used by file import and shared links). */
  load(next: Partial<SimState>): void {
    const merged = { ...this.state, ...next };
    this.state = {
      ...merged,
      oscillator: sanitiseOscillator(merged.oscillator),
      pendulum: sanitisePendulum(merged.pendulum),
      pendInitial: { thetas: padAngles(merged.pendInitial.thetas), omegas: padAngles(merged.pendInitial.omegas) },
      status: "ok",
    };
    this.osc.setParams(this.state.oscillator);
    this.configureSolver();
    this.restartOscillator(false);
    this.restartPendulum(false);
    this.update({ epoch: this.state.epoch + 1 });
  }
}
