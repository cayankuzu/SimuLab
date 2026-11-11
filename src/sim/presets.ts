/**
 * Ready-made experiments. Every preset is a complete, reproducible set of
 * parameters and initial conditions; labels live in the i18n dictionaries.
 */

import {
  DEFAULT_PENDULUM_LENGTHS,
  DEFAULT_PENDULUM_MASSES,
  STANDARD_GRAVITY,
  type SolverSettings,
} from "@/physics/constants";
import type { OscillatorParams } from "@/physics/oscillator";
import { linearModes } from "@/physics/pendulum";

export type OscillatorPresetId =
  | "undamped"
  | "underdamped"
  | "critical"
  | "overdamped"
  | "resonance"
  | "beats"
  | "eulerDrift";

export interface OscillatorPreset {
  id: OscillatorPresetId;
  params: OscillatorParams;
  x0: number;
  v0: number;
  /** Optional solver override (used by the numerical-method demonstrations). */
  solver?: SolverSettings;
}

export const OSCILLATOR_PRESETS: readonly OscillatorPreset[] = [
  {
    id: "undamped",
    params: { mass: 2, stiffness: 24, damping: 0, driveAmplitude: 0, driveFrequency: 3.46 },
    x0: 2,
    v0: 0,
  },
  {
    id: "underdamped",
    // zeta = 0.8 / (2 sqrt(56)) = 0.053
    params: { mass: 2, stiffness: 28, damping: 0.8, driveAmplitude: 0, driveFrequency: 3.74 },
    x0: 2,
    v0: 0,
  },
  {
    id: "critical",
    // c = 2 sqrt(k m) = 14  ->  zeta = 1
    params: { mass: 2, stiffness: 24.5, damping: 14, driveAmplitude: 0, driveFrequency: 3.5 },
    x0: 2,
    v0: 0,
  },
  {
    id: "overdamped",
    // zeta = 22 / (2 sqrt(40)) = 1.74
    params: { mass: 2, stiffness: 20, damping: 22, driveAmplitude: 0, driveFrequency: 3.16 },
    x0: 2,
    v0: 0,
  },
  {
    id: "resonance",
    // omega = omega0 = 3.5 rad/s, Q = 12.7; steady amplitude F0 / (c omega0) = 4.16 m stays clear of the stops.
    params: { mass: 2, stiffness: 24.5, damping: 0.55, driveAmplitude: 8, driveFrequency: 3.5 },
    x0: 0.2,
    v0: 0,
  },
  {
    id: "beats",
    // Undamped, driven 10 % below omega0: beat period 2 pi / |omega0 - omega| = 17.95 s.
    params: { mass: 2, stiffness: 24.5, damping: 0, driveAmplitude: 3, driveFrequency: 3.15 },
    x0: 0,
    v0: 0,
  },
  {
    id: "eulerDrift",
    // Same physics as "undamped" but integrated with explicit Euler at 60 Hz:
    // the energy grows by (1 + h^2 omega0^2) every step.
    params: { mass: 2, stiffness: 24, damping: 0, driveAmplitude: 0, driveFrequency: 3.46 },
    x0: 1,
    v0: 0,
    solver: { method: "euler", rateHz: 60 },
  },
];

export type PendulumPresetId =
  | "single"
  | "singleLarge"
  | "double"
  | "doubleRegular"
  | "mode1"
  | "mode2"
  | "triple"
  | "quad"
  | "six"
  | "moon"
  | "mars"
  | "microgravity";

export interface PendulumPreset {
  id: PendulumPresetId;
  count: number;
  gravity: number;
  jointDamping: number;
  thetas: number[];
  omegas?: number[];
}

const deg = (value: number) => (value * Math.PI) / 180;

/** Angle amplitudes of a small-amplitude normal mode of the default double pendulum. */
function modeAngles(mode: 0 | 1, amplitude: number): number[] {
  const { shapes } = linearModes({
    count: 2,
    masses: DEFAULT_PENDULUM_MASSES,
    lengths: DEFAULT_PENDULUM_LENGTHS,
    gravity: STANDARD_GRAVITY,
    jointDamping: 0,
  });
  const a = shapes[mode];
  const b = shapes[2 + mode];
  const scale = amplitude / Math.max(Math.abs(a), Math.abs(b));
  return [a * scale, b * scale];
}

export const PENDULUM_PRESETS: readonly PendulumPreset[] = [
  { id: "single", count: 1, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [deg(10)] },
  { id: "singleLarge", count: 1, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [deg(150)] },
  { id: "double", count: 2, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [2.15, 1.65] },
  { id: "doubleRegular", count: 2, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [0.35, 0.25] },
  { id: "mode1", count: 2, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: modeAngles(0, deg(6)) },
  { id: "mode2", count: 2, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: modeAngles(1, deg(6)) },
  { id: "triple", count: 3, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [2.2, 1.7, 1.2] },
  { id: "quad", count: 4, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [2.3, 1.8, 1.4, 1.1] },
  { id: "six", count: 6, gravity: STANDARD_GRAVITY, jointDamping: 0, thetas: [2.4, 2.0, 1.6, 1.3, 1.0, 0.8] },
  { id: "moon", count: 2, gravity: 1.62, jointDamping: 0, thetas: [2.2, 1.6] },
  { id: "mars", count: 2, gravity: 3.73, jointDamping: 0, thetas: [2.2, 1.6] },
  {
    id: "microgravity",
    count: 2,
    gravity: 0,
    jointDamping: 0,
    thetas: [1.8, 1.2],
    omegas: [1.5, -2.0],
  },
];

/** Default release angles when the number of links is changed by hand [rad]. */
export const DEFAULT_RELEASE_ANGLES: Readonly<Record<number, readonly number[]>> = {
  1: [1.35],
  2: [2.15, 1.65],
  3: [2.2, 1.7, 1.2],
  4: [2.3, 1.8, 1.4, 1.1],
  5: [2.35, 1.9, 1.5, 1.2, 0.9],
  6: [2.4, 2.0, 1.6, 1.3, 1.0, 0.8],
};
