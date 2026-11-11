/**
 * Laboratory tasks. Each task states a goal that has to be reached by
 * *measurement*: completion is decided from the virtual instruments (period
 * meter, step-response meter, energy ledger, twin separation, Lyapunov
 * estimate), never from the mere position of a slider. The structure follows
 * the predict-observe-explain pattern [white1992]: the task text asks for a
 * prediction, the instruments supply the observation, the theory panel the
 * explanation.
 */

import { STANDARD_GRAVITY } from "@/physics/constants";
import { predictionHorizon } from "@/physics/lyapunov";
import { criticalSettlingFactor, steadyState } from "@/physics/measure";
import { oscillatorTheory } from "@/physics/oscillator";
import { linearModes } from "@/physics/pendulum";
import { exactPendulumPeriod } from "@/physics/special";
import type { ModuleId, Simulation } from "./Simulation";

export type TaskId =
  | "periodDesign"
  | "criticalDamping"
  | "resonancePeak"
  | "integratorError"
  | "secondsPendulum"
  | "anharmonic"
  | "butterfly"
  | "regularIsland"
  | "normalMode";

export interface TaskReadout {
  /** i18n key suffix of the label. */
  key: string;
  value: number | null;
  unit: string;
  digits: number;
}

export interface TaskStatus {
  /** One flag per success criterion, in the order of the localized criterion list. */
  checks: boolean[];
  done: boolean;
  readouts: TaskReadout[];
}

export type TaskMemory = Record<string, number>;

export interface TaskDefinition {
  id: TaskId;
  module: ModuleId;
  /** Number of success criteria (must match the localized list). */
  criteria: number;
  /** Puts the apparatus into the starting configuration of the task. */
  setup(sim: Simulation): void;
  /**
   * Evaluates the criteria from the current measurements. `memory` persists
   * between calls and is cleared when the task is (re)started; entries whose
   * key starts with "run:" are also cleared whenever the trajectory restarts.
   */
  evaluate(sim: Simulation, memory: TaskMemory): TaskStatus;
}

const status = (checks: boolean[], readouts: TaskReadout[]): TaskStatus => ({
  checks,
  done: checks.every(Boolean),
  readouts,
});

const degrees = (radians: number) => (radians * 180) / Math.PI;

