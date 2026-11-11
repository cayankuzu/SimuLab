import { describe, expect, it } from "vitest";
import { OSC_GEOMETRY, STANDARD_GRAVITY } from "@/physics/constants";
import { steadyState, transientDecayTime } from "@/physics/measure";
import { oscillatorTheory } from "@/physics/oscillator";
import {
  buildCsv,
  CSV_INTERNATIONAL,
  CSV_SPREADSHEET,
  decodeShareHash,
  encodeShareHash,
  fromExperimentFile,
  toExperimentFile,
} from "@/sim/exchange";
import { OSCILLATOR_PRESETS, PENDULUM_PRESETS } from "@/sim/presets";
import { SeriesBuffer } from "@/sim/SeriesBuffer";
import { OSC_CH, PEND_CH, Simulation } from "@/sim/Simulation";
import { clearRunMemory, findTask, TASKS, type TaskId, type TaskMemory } from "@/sim/tasks";

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Runs the simulation for `seconds` of simulated time in 60 Hz frames. */
function run(sim: Simulation, seconds: number): void {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) sim.advance(1 / 60);
}

describe("SeriesBuffer", () => {
  it("keeps the newest samples in order and supports binary search", () => {
    const buffer = new SeriesBuffer(2, 4);
    for (let i = 0; i < 10; i++) buffer.push([i, i * i]);
    expect(buffer.length).toBe(4);
    expect(buffer.total).toBe(10);
    expect([0, 1, 2, 3].map((i) => buffer.get(0, i))).toEqual([6, 7, 8, 9]);
    expect(buffer.latest(1)).toBe(81);
    expect(buffer.lowerBound(0, 7.5)).toBe(2);
    expect(buffer.lowerBound(0, 100)).toBe(4);
    expect(Array.from(buffer.tail(1, 2))).toEqual([64, 81]);
    buffer.clear();
    expect(buffer.length).toBe(0);
    expect(Number.isNaN(buffer.latest(0))).toBe(true);
  });
});

