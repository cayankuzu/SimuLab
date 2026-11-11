import type { plotsFrequency as source } from "../tr/plotsFrequency";

/** Frequency plots: frequency response (oscillator) and amplitude spectrum. */
export const plotsFrequency: typeof source = {
  response: {
    off: "The drive is off. Raise the driving-force amplitude to see the frequency response.",
    theory: "theory",
    live: "measured (live)",
    sweep: "sweep",
    sweepImpacts: "sweep, with impacts on a stop",
    stopLimit: "stop limit",
    drive: "drive",
    runSweep: "Frequency sweep",
    cancelSweep: "Cancel",
    progress: (done: number, total: number) => `${done}/${total}`,
    sweepHint:
      "The solver is run separately at every frequency until the steady state, and amplitude and phase are measured with the virtual instruments.",
    sweepDisabled:
      "A sweep needs the drive on and ζ ≥ 0.01; with very small damping the steady state takes impractically long to reach.",
    footer: {
      amplitude: "Amplitude",
      phaseLag: "Phase lag",
      steady: "Steady state",
      transient: "Transient: the measured values have not yet settled onto the theoretical curve",
      wait: (seconds: string) => `about ${seconds} s more`,
      impactNote:
        "Points with impacts deviate from linear theory: the stops limit the amplitude and make the response non-linear.",
    },
  },
  spectrum: {
    signalOscillator: "signal x(t)",
    signalPendulum: (index: number) => `signal ω${index}(t)`,
    peak: "dominant peak",
    natural: "f₀",
    damped: "f_d",
    drive: "f_s",
    mode: (index: number) => `f${index}`,
    amplitudeAxis: (unit: string) => `Amplitude [${unit}]`,
    need: (count: number) => `The spectrum needs at least ${count} samples`,
    footer: (resolution: string, seconds: string) =>
      `Resolution Δf = ${resolution} Hz; analysed record ${seconds} s. Sharp lines indicate regular (periodic or quasi-periodic) motion, a broad continuous spectrum indicates chaotic motion.`,
  },
};