export const TASKS: readonly TaskDefinition[] = [
  /* ---------------------------------------------------------------- */
  {
    id: "periodDesign",
    module: "oscillator",
    criteria: 3,
    setup(sim) {
      sim.applyOscillatorPreset("undamped");
    },
    evaluate(sim) {
      const p = sim.getState().oscillator;
      const period = sim.oscMeter.period;
      const enough = sim.oscMeter.periods >= 6;
      const free = p.damping === 0 && p.driveAmplitude === 0;
      return status(
        [free, enough, free && period !== null && enough && Math.abs(period - 2) <= 0.02],
        [
          { key: "measuredPeriod", value: period, unit: "s", digits: 4 },
          { key: "theoryPeriod", value: oscillatorTheory(p).period0, unit: "s", digits: 4 },
          { key: "target", value: 2, unit: "s", digits: 2 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "criticalDamping",
    module: "oscillator",
    criteria: 3,
    setup(sim) {
      sim.applyOscillatorPreset("undamped");
      sim.setOscillatorParams({ mass: 4, stiffness: 36, damping: 2, driveAmplitude: 0 });
      sim.setOscillatorInitial({ x: 3, v: 0 });
    },
    evaluate(sim) {
      const state = sim.getState();
      const p = state.oscillator;
      const theory = oscillatorTheory(p);
      const meter = sim.stepMeter;
      const released =
        p.driveAmplitude === 0 && state.oscInitial.v === 0 && Math.abs(meter.initialDisplacement) >= 1.5;
      const settling = meter.settlingTime;
      const best = criticalSettlingFactor(0.02) / theory.omega0;
      const settled = released && settling !== null;
      return status(
        [released, settled && meter.overshoot <= 0.005, settled && (settling as number) <= 1.1 * best],
        [
          { key: "zeta", value: theory.zeta, unit: "", digits: 3 },
          { key: "overshoot", value: 100 * meter.overshoot, unit: "%", digits: 2 },
          { key: "settling", value: settling, unit: "s", digits: 3 },
          { key: "bestSettling", value: best, unit: "s", digits: 3 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "resonancePeak",
    module: "oscillator",
    criteria: 3,
    setup(sim) {
      sim.applyOscillatorPreset("undamped");
      // zeta = 0.25: the amplitude at omega0 is 96.8 % of the peak, clearly below the 98 % criterion,
      // so the sheet cannot be completed by driving at the natural frequency.
      sim.setOscillatorParams({ mass: 2, stiffness: 24.5, damping: 3.5, driveAmplitude: 4, driveFrequency: 2 });
      sim.setOscillatorInitial({ x: 0, v: 0 });
    },
    evaluate(sim) {
      const p = sim.getState().oscillator;
      const theory = oscillatorTheory(p);
      const amplitude = sim.oscMeter.amplitude;
      const settled = steadyState(
        sim.oscMeter.amplitudeDrift,
        sim.oscMeter.centreDrift,
        sim.oscUndisturbedFor,
        theory.transientRate,
      );
      const steady = p.driveAmplitude > 0 && settled.steady;
      const peak = theory.peakAmplitude;
      const atPeak = steady && amplitude !== null && peak !== null && Number.isFinite(peak) && amplitude >= 0.98 * peak;
      return status(
        [steady, atPeak, sim.osc.impactCount === 0],
        [
          { key: "amplitude", value: amplitude, unit: "m", digits: 4 },
          { key: "peakAmplitude", value: peak, unit: "m", digits: 4 },
          { key: "driveFrequency", value: p.driveFrequency, unit: "rad/s", digits: 2 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "integratorError",
    module: "oscillator",
    criteria: 2,
    setup(sim) {
      sim.applyOscillatorPreset("undamped");
      sim.setSolver({ method: "euler", rateHz: 300 });
    },
    evaluate(sim, memory) {
      const state = sim.getState();
      const p = state.oscillator;
      const conservative = p.damping === 0 && p.driveAmplitude === 0;
      const energy = sim.osc.energy();
      const relative = Math.abs(energy.residual) / sim.osc.energyScale();
      const method = state.solver.method;
      if (conservative && method === "euler" && relative >= 0.05) memory.eulerSeen = 1;
      const accurate = method === "rk4" || method === "dopri5";
      if (conservative && accurate) {
        memory["run:since"] ??= sim.osc.t;
        memory["run:worst"] = Math.max(memory["run:worst"] ?? 0, relative);
      } else {
        // Anything else interrupts the observation: the 20 s start again.
        delete memory["run:since"];
        delete memory["run:worst"];
      }
      const observed = memory["run:since"] === undefined ? 0 : sim.osc.t - memory["run:since"];
      const verified = conservative && accurate && observed >= 20 && (memory["run:worst"] ?? 1) <= 1e-6;
      return status(
        [memory.eulerSeen === 1, memory.eulerSeen === 1 && verified],
        [
          { key: "residual", value: relative, unit: "", digits: -2 },
          { key: "elapsed", value: observed, unit: "s", digits: 1 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "secondsPendulum",
    module: "pendulum",
    criteria: 4,
    setup(sim) {
      sim.applyPendulumPreset("single");
      const lengths = [...sim.getState().pendulum.lengths];
      lengths[0] = 0.8;
      sim.setPendulumParams({ lengths, gravity: STANDARD_GRAVITY });
      sim.setPendulumInitial(0, { theta: (5 * Math.PI) / 180, omega: 0 });
    },
    evaluate(sim) {
      const p = sim.getState().pendulum;
      // 5e-4 m/s^2 is the tolerance with which the interface shows "Earth"; it changes the period by 4e-5 s.
      const single = p.count === 1 && p.jointDamping === 0 && Math.abs(p.gravity - STANDARD_GRAVITY) < 5e-4;
      const amplitude = sim.swingMeter.amplitude;
      const small = amplitude !== null && degrees(amplitude) <= 6;
      const period = sim.periodMeter.period;
      const enough = sim.periodMeter.periods >= 6;
      return status(
        [single, small, enough, single && small && enough && period !== null && Math.abs(period - 2) <= 0.003],
        [
          { key: "measuredPeriod", value: period, unit: "s", digits: 4 },
          { key: "length", value: p.lengths[0], unit: "m", digits: 3 },
          { key: "amplitude", value: amplitude === null ? null : degrees(amplitude), unit: "deg", digits: 1 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "anharmonic",
    module: "pendulum",
    criteria: 3,
    setup(sim) {
      sim.applyPendulumPreset("single");
      sim.setPendulumInitial(0, { theta: (20 * Math.PI) / 180, omega: 0 });
    },
    evaluate(sim) {
      const state = sim.getState();
      const p = state.pendulum;
      const single = p.count === 1 && p.jointDamping === 0 && p.gravity > 0;
      const exact = exactPendulumPeriod(p.lengths[0], p.gravity, sim.pend.y[0], sim.pend.y[1]);
      const large = single && exact.motion === "libration" && degrees(exact.amplitude) >= 90;
      const period = sim.periodMeter.period;
      const measured = sim.periodMeter.periods >= 4 && period !== null;
      const agrees =
        large && measured && Math.abs((period as number) - exact.period) / exact.period <= 1e-3 &&
        (period as number) / exact.smallAngle >= 1.15;
      return status(
        [large, large && measured, agrees],
        [
          { key: "measuredPeriod", value: period, unit: "s", digits: 4 },
          { key: "exactPeriod", value: Number.isFinite(exact.period) ? exact.period : null, unit: "s", digits: 4 },
          { key: "smallAnglePeriod", value: exact.smallAngle, unit: "s", digits: 4 },
          { key: "amplitude", value: degrees(exact.amplitude), unit: "deg", digits: 1 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "butterfly",
    module: "pendulum",
    criteria: 2,
    setup(sim) {
      sim.applyPendulumPreset("double");
      sim.setTwin({ enabled: true, offset: 1e-3 });
      sim.reset();
    },
    evaluate(sim) {
      const state = sim.getState();
      const ready = state.pendulum.count >= 2 && state.twin.enabled && state.twin.offset <= 1e-3;
      const lambda = sim.lyapunov.exponent;
      const horizon = predictionHorizon(lambda, state.twin.offset, 1);
      return status(
        [ready, ready && sim.divergenceTime !== null],
        [
          { key: "separation", value: sim.separation, unit: "rad", digits: -2 },
          // Counted from the twin's release, like the Measurements tab and the chaos plot: a duration,
          // comparable with the prediction horizon beside it, also after the twin was launched anew.
          {
            key: "divergenceTime",
            value: sim.divergenceTime === null ? null : sim.divergenceTime - sim.twinSince,
            unit: "s",
            digits: 2,
          },
          { key: "lyapunov", value: sim.lyapunov.time > 5 ? lambda : null, unit: "1/s", digits: 2 },
          { key: "horizon", value: Number.isFinite(horizon) && sim.lyapunov.time > 5 ? horizon : null, unit: "s", digits: 1 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "regularIsland",
    module: "pendulum",
    criteria: 4,
    setup(sim) {
      sim.applyPendulumPreset("double");
      sim.setTwin({ enabled: true, offset: 1e-3 });
      sim.reset();
    },
    evaluate(sim, memory) {
      const state = sim.getState();
      const ready = state.pendulum.count === 2 && state.twin.enabled && state.pendulum.jointDamping === 0;
      memory["run:maxSeparation"] = Math.max(memory["run:maxSeparation"] ?? 0, sim.separation);
      const swinging = sim.pend.energy().mechanical > 0.05;
      // The twin must have been followed for 60 s; switching it off and on again starts the count anew.
      const tracked = state.twin.enabled ? sim.pend.t - sim.twinSince : 0;
      const longEnough = tracked >= 60;
      const coherent = memory["run:maxSeparation"] < 0.05;
      const lambda = sim.lyapunov.exponent;
      // Right after a parameter change the estimate is 0 by construction; require a real average.
      const regular = sim.lyapunov.time >= 30 && lambda < 0.1;
      return status(
        [ready && swinging, longEnough, ready && longEnough && coherent, ready && longEnough && regular],
        [
          { key: "elapsed", value: tracked, unit: "s", digits: 1 },
          { key: "maxSeparation", value: memory["run:maxSeparation"], unit: "rad", digits: -2 },
          { key: "lyapunov", value: sim.lyapunov.time > 5 ? lambda : null, unit: "1/s", digits: 3 },
        ],
      );
    },
  },
  /* ---------------------------------------------------------------- */
  {
    id: "normalMode",
    module: "pendulum",
    criteria: 4,
    setup(sim) {
      sim.applyPendulumPreset("doubleRegular");
      sim.setPendulumInitial(0, { theta: 0.15, omega: 0 });
      sim.setPendulumInitial(1, { theta: -0.1, omega: 0 });
    },
    evaluate(sim) {
      const p = sim.getState().pendulum;
      const ready = p.count === 2 && p.jointDamping === 0 && p.gravity > 0;
      const amplitude = sim.swingMeter.amplitude;
      // Small swings only: at larger amplitudes the non-linear frequency shift exceeds the tolerance below.
      const small = amplitude !== null && degrees(amplitude) <= 5 && degrees(amplitude) >= 0.5;
      const period = sim.periodMeter.period;
      const spread = sim.periodMeter.periodSpread;
      const enough = sim.periodMeter.periods >= 12;
      const pure = enough && period !== null && spread !== null && spread / period <= 0.003;
      let t1: number | null = null;
      let t2: number | null = null;
      if (ready) {
        const modes = linearModes(p);
        t1 = (2 * Math.PI) / modes.omega[0];
        t2 = (2 * Math.PI) / modes.omega[1];
      }
      const matches =
        pure && t1 !== null && t2 !== null &&
        (Math.abs((period as number) - t1) / t1 <= 0.025 || Math.abs((period as number) - t2) / t2 <= 0.025);
      return status(
        [ready && small, enough, ready && small && pure, ready && small && matches],
        [
          { key: "measuredPeriod", value: period, unit: "s", digits: 4 },
          { key: "spread", value: period !== null && spread !== null ? (100 * spread) / period : null, unit: "%", digits: 2 },
          { key: "mode1Period", value: t1, unit: "s", digits: 4 },
          { key: "mode2Period", value: t2, unit: "s", digits: 4 },
        ],
      );
    },
  },
];

export function findTask(id: TaskId): TaskDefinition {
  const task = TASKS.find((candidate) => candidate.id === id);
  if (!task) throw new Error(`Unknown task: ${id}`);
  return task;
}

/** Removes the per-run entries of a task memory (call when the trajectory restarts). */
export function clearRunMemory(memory: TaskMemory): void {
  for (const key of Object.keys(memory)) {
    if (key.startsWith("run:")) delete memory[key];
  }
}
