import type { ValidationCaseId } from "@/physics/validation";
import type { ValidationCaseText, verification as source } from "../tr/verification";

const cases: Record<ValidationCaseId, ValidationCaseText> = {
  convergence: {
    title: "Observed order of accuracy",
    description:
      "A driven, damped oscillator with a known closed-form solution ($m = 1$ kg, $k = 4\\pi^2$ N/m, $c = 0.4$ N·s/m, $F_0 = 3$ N, $\\omega = 4$ rad/s) is integrated to $t = 2$ s with two step sizes. The observed order $p = \\ln(e_1/e_2)/\\ln(h_1/h_2)$ computed from the two errors is compared with the theoretical order of the method [@roache1998; @oberkampf2010].",
    rows: ["Explicit Euler", "Symplectic Euler", "Midpoint (RK2)", "Classical Runge–Kutta (RK4)", "Dormand–Prince 5"],
  },
  freeResponse: {
    title: "Free response against the closed-form solution",
    description:
      "The oscillator with $m = 2$ kg and $k = 24$ N/m is released from rest at $x_0 = 2$ m and integrated with RK4 at $h = 1$ ms for 20 s. The table gives the largest deviation of the numerical position from the analytical solution in the four damping regimes.",
    rows: ["$\\zeta = 0$ (undamped)", "$\\zeta = 0.1$ (underdamped)", "$\\zeta = 1$ (critically damped)", "$\\zeta = 2.5$ (overdamped)"],
  },
  steadyState: {
    title: "Driven steady state: amplitude and phase lag",
    description:
      "$m = 2$ kg, $k = 24.5$ N/m, $c = 0.55$ N·s/m, $F_0 = 1$ N. The oscillator is driven at five frequencies until the transient has decayed by a factor $e^{-16}$; amplitude and phase lag are measured with the virtual instruments of the application and compared with the theoretical $A(\\omega)$ and $\\delta(\\omega)$.",
    rows: [
      "$A(0.5\\,\\omega_0)$",
      "$\\delta(0.5\\,\\omega_0)$",
      "$A(0.9\\,\\omega_0)$",
      "$\\delta(0.9\\,\\omega_0)$",
      "$A(\\omega_0)$",
      "$\\delta(\\omega_0)$",
      "$A(1.1\\,\\omega_0)$",
      "$\\delta(1.1\\,\\omega_0)$",
      "$A(1.5\\,\\omega_0)$",
      "$\\delta(1.5\\,\\omega_0)$",
    ],
  },
  criticalDamping: {
    title: "Step response: overshoot and settling time",
    description:
      "$m = 4$ kg, $k = 36$ N/m, $x_0 = 2$ m. At critical damping there must be no overshoot and the 2 % settling time must equal $5.834/\\omega_0$; for $\\zeta = 0.5$ the overshoot must equal $e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}$. The step-response meter receives a sample after every step of 1 ms and places the entry into the 2 % band between two samples by linear interpolation.",
    rows: ["Overshoot, $\\zeta = 1$", "2 % settling time, $\\zeta = 1$", "Overshoot, $\\zeta = 0.5$"],
  },
  impact: {
    title: "Impact with a stop: instant, speed and energy loss",
    description:
      "The undamped oscillator ($m = 2$ kg, $k = 24$ N/m) is released at $x_0 = 6$ m and hits the stop at $x_\\mathrm{min} = -4.75$ m. The instant of impact $\\arccos(x_\\mathrm{min}/x_0)/\\omega_0$, the impact speed $\\omega_0\\sqrt{x_0^2 - x_\\mathrm{min}^2}$ and the energy lost $\\tfrac12 m v^2(1-e^2)$ are known in closed form. The instant of impact is located inside the step by bisection.",
    rows: ["Instant of impact", "Impact speed", "Energy lost in the impact", "Mechanical energy after the impact"],
  },
  energyLedger: {
    title: "Closure of the energy ledger",
    description:
      "Damping, drive and stops act together ($c = 0.55$ N·s/m, $F_0 = 12$ N, $\\omega = 3.5$ rad/s; 27 impacts in 60 s). The largest relative deviation of $E_k + E_p + Q_c + Q_e - W$ from the initial energy is measured.",
    rows: ["RK4, 1000 Hz", "RK4, 300 Hz"],
  },
  pendulumPeriod: {
    title: "Period of the finite-amplitude pendulum",
    description:
      "The measured period of a single pendulum of length $L = 1$ m is compared with the elliptic-integral solution $T = 4\\sqrt{L/g}\\,K(\\sin(\\theta_0/2))$ [@belendez2007; @dlmf]. The last row is a pendulum that goes over the top and rotates continuously: $T = (2/\\kappa)\\sqrt{L/g}\\,K(1/\\kappa)$.",
    rows: [
      "$\\theta_0 = 10^\\circ$",
      "$\\theta_0 = 45^\\circ$",
      "$\\theta_0 = 90^\\circ$",
      "$\\theta_0 = 135^\\circ$",
      "$\\theta_0 = 170^\\circ$",
      "Rotation, $\\kappa = 1.2$",
    ],
  },
  energyDrift: {
    title: "Energy drift of the frictionless chain",
    description:
      "The chain with the default masses and lengths is released from large angles and followed for 60 s; the table gives the largest relative deviation of the energy ledger. The explicit-Euler row is there to show the inadequacy of that method and is a lower-bound criterion. The last two rows are the hardest corner of the admissible parameter range (three heavy, long links driving three light, short ones): the error of the fixed-step method is visible there, that of the error-controlled method is not.",
    rows: [
      "$N = 1$, RK4, 1000 Hz",
      "$N = 2$, RK4, 1000 Hz",
      "$N = 3$, RK4, 1000 Hz",
      "$N = 6$, RK4, 1000 Hz",
      "$N = 2$, RK4, 300 Hz",
      "$N = 2$, Dormand–Prince 5",
      "$N = 2$, viscous joint friction ($b = 0.3$)",
      "$N = 2$, explicit Euler, 1000 Hz (lower bound)",
      "$N = 6$, extreme mass ratio, RK4, 1000 Hz",
      "$N = 6$, extreme mass ratio, Dormand–Prince 5",
    ],
  },
  normalModes: {
    title: "Small-oscillation spectrum",
    description:
      "The numerical eigenfrequencies of a chain with equal masses and equal lengths are compared with the Laguerre zeros in $\\omega_k^2 = (g/\\ell)\\,x_k$ [@muller2007; @braun2003]; those of the double pendulum with the closed-form result $(2 \\mp \\sqrt2)\\,g/\\ell$ [@taylor2005]; and the fundamental of the six-link chain with the value given by the Bessel zero of the hanging rope [@verbin2015]. The last row checks that the non-linear simulation reproduces the period of the first mode at small amplitude.",
    rows: [
      "$N = 2$: eigenfrequencies against Laguerre zeros",
      "$N = 3$: eigenfrequencies against Laguerre zeros",
      "$N = 6$: eigenfrequencies against Laguerre zeros",
      "$N = 2$: $\\omega_1$",
      "$N = 2$: $\\omega_2$",
      "$N = 6$: fundamental against the hanging-rope limit",
      "$N = 2$: period of mode 1 measured in the simulation",
    ],
  },
  newtonEuler: {
    title: "Agreement of the Lagrangian and Newtonian derivations",
    description:
      "The equations of motion are derived with Lagrange's method. The rod forces are computed separately from Newton's second law for every mass; an ideal rod carries force only along its own direction, so the transverse component must vanish if the two derivations are consistent. The criterion is the ratio of the transverse component to the tension over 200 randomly chosen states. The last row is the known tension of the single pendulum: $T = m(g\\cos\\theta + L\\dot\\theta^2)$.",
    rows: ["$N = 2$: transverse force / tension", "$N = 6$: transverse force / tension", "$N = 1$: rod tension"],
  },
  lyapunov: {
    title: "Largest Lyapunov exponent",
    description:
      "The exponent estimated with Benettin's method [@benettin1976] over 400 s must be close to zero for regular motion and clearly positive for the chaotic double pendulum. The last two rows measure the sensitivity of the estimate to the numerical parameters: the step is halved and the initial separation is made ten times larger.",
    rows: [
      "$N = 1$, $\\theta_0 = 120^\\circ$ (regular)",
      "$N = 2$, small angles (regular)",
      "$N = 2$, $\\theta = (2.15,\\ 1.65)$ rad (chaotic)",
      "Same experiment, step halved",
      "Same experiment, $d_0 = 10^{-7}$",
    ],
  },
  reversibility: {
    title: "Time reversibility",
    description:
      "The frictionless equations of motion are reversible in time. The chain is integrated forwards, the signs of the velocities are changed and it is integrated again for the same time; the table gives the largest error in returning to the initial state. On a chaotic trajectory the error grows exponentially, so the time is short and the tolerance wide.",
    rows: ["$N = 2$, regular; 20 s out and back", "$N = 3$, regular; 20 s out and back", "$N = 2$, chaotic; 5 s out and back"],
  },
  crossIntegrator: {
    title: "Agreement of two independent methods",
    description:
      "The three-link chain is integrated for 5 s with fixed-step RK4 and with the error-controlled Dormand–Prince method. When the step is made four times smaller, the difference between RK4 and the reference solution must shrink by a factor of about $4^4 = 256$, as expected of a fourth-order method.",
    rows: ["Difference between RK4 (1000 Hz) and DP5", "Difference between RK4 (4000 Hz) and DP5", "Error ratio (expected: about 256)"],
  },
  spectrum: {
    title: "Spectrum analyser",
    description:
      "A sine of frequency 1.2345 Hz and amplitude 0.7 with a constant offset is sampled at 100 Hz (4096 samples). The frequency does not coincide with any FFT bin; the peak frequency and amplitude are recovered with a Hann window [@harris1978] and two-bin interpolation [@grandke1983].",
    rows: ["Peak frequency", "Peak amplitude"],
  },
};

