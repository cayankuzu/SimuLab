import type { TaskId } from "@/sim/tasks";
import type { tasks as source, TaskText } from "../tr/tasks";

const items: Record<TaskId, TaskText> = {
  periodDesign: {
    title: "Design the period: T = 2 s",
    summary: "Choose mass and spring constant so that the measured period is 2 s.",
    goal: "Make the **measured** period of the undamped, undriven oscillator 2.00 s. You may change the mass and the spring constant. The result is read from the period meter, averaged over at least six oscillations, not from the position of the sliders.",
    question: "If the mass is made four times larger and the spring is kept, how does the period change?",
    options: ["It does not change", "It doubles", "It becomes four times longer", "It halves"],
    note: "$T_0 = 2\\ \\mathrm{s}$ requires $k/m = \\pi^2 \\approx 9.87\\ \\mathrm{s^{-2}}$. For a linear spring the period does not depend on the amplitude.",
    criteria: ["Damping and drive are off (c = 0, F₀ = 0)", "At least 6 full periods measured", "Measured period 2.00 s ± 0.02 s"],
    explain:
      "The restoring force is proportional to the displacement and the inertia to the mass, so the period depends only on the ratio $m/k$ and grows as $\\sqrt{m}$: four times the mass gives twice the period. Change the amplitude and repeat the measurement: for a linear spring the period stays the same. The Measurements tab lists the theoretical $T_0$, the measured period and the deviation between them side by side [@french1971; @taylor2005].",
  },

  criticalDamping: {
    title: "Find critical damping",
    summary: "Find the damping coefficient that settles fastest without overshoot.",
    goal: "The apparatus with $m = 4\\ \\mathrm{kg}$ and $k = 36\\ \\mathrm{N/m}$ is released from rest at $x_0 = 3\\ \\mathrm{m}$. Choose the damping coefficient so that the mass settles **without overshooting** equilibrium and as **quickly** as possible. Restart the experiment (R key) every time you change the damping; overshoot and settling time are measured from the instant of release.",
    question: "Does the mass always settle faster when the damping coefficient is increased?",
    options: [
      "Yes; the larger the damping, the faster it settles",
      "No; the fastest return without overshoot occurs at one value, and more damping slows the return",
      "Damping changes only the amplitude, not the settling time",
    ],
    note: "For $\\zeta < 1$ the mass overshoots equilibrium; for $\\zeta > 1$ it does not, but returns slowly. For $\\zeta = 1$ the 2 % settling time is $5.834/\\omega_0$.",
    criteria: [
      "Drive is off; the mass was released from rest at |x₀| ≥ 1.5 m",
      "The mass has settled and the overshoot is below 0.5 % of |x₀|",
      "The 2 % settling time is at most 1.1 times the value at critical damping",
    ],
    explain:
      "Critical damping is $c_\\mathrm{kr} = 2\\sqrt{km} = 24\\ \\mathrm{N\\,s/m}$. With less damping the mass overshoots and oscillates; with more it does not overshoot, but the slowly decaying exponential term dominates and the return takes longer [@rao2017]. If overshoot is allowed, settling becomes shorter still: when the overshoot is exactly 2 %, i.e. at $\\zeta \\approx 0.78$ from $e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} = 0.02$, the mass stays inside the 2 % band from its first entry. The “best” damping therefore depends on the purpose. Car suspensions are not critically damped: the damping ratio of passenger cars is typically between 0.2 and 0.4 [@gillespie1992; @dixon2007].",
  },

  resonancePeak: {
    title: "Find the resonance peak",
    summary: "Sweep the drive frequency and find where the steady-state amplitude is largest.",
    goal: "The oscillator with $m = 2\\ \\mathrm{kg}$, $k = 24.5\\ \\mathrm{N/m}$ and $c = 1.2\\ \\mathrm{N\\,s/m}$ is driven by a harmonic force of amplitude $F_0 = 4\\ \\mathrm{N}$. Change the drive frequency and find the frequency at which the **steady-state amplitude** is largest. Wait for the transient to die out at every frequency. The response curve in the Frequency tab marks your measured points on the theoretical curve.",
    question: "At which drive frequency does the amplitude reach its largest value?",
    options: ["Exactly at the natural frequency (ω = ω₀)", "Slightly below ω₀", "Slightly above ω₀"],
    note: "Here $\\omega_0 = 3.5\\ \\mathrm{rad/s}$ and $\\zeta \\approx 0.086$. An amplitude peak exists only for $\\zeta < 1/\\sqrt{2}$.",
    criteria: [
      "Steady state: the transient has decayed (at least ln 100/γ ≈ 15 s since the last change) and the amplitudes of two successive oscillations differ by less than 1 %",
      "Measured amplitude at least 98 % of the theoretical peak amplitude",
      "The mass did not hit the stops",
    ],
    explain:
      "The amplitude peaks at $\\omega_r = \\omega_0\\sqrt{1-2\\zeta^2} \\approx 3.47\\ \\mathrm{rad/s}$, slightly below the natural frequency; the peak amplitude is $(F_0/k)/(2\\zeta\\sqrt{1-\\zeta^2}) \\approx 0.96\\ \\mathrm{m}$. The velocity amplitude and the mean power absorbed from the drive, however, are largest exactly at $\\omega_0$; the full width at half maximum of the power curve is $c/m$. For light damping the two peaks practically coincide: “resonance is at $\\omega_0$” is exact for power and approximate for amplitude [@french1971; @taylor2005]. The 1940 collapse of the Tacoma Narrows bridge is often quoted as an example of such forced resonance; it was in fact an aeroelastic torsional flutter fed by the structure's own motion [@billah1991].",
  },

  integratorError: {
    title: "Measure the error of the numerical method",
    summary: "See how explicit Euler breaks the energy ledger, then close it.",
    goal: "In the undamped, undriven oscillator mechanical energy is conserved, so the residual $\\Delta E$ of the energy ledger is a direct measure of the numerical error. The apparatus is set up with the explicit Euler method (300 Hz). First watch the relative residual exceed 5 %. Then choose RK4 or Dormand–Prince in the solver menu of the top bar, restart the experiment and show that the residual stays below $10^{-6}$ for 20 s.",
    question: "What happens over time to the computed total energy of an undamped oscillator integrated with explicit Euler?",
    options: ["It stays constant", "It decreases slowly", "It grows at every step"],
    note: "$h$ is the step size and $\\omega_0$ the natural angular frequency. The factor is larger than 1 for Euler and very slightly smaller than 1 for RK4.",
    criteria: [
      "With explicit Euler the relative energy residual exceeded 5 %",
      "With RK4 or Dormand–Prince the relative residual stayed below 10⁻⁶ for 20 s",
    ],
    explain:
      "An explicit Euler step multiplies the energy of the undamped oscillator by exactly $1 + h^2\\omega_0^2$: however small the step, the energy grows exponentially and the phase trajectory spirals outwards. For classical RK4 the factor is $1 - (h\\omega_0)^6/72 + \\dots$; with $h = 1\\ \\mathrm{ms}$ and $\\omega_0 \\approx 3.5\\ \\mathrm{rad/s}$ the relative loss per step is of order $10^{-17}$, below the rounding error of double-precision numbers [@hairer2006]. No explicit Runge–Kutta method is symplectic [@sanzserna1988]; when the energy behaviour matters over very long times, symplectic methods are preferred [@hairer2003]. This laboratory shows the energy ledger in every run: the numerical error is not hidden, it is measured.",
  },

  secondsPendulum: {
    title: "The seconds pendulum",
    summary: "Find by measurement the length of a pendulum whose period is 2 s.",
    goal: "At standard gravity ($g = 9.80665\\ \\mathrm{m/s^2}$) adjust the length of the single pendulum so that the **measured** period at small amplitude is 2.000 s. Each swing of such a pendulum from one side to the other takes 1 s, hence its name.",
    question: "Roughly how long is a pendulum whose period is 2 s?",
    options: ["0.25 m", "0.5 m", "1 m", "2 m"],
    note: "The formula holds for small angles; at an amplitude of 5° the period is only 0.05 % longer.",
    criteria: [
      "Single pendulum, no joint damping, g = 9.80665 m/s²",
      "Amplitude below 6°",
      "At least 6 full periods measured",
      "Measured period 2.000 s ± 0.003 s",
    ],
    explain:
      "The result is $L = g/\\pi^2 = 0.9936\\ \\mathrm{m}$: the seconds pendulum is almost exactly one metre long. That is no coincidence. In 1790 the length of the seconds pendulum at latitude 45° was proposed in France as the unit of length; the Academy commission of Borda, Lagrange, Laplace, Monge and Condorcet preferred one ten-millionth of the quarter meridian in its report of 19 March 1791 [@borda1791]. The period of a pendulum does not depend on its mass and is inversely proportional to $\\sqrt{g}$; on the Moon ($g = 1.62\\ \\mathrm{m/s^2}$) the same pendulum swings about 2.46 times more slowly. The value of $g$ used here is the standard acceleration of gravity adopted in 1901 [@cgpm1901].",
  },

  anharmonic: {
    title: "The period at large amplitude",
    summary: "Measure how isochronism fails at large angles and compare with the elliptic integral.",
    goal: "Release the single pendulum from rest at 90° or more (drag the bob or type the initial angle). Measure the period and compare it with two theoretical values: $T_0$ from the small-angle formula and the exact period given by an elliptic integral.",
    question: "How does the period change when the amplitude is raised from 5° to 120°?",
    options: ["It does not change; the period of a pendulum is independent of amplitude", "It becomes shorter", "It becomes longer"],
    note: "$K$ is the complete elliptic integral of the first kind. For $\\theta_0 = 90^\\circ$, $T/T_0 = 1.1803$.",
    criteria: [
      "Single pendulum, undamped; amplitude at least 90° (libration, not full rotation)",
      "At least 4 full periods measured",
      "Measured period agrees with the exact solution to one part in a thousand and is at least 1.15 T₀",
    ],
    explain:
      "The restoring torque is proportional to $\\sin\\theta$, which grows more slowly than $\\theta$ at large angles; the pendulum “softens” and the period lengthens: by 18 % at 90°, 37 % at 120° and 76 % at 150°. Galileo's observation of isochronism holds only approximately, for small angles. Huygens found in 1659 that the exactly isochronous curve is not the circle but the cycloid, and published the proof in 1673 [@huygens1673]. The exact period of the circular pendulum is given in closed form by an elliptic integral and is computed in a few steps with the arithmetic–geometric mean [@belendez2007; @carvalhaes2008].",
  },

  butterfly: {
    title: "Measure the butterfly effect",
    summary: "How long does a difference of one milliradian take to become 1 rad?",
    goal: "The double pendulum is released together with a twin whose first angle differs by $\\delta_0 = 0.001\\ \\mathrm{rad}$ (about 0.06°). Measure the instant at which the angular separation of the two pendulums reaches 1 rad. The separation plot in the Chaos tab has a logarithmic axis; exponential growth appears there as a straight line.",
    question: "When does the difference between the two pendulums reach 1 rad?",
    options: [
      "Never; the difference always stays small",
      "The difference grows in proportion to time; it takes minutes",
      "The difference grows exponentially; it takes seconds to a few tens of seconds",
    ],
    note: "$\\lambda$ is the largest Lyapunov exponent and $a$ the accepted tolerance (here 1 rad).",
    criteria: ["At least two links; twin enabled with δ₀ ≤ 0.001 rad", "The angular separation reached 1 rad"],
    explain:
      "On average the separation grows exponentially, at a rate given by the largest Lyapunov exponent $\\lambda$. Making the initial difference a thousand times smaller ($\\delta_0 = 10^{-6}\\ \\mathrm{rad}$) does not make the prediction time a thousand times longer; it adds only $\\ln 1000/\\lambda \\approx 6.9/\\lambda$: every improvement in measurement precision buys a fixed amount of prediction time [@strogatz2015]. Change the initial offset of the twin, repeat the run and measure this. The motion is nevertheless completely deterministic: the same initial conditions give the same trajectory. Unpredictability arises not from randomness but from the fact that initial conditions are never known with infinite precision. The divergence rate measured on a real double pendulum is $7.5 \\pm 1.5\\ \\mathrm{s^{-1}}$ [@shinbrot1992]; it depends on the dimensions and the energy of the apparatus and cannot be compared directly with the value of this model.",
  },

  regularIsland: {
    title: "An island of regular motion",
    summary: "Show that the same double pendulum is not chaotic at low energy.",
    goal: "A double pendulum is not chaotic under all conditions. With the twin enabled ($\\delta_0 = 0.001\\ \\mathrm{rad}$), choose initial angles such that the two pendulums stay within 0.05 rad of each other for 60 s and the estimate of the Lyapunov exponent falls below $0.1\\ \\mathrm{s^{-1}}$.",
    question: "If the double pendulum is released from very small angles, does it still separate quickly from its twin?",
    options: [
      "Yes; a double pendulum is chaotic under all conditions",
      "No; at low energy the motion is regular and the difference stays small",
      "It stays close only if there is friction",
    ],
    note: "In regular (quasi-periodic) motion the separation grows at most in proportion to time and $\\lambda$ tends to zero; the finite-time estimate decays roughly like $\\ln t/t$.",
    criteria: [
      "Double pendulum, twin enabled, no joint damping, and the pendulum is swinging",
      "The trajectory was followed for at least 60 s",
      "The separation did not exceed 0.05 rad during 60 s",
      "The estimate of the Lyapunov exponent is below 0.1 s⁻¹",
    ],
    explain:
      "At small angles the equations of motion become linear and the motion is the sum of two normal modes: quasi-periodic and predictable. As the energy increases, the regular regions of phase space shrink and the chaotic ones grow [@stachowiak2006]; at very high energy gravity becomes negligible beside the rotational energy and the motion is regular again [@rafat2009]. The sentence “the double pendulum is chaotic” is therefore incomplete: chaos is a property not of the system but of its trajectories in a certain range of energies. In the Poincaré section of the Chaos tab regular trajectories appear as closed curves and chaotic ones as a cloud of points filling an area.",
  },

  normalMode: {
    title: "Catch a normal mode",
    summary: "Release the double pendulum so that it swings with a single frequency.",
    goal: "The small oscillations of a double pendulum are in general a mixture of two frequencies. Choose initial angles (between 0.5° and 5°) such that the motion has a **single frequency**: the measured period of $\\theta_1$ must not change from swing to swing and must equal one of the two theoretical mode periods. The mode shapes, i.e. the ratios of the angles, are listed in the table of the Measurements tab.",
    question: "For small oscillations of a double pendulum, in how many different patterns of motion do all parts swing with the same frequency?",
    options: ["One", "Two", "Infinitely many"],
    note: "$\\mathbf{M}$ is the mass matrix and $\\mathbf{K} = g\\,\\mathrm{diag}(\\mu_i L_i)$ the stiffness matrix; $\\mu_i$ is the total mass from joint $i$ downwards. The eigenvector $\\mathbf{a}$ gives the ratio of the angles.",
    criteria: [
      "Double pendulum, undamped; amplitude of θ₁ between 0.5° and 5°",
      "At least 12 full periods measured",
      "Relative spread of the period below 0.3 % (single frequency)",
      "Measured period agrees with T₁ or T₂ to within 2.5 %",
    ],
    explain:
      "A linear system with $N$ degrees of freedom has exactly $N$ normal modes; the double pendulum has two. In the first the two rods deflect to the same side, in the second to opposite sides, and the second has the higher frequency. If the pendulum is released with the ratios of one eigenvector, only that mode is excited and every angle oscillates as a single cosine; any other initial condition is a sum of the two modes and the amplitudes beat. For a double pendulum with equal masses and equal lengths, $\\omega^2 = (2 \\pm \\sqrt{2})\\,g/L$ and $\\theta_2/\\theta_1 = \\pm\\sqrt{2}$ [@taylor2005]. For a chain of $N$ links with equal masses and equal lengths, $\\omega_k^2 = (g/\\ell)\\,x_k$, where $x_k$ are the zeros of the $N$-th Laguerre polynomial [@muller2007; @braun2003].",
  },
};