describe("fixed-step loop", () => {
  it("produces bit-identical trajectories for any frame partition", () => {
    const steady = new Simulation();
    const jittery = new Simulation();
    steady.applyPendulumPreset("double");
    jittery.applyPendulumPreset("double");

    const history = new Map<number, number>();
    const key = (sim: Simulation) => Math.round(sim.pend.t * sim.getState().solver.rateHz);
    for (let i = 0; i < 480; i++) {
      steady.advance(1 / 60);
      history.set(key(steady), steady.pend.y[1]);
    }
    const random = lcg(42);
    let compared = 0;
    let elapsed = 0;
    while (elapsed < 7.9) {
      const dt = 0.003 + random() * 0.03;
      jittery.advance(dt);
      elapsed += dt;
      const reference = history.get(key(jittery));
      if (reference !== undefined) {
        // Chaotic system: any dependence on frame timing would show up as a large difference here.
        expect(jittery.pend.y[1]).toBe(reference);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(5);
  });

  it("does not advance while paused, dragging or after divergence", () => {
    const sim = new Simulation();
    sim.setRunning(false);
    sim.advance(1);
    expect(sim.osc.t).toBe(0);
    sim.stepFrame();
    // One display frame = round(1000 / 60) = 17 solver steps.
    expect(sim.osc.t).toBeCloseTo(0.017, 9);
    sim.setRunning(true);
    sim.beginDrag();
    sim.advance(1);
    expect(sim.osc.t).toBeCloseTo(0.017, 9);
    sim.dragOscillatorTo(3.2);
    expect(sim.osc.x).toBe(3.2);
    expect(sim.osc.t).toBe(0);
    sim.endDrag(-4);
    expect(sim.getState().oscInitial).toEqual({ x: 3.2, v: -4 });
    expect(sim.osc.v).toBe(-4);
  });

  it("holds time while a body is pressed and resumes unchanged if it was not moved", () => {
    const sim = new Simulation();
    sim.advance(0.5);
    const before = { t: sim.osc.t, x: sim.osc.x, v: sim.osc.v, epoch: sim.getState().epoch };
    sim.hold();
    sim.advance(1);
    expect(sim.osc.t).toBe(before.t);
    sim.release();
    expect({ t: sim.osc.t, x: sim.osc.x, v: sim.osc.v, epoch: sim.getState().epoch }).toEqual(before);
    sim.advance(0.1);
    expect(sim.osc.t).toBeGreaterThan(before.t);
  });

  it("bounds the work per frame and never spirals after a long stall", () => {
    const sim = new Simulation();
    sim.advance(30);
    expect(sim.osc.t).toBeLessThanOrEqual(0.1 + 1e-9);
  });

  it("scales simulated time with the time scale", () => {
    const sim = new Simulation();
    sim.setTimeScale(0.25);
    run(sim, 4);
    expect(sim.osc.t).toBeCloseTo(1, 2);
  });
});

describe("experiments", () => {
  it("every oscillator preset runs within the mechanical limits and keeps its ledger closed", () => {
    for (const preset of OSCILLATOR_PRESETS) {
      const sim = new Simulation();
      sim.applyOscillatorPreset(preset.id);
      expect(sim.getState().scenario.oscillator).toBe(preset.id);
      run(sim, 20);
      expect(sim.getState().status).toBe("ok");
      expect(sim.osc.x).toBeGreaterThanOrEqual(OSC_GEOMETRY.xMin);
      expect(sim.osc.x).toBeLessThanOrEqual(OSC_GEOMETRY.xMax);
      const relative = Math.abs(sim.osc.energy().residual) / sim.osc.energyScale();
      if (preset.solver?.method === "euler") expect(relative).toBeGreaterThan(1e-3);
      else expect(relative).toBeLessThan(1e-8);
    }
  });

  it("every pendulum preset conserves energy with the default solver", () => {
    for (const preset of PENDULUM_PRESETS) {
      const sim = new Simulation();
      sim.applyPendulumPreset(preset.id);
      expect(sim.getState().pendulum.count).toBe(preset.count);
      expect(sim.getState().scenario.pendulum).toBe(preset.id);
      run(sim, 10);
      expect(sim.getState().status).toBe("ok");
      expect(Math.abs(sim.pend.energy().residual) / sim.pend.energyScale()).toBeLessThan(1e-6);
      expect(sim.pendSeries.length).toBeGreaterThan(900);
    }
  });

  it("records the closed-form reference next to the numerical solution", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("underdamped");
    run(sim, 15);
    expect(sim.maxExactError).toBeLessThan(1e-9);
    const last = sim.oscSeries.length - 1;
    expect(sim.oscSeries.get(OSC_CH.x, last)).toBeCloseTo(sim.oscSeries.get(OSC_CH.xExact, last), 9);
    // The reference survives a parameter change (it is re-based at that instant).
    sim.setOscillatorParams({ damping: 2.5 });
    run(sim, 5);
    expect(sim.maxExactError).toBeLessThan(1e-9);
  });

  it("measures the period and logarithmic decrement of the underdamped preset", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("underdamped");
    run(sim, 20);
    const theory = oscillatorTheory(sim.getState().oscillator);
    expect(sim.oscMeter.period).toBeCloseTo(theory.periodD as number, 6);
    expect(sim.oscMeter.logDecrement).toBeCloseTo(theory.logDecrement as number, 5);
  });

  it("reports the driven steady state only once the transient has decayed", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("resonance");
    const theory = oscillatorTheory(sim.getState().oscillator);
    const waitTime = transientDecayTime(theory.transientRate);
    let reportedAt: number | null = null;
    for (let i = 0; i < 600 && reportedAt === null; i++) {
      run(sim, 0.2);
      const relative = Math.abs((sim.oscMeter.amplitude ?? 0) - theory.steadyAmplitude) / theory.steadyAmplitude;
      const settled = steadyState(
        sim.oscMeter.amplitudeDrift,
        sim.oscMeter.centreDrift,
        sim.oscUndisturbedFor,
        theory.transientRate,
      );
      // The cycle-to-cycle change alone would announce the steady state several per cent too early.
      if (settled.steady) {
        reportedAt = sim.osc.t;
        expect(relative).toBeLessThan(0.015);
      } else {
        expect(settled.remaining > 0 || (sim.oscMeter.amplitudeDrift ?? 1) >= 0.01).toBe(true);
      }
    }
    expect(reportedAt).not.toBeNull();
    expect(reportedAt as number).toBeGreaterThanOrEqual(waitTime);
    expect(reportedAt as number).toBeLessThan(waitTime + 5);
    // A parameter change is a disturbance: the waiting time starts again.
    sim.setOscillatorParams({ driveFrequency: 3.2 });
    expect(sim.oscUndisturbedFor).toBe(0);
    expect(steadyState(0, 0, sim.oscUndisturbedFor, theory.transientRate).steady).toBe(false);
    // Without damping there is no steady state at all.
    expect(steadyState(0, 0, 1e6, 0)).toEqual({ steady: false, remaining: Number.POSITIVE_INFINITY });
  });

  it("shows explicit Euler pumping energy into a frictionless oscillator", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("eulerDrift");
    const initial = sim.osc.energy().mechanical;
    run(sim, 10);
    const h = 1 / 60;
    const omega0 = oscillatorTheory(sim.getState().oscillator).omega0;
    const steps = Math.round(sim.osc.t * 60);
    expect(sim.osc.energy().mechanical / initial).toBeCloseTo((1 + h * h * omega0 * omega0) ** steps, 6);
  });

  it("launches the twin with the configured offset and detects its divergence", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("double");
    expect(sim.twin.y[0] - sim.pend.y[0]).toBeCloseTo(1e-3, 15);
    expect(sim.divergenceTime).toBeNull();
    run(sim, 40);
    expect(sim.divergenceTime).not.toBeNull();
    expect(sim.lyapunov.exponent).toBeGreaterThan(0.3);
    // A single pendulum is integrable: the twin never separates appreciably.
    sim.applyPendulumPreset("single");
    run(sim, 40);
    expect(sim.divergenceTime).toBeNull();
    expect(sim.separation).toBeLessThan(0.01);
  });

  it("collects Poincare section points for the double pendulum only", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("double");
    run(sim, 30);
    expect(sim.poincare.length).toBeGreaterThan(5);
    for (let i = 0; i < sim.poincare.length; i++) {
      expect(Math.abs(sim.poincare.get(0, i))).toBeLessThanOrEqual(Math.PI);
    }
    sim.applyPendulumPreset("triple");
    run(sim, 10);
    expect(sim.poincare.length).toBe(0);
  });

  it("changes the number of links, parameters and gravity without losing consistency", () => {
    const sim = new Simulation();
    sim.setModule("pendulum");
    for (const n of [1, 6, 3, 2]) {
      sim.setLinkCount(n);
      expect(sim.model.n).toBe(n);
      expect(sim.pend.y.length).toBe(2 * n + 1);
      run(sim, 1);
      expect(Number.isFinite(sim.pendSeries.latest(PEND_CH.theta + n - 1))).toBe(true);
      if (n < 6) expect(Number.isNaN(sim.pendSeries.latest(PEND_CH.theta + n))).toBe(true);
    }
    const before = Array.from(sim.pend.y.subarray(0, 4));
    sim.setPendulumParams({ gravity: 1.62, jointDamping: 0.2 });
    expect(Array.from(sim.pend.y.subarray(0, 4))).toEqual(before);
    expect(sim.pend.energy().residual).toBe(0);
    sim.setPendulumParams({ gravity: 999, jointDamping: -3 });
    expect(sim.getState().pendulum.gravity).toBe(26);
    expect(sim.getState().pendulum.jointDamping).toBe(0);
  });

  it("remembers the active preset of each experiment separately and forgets it on a manual edit", () => {
    const sim = new Simulation();
    expect(sim.getState().scenario).toEqual({ oscillator: "undamped", pendulum: "double" });
    sim.applyPendulumPreset("six");
    sim.setModule("oscillator");
    expect(sim.getState().scenario).toEqual({ oscillator: "undamped", pendulum: "six" });
    sim.setOscillatorParams({ damping: 1 });
    expect(sim.getState().scenario).toEqual({ oscillator: null, pendulum: "six" });
    sim.setLinkCount(3);
    expect(sim.getState().scenario).toEqual({ oscillator: null, pendulum: null });
  });

  it("holds and releases a pendulum link with a throw velocity", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("double");
    run(sim, 1);
    sim.beginDrag();
    sim.dragPendulumTo(1, 0.5);
    expect(sim.pend.t).toBe(0);
    expect(sim.pend.y[2]).toBe(0);
    expect(Math.abs(sim.pend.y[1] - 0.5) % (2 * Math.PI)).toBeLessThan(1e-9);
    sim.endDrag(3, 1);
    expect(sim.pend.y[3]).toBe(3);
    expect(sim.isDragging).toBe(false);
  });

  it("halts instead of producing non-finite states", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("six");
    sim.setSolver({ method: "euler", rateHz: 60 });
    for (let i = 0; i < 60 * 600 && sim.getState().status === "ok"; i++) sim.advance(1 / 60);
    // Either it survives ten simulated minutes with finite values or it stops cleanly.
    for (const value of sim.pend.y) expect(Number.isFinite(value)).toBe(true);
    if (sim.getState().status === "diverged") {
      expect(sim.getState().running).toBe(false);
      sim.setSolver({ method: "rk4", rateHz: 1000 });
      expect(sim.getState().status).toBe("ok");
      expect(sim.pend.t).toBe(0);
    }
  });
});