/** Verification panel. */
export const verification: typeof source = {
  title: "Verification experiments",
  intro:
    "The fourteen experiments below run the solver code of the application on problems whose answer is known independently: a closed-form solution, a conservation law, the value of a special function or an independent derivation. They are executed in this browser, with the code that is loaded right now; the same experiments are part of the automated test suite and of the technical report.",
  run: "Run the experiments",
  rerun: "Run again",
  progress: (done: number, total: number) => `${done} / ${total} experiments completed`,
  idle: "The experiments have not been run yet.",
  summary: (passed: number, total: number, seconds: string) => `${passed} of ${total} criteria met · ${seconds} s`,
  allPassed: "All criteria met",
  someFailed: (count: number) => `${count} criteria not met`,
  failed: "The experiment could not be run",
  columns: {
    quantity: "Quantity",
    measured: "Measured",
    reference: "Reference value",
    error: "Error",
    tolerance: "Tolerance",
    result: "Result",
  },
  pass: "passed",
  fail: "failed",
  pending: "pending",
  running: "running",
  metrics: {
    relative: "relative error",
    absolute: "absolute error",
    atMost: "upper bound",
    atLeast: "lower bound",
  },
  metricNote:
    "The error column is the relative or absolute difference between the measured value and the reference value. In rows without a reference value the measured value itself is compared with a bound.",
  cases,
};
