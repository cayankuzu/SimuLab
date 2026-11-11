import type { plots as source } from "../tr/plots";

/** Plot panel (analysis dock). */
export const plots: typeof source = {
  title: "Plots",
  tabs: {
    label: "Plot groups",
    signals: "Signals",
    energy: "Energy",
    frequency: "Frequency",
    chaos: "Chaos",
  },
  toggle: "Plot panel",
  resize: "Resize the plot panel",
  window: "Time window",
  seconds: (value: number) => `${value} s`,
  waiting: "Waiting for data",
  axes: {
    time: "t [s]",
    position: "x [m]",
    velocity: "v [m/s]",
    angle: "θ [rad]",
    angularVelocity: "ω [rad/s]",
    energy: "E [J]",
    frequency: "f [Hz]",
    driveFrequency: "ω [rad/s]",
    amplitude: "A [m]",
    phaseLag: "δ [rad]",
  },

  timeSeries: {
    title: "Time series",
    description: "Position and velocity (or the link angles) versus time; the last seconds are shown in a sliding window.",
    position: "x",
    velocity: "v",
    exact: "x analytical",
    showExact: "Show the analytical solution",
    link: (index: number) => `θ${index}`,
  },

  phase: {
    title: "Phase portrait",
    description: "Trajectory of the state in the phase plane: position (angle) horizontally, velocity (angular velocity) vertically.",
    trajectory: "trajectory",
    twin: "twin",
    link: "Link",
  },

  energy: {
    title: "Energy ledger",
    description: "Kinetic and potential energy, energy turned into heat and the work done by the drive; the dashed line is the balance total.",
    kinetic: "kinetic",
    potential: "potential",
    heat: "damping heat",
    impact: "impact heat",
    work: "drive work",
    total: "balance total",
    residual: "residual",
  },

  response: {
    title: "Frequency response",
    description: "Steady-state amplitude and phase lag versus driving frequency: theoretical curve and measured points.",
  },

  spectrum: {
    title: "Amplitude spectrum",
    description: "Hann-windowed discrete Fourier transform of the recorded signal.",
  },

  divergence: {
    title: "Twin separation and Lyapunov exponent",
    description: "Logarithmic plot of the angular separation from the twin pendulum and the finite-time estimate of the largest Lyapunov exponent.",
  },

  poincare: {
    title: "Poincaré section",
    description: "The point (θ₁, p₁) at every upward crossing of the plane θ₂ = 0.",
  },
};
