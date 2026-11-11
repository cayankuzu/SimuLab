import { describe, expect, it } from "vitest";
import { OSC_GEOMETRY, STANDARD_GRAVITY } from "@/physics/constants";
import { createAdvancer, INTEGRATORS, INTEGRATOR_IDS, type Derivative } from "@/physics/integrators";
import { choleskyFactor, choleskySolve, generalizedSymmetricEigen, symmetricEigen } from "@/physics/linalg";
import { BenettinEstimator, predictionHorizon } from "@/physics/lyapunov";
import { dampingRatioFromDecrement, OscillationMeter, StepResponseMeter, CRITICAL_SETTLING_FACTOR } from "@/physics/measure";
import {
  exactOscillatorState,
  magnification,
  OSC,
  OscillatorSystem,
  oscillatorTheory,
  steadyStateAmplitude,
  type OscillatorParams,
} from "@/physics/oscillator";
import { linearModes, PendulumModel, PendulumTrajectory, type PendulumParams } from "@/physics/pendulum";
import { agm, BESSEL_J0_ZEROS, ellipticK, exactPendulumPeriod, laguerre, laguerreZeros, wrapAngle } from "@/physics/special";
import { amplitudeSpectrum, dominantPeak, fft } from "@/physics/spectrum";

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe("linear algebra", () => {
  it("solves symmetric positive-definite systems by Cholesky factorisation", () => {
    const random = lcg(7);
    for (const n of [1, 2, 3, 6]) {
      const b = new Float64Array(n * n);
      for (let i = 0; i < n * n; i++) b[i] = random() - 0.5;
      // A = B B^T + n I is symmetric positive definite.
      const a = new Float64Array(n * n);
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          let s = i === j ? n : 0;
          for (let k = 0; k < n; k++) s += b[i * n + k] * b[j * n + k];
          a[i * n + j] = s;
        }
      }
      const x = new Float64Array(n);
      for (let i = 0; i < n; i++) x[i] = random() * 4 - 2;
      const rhs = new Float64Array(n);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) rhs[i] += a[i * n + j] * x[j];
      const l = Float64Array.from(a);
      expect(choleskyFactor(l, n)).toBe(true);
      choleskySolve(l, n, rhs);
      for (let i = 0; i < n; i++) expect(rhs[i]).toBeCloseTo(x[i], 12);
    }
  });

  it("rejects matrices that are not positive definite", () => {
    expect(choleskyFactor(new Float64Array([1, 2, 2, 1]), 2)).toBe(false);
  });

  it("diagonalises symmetric matrices (A v = lambda v, V orthonormal)", () => {
    const n = 5;
    const random = lcg(11);
    const a = new Float64Array(n * n);
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const value = random() * 2 - 1;
        a[i * n + j] = value;
        a[j * n + i] = value;
      }
    }
    const { values, vectors } = symmetricEigen(a, n);
    for (let k = 0; k < n; k++) {
      if (k > 0) expect(values[k]).toBeGreaterThanOrEqual(values[k - 1]);
      for (let i = 0; i < n; i++) {
        let av = 0;
        for (let j = 0; j < n; j++) av += a[i * n + j] * vectors[j * n + k];
        expect(av).toBeCloseTo(values[k] * vectors[i * n + k], 12);
      }
      let norm = 0;
      for (let i = 0; i < n; i++) norm += vectors[i * n + k] ** 2;
      expect(norm).toBeCloseTo(1, 12);
    }
  });

  it("solves the generalised problem K x = lambda M x", () => {
    const k = new Float64Array([6, -2, -2, 4]);
    const m = new Float64Array([2, 0.5, 0.5, 1]);
    const { values, vectors } = generalizedSymmetricEigen(k, m, 2);
    for (let c = 0; c < 2; c++) {
      for (let i = 0; i < 2; i++) {
        const kx = k[i * 2] * vectors[c] + k[i * 2 + 1] * vectors[2 + c];
        const mx = m[i * 2] * vectors[c] + m[i * 2 + 1] * vectors[2 + c];
        expect(kx).toBeCloseTo(values[c] * mx, 12);
      }
    }
  });
});