describe("laboratory tasks are achievable by measurement", () => {
  const memories = new Map<TaskId, TaskMemory>();
  const evaluate = (sim: Simulation, id: TaskId) => {
    if (!memories.has(id)) memories.set(id, {});
    return findTask(id).evaluate(sim, memories.get(id) as TaskMemory);
  };
  /** Runs while re-evaluating at 5 Hz, like the interface does. */
  const runEvaluating = (sim: Simulation, id: TaskId, seconds: number) => {
    let last = evaluate(sim, id);
    for (let i = 0; i < seconds * 5 && !last.done; i++) {
      run(sim, 0.2);
      last = evaluate(sim, id);
    }
    return last;
  };

  it("declares as many criteria as it evaluates", () => {
    for (const task of TASKS) {
      const sim = new Simulation();
      task.setup(sim);
      const result = task.evaluate(sim, {});
      expect(result.checks.length).toBe(task.criteria);
      expect(result.done).toBe(false);
      expect(sim.getState().module).toBe(task.module);
    }
  });

  it("periodDesign: T = 2 s needs k/m = pi^2", () => {
    const sim = new Simulation();
    findTask("periodDesign").setup(sim);
    sim.setOscillatorParams({ mass: 2, stiffness: 19.5 });
    sim.reset();
    expect(runEvaluating(sim, "periodDesign", 30).done).toBe(true);
  });

  it("criticalDamping: c = 2 sqrt(k m) passes, half of it overshoots, double is too slow", () => {
    const attempt = (damping: number) => {
      const sim = new Simulation();
      findTask("criticalDamping").setup(sim);
      sim.setOscillatorParams({ damping });
      sim.reset();
      memories.delete("criticalDamping");
      return runEvaluating(sim, "criticalDamping", 25);
    };
    expect(attempt(24).done).toBe(true);
    expect(attempt(12).checks[1]).toBe(false);
    expect(attempt(48).checks[2]).toBe(false);
  });

  it("resonancePeak: driving at w0 sqrt(1 - 2 zeta^2) reaches the peak amplitude", () => {
    const sim = new Simulation();
    findTask("resonancePeak").setup(sim);
    const peak = oscillatorTheory(sim.getState().oscillator).omegaPeak as number;
    sim.setOscillatorParams({ driveFrequency: Math.round(peak * 100) / 100 });
    sim.reset();
    expect(runEvaluating(sim, "resonancePeak", 90).done).toBe(true);
    // Far from the peak the amplitude criterion fails.
    sim.setOscillatorParams({ driveFrequency: 2 });
    sim.reset();
    expect(runEvaluating(sim, "resonancePeak", 60).checks[1]).toBe(false);
  });

  it("integratorError: Euler violates the ledger, RK4 closes it", () => {
    const sim = new Simulation();
    findTask("integratorError").setup(sim);
    const first = runEvaluating(sim, "integratorError", 60);
    expect(first.checks[0]).toBe(true);
    expect(first.done).toBe(false);
    sim.setSolver({ method: "rk4", rateHz: 1000 });
    sim.reset();
    clearRunMemory(memories.get("integratorError") as TaskMemory);
    expect(runEvaluating(sim, "integratorError", 30).done).toBe(true);
  });

  it("secondsPendulum: L = g / pi^2", () => {
    const sim = new Simulation();
    findTask("secondsPendulum").setup(sim);
    const lengths = [...sim.getState().pendulum.lengths];
    lengths[0] = 0.995;
    sim.setPendulumParams({ lengths });
    sim.reset();
    expect(STANDARD_GRAVITY / Math.PI ** 2).toBeCloseTo(0.9936, 4);
    expect(runEvaluating(sim, "secondsPendulum", 30).done).toBe(true);
  });

  it("anharmonic: a 120 degree swing is slower than Huygens' formula and matches the elliptic integral", () => {
    const sim = new Simulation();
    findTask("anharmonic").setup(sim);
    sim.setPendulumInitial(0, { theta: (120 * Math.PI) / 180 });
    expect(runEvaluating(sim, "anharmonic", 30).done).toBe(true);
  });

  it("butterfly: the twin separates by 1 rad", () => {
    const sim = new Simulation();
    findTask("butterfly").setup(sim);
    expect(runEvaluating(sim, "butterfly", 60).done).toBe(true);
  });

  it("regularIsland: small swings stay coherent for a minute, the chaotic preset does not", () => {
    const sim = new Simulation();
    findTask("regularIsland").setup(sim);
    sim.setPendulumInitial(0, { theta: 0.2 });
    sim.setPendulumInitial(1, { theta: 0.15 });
    memories.delete("regularIsland");
    expect(runEvaluating(sim, "regularIsland", 70).done).toBe(true);

    const chaotic = new Simulation();
    findTask("regularIsland").setup(chaotic);
    memories.delete("regularIsland");
    const result = runEvaluating(chaotic, "regularIsland", 70);
    expect(result.done).toBe(false);
    expect(result.checks[2]).toBe(false);
  });

  it("normalMode: a pure mode has a single sharp period, a mixture does not", () => {
    const sim = new Simulation();
    findTask("normalMode").setup(sim);
    const mixed = runEvaluating(sim, "normalMode", 60);
    expect(mixed.done).toBe(false);
    sim.applyPendulumPreset("mode1");
    expect(runEvaluating(sim, "normalMode", 60).done).toBe(true);
    sim.applyPendulumPreset("mode2");
    expect(runEvaluating(sim, "normalMode", 40).done).toBe(true);
  });
});