/** Task sheets panel. */
export const tasks: typeof source = {
  title: "Task sheets",
  intro:
    "Every sheet first asks for a prediction, is completed by measurement and ends with an explanation. Completion is decided from the values measured by the virtual instruments, not from the position of the sliders.",
  progress: (done: number, total: number) => `${done} / ${total} completed`,
  groups: { oscillator: "Spring–mass oscillator", pendulum: "Pendulum chain" },
  status: { completed: "completed", active: "in progress" },
  openTask: (title: string) => `Open task sheet: ${title}`,
  actions: {
    back: "All task sheets",
    start: "Set up and start",
    restart: "Set up again",
    stop: "Leave this sheet",
    reveal: "Show the explanation",
    next: "Next sheet",
    goToExperiment: "Return to the experiment",
  },
  headings: {
    goal: "Goal",
    predict: "Predict",
    observe: "Observe and measure",
    explain: "Explain",
    criteria: "Completion criteria",
    readouts: "Instrument readings",
    theory: "Governing relation",
    references: "Sources",
  },
  steps: { predict: "1", observe: "2", explain: "3" },
  predict: {
    hint: "Choose an answer before setting up the apparatus. When the sheet is complete, your prediction is compared with your observation.",
    correct: "Your prediction agreed with the observation.",
    wrong: "Your prediction did not agree with the observation. While reading the explanation, think about why it differed; this is the most instructive part of the sheet.",
    skipped: "You did not choose a prediction on this sheet.",
    answer: (text: string) => `Answer consistent with theory and measurement: ${text}`,
  },
  observe: {
    idle: "Once the apparatus is set up, the criteria are evaluated continuously from the instrument readings. Switching to the Parameters tab does not stop the evaluation.",
    otherActive: (title: string) => `Another sheet is in progress: ${title}. Starting this one leaves it.`,
    wrongModule: (experiment: string) => `This sheet runs on the “${experiment}” apparatus; the other apparatus is being shown.`,
    met: "met",
    unmet: "not yet met",
    summary: (met: number, total: number) => `${met} / ${total} criteria met`,
  },
  explain: {
    locked: "The explanation opens when the sheet is complete. Think of your own explanation first.",
  },
  done: {
    title: "Sheet completed",
    announce: (title: string) => `Sheet completed: ${title}`,
  },
  readouts: {
    measuredPeriod: "Measured period",
    theoryPeriod: "Theoretical period T₀",
    target: "Target",
    zeta: "Damping ratio ζ",
    overshoot: "Overshoot",
    settling: "2 % settling time",
    bestSettling: "Settling time at critical damping",
    amplitude: "Amplitude",
    peakAmplitude: "Theoretical peak amplitude",
    driveFrequency: "Drive angular frequency",
    residual: "Relative energy residual",
    elapsed: "Elapsed time",
    length: "Rod length",
    exactPeriod: "Exact period (elliptic integral)",
    smallAnglePeriod: "Small-angle period T₀",
    separation: "Angular separation from the twin",
    divergenceTime: "Instant of reaching 1 rad",
    lyapunov: "Lyapunov exponent (estimate)",
    horizon: "Prediction horizon (estimate)",
    maxSeparation: "Largest separation",
    spread: "Relative spread of the period",
    mode1Period: "Period of mode 1, T₁",
    mode2Period: "Period of mode 2, T₂",
  },
  items,
};
