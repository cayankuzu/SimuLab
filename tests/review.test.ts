/**
 * Regression tests for the defects found by the independent review of
 * version 2.0.0. Each test reproduces the reported failure scenario and
 * asserts the corrected behaviour.
 */

import { describe, expect, it } from "vitest";
import { DEFAULT_SOLVER, OSC_GEOMETRY, STANDARD_GRAVITY } from "@/physics/constants";
import { CRITICAL_SETTLING_FACTOR, OscillationMeter, steadyState, StepResponseMeter } from "@/physics/measure";
import { oscillatorTheory, settlingTimeFromRest, type OscillatorParams } from "@/physics/oscillator";
import { PendulumModel } from "@/physics/pendulum";
import { amplitudeSpectrum, dominantPeak } from "@/physics/spectrum";
import { buildCsv, CSV_INTERNATIONAL, CSV_SPREADSHEET, decodeShareHash, encodeShareHash, fromExperimentFile, toExperimentFile } from "@/sim/exchange";
import { INITIAL_LIMITS, LAG_FRAMES, LAG_WINDOW_SECONDS, Simulation } from "@/sim/Simulation";
import { clearRunMemory, findTask, type TaskId, type TaskMemory, type TaskStatus } from "@/sim/tasks";

/** Runs the simulation for `seconds` of simulated time in 60 Hz frames. */
function run(sim: Simulation, seconds: number): void {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) sim.advance(1 / 60);
}

/** Asserts that two lists of link angles describe the same configuration (equal up to whole turns). */
function expectShape(actual: readonly number[], expected: readonly number[]): void {
  expect(actual.length).toBe(expected.length);
  actual.forEach((theta, index) => {
    const reference = expected[index] ?? Number.NaN;
    expect(Math.sin(theta)).toBeCloseTo(Math.sin(reference), 9);
    expect(Math.cos(theta)).toBeCloseTo(Math.cos(reference), 9);
  });
}

/** Drives a task the way the interface does: evaluation every 0.2 s, run memory cleared when the trajectory restarts. */
class TaskProbe {
  private memory: TaskMemory = {};
  private epoch: number;
  last: TaskStatus;

  constructor(
    readonly sim: Simulation,
    readonly id: TaskId,
  ) {
    findTask(id).setup(sim);
    this.epoch = sim.getState().epoch;
    this.last = findTask(id).evaluate(sim, this.memory);
  }

  evaluate(): TaskStatus {
    const epoch = this.sim.getState().epoch;
    if (epoch !== this.epoch) {
      this.epoch = epoch;
      clearRunMemory(this.memory);
    }
    this.last = findTask(this.id).evaluate(this.sim, this.memory);
    return this.last;
  }

  /** Runs for up to `seconds`, stopping early once the task is done. */
  run(seconds: number): TaskStatus {
    this.evaluate();
    for (let i = 0; i < seconds * 5 && !this.last.done; i++) {
      run(this.sim, 0.2);
      this.evaluate();
    }
    return this.last;
  }
}