describe("data exchange", () => {
  it("round-trips an experiment through a file and through a link", () => {
    const sim = new Simulation();
    sim.applyPendulumPreset("triple");
    sim.setPendulumParams({ gravity: 3.73, jointDamping: 0.12 });
    sim.setTwin({ offset: 1e-6 });
    sim.setSolver({ method: "dopri5", rateHz: 600 });
    const file = toExperimentFile(sim.getState());
    const restored = new Simulation();
    restored.load(fromExperimentFile(JSON.parse(JSON.stringify(file))) ?? {});
    expect(toExperimentFile(restored.getState())).toEqual(file);

    const hash = encodeShareHash(sim.getState());
    expect(hash.startsWith("#x=")).toBe(true);
    const viaLink = new Simulation();
    viaLink.load(decodeShareHash(hash) ?? {});
    expect(toExperimentFile(viaLink.getState())).toEqual(file);

    // Identical definitions give identical trajectories.
    sim.reset();
    restored.reset();
    run(sim, 3);
    run(restored, 3);
    expect(Array.from(restored.pend.y)).toEqual(Array.from(sim.pend.y));
  });

  it("rejects malformed or hostile input", () => {
    expect(fromExperimentFile(null)).toBeNull();
    expect(fromExperimentFile({ schema: "something-else" })).toBeNull();
    expect(decodeShareHash("#x=not-base64-json")).toBeNull();
    expect(decodeShareHash("#unrelated")).toBeNull();
    const file = toExperimentFile(new Simulation().getState());
    expect(fromExperimentFile({ ...file, solver: { method: "constructor", rateHz: 1000 } })).toBeNull();
    expect(fromExperimentFile({ ...file, solver: { method: "rk4", rateHz: 1e9 } })).toBeNull();
    expect(fromExperimentFile({ ...file, pendulum: { ...file.pendulum, masses: ["1"] } })).toBeNull();
    // Out-of-range numbers are accepted syntactically but clamped by the simulation.
    const sim = new Simulation();
    sim.load(fromExperimentFile({ ...file, oscillator: { ...file.oscillator, mass: 1e9, x0: -1e9 } }) ?? {});
    expect(sim.getState().oscillator.mass).toBe(10);
    expect(sim.osc.x).toBe(OSC_GEOMETRY.xMin);
  });

  it("exports telemetry with full metadata in two CSV dialects", () => {
    const sim = new Simulation();
    sim.applyOscillatorPreset("resonance");
    run(sim, 2);
    const stamp = new Date("2026-11-10T12:00:00Z");
    const csv = buildCsv(sim, CSV_INTERNATIONAL, stamp);
    const lines = csv.trimEnd().split("\n");
    const header = lines.findIndex((line) => !line.startsWith("#"));
    expect(lines[1]).toBe("# exported: 2026-11-10T12:00:00.000Z");
    expect(csv).toContain("integrator: rk4 (order 4) | fixed step h = 0.001 s (1000 Hz)");
    expect(csv).toContain("m = 2 kg | k = 24.5 N/m | c = 0.55 N s/m | F0 = 8 N | omega = 3.5 rad/s");
    expect(lines[header].split(",")).toHaveLength(15);
    expect(lines.length - header - 1).toBe(sim.oscSeries.length);
    const first = lines[header + 1].split(",").map(Number);
    expect(first[0]).toBe(0);
    expect(first[1]).toBe(0.2);

    const spreadsheet = buildCsv(sim, CSV_SPREADSHEET, stamp);
    expect(spreadsheet.charCodeAt(0)).toBe(0xfeff);
    const dataLine = spreadsheet.trimEnd().split("\n")[header + 2];
    expect(dataLine.split(";")).toHaveLength(15);
    expect(dataLine).toContain(",");

    sim.applyPendulumPreset("double");
    run(sim, 1);
    const pendulum = buildCsv(sim, CSV_INTERNATIONAL, stamp).trimEnd().split("\n");
    const columns = pendulum[pendulum.findIndex((line) => !line.startsWith("#"))].split(",");
    expect(columns).toEqual([
      "t_s",
      "theta1_rad",
      "theta2_rad",
      "omega1_rad_per_s",
      "omega2_rad_per_s",
      "E_kinetic_J",
      "E_potential_J",
      "Q_joints_J",
      "ledger_residual_J",
      "lyapunov_estimate_per_s",
      "twin_separation_rad",
      "twin_theta2_rad",
      "twin_omega2_rad_per_s",
    ]);
  });
});