describe("special functions", () => {
  it("computes the arithmetic-geometric mean (Gauss: 1/AGM(1, sqrt 2) = 0.8346268...)", () => {
    expect(1 / agm(1, Math.SQRT2)).toBeCloseTo(0.8346268416740731, 14);
    expect(agm(3, 3)).toBe(3);
  });

  it("computes the complete elliptic integral K(k)", () => {
    expect(ellipticK(0)).toBeCloseTo(Math.PI / 2, 15);
    expect(ellipticK(Math.SQRT1_2)).toBeCloseTo(1.8540746773013719, 13);
    expect(ellipticK(0.5)).toBeCloseTo(1.6857503548125961, 13);
    expect(ellipticK(1)).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(ellipticK(1.01))).toBe(true);
  });

  it("matches the amplitude series T/T0 = 1 + theta0^2/16 + 11 theta0^4/3072 + ...", () => {
    const theta0 = 0.2;
    const exact = exactPendulumPeriod(1, STANDARD_GRAVITY, theta0, 0);
    const series = 1 + theta0 ** 2 / 16 + (11 * theta0 ** 4) / 3072 + (173 * theta0 ** 6) / 737280;
    expect(exact.period / exact.smallAngle).toBeCloseTo(series, 10);
    expect(exact.motion).toBe("libration");
    expect(exact.amplitude).toBeCloseTo(theta0, 12);
  });

  it("gives T(90 deg) / T0 = 1.18034...", () => {
    const exact = exactPendulumPeriod(1, STANDARD_GRAVITY, Math.PI / 2, 0);
    expect(exact.period / exact.smallAngle).toBeCloseTo(1.1803405990160962, 12);
  });

  it("classifies libration, separatrix and rotation from the energy", () => {
    const g = STANDARD_GRAVITY;
    expect(exactPendulumPeriod(1, g, 0, 0).motion).toBe("rest");
    expect(exactPendulumPeriod(1, g, 0, 2 * Math.sqrt(g)).motion).toBe("separatrix");
    expect(exactPendulumPeriod(1, g, 0, 2.5 * Math.sqrt(g)).motion).toBe("rotation");
    expect(exactPendulumPeriod(1, g, Math.PI, 0).period).toBe(Number.POSITIVE_INFINITY);
    // Fast rotation tends to uniform spinning: T -> (2 pi / omega)(1 + 1/(4 kappa^2) + ...).
    const fast = exactPendulumPeriod(1, g, 0, 400);
    expect(fast.period / (((2 * Math.PI) / 400) * (1 + 1 / (4 * fast.kappa ** 2)))).toBeCloseTo(1, 7);
  });

  it("reports the seconds pendulum: L = g/pi^2 swings with a 2 s period", () => {
    const length = STANDARD_GRAVITY / Math.PI ** 2;
    expect(length).toBeCloseTo(0.99362, 5);
    expect(exactPendulumPeriod(length, STANDARD_GRAVITY, 1e-6, 0).period).toBeCloseTo(2, 10);
  });

  it("finds the zeros of the Laguerre polynomials", () => {
    expect(Array.from(laguerreZeros(2))).toEqual([expect.closeTo(2 - Math.SQRT2, 12), expect.closeTo(2 + Math.SQRT2, 12)]);
    for (const n of [3, 4, 6]) {
      const zeros = laguerreZeros(n);
      let sum = 0;
      for (const x of zeros) {
        expect(Math.abs(laguerre(n, x))).toBeLessThan(1e-9);
        sum += x;
      }
      // Sum of the zeros of L_n equals n^2.
      expect(sum).toBeCloseTo(n * n, 9);
    }
  });

  it("tabulates zeros of J0 (checked against the integral representation)", () => {
    const j0 = (x: number) => {
      const steps = 4000;
      let sum = 0;
      for (let i = 0; i < steps; i++) sum += Math.cos(x * Math.sin(((i + 0.5) * Math.PI) / steps));
      return sum / steps;
    };
    for (const zero of BESSEL_J0_ZEROS) expect(Math.abs(j0(zero))).toBeLessThan(1e-12);
  });

  it("wraps angles to (-pi, pi]", () => {
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(Math.PI)).toBeCloseTo(Math.PI, 15);
    expect(wrapAngle(-Math.PI)).toBeCloseTo(Math.PI, 15);
    expect(wrapAngle(3 * Math.PI + 0.25)).toBeCloseTo(-Math.PI + 0.25, 12);
    expect(wrapAngle(-7)).toBeCloseTo(-7 + 2 * Math.PI, 12);
  });
});

