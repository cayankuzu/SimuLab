import type { parameters as source } from "../tr/parameters";

/** Parameters panel. */
export const parameters: typeof source = {
  tabs: { parameters: "Parameters", measurements: "Measurements", tasks: "Tasks", label: "Inspector sections" },
  scenarios: "Ready-made experiments",
  scenarioHint: "Each one sets the parameters and the initial conditions together.",
  physical: "Physical parameters",
  initial: "Initial conditions",
  initialHint: "Entering a value restarts the experiment from these conditions.",
  numerical: "Numerical-method demonstration",

  oscillator: {
    equation: "Equation of motion",
    mass: "Mass",
    stiffness: "Spring constant",
    damping: "Damping coefficient",
    driveAmplitude: "Driving-force amplitude",
    driveFrequency: "Driving angular frequency",
    x0: "Initial position",
    v0: "Initial velocity",
    marks: { critical: "critical", natural: "ω₀", peak: "peak" },
    driveOff: "The drive is off; raise the amplitude to enable the frequency control.",
    presets: {
      undamped: { name: "Undamped", note: "c = 0. The phase portrait is a closed ellipse." },
      underdamped: { name: "Light damping", note: "ζ ≈ 0.05. The amplitude decays under an exponential envelope." },
      critical: { name: "Critical damping", note: "ζ = 1. Fastest return without overshoot." },
      overdamped: { name: "Overdamped", note: "ζ ≈ 1.7. No oscillation, slow return." },
      resonance: { name: "Resonance", note: "ω = ω₀, Q ≈ 13. Steady amplitude F₀/(cω₀) ≈ 4.2 m." },
      beats: { name: "Beats", note: "Undamped, driven 10 % below ω₀; the envelope beats every 18 s." },
      eulerDrift: {
        name: "Euler drift",
        note: "The same undamped system integrated with explicit Euler at 60 Hz: the energy grows artificially.",
      },
    },
  },

  pendulum: {
    links: "Number of links",
    gravity: "Gravitational acceleration",
    jointDamping: "Joint damping coefficient",
    chain: "Masses and rod lengths",
    massOf: (index: number) => `Mass ${index}`,
    lengthOf: (index: number) => `Rod length ${index}`,
    angleOf: (index: number) => `Angle ${index}`,
    omegaOf: (index: number) => `Angular velocity ${index}`,
    angleUnitNote: "Angles are measured from the downward vertical.",
    bodies: {
      earth: "Earth",
      mars: "Mars",
      moon: "Moon",
      jupiter: "Jupiter",
      microgravity: "Free fall",
    },
    twin: {
      title: "Twin trajectory",
      enable: "Show the twin pendulum",
      description:
        "A second pendulum, identical except that its first angle differs by δ₀, is integrated at the same time. How fast the two separate shows the sensitivity to initial conditions.",
      offset: "Initial offset δ₀",
    },
    presets: {
      single: { name: "Small angle", note: "N = 1, θ₀ = 10°. The period is very close to 2π√(L/g)." },
      singleLarge: { name: "Large angle", note: "N = 1, θ₀ = 150°. Isochronism fails; the period is given by an elliptic integral." },
      double: { name: "Double pendulum", note: "θ = (2.15, 1.65) rad. Chaotic regime." },
      doubleRegular: { name: "Regular double", note: "Small angles; the motion is a sum of two normal modes." },
      mode1: { name: "Normal mode 1", note: "Both links swing the same way at a single frequency." },
      mode2: { name: "Normal mode 2", note: "The links swing in opposite directions at the higher frequency." },
      triple: { name: "Triple", note: "N = 3." },
      quad: { name: "Quadruple", note: "N = 4." },
      six: { name: "Six-link chain", note: "N = 6. The small-oscillation spectrum approaches that of a hanging rope." },
      moon: { name: "On the Moon", note: "g = 1.62 m/s². Same angles, √(9.81/1.62) ≈ 2.5 times slower." },
      mars: { name: "On Mars", note: "g = 3.73 m/s²." },
      microgravity: { name: "Free fall", note: "g = 0. No restoring torque; angular momentum is conserved." },
    },
  },
};