/** Minimal RFC 4180 reader: quoted fields may contain delimiters, line breaks and doubled quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) {
      record.push(field);
      field = "";
    } else if (char === "\n") {
      record.push(field);
      records.push(record);
      record = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  return records;
}

describe("divergence handling", () => {
  it("ends a run whose twin blows up first, without an exception leaving the frame loop", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("quad");
    sim.setSolver({ method: "midpoint", rateHz: 60 });
    let thrown = 0;
    for (let i = 0; i < 60 * 80 && sim.getState().status === "ok"; i++) {
      try {
        sim.advance(1 / 60);
      } catch {
        thrown++;
      }
    }
    expect(thrown).toBe(0);
    expect(sim.getState().status).toBe("diverged");
    expect(sim.getState().running).toBe(false);
    // The state left on display is the last valid one.
    for (let i = 0; i < 2 * sim.model.n; i++) {
      expect(Number.isFinite(sim.pend.y[i])).toBe(true);
      expect(Number.isFinite(sim.twin.y[i])).toBe(true);
    }
  });

  it("halts inside a batch of many steps per frame", () => {
    const sim = new Simulation();
    sim.setModule("pendulum");
    sim.setLinkCount(6);
    sim.setPendulumParams({ masses: [6, 6, 6, 0.3, 0.3, 0.3], lengths: [1.8, 1.8, 1.8, 0.4, 0.4, 0.4] });
    sim.setSolver({ method: "symplecticEuler", rateHz: 600 });
    sim.setTimeScale(2);
    let thrown = 0;
    for (let i = 0; i < 30 * 30 && sim.getState().status === "ok"; i++) {
      try {
        sim.advance(1 / 30);
      } catch {
        thrown++;
      }
    }
    expect(thrown).toBe(0);
    expect(sim.getState().status).toBe("diverged");
    for (let i = 0; i < 2 * sim.model.n; i++) expect(Number.isFinite(sim.pend.y[i])).toBe(true);
  });

  it("does not throw from the model for a state that is already non-finite", () => {
    const model = new PendulumModel({ count: 2, masses: [1, 1], lengths: [1, 1], gravity: STANDARD_GRAVITY, jointDamping: 0 });
    const alpha = new Float64Array(2);
    expect(() => model.accelerations(new Float64Array([Number.NaN, 0, 0, 0, 0]), alpha)).not.toThrow();
    expect(Number.isNaN(alpha[0])).toBe(true);
    expect(() => model.accelerations(new Float64Array([0.3, 0.2, Number.POSITIVE_INFINITY, 0, 0]), alpha)).not.toThrow();
  });

  it("clears the diverged state only after restarting the experiment that diverged", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("six");
    sim.setSolver({ method: "euler", rateHz: 60 });
    for (let i = 0; i < 60 * 120 && sim.getState().status === "ok"; i++) sim.advance(1 / 60);
    expect(sim.getState().status).toBe("diverged");
    expect(sim.pend.t).toBeGreaterThan(1);

    sim.setModule("oscillator");
    sim.reset();
    expect(sim.getState().status).toBe("ok");
    // The pendulum was restarted too: it must not resume from its blown-up state.
    expect(sim.pend.t).toBe(0);
    for (let i = 0; i < 2 * sim.model.n; i++) expect(Math.abs(sim.pend.y[i])).toBeLessThan(10);
    sim.setModule("pendulum");
    sim.setRunning(true);
    expect(() => run(sim, 0.5)).not.toThrow();
  });

  it("refuses a change of experiment while a body is held", () => {
    const sim = new Simulation();
    run(sim, 1);
    sim.hold();
    sim.setModule("pendulum");
    expect(sim.getState().module).toBe("oscillator");
    sim.release();
    sim.setModule("pendulum");
    expect(sim.getState().module).toBe("pendulum");
  });
});

describe("imported data", () => {
  it("limits initial conditions from a file or a link like the number fields do", () => {
    const file = toExperimentFile(new Simulation().getState());
    const hostile = {
      ...file,
      module: "pendulum" as const,
      oscillator: { ...file.oscillator, x0: -1e9, v0: 1e300 },
      pendulum: { ...file.pendulum, thetas: [1e6, -1e6], omegas: [5000, -5000] },
    };
    const patch = fromExperimentFile(hostile);
    expect(patch).not.toBeNull();

    for (const sim of [new Simulation(patch ?? {}), new Simulation()]) {
      sim.load(patch ?? {});
      const state = sim.getState();
      expect(state.oscInitial).toEqual({ x: OSC_GEOMETRY.xMin, v: INITIAL_LIMITS.speed });
      expect(state.pendInitial.omegas.slice(0, 2)).toEqual([INITIAL_LIMITS.angularSpeed, -INITIAL_LIMITS.angularSpeed]);
      // An angle beyond the limit is reduced by whole turns, which keeps the configuration.
      expectShape(state.pendInitial.thetas.slice(0, 2), [1e6, -1e6]);
      for (const theta of state.pendInitial.thetas.slice(0, 2)) expect(Math.abs(theta)).toBeLessThanOrEqual(Math.PI);
      sim.setRunning(true);
      expect(() => run(sim, 1)).not.toThrow();
      expect(Number.isFinite(sim.pend.energy().mechanical)).toBe(true);
      sim.setModule("oscillator");
      expect(Number.isFinite(sim.osc.energy().mechanical)).toBe(true);
    }

    const viaLink = decodeShareHash(encodeShareHash({ ...new Simulation(patch ?? {}).getState() }));
    expect(viaLink?.pendInitial?.omegas?.[0]).toBe(INITIAL_LIMITS.angularSpeed);
  });

  it("keeps the configuration of a chain grabbed after many turns, through field edits, files and links", () => {
    const sim = new Simulation();
    sim.setModule("pendulum");
    sim.applyPendulumPreset("double");
    sim.setPendulumInitial(1, { omega: 30 });
    sim.setRunning(true);
    run(sim, 6);
    const [theta1 = 0, theta2 = 0] = sim.pend.y.subarray(0, 2);
    // The run has wound the chain beyond the limit of the initial conditions.
    expect(Math.max(Math.abs(theta1), Math.abs(theta2))).toBeGreaterThan(INITIAL_LIMITS.angle);

    sim.hold();
    sim.beginDrag();
    sim.dragPendulumTo(0, theta1 + 0.01);
    sim.endDrag(0, 0);
    const shape = [theta1 + 0.01, theta2];
    const stored = sim.getState().pendInitial.thetas.slice(0, 2);
    for (const theta of stored) expect(Math.abs(theta)).toBeLessThanOrEqual(INITIAL_LIMITS.angle);
    expectShape(stored, shape);

    // Editing another quantity of the chain leaves the angles alone.
    sim.setPendulumInitial(0, { omega: 0.5 });
    expectShape(sim.getState().pendInitial.thetas.slice(0, 2), shape);
    // A file and a shared link reproduce the same chain.
    const viaFile = fromExperimentFile(JSON.parse(JSON.stringify(toExperimentFile(sim.getState()))));
    expectShape(new Simulation(viaFile ?? {}).getState().pendInitial.thetas.slice(0, 2), shape);
    const viaLink = decodeShareHash(encodeShareHash(sim.getState()));
    expectShape(new Simulation(viaLink ?? {}).getState().pendInitial.thetas.slice(0, 2), shape);
  });
});

describe("solver changes and presets", () => {
  it("treats a change of solver as a new run of both experiments", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("eulerDrift");
    run(sim, 20);
    const epoch = sim.getState().epoch;
    expect(sim.oscSeries.length).toBeGreaterThan(1000);
    sim.setSolver({ method: "dopri5", rateHz: 1000 });
    expect(sim.getState().epoch).toBe(epoch + 1);
    expect(sim.osc.t).toBe(0);
    expect(sim.pend.t).toBe(0);
    expect(sim.oscSeries.length).toBe(1);
    expect(sim.maxExactError).toBe(0);
    run(sim, 20);
    // One sampling interval in the buffer and an honest ledger.
    const energy = sim.osc.energy();
    expect(Math.abs(energy.residual) / sim.osc.energyScale()).toBeLessThan(1e-9);
    expect(sim.oscSeries.get(0, 1) - sim.oscSeries.get(0, 0)).toBeCloseTo(0.01, 12);

    // Selecting the solver that is already active changes nothing.
    const before = sim.getState();
    sim.setSolver({ method: "dopri5", rateHz: 1000 });
    expect(sim.getState()).toBe(before);
  });

  it("restores the solver that a demonstration preset replaced", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("eulerDrift");
    expect(sim.getState().solver).toEqual({ method: "euler", rateHz: 60 });
    sim.applyOscillatorPreset("undamped");
    expect(sim.getState().solver).toEqual(DEFAULT_SOLVER);
    run(sim, 20);
    expect(Math.abs(sim.osc.energy().residual) / sim.osc.energyScale()).toBeLessThan(1e-9);

    sim.applyOscillatorPreset("eulerDrift");
    expect(sim.getState().scenario.oscillator).toBe("eulerDrift");
    sim.applyPendulumPreset("double");
    expect(sim.getState().solver).toEqual(DEFAULT_SOLVER);
    // The Euler demonstration no longer runs, so it is no longer marked as the active preset.
    expect(sim.getState().scenario.oscillator).toBeNull();

    // A solver chosen by hand is kept by later presets.
    sim.applyOscillatorPreset("eulerDrift");
    sim.setSolver({ method: "midpoint", rateHz: 300 });
    sim.applyOscillatorPreset("undamped");
    expect(sim.getState().solver).toEqual({ method: "midpoint", rateHz: 300 });
  });

  it("starts the sampling grid at the release, whatever ran before", () => {
    const sim = new Simulation();
    run(sim, 0.137);
    sim.setModule("pendulum");
    run(sim, 0.093);
    sim.reset();
    run(sim, 0.05);
    for (let i = 0; i < 4; i++) expect(sim.pendSeries.get(0, i)).toBeCloseTo(0.01 * i, 12);
  });

  it("counts frames that were cut, and never takes more than 400 steps in one", () => {
    const sim = new Simulation();
    sim.setSolver({ method: "rk4", rateHz: 2000 });
    sim.setTimeScale(2);
    sim.advance(1 / 60);
    expect(sim.perf.droppedFrames).toBe(0);
    sim.advance(0.5);
    expect(sim.perf.droppedFrames).toBe(1);
    expect(sim.perf.stepsPerFrame).toBe(400);
    sim.reset();
    expect(sim.perf.droppedFrames).toBe(0);
  });

  it("reports cut frames once they recur, not for a single long frame", () => {
    const sim = new Simulation();
    const frames = (count: number, seconds: number) => {
      for (let i = 0; i < count; i++) sim.advance(seconds);
    };
    // Isolated long frames, such as building a scene or opening the theory reader, a few seconds apart.
    for (let i = 0; i < 3; i++) {
      sim.advance(0.4);
      frames(180, 1 / 60);
    }
    expect(sim.perf.droppedFrames).toBe(3);
    expect(sim.perf.lagging).toBe(false);
    // A device that cannot keep up: LAG_FRAMES cut frames within LAG_WINDOW_SECONDS.
    frames(LAG_FRAMES - 1, 0.15);
    expect(sim.perf.lagging).toBe(false);
    frames(1, 0.15);
    expect(sim.perf.lagging).toBe(true);
    expect(sim.perf.droppedFrames).toBe(3 + LAG_FRAMES);
    // Recovering does not erase the record of the run; a restart does.
    frames(600, 1 / 60);
    expect(sim.perf.lagging).toBe(true);
    sim.reset();
    expect(sim.perf.lagging).toBe(false);
    expect(sim.perf.droppedFrames).toBe(0);
    // Long frames spread over more than the window stay isolated.
    for (let i = 0; i < 2 * LAG_FRAMES; i++) {
      sim.advance(0.2);
      frames(Math.ceil((LAG_WINDOW_SECONDS / (LAG_FRAMES - 1)) * 60), 1 / 60);
    }
    expect(sim.perf.lagging).toBe(false);
  });
});

describe("clock and closed-form reference", () => {
  it("shows a deviation from the analytical solution that falls when the step is refined", () => {
    const deviation = (rateHz: number): number => {
      const sim = new Simulation();
      sim.setSolver({ method: "rk4", rateHz });
      for (let i = 0; i < 6000; i++) sim.advance(0.1);
      expect(sim.osc.t).toBeCloseTo(600, 6);
      return sim.maxExactError;
    };
    const coarse = deviation(1000);
    const fine = deviation(2000);
    // Fourth order: a factor of 16 is expected; round-off in the clock used to reverse the trend.
    expect(coarse).toBeLessThan(2e-8);
    expect(fine).toBeLessThan(coarse / 8);
  });

  it("keeps the adaptive solver on the compensated clock", () => {
    // Dormand-Prince ends every call at t + h; measured from the clock, that end carried the round-off
    // of t + h, and the state drifted away from the clock by 7e-9 s in 600 s (5e-8 m at 1000 Hz).
    for (const rateHz of [1000, 2000]) {
      const sim = new Simulation();
      sim.setSolver({ method: "dopri5", rateHz });
      for (let i = 0; i < 6000; i++) sim.advance(0.1);
      expect(sim.osc.t).toBeCloseTo(600, 6);
      expect(sim.maxExactError, `${rateHz} Hz`).toBeLessThan(1e-10);
    }
  });

  it("keeps the drive phase continuous when the frequency is changed", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("resonance");
    run(sim, 3);
    const phase = sim.osc.phase;
    sim.setOscillatorParams({ driveFrequency: 5 });
    expect(sim.osc.phase).toBe(phase);
    run(sim, 1);
    expect(sim.osc.phase).toBeCloseTo(phase + 5 * 1, 9);
  });
});

describe("steady state and step response", () => {
  it("uses the slow root of an overdamped system for the transient", () => {
    const strong: OscillatorParams = { mass: 0.5, stiffness: 4, damping: 60, driveAmplitude: 0, driveFrequency: 1 };
    const theory = oscillatorTheory(strong);
    const gamma = theory.gamma;
    const omega0 = theory.omega0;
    expect(theory.transientRate).toBeCloseTo(gamma - Math.sqrt(gamma * gamma - omega0 * omega0), 9);
    expect(theory.decayTime).toBeCloseTo(1 / theory.transientRate, 9);
    // Up to critical damping the envelope rate is c/(2m).
    expect(oscillatorTheory({ ...strong, damping: 1 }).transientRate).toBe(1);
  });

  it("reports the steady state of an overdamped driven oscillator only when the amplitude has settled", () => {
    for (const params of [
      { mass: 0.5, stiffness: 4, damping: 60, driveAmplitude: 25, driveFrequency: 10 },
      { mass: 2, stiffness: 20, damping: 60, driveAmplitude: 25, driveFrequency: 14 },
    ]) {
      const sim = new Simulation();
      sim.setOscillatorParams(params);
      sim.setOscillatorInitial({ x: 3, v: 0 });
      const theory = oscillatorTheory(sim.getState().oscillator);
      let flagged = false;
      for (let i = 0; i < 5 * 150 && !flagged; i++) {
        run(sim, 0.2);
        const settled = steadyState(sim.oscMeter.amplitudeDrift, sim.oscMeter.centreDrift, sim.oscUndisturbedFor, theory.transientRate);
        if (settled.steady) {
          flagged = true;
          const amplitude = sim.oscMeter.amplitude as number;
          expect(Math.abs(amplitude - theory.steadyAmplitude) / theory.steadyAmplitude).toBeLessThan(0.015);
        }
      }
      expect(flagged).toBe(true);
      expect(sim.osc.impactCount).toBe(0);
    }
  });

  it("computes the theoretical settling time for every damping ratio", () => {
    const base: OscillatorParams = { mass: 1, stiffness: 10, damping: 0, driveAmplitude: 0, driveFrequency: 1 };
    const omega0 = Math.sqrt(10);
    const critical = 2 * Math.sqrt(10);
    expect(settlingTimeFromRest(base)).toBeNull();
    expect(settlingTimeFromRest({ ...base, damping: critical })).toBeCloseTo(CRITICAL_SETTLING_FACTOR / omega0, 9);
    // The reviewer's case: zeta = 0.98 is labelled "critical", but its settling time is 4 % shorter.
    expect(settlingTimeFromRest({ ...base, damping: 6.2 })).toBeCloseTo(1.7738, 3);
    expect(settlingTimeFromRest({ ...base, damping: 6.4 })).toBeCloseTo(1.8875, 3);
    // Underdamped: the last exit from the band, found on the oscillating response.
    const light = settlingTimeFromRest({ ...base, damping: 0.4 }) as number;
    const meter = new StepResponseMeter(0.02);
    meter.reset(0, 1);
    const gamma = 0.2;
    const wd = Math.sqrt(10 - gamma * gamma);
    for (let i = 1; i <= 60_000; i++) {
      const t = i * 1e-3;
      meter.push(t, Math.exp(-gamma * t) * (Math.cos(wd * t) + (gamma / wd) * Math.sin(wd * t)));
    }
    expect(meter.settlingTime).not.toBeNull();
    expect(light).toBeCloseTo(meter.settlingTime as number, 4);
  });

  it("measures the settling time between samples, as the other instruments do", () => {
    for (const [mass, stiffness, damping] of [
      [2, 24.5, 14],
      [1, 10, 6.2],
      [0.5, 80, 12.6],
    ]) {
      const sim = new Simulation();
      sim.setOscillatorParams({ mass, stiffness, damping, driveAmplitude: 0 });
      sim.setOscillatorInitial({ x: 2, v: 0 });
      run(sim, 8);
      const measured = sim.stepMeter.settlingTime as number;
      const expected = settlingTimeFromRest(sim.getState().oscillator) as number;
      // Sampled at 10 ms. Without interpolation the result was early by up to 1.7 %; what
      // remains is the curvature of the response between two samples (0.1 ms in the stiffest case).
      expect(Math.abs(measured - expected) / expected).toBeLessThan(5e-4);
    }
  });

  it("invalidates a step response when a parameter changes after the release", () => {
    const sim = new Simulation();
    sim.setOscillatorParams({ mass: 4, stiffness: 36, damping: 60, driveAmplitude: 0 });
    sim.setOscillatorInitial({ x: 3, v: 0 });
    run(sim, 20);
    expect(sim.stepMeter.settlingTime).not.toBeNull();
    sim.setOscillatorParams({ stiffness: 4 });
    expect(sim.stepMeter.initialDisplacement).toBe(0);
    expect(sim.stepMeter.settlingTime).toBeNull();
  });

  it("counts complete periods, not overlapping intervals", () => {
    const meter = new OscillationMeter();
    const omega = 2 * Math.PI;
    for (let i = 0; i <= 6750; i++) {
      const t = i * 1e-3;
      meter.push(t, Math.sin(omega * t + 0.3), omega * Math.cos(omega * t + 0.3));
    }
    // 6.75 periods observed: about twelve intervals, but only six complete periods.
    expect(meter.cycles).toBeGreaterThanOrEqual(11);
    expect(meter.periods).toBeLessThanOrEqual(6);
    expect(meter.periods).toBe(Math.floor(meter.cycles / 2));
    expect(meter.centreDrift).toBeLessThan(1e-6);
  });
});

describe("spectrum of a short record", () => {
  it("does not zero-pad: frequency and amplitude are right before 4096 samples exist", () => {
    for (const available of [256, 512, 1024, 2048, 3000, 4096]) {
      const samples = new Float64Array(available);
      for (let i = 0; i < available; i++) samples[i] = 0.4 + 2 * Math.sin((2 * Math.PI * 1.7313 * i) / 100 + 0.7);
      const spectrum = amplitudeSpectrum(samples, 100, 4096);
      const expectedLength = 2 ** Math.floor(Math.log2(available));
      expect(spectrum.samples).toBe(expectedLength);
      expect(spectrum.resolution).toBeCloseTo(100 / expectedLength, 12);
      expect(spectrum.frequency.length).toBe(expectedLength / 2 + 1);
      const peak = dominantPeak(spectrum, 2 * spectrum.resolution);
      expect(peak).not.toBeNull();
      expect(Math.abs((peak?.frequency ?? 0) - 1.7313)).toBeLessThan(5e-4);
      expect(Math.abs((peak?.amplitude ?? 0) - 2) / 2).toBeLessThan(2e-3);
    }
  });

  it("reads the undamped preset correctly ten seconds into the run", () => {
    const sim = new Simulation();
    run(sim, 10);
    const samples = sim.oscSeries.tail(1, 4096);
    const spectrum = amplitudeSpectrum(samples, 1 / sim.sampleInterval, 4096);
    const peak = dominantPeak(spectrum, 2 * spectrum.resolution);
    const f0 = oscillatorTheory(sim.getState().oscillator).omega0 / (2 * Math.PI);
    // Zero-padded, this read 0.5494 Hz and 2.333 m for a 2.000 m oscillation at 0.5513 Hz.
    expect(Math.abs((peak?.frequency ?? 0) - f0) / f0).toBeLessThan(1e-3);
    expect(Math.abs((peak?.amplitude ?? 0) - 2) / 2).toBeLessThan(1e-3);
  });

  it("halves the Nyquist bin like the zero-frequency bin", () => {
    const samples = new Float64Array(1024);
    for (let i = 0; i < samples.length; i++) samples[i] = 0.7 * (i % 2 === 0 ? 1 : -1);
    const spectrum = amplitudeSpectrum(samples, 100, 1024);
    expect(spectrum.amplitude[spectrum.amplitude.length - 1]).toBeCloseTo(0.7, 6);
  });
});

describe("CSV export", () => {
  it("is read as a table by a quote-aware reader in both dialects", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("resonance");
    run(sim, 2);
    for (const dialect of [CSV_INTERNATIONAL, CSV_SPREADSHEET]) {
      const text = buildCsv(sim, dialect, new Date("2026-11-11T12:00:00Z")).replace(/^﻿/, "");
      expect(text).not.toContain('"');
      const records = parseCsv(text, dialect.delimiter);
      const metadata = records.filter((record) => record[0].startsWith("#"));
      const table = records.filter((record) => !record[0].startsWith("#"));
      expect(metadata.length).toBeGreaterThan(8);
      // A metadata line is one field: it contains neither the delimiter nor a quote.
      for (const record of metadata) expect(record).toHaveLength(1);
      expect(table).toHaveLength(sim.oscSeries.length + 1);
      for (const record of table) expect(record).toHaveLength(15);
      expect(metadata[metadata.length - 1][0]).toBe(
        dialect.delimiter === ";" ? "# decimal separator: comma | field delimiter: semicolon" : "# decimal separator: point | field delimiter: comma",
      );
    }
    sim.applyPendulumPreset("triple");
    run(sim, 1);
    for (const dialect of [CSV_INTERNATIONAL, CSV_SPREADSHEET]) {
      const records = parseCsv(buildCsv(sim, dialect).replace(/^﻿/, ""), dialect.delimiter);
      const table = records.filter((record) => !record[0].startsWith("#"));
      expect(new Set(table.map((record) => record.length)).size).toBe(1);
      for (const record of records.filter((entry) => entry[0].startsWith("#"))) expect(record).toHaveLength(1);
    }
  });
});

describe("task sheets cannot be completed without the measurement", () => {
  it("periodDesign, secondsPendulum, anharmonic and butterfly stay open with the wrong setting", () => {
    expect(new TaskProbe(new Simulation(), "periodDesign").run(30).done).toBe(false);
    expect(new TaskProbe(new Simulation(), "secondsPendulum").run(30).done).toBe(false);
    expect(new TaskProbe(new Simulation(), "anharmonic").run(30).done).toBe(false);
    const butterfly = new TaskProbe(new Simulation(), "butterfly");
    butterfly.sim.setTwin({ enabled: false });
    expect(butterfly.run(40).done).toBe(false);
  });

  it("butterfly reports the time from the twin's release, not the clock, after a new launch of the twin", () => {
    const probe = new TaskProbe(new Simulation(), "butterfly");
    probe.sim.setRunning(true);
    run(probe.sim, 3);
    // A twin launched anew, with another offset: its own release is the origin of the duration.
    probe.sim.setTwin({ offset: 1e-6 });
    const status = probe.run(60);
    expect(status.done).toBe(true);
    const divergence = probe.sim.divergenceTime ?? Number.NaN;
    expect(probe.sim.twinSince).toBeGreaterThan(0);
    const readout = status.readouts.find((item) => item.key === "divergenceTime");
    expect(readout?.value).toBeCloseTo(divergence - probe.sim.twinSince, 12);
  });

  it("counts N complete periods before it accepts a period", () => {
    const probe = new TaskProbe(new Simulation(), "periodDesign");
    probe.sim.setOscillatorParams({ mass: 2, stiffness: 19.5 });
    probe.sim.reset();
    // T = 2.012 s: after four periods the measured value is already stable, but six are required.
    run(probe.sim, 4 * 2.012 + 0.5);
    expect(probe.evaluate().checks[1]).toBe(false);
    expect(probe.run(30).done).toBe(true);
    expect(probe.sim.osc.t).toBeGreaterThan(6 * 2.012);
  });

  it("resonancePeak cannot be completed at or above the natural frequency", () => {
    const peak = oscillatorTheory({ mass: 2, stiffness: 24.5, damping: 3.5, driveAmplitude: 4, driveFrequency: 2 });
    expect(peak.omegaPeak).toBeCloseTo(3.274, 3);
    expect(peak.peakAmplitude).toBeCloseTo(0.3372, 4);
    for (const omega of [3.5, 3.53]) {
      const probe = new TaskProbe(new Simulation(), "resonancePeak");
      probe.sim.setOscillatorParams({ driveFrequency: omega });
      probe.sim.reset();
      const status = probe.run(40);
      expect(status.checks[0]).toBe(true);
      expect(status.checks[1]).toBe(false);
      expect(status.done).toBe(false);
    }
    const right = new TaskProbe(new Simulation(), "resonancePeak");
    right.sim.setOscillatorParams({ driveFrequency: 3.27 });
    right.sim.reset();
    expect(right.run(40).done).toBe(true);
  });

  it("criticalDamping does not accept a settling time measured before a parameter change", () => {
    const probe = new TaskProbe(new Simulation(), "criticalDamping");
    probe.sim.setOscillatorParams({ damping: 60 });
    probe.sim.reset();
    expect(probe.run(20).checks).toEqual([true, true, false]);
    // Lowering k makes the old settling time look good against the new reference; it must not count.
    probe.sim.setOscillatorParams({ stiffness: 4 });
    expect(probe.evaluate().done).toBe(false);
    expect(probe.run(5).done).toBe(false);
  });

  it("integratorError requires twenty seconds integrated by the accurate method", () => {
    const probe = new TaskProbe(new Simulation(), "integratorError");
    probe.run(25);
    expect(probe.last.checks[0]).toBe(true);
    probe.sim.setRunning(false);
    probe.sim.setOscillatorParams({ mass: probe.sim.getState().oscillator.mass });
    probe.sim.setSolver({ method: "rk4", rateHz: 1000 });
    expect(probe.evaluate().done).toBe(false);
    probe.sim.setRunning(true);
    run(probe.sim, 10);
    expect(probe.evaluate().done).toBe(false);
    expect(probe.run(15).done).toBe(true);
  });

  it("regularIsland requires sixty seconds of twin tracking and a real average", () => {
    const probe = new TaskProbe(new Simulation(), "regularIsland");
    probe.sim.setTwin({ enabled: false });
    probe.run(61);
    probe.sim.setRunning(false);
    probe.sim.setPendulumParams({ jointDamping: 0 });
    probe.sim.setTwin({ enabled: true });
    expect(probe.evaluate().done).toBe(false);
  });

  it("secondsPendulum accepts the gravity the interface shows as Earth", () => {
    const probe = new TaskProbe(new Simulation(), "secondsPendulum");
    const lengths = [...probe.sim.getState().pendulum.lengths];
    lengths[0] = 0.995;
    probe.sim.setPendulumParams({ lengths, gravity: 9.807 });
    probe.sim.reset();
    expect(probe.run(40).done).toBe(true);
  });
});