describe("integrators", () => {
  const omega = 3;
  const sho: Derivative = (_t, y, dydt) => {
    dydt[0] = y[1];
    dydt[1] = -omega * omega * y[0];
  };
  const energy = (y: Float64Array) => 0.5 * y[1] * y[1] + 0.5 * omega * omega * y[0] * y[0];

  it("lists consistent metadata", () => {
    for (const id of INTEGRATOR_IDS) expect(createAdvancer(id, 2).info).toBe(INTEGRATORS[id]);
  });

  it("explicit Euler multiplies the oscillator energy by exactly (1 + h^2 w^2) per step", () => {
    const h = 0.01;
    const y = new Float64Array([1, 0]);
    const advancer = createAdvancer("euler", 2);
    const e0 = energy(y);
    const steps = 500;
    for (let i = 0; i < steps; i++) advancer.advance(sho, i * h, y, h);
    expect(energy(y) / e0).toBeCloseTo((1 + h * h * omega * omega) ** steps, 9);
  });

  it("semi-implicit Euler keeps the oscillator energy bounded (no secular drift)", () => {
    const h = 0.01;
    const y = new Float64Array([1, 0]);
    const advancer = createAdvancer("symplecticEuler", 2, { positions: 1 });
    const e0 = energy(y);
    let worst = 0;
    for (let i = 0; i < 200_000; i++) {
      advancer.advance(sho, i * h, y, h);
      worst = Math.max(worst, Math.abs(energy(y) / e0 - 1));
    }
    // Oscillation amplitude of the energy error is O(h w), independent of the run length.
    expect(worst).toBeLessThan(1.1 * h * omega);
  });

  it("classical RK4 has amplification |R(iz)|^2 = 1 - z^6/72 + z^8/576 on the oscillator", () => {
    const h = 0.05;
    const z = h * omega;
    const y = new Float64Array([1, 0]);
    const advancer = createAdvancer("rk4", 2);
    const e0 = energy(y);
    const steps = 2000;
    for (let i = 0; i < steps; i++) advancer.advance(sho, i * h, y, h);
    const perStep = 1 - z ** 6 / 72 + z ** 8 / 576;
    expect(energy(y) / e0).toBeCloseTo(perStep ** steps, 12);
    expect(perStep).toBeLessThan(1); // RK4 dissipates: it is not symplectic.
  });

  it("the adaptive Dormand-Prince pair meets its tolerance over one long call", () => {
    const y = new Float64Array([1, 0]);
    const advancer = createAdvancer("dopri5", 2, { rtol: 1e-10, atol: 1e-12 });
    const evaluations = advancer.advance(sho, 0, y, 25);
    expect(y[0]).toBeCloseTo(Math.cos(omega * 25), 7);
    expect(y[1]).toBeCloseTo(-omega * Math.sin(omega * 25), 6);
    expect(evaluations).toBeGreaterThan(100);
    expect(evaluations).toBeLessThan(40_000);
  });

  it("the adaptive pair is deterministic and insensitive to how the interval is partitioned", () => {
    const whole = new Float64Array([1, 0]);
    createAdvancer("dopri5", 2, { rtol: 1e-11, atol: 1e-13 }).advance(sho, 0, whole, 4);
    const pieces = new Float64Array([1, 0]);
    const advancer = createAdvancer("dopri5", 2, { rtol: 1e-11, atol: 1e-13 });
    for (let i = 0; i < 4000; i++) advancer.advance(sho, i * 1e-3, pieces, 1e-3);
    expect(pieces[0]).toBeCloseTo(whole[0], 8);
    expect(pieces[1]).toBeCloseTo(whole[1], 8);
  });
});

