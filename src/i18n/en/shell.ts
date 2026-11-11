import type { shell as source } from "../tr/shell";

/** Application shell: top bar, 3-D viewport, status bar and general dialogs. */
export const shell: typeof source = {
  meta: { languageName: "English" },

  common: {
    close: "Close",
    theory: "Theory",
    invalidNumber: (min: string, max: string) => `This is not a number. Enter a value from ${min} to ${max}.`,
    limitedNumber: (min: string, max: string, used: string) =>
      `The admissible range is ${min} to ${max}; the nearest limit, ${used}, is used.`,
  },

  app: {
    name: "SimuLab",
    tagline: "Oscillation and Chaos Laboratory",
    noWebgl: "Your browser does not support WebGL; the 3-D scene cannot be shown.",
  },

  modules: {
    switcher: "Experiment",
    oscillator: { name: "Oscillator", full: "Damped, driven spring–mass oscillator" },
    pendulum: { name: "Pendulum", full: "Planar N-link pendulum" },
  },

  transport: {
    run: "Run",
    pause: "Pause",
    step: "Advance one frame",
    reset: "Return to initial conditions",
    time: "Simulated time",
    speed: "Time scale",
  },

  solver: {
    button: "Numerical solver",
    title: "Numerical solver",
    intro:
      "The equations of motion are integrated with a fixed step; identical initial conditions give the identical trajectory regardless of the display refresh rate.",
    restartNote:
      "Changing the method or the step rate returns both experiments to their initial conditions and clears the data recorded so far, so that every record is produced by a single solver.",
    method: "Method",
    rate: "Step rate",
    stepSize: "Step",
    order: "Order",
    evaluations: "Derivatives per step",
    restoreDefault: "Restore default",
    nonDefault: "Non-default solver",
    methods: {
      euler: {
        name: "Explicit Euler",
        note: "First order. Multiplies the energy of a frictionless oscillator by (1 + h²ω₀²) every step; included to demonstrate the error.",
      },
      symplecticEuler: {
        name: "Semi-implicit Euler",
        note: "First order, symplectic. The energy error stays bounded but the phase error accumulates.",
      },
      midpoint: {
        name: "Midpoint (RK2)",
        note: "Second-order explicit Runge–Kutta.",
      },
      rk4: {
        name: "Classical Runge–Kutta (RK4)",
        note: "Fourth order. The default; at 1000 Hz the relative energy drift of the double pendulum over 60 s is of order 10⁻⁹.",
      },
      dopri5: {
        name: "Dormand–Prince 5(4)",
        note: "Fifth order with an embedded error estimate and adaptive step size (relative tolerance 10⁻¹⁰).",
      },
    },
    diverged: {
      title: "The solution diverged",
      body: "With the chosen method and step the state variables did not stay finite; the run was halted. Choose a smaller step or a higher-order method.",
    },
  },

  topbar: {
    theory: "Theory and references",
    exportMenu: "Data and sharing",
    sound: "Sound (sonification)",
    shortcuts: "Keyboard shortcuts",
    language: "Interface language",
    panel: "Open the parameter panel",
  },

  exchange: {
    data: "Telemetry",
    experiment: "Experiment definition",
    csvInternational: {
      label: "Download CSV",
      hint: "Comma-separated, decimal point: Python, MATLAB, R",
    },
    csvSpreadsheet: {
      label: "Download CSV (spreadsheet)",
      hint: "Semicolon-separated, decimal comma: European-locale spreadsheets",
    },
    json: {
      label: "Download experiment file (JSON)",
      hint: "Parameters, initial conditions and solver settings",
    },
    open: {
      label: "Open experiment file",
      hint: "Rebuilds a saved experiment exactly",
    },
    link: {
      label: "Copy link",
      hint: "An address that rebuilds this experiment; nothing is sent to a server",
    },
    copied: "Link copied to the clipboard",
    copyFailed: "Clipboard unavailable; copy the address from the address bar",
    imported: "Experiment file loaded",
    importFailed: "The file is not a valid SimuLab experiment file",
    samples: (count: number) => `${count.toLocaleString("en-US")} samples recorded`,
  },

  viewport: {
    ariaLabel:
      "Three-dimensional experiment scene. Bodies can be grabbed and dragged with the pointer; the same can be done from the keyboard through the initial-condition fields of the Parameters panel. While the scene has the focus, the arrow keys orbit the camera and, with Shift, pan it.",
    hint: "Grab a body and drag it; release while moving to throw it",
    views: { title: "View", isoCode: "3D", iso: "Isometric", front: "Front", top: "Top", side: "Side" },
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    overlaysLabel: "Scene layers",
    overlays: {
      velocity: "Velocity",
      netForce: "Net force",
      freeBody: "Free body",
      trail: "Trail",
      strobe: "Stroboscope",
      grid: "Grid",
      axes: "Axes",
      labels: "Labels",
    },
    overlayHints: {
      velocity: "Velocity vector",
      netForce: "Net force on the body",
      freeBody: "Free-body diagram: every force separately",
      trail: "Path of the end mass over the last seconds",
      strobe: "Flash images at equal time intervals",
      grid: "1 m grid on the bench",
      axes: "Coordinate axes",
      labels: "Numerical labels inside the scene",
    },
    scale: {
      title: "Vector scale",
      force: (newtons: string) => `1 m ≙ ${newtons} N`,
      velocity: (speed: string) => `1 m ≙ ${speed} m/s`,
      time: (scale: string) => `Time scale ${scale}×`,
    },
    strobeInterval: "Flash interval",
    vectorMass: {
      label: "Vectors drawn on mass",
      hint: "Clicking a mass in the scene selects it as well.",
    },
    regimes: {
      undamped: "Undamped",
      underdamped: "Underdamped",
      critical: "Critically damped",
      overdamped: "Overdamped",
      driven: "Driven",
      resonance: "Near resonance",
      atStop: "Resting on a stop",
      libration: "Libration",
      rotation: "Rotation",
      regular: "Regular",
      chaotic: "Chaotic",
      undetermined: "Measuring",
    },
  },

  status: {
    integrator: "Solver",
    ledger: "Energy-ledger residual",
    ledgerHint:
      "The quantity E_k + E_p + Q − W − E₀ relative to the energy of the system. It is zero for an exact solver; the value shown is the numerical error.",
    switchToAdaptive: "Restart with the adaptive solver",
    switchToAdaptiveHint: (threshold: string) =>
      `The energy-ledger residual has reached ${threshold}. The adaptive solver divides every step into as many sub-steps as its error control requires. Switching returns both experiments to their initial conditions.`,
    exactError: "Deviation from the analytical solution",
    exactErrorHint: "Largest difference between the numerical x(t) and the closed-form solution (since the last restart).",
    fps: "Frame rate",
    physics: "Physics time",
    samples: "Recording",
    paused: "Paused",
    held: "Body held",
    dropped: "Late frames",
    droppedHint: (cap: number, frames: number, window: number) =>
      `Number of frames since the last restart that took longer than ${cap} s. The part of such a frame beyond ${cap} s is not simulated, so simulated time falls behind. The count appears once such frames recur (${frames} within ${window} s); a single long frame, such as the one in which a scene is built, does not show it.`,
  },

  dock: {
    resizeHint:
      "Drag, or click: each click steps to the next height, and from the tallest back to the lowest. From the keyboard, use the up and down arrow keys, Home and End.",
  },

  shortcuts: {
    title: "Keyboard shortcuts",
    groups: { transport: "Experiment", view: "View", panels: "Panels", scene: "While the 3-D scene has the focus" },
    keys: { arrows: "Arrow keys" },
    singleKey: {
      label: "Single-key shortcuts",
      description:
        "When off, letter, digit and punctuation keys do nothing; the space bar keeps working. Switch them off if you use speech input or keyboard-assistance software.",
    },
    items: {
      toggleRun: "Run / pause",
      step: "Advance one frame while paused",
      reset: "Return to initial conditions",
      moduleOscillator: "Oscillator experiment",
      modulePendulum: "Pendulum experiment",
      velocity: "Velocity vector",
      netForce: "Net-force vector",
      freeBody: "Free-body diagram",
      trail: "Trail",
      strobe: "Stroboscope",
      grid: "Grid",
      dock: "Plot panel",
      theory: "Theory and references",
      sound: "Sound",
      help: "This window",
      orbit: "Orbit the camera",
      pan: "Pan the camera",
    },
  },

  welcome: {
    title: "Welcome to SimuLab",
    lead: "This is a measurement bench, not an animation: every motion you see is a verified numerical solution of the equations of motion, and every quantity can be measured and compared with theory.",
    steps: [
      {
        title: "Grab and release",
        body: "Grab the carriage or one of the pendulum masses and drag it. On release the pointer velocity is transferred to the body.",
      },
      {
        title: "Change a parameter, watch the plots",
        body: "The parameter panel stays open beside the scene (in a window narrower than 1024 px it opens with the slider button of the top bar), and the plots below update at the same time. Type into a number field for an exact value.",
      },
      {
        title: "Measure and compare",
        body: "The Measurements tab lists the period, amplitude and damping read by the virtual instruments next to their theoretical values.",
      },
      {
        title: "Check the source",
        body: "Theory and references holds the derivation of the equations, the numerical method and the verification results.",
      },
    ],
    start: "Start experimenting",
  },
};
