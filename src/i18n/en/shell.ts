import type { shell as source } from "../tr/shell";

/** Application shell: top bar, 3-D viewport, status bar and general dialogs. */
export const shell: typeof source = {
  meta: { languageName: "English", locale: "en" },

  common: {
    close: "Close",
    cancel: "Cancel",
    apply: "Apply",
    theory: "Theory",
    measured: "Measured",
    deviation: "Deviation",
    notAvailable: "n/a",
  },

  app: {
    name: "SimuLab",
    tagline: "Oscillation and Chaos Laboratory",
    loading: "Preparing the laboratory",
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
    verification: "Verification",
    exportMenu: "Data and sharing",
    soundOn: "Mute",
    soundOff: "Unmute (sonification)",
    shortcuts: "Keyboard shortcuts",
    language: "Interface language",
    panel: "Open the parameter panel",
    dock: "Show/hide the plot panel",
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
      "Three-dimensional experiment scene. Bodies can be grabbed and dragged with the pointer; the same can be done from the keyboard through the initial-condition fields of the Parameters panel.",
    hint: "Grab a body and drag it; release while moving to throw it",
    views: { title: "View", iso: "Isometric", front: "Front", top: "Top", side: "Side" },
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
    },
    strobeInterval: "Flash interval",
    selectedLink: (index: number) => `Vectors on mass ${index}. Click a mass to change.`,
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
    switchToAdaptive: "Error is growing: switch to the adaptive solver",
    exactError: "Deviation from the analytical solution",
    exactErrorHint: "Largest difference between the numerical x(t) and the closed-form solution (since the last restart).",
    fps: "Frame rate",
    steps: "Steps per frame",
    physics: "Physics time",
    samples: "Recording",
    paused: "Paused",
    held: "Body held",
    dropped: (count: number) => `time budget exceeded in ${count} frames`,
  },

  shortcuts: {
    title: "Keyboard shortcuts",
    groups: { transport: "Experiment", view: "View", panels: "Panels" },
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
        body: "The panel on the right is always open and the plots below update at the same time. Type into a number field for an exact value.",
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