describe("oscillator theory", () => {
  const params: OscillatorParams = { mass: 2, stiffness: 24.5, damping: 0.55, driveAmplitude: 12, driveFrequency: 3.5 };

  it("derives the characteristic quantities", () => {
    const th = oscillatorTheory(params);
    expect(th.omega0).toBeCloseTo(3.5, 12);
    expect(th.criticalDamping).toBeCloseTo(14, 12);
    expect(th.zeta).toBeCloseTo(0.55 / 14, 12);
    expect(th.regime).toBe("underdamped");
    expect(th.qualityFactor).toBeCloseTo(14 / (2 * 0.55), 12);
    expect(th.bandwidth).toBeCloseTo(0.275, 12);
    expect(th.omegaD).toBeCloseTo(3.5 * Math.sqrt(1 - th.zeta ** 2), 12);
    // At omega = omega0 the displacement lags the force by exactly 90 degrees and A = F0 / (c omega0).
    expect(th.phaseLag).toBeCloseTo(Math.PI / 2, 12);
    expect(th.steadyAmplitude).toBeCloseTo(12 / (0.55 * 3.5), 12);
    expect(th.meanPower).toBeCloseTo((12 * 12) / (2 * 0.55), 9);
  });

  it("places the amplitude peak at w0 sqrt(1 - 2 zeta^2) with height (F0/k) / (2 zeta sqrt(1 - zeta^2))", () => {
    const th = oscillatorTheory(params);
    const peak = th.omegaPeak as number;
    expect(peak).toBeLessThan(th.omega0);
    expect(steadyStateAmplitude(params, peak)).toBeCloseTo(th.peakAmplitude as number, 12);
    expect(steadyStateAmplitude(params, peak * 1.001)).toBeLessThan(th.peakAmplitude as number);
    expect(steadyStateAmplitude(params, peak * 0.999)).toBeLessThan(th.peakAmplitude as number);
    expect(oscillatorTheory({ ...params, damping: 12 }).omegaPeak).toBeNull();
  });

  it("has a power resonance whose full width at half maximum is exactly c/m", () => {
    const { mass: m, damping: c, stiffness: k } = params;
    const gamma = c / (2 * m);
    const omega0 = Math.sqrt(k / m);
    const power = (w: number) => oscillatorTheory({ ...params, driveFrequency: w }).meanPower;
    const upper = gamma + Math.sqrt(gamma * gamma + omega0 * omega0);
    const lower = -gamma + Math.sqrt(gamma * gamma + omega0 * omega0);
    expect(upper - lower).toBeCloseTo(c / m, 14);
    expect(power(upper) / power(omega0)).toBeCloseTo(0.5, 12);
    expect(power(lower) / power(omega0)).toBeCloseTo(0.5, 12);
  });

  it("classifies the damping regimes", () => {
    const base = { mass: 2, stiffness: 24.5, driveAmplitude: 0, driveFrequency: 1 };
    expect(oscillatorTheory({ ...base, damping: 0 }).regime).toBe("undamped");
    expect(oscillatorTheory({ ...base, damping: 14 }).regime).toBe("critical");
    expect(oscillatorTheory({ ...base, damping: 22 }).regime).toBe("overdamped");
    expect(oscillatorTheory({ ...base, damping: 22 }).omegaD).toBeNull();
    expect(magnification(1, 0.05)).toBeCloseTo(10, 12);
  });

  it("closed-form solution satisfies the differential equation and the initial data", () => {
    const cases: OscillatorParams[] = [
      params,
      { ...params, damping: 0 },
      { ...params, damping: 14 },
      { ...params, damping: 30 },
      { ...params, damping: 0, driveFrequency: 3.5 }, // undamped resonance (secular term)
    ];
    for (const p of cases) {
      const start = exactOscillatorState(p, 1.3, -0.7, 0.4, 0);
      expect(start.x).toBeCloseTo(1.3, 12);
      expect(start.v).toBeCloseTo(-0.7, 12);
      const t = 2.37;
      const h = 1e-4;
      const a = { ...exactOscillatorState(p, 1.3, -0.7, 0.4, t - h) };
      const b = { ...exactOscillatorState(p, 1.3, -0.7, 0.4, t) };
      const c = { ...exactOscillatorState(p, 1.3, -0.7, 0.4, t + h) };
      const acceleration = (c.x - 2 * b.x + a.x) / (h * h);
      const residual =
        p.mass * acceleration + p.damping * b.v + p.stiffness * b.x - p.driveAmplitude * Math.cos(0.4 + p.driveFrequency * t);
      expect(Math.abs(residual)).toBeLessThan(2e-5);
      expect((c.x - a.x) / (2 * h)).toBeCloseTo(b.v, 6);
    }
  });
});

