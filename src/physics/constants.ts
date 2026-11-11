/**
 * Physical constants, apparatus geometry and admissible parameter ranges.
 * This file is the single source of truth: the solver, the 3-D scene, the
 * controls and the documentation all read these numbers.
 */

import type { IntegratorId } from "./integrators";

/** Standard acceleration of gravity g_n, exact by definition (3rd CGPM, 1901) [cgpm1901, bipm2019si]. */
export const STANDARD_GRAVITY = 9.80665;

export type GravityPresetId = "earth" | "mars" | "moon" | "jupiter" | "microgravity";

export interface GravityPreset {
  readonly id: GravityPresetId;
  /** Surface gravitational acceleration [m/s^2]. */
  readonly g: number;
}

/**
 * Surface gravity of selected bodies. Earth uses the conventional standard
 * value; the others are the "Surface gravity (mean)" rows (Jupiter: "Gravity
 * (mean, 1 bar)") of the NASA NSSDCA fact sheets as revised 2024-2025
 * [nasa_marsfact, nasa_moonfact, nasa_jupiterfact].
 */
export const GRAVITY_PRESETS: readonly GravityPreset[] = [
  { id: "earth", g: STANDARD_GRAVITY },
  { id: "mars", g: 3.73 },
  { id: "moon", g: 1.62 },
  { id: "jupiter", g: 25.92 },
  { id: "microgravity", g: 0 },
];

export interface Range {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly initial: number;
}

/* ------------------------------------------------------------------ */
/* Module 1 - spring-mass oscillator                                    */
/* ------------------------------------------------------------------ */

/**
 * Apparatus geometry along the rail axis x [m]. x is the displacement of the
 * carriage centre from the position where the spring is relaxed.
 *
 *   wall slab        centre -7.50, thickness 0.50  -> front face at -7.25
 *   steel flange     -7.25 .. -7.11
 *   neoprene pad     -7.11 .. -7.05 (centre -7.08)  -> spring seat at anchorX
 *   spring           anchorX .. (x - carriageHalfLength)
 *   coil bind        spring length = solidLength    -> x = xMin
 *   rail end stop    face at xMax + carriageHalfLength
 */
export const OSC_GEOMETRY = {
  wallCentreX: -7.5,
  wallThickness: 0.5,
  padCentreX: -7.08,
  padThickness: 0.06,
  /** x of the spring seat on the wall side. */
  anchorX: -7.05,
  /** Length of the fully compressed spring (coils touching). */
  solidLength: 1.45,
  /** Number of coils drawn; solidLength = (coils + 1) * wireDiameter. */
  coils: 14,
  wireDiameter: 1.45 / 15,
  coilRadius: 0.42,
  carriageHalfLength: 0.85,
  /** Lowest admissible carriage position (coil bind): anchorX + solidLength + carriageHalfLength. */
  xMin: -4.75,
  /** Highest admissible carriage position (rubber end stop on the rail). */
  xMax: 6.5,
  /**
   * Newtonian coefficient of restitution of both stops. A model parameter, not a
   * material constant: measured values for rigid bodies on rubber blocks lie
   * around 0.37-0.44 [sandeep2021].
   */
  restitution: 0.45,
} as const;

export const OSC_RANGES = {
  mass: { min: 0.5, max: 10, step: 0.1, initial: 2 },
  stiffness: { min: 4, max: 80, step: 0.5, initial: 24 },
  damping: { min: 0, max: 60, step: 0.1, initial: 0 },
  driveAmplitude: { min: 0, max: 25, step: 0.5, initial: 0 },
  driveFrequency: { min: 0.2, max: 14, step: 0.01, initial: 3.46 },
} as const satisfies Record<string, Range>;

/* ------------------------------------------------------------------ */
/* Module 2 - planar N-link pendulum                                    */
/* ------------------------------------------------------------------ */

export const MAX_LINKS = 6;

export const PEND_RANGES = {
  mass: { min: 0.3, max: 6, step: 0.1, initial: 1.5 },
  length: { min: 0.4, max: 1.8, step: 0.005, initial: 1 },
  gravity: { min: 0, max: 26, step: 0.01, initial: STANDARD_GRAVITY },
  /** Viscous bearing coefficient b [N m s / rad]. */
  jointDamping: { min: 0, max: 2, step: 0.01, initial: 0 },
} as const satisfies Record<string, Range>;

export const DEFAULT_PENDULUM_MASSES: readonly number[] = [2.0, 1.8, 1.5, 1.2, 1.0, 0.8];
export const DEFAULT_PENDULUM_LENGTHS: readonly number[] = [1.2, 1.0, 0.9, 0.8, 0.7, 0.6];

/** Initial angular offsets offered for the twin ("ghost") pendulum [rad]. */
export const TWIN_OFFSETS: readonly number[] = [1e-2, 1e-3, 1e-6, 1e-9];
export const DEFAULT_TWIN_OFFSET = 1e-3;

/* ------------------------------------------------------------------ */
/* Solver                                                               */
/* ------------------------------------------------------------------ */

export interface SolverSettings {
  readonly method: IntegratorId;
  /** Fixed simulation rate 1/h [Hz]. */
  readonly rateHz: number;
}

export const SOLVER_RATES: readonly number[] = [60, 120, 300, 600, 1000, 2000];

export const DEFAULT_SOLVER: SolverSettings = { method: "rk4", rateHz: 1000 };

/**
 * Target rate of the recorded telemetry. Every round(f_s / 100)-th step is
 * recorded: at 100 Hz for step rates from 300 Hz up, at the step rate itself
 * for 60 and 120 Hz (stride 1).
 */
export const TELEMETRY_RATE_HZ = 100;
