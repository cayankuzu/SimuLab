import type { measurements as source } from "../tr/measurements";

/** Measurements panel: theoretical values, what the virtual instruments measure, and the deviation between them. */
export const measurements: typeof source = {
  columns: {
    quantity: "Quantity",
    value: "Value",
    unit: "Unit",
    theory: "Theory",
    measured: "Measured",
    deviation: "Deviation",
  },
  notYet: "not yet",

  oscillator: {
    characteristic: {
      title: "Characteristic quantities (theory)",
      regimes: {
        undamped: "undamped",
        underdamped: "underdamped",
        critical: "critically damped",
        overdamped: "overdamped",
      },
      rows: {
        omega0: "Natural angular frequency",
        frequency0: "Natural frequency",
        period0: "Natural period",
        criticalDamping: "Critical damping coefficient",
        zeta: "Damping ratio",
        gamma: "Exponential decay rate, c/(2m)",
        omegaD: "Damped angular frequency",
        periodD: "Damped period",
        logDecrement: "Logarithmic decrement",
        qualityFactor: "Quality factor",
        decayTime: "Decay time constant",
      },
      missing: "A dash (—) marks a quantity that is undefined or infinite at this damping (c = 0 or ζ ≥ 1).",
    },

    comparison: {
      title: "Measurement and theory",
      rows: {
        periodNatural: "Natural period",
        periodDamped: "Damped period",
        periodDriven: "Drive period",
        logDecrement: "Logarithmic decrement",
        zeta: "Damping ratio, from Λ",
        amplitude: "Amplitude",
        phaseLag: "Phase lag",
        overshoot: "Overshoot",
        settling: (percent: string) => `Settling time, ${percent} %`,
      },
      steady: {
        measuring: "measuring",
        reached: "steady state",
        transient: "transient",
      },
      empty:
        "There is no measurement to compare with theory in this situation: the drive is off, the motion is not oscillatory and the carriage was not released from rest.",
      impactNote:
        "The carriage hit a stop during this run. The linear theory does not include the stops, so the deviations below are not a valid comparison.",
      periodNote: (count: number) =>
        `The period is the time between successive zero crossings of x in the same direction. The mean of the latest intervals is given, with the sample standard deviation after the ± sign; ${count} intervals measured so far.`,
      decrementNote: "Λ is measured from successive positive peaks; the damping ratio follows from it:",
      steadyNote: (limit: string, drift: string | null, wait: string | null) =>
        `Steady state requires two conditions: the relative difference between the peak-to-peak amplitudes of two successive oscillations must be < ${limit} %, and the time the transient needs to decay to ${limit} %, ln(100/${limit})/γ, must have passed since the last change (restart, parameter change, impact). ${
          drift === null ? "The difference cannot be measured yet." : `Current difference: ${drift} %.`
        }${wait === null ? "" : wait === "0" ? " The waiting time has passed." : ` Remaining waiting time: ${wait} s.`}`,
      responseNote:
        "The measured amplitude is half the difference between the latest peak and the latest trough; the measured phase lag is the drive phase at the instant of the latest peak of x.",
      undampedNote:
        "With c = 0 the transient never decays: even if the criterion is met momentarily, no lasting steady state forms.",
      stepNote: (x0: string, percent: string) =>
        `Overshoot and settling time are measured since the last release (x₀ = ${x0} m). The overshoot is a percentage of |x₀|; the settling time is the instant after which |x| stays within ${percent} % of |x₀|. If a parameter was changed after the release, the comparison with theory is not valid.`,
      stepTheoryNote:
        "The theoretical overshoot is zero for ζ ≥ 1. A theoretical settling time is given only for critical damping (ζ = 1):",
    },

    driven: {
      title: "Driven response (theory)",
      rows: {
        staticDeflection: "Static deflection, F₀/k",
        amplitude: "Steady-state amplitude",
        phaseLag: "Phase lag",
        omegaPeak: "Frequency of the amplitude peak",
        peakAmplitude: "Peak amplitude",
        bandwidth: "Half-power bandwidth, c/m",
        meanPower: "Mean absorbed power, ½cω²A²",
      },
      note: "Amplitude, phase lag and power are for the current drive frequency ω. The amplitude peak exists only for ζ < 1/√2.",
      resonanceNote: "With c = 0 there is no steady state at resonance (ω = ω₀); the amplitude grows linearly in time.",
    },

    stops: {
      title: "Stops",
      resting: "resting on a stop",
      rows: {
        impacts: "Number of impacts with a stop",
        lastSpeed: "Speed before the latest impact",
        heat: "Impact heat",
        restitution: "Coefficient of restitution",
      },
      note: (xMin: string, xMax: string) =>
        `The stops are at x = ${xMin} m and x = ${xMax} m. e is a model parameter, not a measured material constant; at every impact the following rule is applied and the kinetic energy lost is booked as impact heat:`,
    },

    numerics: {
      title: "Numerical accuracy",
      rows: {
        residual: "Energy-ledger residual",
        relative: "Relative residual",
        exactError: "Largest deviation from the analytical solution",
        solver: "Solver",
        step: "Step",
        order: "Order of the method",
      },
      ledgerNote:
        "For an exact solution ΔE is zero; the value shown is numerical error. The denominator of the relative residual is the largest of |E₀|, the mechanical energy and Q + |W|.",
      exactNote:
        "The analytical reference solution is tracked since the last restart; it is rebuilt from the current state at every impact and parameter change.",
      adaptiveNote: "Adaptive method: every step h is divided into error-controlled internal steps.",
    },
  },

  pendulum: {
    period: {
      title: "Period of the single pendulum",
      motions: {
        rest: "at rest",
        libration: "libration",
        separatrix: "separatrix",
        rotation: "rotation",
      },
      rows: {
        smallAngle: "Small-angle period",
        exact: "Exact period",
        ratio: "Period ratio",
        amplitude: "Amplitude",
      },
      theoryNote:
        "The exact period and the amplitude are computed from the instantaneous energy of the undamped pendulum (K: complete elliptic integral of the first kind). The period is the time of one full swing in libration and of one full turn in rotation.",
      isochronism:
        "Isochronism, the independence of the period from the amplitude, holds only for small angles: the ratio T/T₀ moves away from 1 as the amplitude grows.",
      measureNote: (count: number) =>
        `The measured period is the time between successive same-direction zero crossings of sin θ at the bottom. The mean of the latest intervals is given, with the sample standard deviation after the ± sign; ${count} intervals measured so far. The measured amplitude is half the difference between the last two turning points of θ.`,
      dampingNote:
        "With joint damping the energy decreases: the theoretical values belong to the instantaneous energy, the measured ones to past swings; the difference is due to the damping.",
      zeroGravity:
        "With g = 0 there is no restoring torque; the small-angle period and the elliptic-integral period are undefined.",
    },

    modes: {
      title: "Small-oscillation normal modes",
      frequenciesCaption: "Frequencies and periods of the normal modes",
      shapesCaption: "Mode shapes: angle amplitudes scaled so that the largest is 1",
      columns: {
        mode: "Mode",
        omega: "Angular frequency (rad/s)",
        frequency: "Frequency (Hz)",
        period: "Period (s)",
        link: (index: number) => `Angle amplitude of link ${index}`,
      },
      note: "These are the eigenfrequencies of the undamped chain linearised about the hanging equilibrium; they hold for small angles only.",
      presets: (first: string, second: string) =>
        `These are the two frequencies excited by the ready-made experiments “${first}” and “${second}”.`,
      measured: "Measured period of θ₁",
      measuredNote: (count: number) =>
        `Measured over ${count} intervals from successive same-direction zero crossings of sin θ₁ at the bottom. It can be compared with T_k only when a single mode is excited; a large ± value shows that the motion is not single-frequency.`,
      zeroGravity: "With g = 0 there is no restoring force; small-oscillation modes are not defined.",
    },

    energy: {
      title: "Energy",
      rows: {
        kinetic: "Kinetic energy",
        potential: "Potential energy",
        heat: "Joint damping heat",
        mechanical: "Mechanical energy",
        maxPotential: "Largest potential energy",
        flip: (link: number) => `Threshold for going over the top (link ${link})`,
        residual: "Energy-ledger residual",
        relative: "Relative residual",
      },
      verdict: {
        impossible: "going over the top impossible",
        possible: "going over the top possible",
      },
      thresholdNote:
        "The potential energy is measured from the hanging equilibrium; its largest value belongs to the chain standing straight up. The threshold for going over the top is the smallest mechanical energy with which a link can pass through the upright position: below it no link can go over the top; being above it is a necessary but not a sufficient condition.",
      ledgerNote:
        "For an exact solution ΔE is zero; the value shown is numerical error. The denominator of the relative residual is the larger of |E₀| and the mechanical energy.",
      zeroGravity: "With g = 0 there is no potential energy and no energy threshold for going over the top.",
    },

    chaos: {
      title: "Chaos indicators",
      rows: {
        lyapunov: "Largest Lyapunov exponent (estimate)",
        averaging: "Averaging time of the estimate",
        lyapunovTime: "Lyapunov time (estimate)",
        twinOffset: "Initial offset of the twin",
        separation: "Angular separation from the twin",
        divergence: (threshold: string) => `Instant at which the separation reached ${threshold} rad (observed)`,
        horizon: "Prediction horizon (estimate)",
      },
      note: (threshold: string) =>
        `λ is a finite-time estimate computed with Benettin's method: it converges as the averaging time grows and decays towards zero for regular motion. The prediction horizon is a rough estimate of the time an initial difference δ₀ needs to grow to a = ${threshold} rad:`,
      twinOff: "The twin trajectory is off; the separation is not being measured.",
    },

    rods: {
      title: "Rod forces",
      caption: "Axial force in each rod",
      columns: {
        rod: "Rod",
        force: "Axial force (N)",
        state: "State",
      },
      tension: "tension",
      compression: "compression",
      note: "A positive value is tension, a negative one compression. At an instant when the value is negative a string in place of the rod would go slack; the model assumes rigid rods.",
    },
  },
};