describe("oscillator with stops", () => {
  it("derives the coil-bind limit from the apparatus geometry", () => {
    const g = OSC_GEOMETRY;
    expect(g.anchorX + g.solidLength + g.carriageHalfLength).toBeCloseTo(g.xMin, 12);
    expect(g.padCentreX + g.padThickness / 2).toBeCloseTo(g.anchorX, 12);
    expect((g.coils + 1) * g.wireDiameter).toBeCloseTo(g.solidLength, 12);
    expect(g.wallCentreX).toBe(-7.5);
  });

  it("never lets the carriage leave [xMin, xMax]", () => {
    const system = new OscillatorSystem({ mass: 0.5, stiffness: 80, damping: 0.2, driveAmplitude: 25, driveFrequency: 12.6 });
    system.reset(6.5, 0);
    const advancer = createAdvancer("rk4", OSC.SIZE);
    for (let i = 0; i < 60_000; i++) {
      system.step(advancer, 1e-3);
      expect(system.x).toBeGreaterThanOrEqual(OSC_GEOMETRY.xMin);
      expect(system.x).toBeLessThanOrEqual(OSC_GEOMETRY.xMax);
    }
    expect(system.impactCount).toBeGreaterThan(0);
    expect(Math.abs(system.energy().residual) / system.energyScale()).toBeLessThan(1e-8);
  });

  it("rests against a stop while the force presses on it and releases when it reverses", () => {
    // Soft spring, strong slow drive: the static force F0 cos(phi) - k x pushes into the right stop for a while.
    const system = new OscillatorSystem({ mass: 1, stiffness: 4, damping: 2, driveAmplitude: 40, driveFrequency: 0.5 });
    system.reset(6.4, 0);
    const advancer = createAdvancer("rk4", OSC.SIZE);
    let rested = false;
    let released = false;
    for (let i = 0; i < 20_000; i++) {
      system.step(advancer, 1e-3);
      if (system.contact === 1) {
        rested = true;
        expect(system.x).toBe(OSC_GEOMETRY.xMax);
        expect(system.v).toBe(0);
        const forces = system.forces();
        expect(forces.contact).toBeLessThan(0);
        expect(forces.net).toBeCloseTo(0, 12);
      } else if (rested) {
        released = true;
      }
    }
    expect(rested).toBe(true);
    expect(released).toBe(true);
    expect(Math.abs(system.energy().residual) / system.energyScale()).toBeLessThan(1e-7);
  });

  it("keeps the drive phase continuous when the frequency is changed mid-run", () => {
    const params: OscillatorParams = { mass: 2, stiffness: 24, damping: 0.5, driveAmplitude: 5, driveFrequency: 2 };
    const system = new OscillatorSystem(params);
    system.reset(0, 0);
    const advancer = createAdvancer("rk4", OSC.SIZE);
    for (let i = 0; i < 1234; i++) system.step(advancer, 1e-3);
    const before = system.forces().drive;
    system.setParams({ ...params, driveFrequency: 9 });
    expect(system.forces().drive).toBe(before);
    expect(system.energy().residual).toBeCloseTo(0, 12);
  });

  it("clamps impossible initial positions", () => {
    const system = new OscillatorSystem({ mass: 2, stiffness: 24, damping: 0, driveAmplitude: 0, driveFrequency: 1 });
    system.reset(-99, -5);
    expect(system.x).toBe(OSC_GEOMETRY.xMin);
    expect(system.v).toBe(0);
  });
});

describe("pendulum chain", () => {
  const params: PendulumParams = { count: 2, masses: [2.0, 1.8], lengths: [1.2, 1.0], gravity: STANDARD_GRAVITY, jointDamping: 0 };

  it("reduces to the simple pendulum for N = 1", () => {
    const model = new PendulumModel({ count: 1, masses: [3], lengths: [0.7], gravity: 9.81, jointDamping: 0 });
    const alpha = new Float64Array(1);
    model.accelerations(new Float64Array([0.9, 1.4, 0]), alpha);
    expect(alpha[0]).toBeCloseTo((-9.81 / 0.7) * Math.sin(0.9), 13);
  });

  it("agrees with the textbook closed-form double-pendulum accelerations", () => {
    const model = new PendulumModel(params);
    const [m1, m2] = params.masses;
    const [l1, l2] = params.lengths;
    const g = params.gravity;
    const random = lcg(99);
    const alpha = new Float64Array(2);
    for (let trial = 0; trial < 50; trial++) {
      const t1 = (random() - 0.5) * 6;
      const t2 = (random() - 0.5) * 6;
      const w1 = (random() - 0.5) * 8;
      const w2 = (random() - 0.5) * 8;
      model.accelerations(new Float64Array([t1, t2, w1, w2, 0]), alpha);
      const den = 2 * m1 + m2 - m2 * Math.cos(2 * t1 - 2 * t2);
      const a1 =
        (-g * (2 * m1 + m2) * Math.sin(t1) -
          m2 * g * Math.sin(t1 - 2 * t2) -
          2 * Math.sin(t1 - t2) * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * Math.cos(t1 - t2))) /
        (l1 * den);
      const a2 =
        (2 *
          Math.sin(t1 - t2) *
          (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(t1) + w2 * w2 * l2 * m2 * Math.cos(t1 - t2))) /
        (l2 * den);
      expect(alpha[0]).toBeCloseTo(a1, 10);
      expect(alpha[1]).toBeCloseTo(a2, 10);
    }
  });

  it("computes kinetic energy consistently from the mass matrix and from bob velocities", () => {
    const six: PendulumParams = {
      count: 6,
      masses: [2.0, 1.8, 1.5, 1.2, 1.0, 0.8],
      lengths: [1.2, 1.0, 0.9, 0.8, 0.7, 0.6],
      gravity: STANDARD_GRAVITY,
      jointDamping: 0,
    };
    const model = new PendulumModel(six);
    const y = new Float64Array(model.size);
    const random = lcg(5);
    for (let i = 0; i < 6; i++) {
      y[i] = (random() - 0.5) * 6;
      y[6 + i] = (random() - 0.5) * 5;
    }
    const px = new Float64Array(6);
    const py = new Float64Array(6);
    const vx = new Float64Array(6);
    const vy = new Float64Array(6);
    model.kinematics(y, px, py, vx, vy);
    let kinetic = 0;
    let potential = 0;
    for (let i = 0; i < 6; i++) {
      kinetic += 0.5 * six.masses[i] * (vx[i] ** 2 + vy[i] ** 2);
      potential += six.masses[i] * six.gravity * py[i];
    }
    expect(model.kineticEnergy(y)).toBeCloseTo(kinetic, 10);
    // potentialEnergy() is measured from the hanging equilibrium.
    let hanging = 0;
    let depth = 0;
    for (let i = 0; i < 6; i++) {
      depth -= six.lengths[i];
      hanging += six.masses[i] * six.gravity * depth;
    }
    expect(model.potentialEnergy(y)).toBeCloseTo(potential - hanging, 10);
    expect(model.totalLength).toBeCloseTo(5.2, 12);
  });

  it("dissipates energy monotonically through viscous joints and books it as heat", () => {
    const model = new PendulumModel({ ...params, jointDamping: 0.4 });
    const trajectory = new PendulumTrajectory(model);
    trajectory.reset([2.15, 1.65]);
    const advancer = createAdvancer("rk4", model.size);
    let previous = trajectory.energy().mechanical;
    for (let i = 0; i < 20_000; i++) {
      advancer.advance(model.derivative, i * 1e-3, trajectory.y, 1e-3);
      if (i % 50 === 0) {
        const energy = trajectory.energy();
        expect(energy.mechanical).toBeLessThanOrEqual(previous + 1e-9);
        expect(energy.heat).toBeGreaterThanOrEqual(0);
        previous = energy.mechanical;
      }
    }
    const final = trajectory.energy();
    expect(final.heat).toBeGreaterThan(1);
    expect(Math.abs(final.residual) / trajectory.energyScale()).toBeLessThan(1e-9);
  });

  it("keeps the configuration when a parameter changes and re-bases the ledger", () => {
    const trajectory = new PendulumTrajectory(new PendulumModel(params));
    trajectory.reset([1, 0.5], [0.3, -0.2]);
    trajectory.setModel(new PendulumModel({ ...params, gravity: 1.62 }));
    expect(Array.from(trajectory.y.slice(0, 4))).toEqual([1, 0.5, 0.3, -0.2]);
    expect(trajectory.energy().residual).toBe(0);
    trajectory.setModel(new PendulumModel({ ...params, count: 3, masses: [2, 1.8, 1.5], lengths: [1.2, 1, 0.9] }));
    expect(trajectory.y.length).toBe(7);
    expect(Array.from(trajectory.y)).toEqual([1, 0.5, 0, 0.3, -0.2, 0, 0]);
  });

  it("orders the linear mode frequencies and returns in-phase / out-of-phase shapes for N = 2", () => {
    const modes = linearModes(params);
    expect(modes.omega[0]).toBeLessThan(modes.omega[1]);
    // Lowest mode: both links swing the same way; highest: opposite ways.
    expect(Math.sign(modes.shapes[0]) * Math.sign(modes.shapes[2])).toBe(1);
    expect(Math.sign(modes.shapes[1]) * Math.sign(modes.shapes[3])).toBe(-1);
  });

  it("is free of gravity torque in zero g and then conserves angular momentum about the pivot", () => {
    const model = new PendulumModel({ ...params, gravity: 0 });
    const y = new Float64Array([1.8, 1.2, 1.5, -2.0, 0]);
    const angularMomentum = () => model.canonicalMomentum(y, 0) + model.canonicalMomentum(y, 1);
    const l0 = angularMomentum();
    const advancer = createAdvancer("rk4", model.size);
    for (let i = 0; i < 20_000; i++) advancer.advance(model.derivative, i * 1e-3, y, 1e-3);
    expect(angularMomentum()).toBeCloseTo(l0, 8);
  });
});

describe("Lyapunov estimator", () => {
  it("recovers the expansion rate of a linear saddle x' = a x, y' = -a y", () => {
    const a = 0.7;
    const saddle: Derivative = (_t, y, dydt) => {
      dydt[0] = a * y[0];
      dydt[1] = -a * y[1];
    };
    const reference = new Float64Array([0, 0]);
    const shadow = new Float64Array(2);
    const estimator = new BenettinEstimator(2, 1e-8);
    estimator.seed(reference, shadow);
    const advancer = createAdvancer("rk4", 2);
    const h = 1e-3;
    for (let i = 1; i <= 50_000; i++) {
      advancer.advance(saddle, 0, reference, h);
      advancer.advance(saddle, 0, shadow, h);
      if (i % 10 === 0) estimator.renormalise(reference, shadow, 10 * h);
    }
    // The seed has only 1/sqrt(2) of its length along the unstable direction, which
    // leaves the well-known O(1/t) finite-time bias ln(1/sqrt 2) / t in the estimate.
    expect(estimator.exponent).toBeCloseTo(a - Math.log(Math.SQRT2) / 50, 6);
    expect(estimator.time).toBeCloseTo(50, 9);
  });

  it("estimates the prediction horizon ln(a/delta0)/lambda", () => {
    expect(predictionHorizon(1, 1e-3, 1)).toBeCloseTo(Math.log(1000), 12);
    expect(predictionHorizon(0, 1e-3, 1)).toBe(Number.POSITIVE_INFINITY);
    // A thousand-fold better initial measurement buys only ln(1000)/lambda more time.
    expect(predictionHorizon(2, 1e-6, 1) - predictionHorizon(2, 1e-3, 1)).toBeCloseTo(Math.log(1000) / 2, 12);
  });
});

describe("virtual instruments", () => {
  it("measures period, amplitude and logarithmic decrement of a decaying oscillation", () => {
    const gamma = 0.12;
    const wd = 4.3;
    const meter = new OscillationMeter();
    const h = 0.004;
    for (let i = 0; i < 6000; i++) {
      const t = i * h;
      const decay = Math.exp(-gamma * t);
      meter.push(t, decay * Math.cos(wd * t), decay * (-gamma * Math.cos(wd * t) - wd * Math.sin(wd * t)));
    }
    const period = (2 * Math.PI) / wd;
    expect(meter.period).toBeCloseTo(period, 5);
    expect(meter.logDecrement).toBeCloseTo(gamma * period, 5);
    const zeta = gamma / Math.hypot(gamma, wd);
    expect(dampingRatioFromDecrement(gamma * period)).toBeCloseTo(zeta, 12);
    expect(meter.cycles).toBeGreaterThan(10);
  });

  it("measures steady amplitude and centre", () => {
    const meter = new OscillationMeter();
    for (let i = 0; i < 5000; i++) {
      const t = i * 0.005;
      meter.push(t, 0.25 + 1.7 * Math.sin(2 * t), 3.4 * Math.cos(2 * t));
    }
    expect(meter.amplitude).toBeCloseTo(1.7, 5);
    expect(meter.centre).toBeCloseTo(0.25, 5);
    expect(meter.amplitudeDrift as number).toBeLessThan(1e-6);
  });

  it("quantifies overshoot and settling of a step response", () => {
    const s = CRITICAL_SETTLING_FACTOR;
    expect((1 + s) * Math.exp(-s)).toBeCloseTo(0.02, 14);
    expect(s).toBeCloseTo(5.83392, 5);
    const meter = new StepResponseMeter(0.02);
    meter.reset(0, 1);
    const w0 = 3;
    for (let i = 1; i <= 8000; i++) {
      const t = i * 1e-3;
      meter.push(t, Math.exp(-w0 * t) * (1 + w0 * t));
    }
    expect(meter.overshoot).toBe(0);
    expect(meter.settlingTime as number).toBeCloseTo(s / w0, 2);
  });
});

describe("spectrum analyser", () => {
  it("satisfies Parseval's theorem", () => {
    const n = 256;
    const random = lcg(3);
    const re = new Float64Array(n);
    const im = new Float64Array(n);
    let timeEnergy = 0;
    for (let i = 0; i < n; i++) {
      re[i] = random() - 0.5;
      timeEnergy += re[i] ** 2;
    }
    fft(re, im);
    let frequencyEnergy = 0;
    for (let i = 0; i < n; i++) frequencyEnergy += re[i] ** 2 + im[i] ** 2;
    expect(frequencyEnergy / n).toBeCloseTo(timeEnergy, 10);
  });

  it("resolves two tones", () => {
    const fs = 100;
    const n = 2048;
    const samples = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      samples[i] = Math.sin((2 * Math.PI * 0.8 * i) / fs) + 0.2 * Math.sin((2 * Math.PI * 3.1 * i) / fs);
    }
    const spectrum = amplitudeSpectrum(samples, fs, n);
    expect(dominantPeak(spectrum)?.frequency).toBeCloseTo(0.8, 3);
    expect(dominantPeak(spectrum, 2)?.frequency).toBeCloseTo(3.1, 3);
    expect(() => fft(new Float64Array(3), new Float64Array(3))).toThrow();
  });
});
