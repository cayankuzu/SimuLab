import type { TheoryDocument } from "./types";

const r = String.raw;

/** Chapters 4-6: numerical methods, deterministic chaos, measurement and analysis tools. */
export const methodsEn: TheoryDocument = [
  {
    id: "sayisal",
    number: "4",
    title: "Numerical methods",
    summary:
      "The one-step methods used, their stability and energy behaviour, the fixed-step loop that is independent of the display rate, locating the instant of impact, and adaptive stepping.",
    sections: [
      {
        id: "sayisal-yontemler",
        title: "Explicit one-step methods",
        blocks: [
          {
            kind: "p",
            text: r`Both models are written as a first-order system, $\dot{\mathbf{y}} = \mathbf{f}(t,\mathbf{y})$; for the oscillator $\mathbf{y} = (x, \dot{x}, \varphi, Q_c, W)$ and for the pendulum $\mathbf{y} = (\theta_1,\dots,\theta_N, \dot\theta_1,\dots,\dot\theta_N, Q_b)$. The integral terms of the energy ledger are part of the state vector, so they are integrated with the same accuracy as the motion. The default method is the classical fourth-order Runge–Kutta method [@runge1895; @kutta1901; @hairer1993]:`,
          },
          {
            kind: "eq",
            label: "4.1",
            tex: r`\begin{aligned} \mathbf{k}_1 &= \mathbf{f}(t_n, \mathbf{y}_n), & \mathbf{k}_2 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_1\right), \\ \mathbf{k}_3 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_2\right), & \mathbf{k}_4 &= \mathbf{f}(t_n + h,\, \mathbf{y}_n + h\,\mathbf{k}_3), \\ \mathbf{y}_{n+1} &= \mathbf{y}_n + \tfrac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right) \end{aligned}`,
          },
          {
            kind: "p",
            text: r`A method of order $p$ has an error of $O(h^{p+1})$ in a single step and of $O(h^p)$ at the end of a fixed time interval [@hairer1993; @butcher2016]. The other methods of Table 4.1 can be selected for comparison and for teaching: seeing what a low-order method does is the shortest way to understand why a high-order one is needed.`,
          },
          {
            kind: "table",
            caption: "Table 4.1. Selectable methods and the orders observed in the verification experiment.",
            head: ["Method", "Order", "Observed order", "Derivative evaluations per step", "Remark"],
            rows: [
              ["Explicit Euler", "1", "1.007", "1", "Energy of the undamped oscillator grows at every step"],
              ["Symplectic Euler", "1", "1.005", "1", "Energy error of the oscillator stays bounded"],
              ["Midpoint (RK2)", "2", "2.0005", "2", "–"],
              ["Classical Runge–Kutta (RK4)", "4", "4.005", "4", "Default"],
              ["Dormand–Prince 5(4)", "5", "5.02", "7", "Embedded error estimate, adaptive step"],
            ],
          },
          {
            kind: "p",
            text: r`The observed order is computed by solving a problem with a known closed-form solution at two step sizes, $p = \ln(e_1/e_2)/\ln(h_1/h_2)$; it is the most direct evidence that the code implements the method correctly [@roache1998; @salari2000; @roy2005].`,
          },
        ],
      },
      {
        id: "sayisal-kararlilik",
        title: "Stability and energy behaviour",
        blocks: [
          {
            kind: "p",
            text: r`The behaviour of the methods on the undamped oscillator is known in closed form. With $z = h\omega_0$, an explicit Euler step multiplies the energy by exactly $1 + z^2$ at every step; however small the step, the energy grows exponentially. For classical RK4 the factor is`,
          },
          { kind: "eq", label: "4.2", tex: r`\frac{E_{n+1}}{E_n} = 1 - \frac{z^6}{72} + \frac{z^8}{576}, \qquad z = h\omega_0` },
          {
            kind: "p",
            text: r`so the method very slowly **loses** energy, and it is stable on the imaginary axis for $|z| \le 2\sqrt{2}$ [@hairer1996; @hairer2006]. With the default step $h = 1$ ms and the stiffest oscillator of the parameter range ($k = 80$ N/m, $m = 0.5$ kg, $\omega_0 = 12.6$ rad/s) the relative loss is $6 \times 10^{-14}$ per step and $3 \times 10^{-9}$ in total over 60 seconds. The symplectic Euler method conserves a modified energy of the oscillator exactly and stays bounded for $z < 2$ [@hairer2003].`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "Explicit Runge–Kutta methods are not symplectic",
            text: r`No explicit Runge–Kutta method preserves the phase-space structure of Hamiltonian systems exactly [@sanzserna1988; @hairer2006]. The symplectic Euler method used here is symplectic only for separable Hamiltonians; the mass matrix of the pendulum chain depends on the angles, so the property does not hold for the chain. In the general case with damping, drive and impacts the system is not Hamiltonian anyway. In this work energy conservation is not assumed but measured: the residual of the energy ledger is on screen at every instant.`,
          },
        ],
      },
      {
        id: "sayisal-dongu",
        title: "The fixed-step loop and reproducibility",
        blocks: [
          {
            kind: "p",
            text: r`The wall-clock duration of every animation frame, multiplied by the time scale, is added to a budget. The budget is spent in steps of exactly $h = 1/f_s$; what is left carries over to the next frame [@fiedler2004]. The step frequency $f_s$ can be set to 60, 120, 300, 600, 1000 or 2000 Hz; the default is 1000 Hz. A single frame adds at most 0.1 s of wall-clock time to the budget, which at 2000 Hz and at the largest time scale, 2, amounts to 400 steps. A frame that lasts longer is cut to 0.1 s: the remainder is not simulated, simulated time falls behind the wall clock, and the status bar counts such frames since the last restart (“Late frames”). When a tab returns from the background the measurement of the frame duration starts afresh, so the time spent there is neither simulated nor counted. The step size never changes. Telemetry is recorded every 10 ms at step frequencies of 300 Hz and above, and at every step at 60 Hz and 120 Hz.`,
          },
          {
            kind: "p",
            text: r`With this arrangement the sequence of states depends only on the initial conditions, the parameters, the method and the value of $h$. The automated tests check this directly: the same experiment is run once with uniform 60 Hz frames and once with random frame durations, and the states at common step counts are found to be equal bit for bit. The experiment file and the shared link carry only these inputs; the recipient reproduces the same trajectory. For the same reason a change of the method or of the step frequency does not continue the experiment in progress: both experiments start again from their initial conditions, so that a record, its energy ledger and its error statistics always belong to one method and one step.`,
          },
          {
            kind: "p",
            text: r`Simulated time is a sum of steps, and this sum has a round-off error of its own. Adding $h = 1$ ms 600 000 times in ordinary floating-point arithmetic loses $7 \times 10^{-9}$ s. In the ready-made experiment “Undamped”, where the carriage reaches 6.9 m/s, this loss alone would shift the closed-form reference solution of Chapter 2 by about $5 \times 10^{-8}$ m where the carriage is fastest, ten times the error of RK4 over the same 600 s. The clock of the oscillator is therefore advanced with compensated (Kahan) summation, and the phase of the drive is computed from the clock instead of being accumulated. The equations of the pendulum do not contain the time explicitly; its clock is an ordinary sum, and the round-off reaches only the time stamps of the record.`,
          },
          {
            kind: "p",
            text: r`After every step the runtime tests whether the solution is still within the finite range. For the pendulum this means that every angle and every angular velocity is below $10^7$ in magnitude (rad and rad/s); the test covers the reference trajectory, the twin while it is shown and the shadow trajectory of the Lyapunov estimate. For the oscillator the position must be finite and the speed below $10^6$ m/s. If the test fails, the state before that step is put back, the experiment is halted and the interface reports that the solution has diverged; an exception raised in the physics core halts the experiment in the same way. A low-order method with a coarse step can end in this way: the ready-made six-link chain integrated with explicit Euler at 60 Hz is halted after 12 s. The halt applies to both experiments; it is lifted when one of them is restarted or a solver is chosen, and either action restarts the experiment that diverged as well.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "The limit of reproducibility",
            text: r`The computations use IEEE 754 double-precision numbers (53-bit significand, $\varepsilon = 2^{-52} \approx 2.2 \times 10^{-16}$) [@ieee754-2019; @goldberg1991]. The four arithmetic operations and the square root are fully specified by the standard; the last digit of the trigonometric functions, however, may differ between runtime environments. On a chaotic trajectory a difference of $10^{-16}$ grows to 1 rad in about $\ln(10^{16})/\lambda \approx 37$ s when the exponent is $\lambda \approx 1\ \mathrm{s^{-1}}$. Bit-for-bit repeatability has therefore been tested for one and the same runtime environment; no comparison between different browser engines has been made.`,
          },
        ],
      },
      {
        id: "sayisal-olay",
        title: "Locating the instant of impact",
        blocks: [
          {
            kind: "p",
            text: r`The stops make the equation of motion piecewise; if the instant of impact is not located inside the step, the error becomes proportional to the step size and the order of the method is lost. If the carriage is beyond a limit at the end of a step, a bisection is carried out on the fraction $s \in [0,1]$ of the step: the state at the start of the step is advanced by $s\,h$ and the largest $s$ for which the carriage is still inside is sought. 52 iterations exhaust all digits of double precision. The state is then advanced to that instant, (2.9) is applied and the rest of the step is integrated. If more than six impacts occur within one step (ever smaller bounces of the carriage on the stop), the carriage is taken to rest on the stop and the remaining kinetic energy is booked as heat.`,
          },
          {
            kind: "p",
            text: r`In the verification experiment the instant of impact deviates from the closed-form value by $9 \times 10^{-13}$ s and the impact speed by $3 \times 10^{-14}$ in relative terms.`,
          },
        ],
      },
      {
        id: "sayisal-uyarlamali",
        title: "Adaptive stepping: Dormand–Prince 5(4)",
        blocks: [
          {
            kind: "p",
            text: r`The Dormand–Prince pair produces, from the same derivative evaluations, a fifth-order solution and a fourth-order comparison solution; their difference is an estimate of the local error [@dormand1980; @hairer1993]. MATLAB's ode45 solver is based on the same pair [@shampine1997]. In the application the fixed outer step $h$ is kept; the method divides this step into its own internal steps such that the estimated error stays below a relative tolerance of $10^{-10}$ and an absolute tolerance of $10^{-12}$. The sequence of steps thus remains independent of the frame duration.`,
          },
          {
            kind: "p",
            text: r`Fixed-step RK4 is sufficient with the default parameters: the relative energy drift over 60 seconds is $2 \times 10^{-9}$ for the double pendulum and $3 \times 10^{-7}$ for the six-link chain. In the hardest corner of the admissible range (three heavy, long links driving three light, short ones; angular speeds beyond 140 rad/s) the drift of the fixed step rises to $1.5 \times 10^{-3}$, while Dormand–Prince gives $4 \times 10^{-9}$ in the same experiment. When the relative residual of an experiment integrated with a fixed-step method reaches $10^{-5}$, the status bar offers a restart with the adaptive method; accepting the offer, like every change of solver, starts both experiments afresh.`,
          },
        ],
      },
      {
        id: "sayisal-cebir",
        title: "Linear algebra and special functions",
        blocks: [
          {
            kind: "list",
            items: [
              r`**Accelerations.** The symmetric positive-definite matrix of system (3.2) is solved by Cholesky factorisation at every derivative evaluation [@golub2013].`,
              r`**Normal modes.** Problem (3.6) is reduced to a standard symmetric eigenvalue problem with the Cholesky factor of $\mathbf{M}$ and solved with Jacobi rotations [@jacobi1846; @golub2013].`,
              r`**Laguerre zeros.** The zeros used as reference values in the verification are computed as the eigenvalues of the tridiagonal matrix built from the three-term recurrence [@golub1969].`,
              r`**Elliptic integral.** $K(k)$ is computed with the arithmetic–geometric mean [@dlmf; @carvalhaes2008].`,
            ],
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "kaos",
    number: "5",
    title: "Deterministic chaos",
    summary:
      "Sensitivity to initial conditions, estimating the Lyapunov exponent, the prediction horizon, the conditions under which chaos is possible, and the Poincaré section.",
    sections: [
      {
        id: "kaos-duyarlilik",
        title: "Sensitivity to initial conditions",
        blocks: [
          {
            kind: "p",
            text: r`In a deterministic system the same initial conditions always give the same trajectory. In a chaotic system, however, trajectories that start from very close initial conditions separate, on average, at an exponential rate. For two trajectories initially separated by $\delta_0$ in phase space,`,
          },
          {
            kind: "eq",
            label: "5.1",
            tex: r`\lVert\delta(t)\rVert \approx \lVert\delta_0\rVert\,e^{\lambda t}, \qquad \lambda = \lim_{t\to\infty}\,\lim_{\lVert\delta_0\rVert\to 0}\frac{1}{t}\ln\frac{\lVert\delta(t)\rVert}{\lVert\delta_0\rVert}`,
          },
          {
            kind: "p",
            text: r`defines the **largest Lyapunov exponent** $\lambda$; its existence, and the fact that it takes the same value for almost every initial direction, are guaranteed by the multiplicative ergodic theorem [@oseledec1968; @ott2002]. A positive exponent is the quantitative signature of chaos. The application shows this separation in two ways: a visible **twin pendulum** released with its first angle differing by $\delta_0$, and an estimate of the exponent that runs continuously in the background.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "Lorenz's rounded number",
            text: r`The famous episode of the discovery of sensitivity does not date from the 1963 paper [@lorenz1963] but from the winter of 1961, and it concerns not the well-known three-variable system but a weather model with twelve variables. In his own account Lorenz says that he re-entered a line of output that had been rounded to three decimals, but gives no digits [@lorenz1993]; the often quoted numbers 0.506127 and 0.506 come from Gleick's book [@gleick1987]. The “butterfly” is the title of a talk given in 1972 [@lorenz1972].`,
          },
        ],
      },
      {
        id: "kaos-benettin",
        title: "Estimating the Lyapunov exponent",
        blocks: [
          {
            kind: "p",
            text: r`The exponent is estimated with the two-trajectory method of Benettin, Galgani and Strelcyn [@benettin1976; @skokos2010]. Next to the reference trajectory, a shadow trajectory at a phase-space distance $d_0 = 10^{-8}$ is integrated with the same method and the same step. After every interval $\tau$ the separation $d_k$ is measured and the shadow is pulled back to the distance $d_0$ along the current direction of the separation; $\tau$ is 0.01 s at step frequencies of 300 Hz and above, and one step at 60 Hz and 120 Hz. The running estimate is`,
          },
          { kind: "eq", label: "5.2", tex: r`\lambda(t) = \frac{1}{t}\sum_{k=1}^{t/\tau}\ln\frac{d_k}{d_0}` },
          {
            kind: "p",
            text: r`The rescaling keeps the separation in the regime of linear growth; for the generalisation of the same idea that yields all exponents see [@benettin1980a; @benettin1980b], and for estimation from experimental time series [@wolf1985]. The distance is measured with the Euclidean norm in the $2N$-dimensional space of angles and angular velocities.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "The value shown is a finite-time estimate",
            text: r`$\lambda(t)$ converges to the exponent only in the limit $t \to \infty$. For regular motion the estimate decays to zero roughly like $\ln t/t$; a small but positive value after a short observation is therefore no evidence of chaos. In the verification experiments the 400-second estimate is 0.017 for the single pendulum, 0.003 for the small-angle double pendulum and 1.04 $\mathrm{s^{-1}}$ for the chaotic double pendulum. Halving the step changes the chaotic value by 7 %: the difference reflects the uncertainty of the finite-time average, not of the method.`,
          },
        ],
      },
      {
        id: "kaos-ufuk",
        title: "The prediction horizon",
        blocks: [
          {
            kind: "p",
            text: r`If the initial state is known with an uncertainty $\delta_0$ and an error of size $a$ counts as failure of the prediction, the prediction is meaningful for roughly [@strogatz2015]`,
          },
          { kind: "eq", label: "5.3", tex: r`t_\mathrm{u} \approx \frac{1}{\lambda}\,\ln\frac{a}{\delta_0}` },
          {
            kind: "p",
            text: r`The dependence is logarithmic: making the initial uncertainty a thousand times smaller extends the horizon only by $\ln 1000/\lambda \approx 6.9/\lambda$. The relation is an order-of-magnitude estimate; the local growth rate varies along the trajectory, so the observed divergence time can differ from it by a factor of a few. The application shows the estimated horizon side by side with the time the twin actually needed, counted from its release, to reach a separation of 1 rad.`,
          },
          {
            kind: "note",
            tone: "info",
            title: "Weather prediction",
            text: r`Applied to the atmosphere, the same idea gives an **intrinsic** limit of about two weeks for the predictability of day-to-day midlatitude weather and a **practical** limit of about ten days with present models and analyses [@zhang2019]; the classical work on the existence of such a limit is due to Lorenz [@lorenz1969].`,
          },
        ],
      },
      {
        id: "kaos-kosul",
        title: "When chaos is possible",
        blocks: [
          {
            kind: "p",
            text: r`The phase space of the undriven single pendulum is two-dimensional, $(\theta, \dot\theta)$. By the Poincaré–Bendixson theorem, a bounded trajectory of an autonomous flow in the plane can only approach a fixed point, a closed orbit or curves connecting them; chaos needs a phase space of at least three dimensions [@strogatz2015; @bendixson1901]. A single pendulum can therefore not be chaotic, however large the release angle; its exponent estimate decays to zero. The phase space of the double pendulum is four-dimensional and conservation of energy confines the motion to a three-dimensional surface: chaos is possible.`,
          },
          {
            kind: "p",
            text: r`That it is possible does not mean that every trajectory is chaotic. At low energy the motion of the double pendulum is the sum of two normal modes and is regular; as the energy increases, a growing part of phase space becomes chaotic [@stachowiak2006; @levien1993]; at very high energy gravity becomes negligible beside the rotational energy and the motion is regular again [@rafat2009; @richter1984]. The divergence rate measured on a real double pendulum from stroboscopic photographs is $7.5 \pm 1.5\ \mathrm{s^{-1}}$ [@shinbrot1992]; this value is specific to the apparatus and the energy and scales with $\sqrt{g/L}$.`,
          },
        ],
      },
      {
        id: "kaos-poincare",
        title: "The Poincaré section",
        blocks: [
          {
            kind: "p",
            text: r`The way to see a trajectory on the three-dimensional energy surface of the double pendulum is to cut it with a two-dimensional surface. The application records every crossing of the surface $\theta_2 = 0$ (mod $2\pi$) with $\theta_2$ increasing and plots the point $(\theta_1, p_1)$, where $p_1$ is the canonical momentum conjugate to $\theta_1$:`,
          },
          {
            kind: "eq",
            label: "5.4",
            tex: r`p_1 = \frac{\partial L}{\partial\dot\theta_1} = \sum_{j=1}^{N}\mu_{\max(1,j)}\,L_1L_j\cos(\theta_1-\theta_j)\,\dot\theta_j`,
          },
          {
            kind: "p",
            text: r`Choosing canonical variables makes the section map area-preserving. A regular trajectory stays on an invariant torus and traces a closed curve in the section; a chaotic trajectory fills an area [@lichtenberg1992; @ott2002]. The instant of crossing is found by linear interpolation between two successive steps, which at $h = 1$ ms gives an error far below the resolution of the plot. For a method that lands exactly on the surface of section see [@henon1982].`,
          },
        ],
      },
      {
        id: "kaos-dogruluk",
        title: "What numerical accuracy means on chaotic trajectories",
        blocks: [
          {
            kind: "p",
            text: r`On a chaotic trajectory numerical error grows exponentially, just like a physical separation. For the double pendulum the relative energy error per step is of order $10^{-14}$; even so small a difference separates the trajectory completely from the exact solution within about $\ln(10^{14})/\lambda \approx 30$ s when $\lambda \approx 1\ \mathrm{s^{-1}}$. This is a limit no finite-precision computation can pass, not a defect of the solver. What is meaningful in a long chaotic simulation is not the individual states but the statistical and geometric properties of the trajectory: the Lyapunov exponent, the structure of the Poincaré section, the conservation of energy. The verification experiments measure this: when the chaotic double pendulum is integrated 5 s forwards and 5 s backwards, it returns to its initial state with an error of $4 \times 10^{-10}$ rad; for regular motion the same experiment over 20 s gives $5 \times 10^{-12}$ rad.`,
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "olcum",
    number: "6",
    title: "Measurement and analysis tools",
    summary:
      "The virtual instruments and plots that allow theory to be compared with measurements made on the simulation rather than with the simulation's own formulas.",
    sections: [
      {
        id: "olcum-cihazlar",
        title: "Virtual instruments",
        blocks: [
          {
            kind: "p",
            text: r`Writing the theoretical value on the screen of a simulation is easy, but it is not a verification. The instruments here see only the sampled solution and make the measurement an experimenter would make with a stopwatch, a ruler and an oscilloscope:`,
          },
          {
            kind: "list",
            items: [
              r`**Period meter.** Measures the time between successive zero crossings of the signal in the same direction; the instant of crossing is found by linear interpolation between two samples. Upward and downward crossings are followed separately, so every period of an oscillation yields two intervals (every turn of a rotating pendulum yields one). The mean and the standard deviation of the last twelve intervals are shown. For the pendulum, $\sin\theta$ is monitored and only the crossings at the bottom are counted, so that the rotation period of a pendulum going over the top is measured as well.`,
              r`**Peak detector.** Extrema are found not by searching for the largest sample but from the zero crossing of the velocity, which gives a time resolution far finer than the sampling interval. The amplitude is half the difference between the latest peak and the latest trough.`,
              r`**Logarithmic decrement.** Computed from successive positive peaks with (2.5); the damping ratio follows from $\zeta = \Lambda/\sqrt{4\pi^2 + \Lambda^2}$.`,
              r`**Steady-state criterion.** Three conditions are required together. From one oscillation to the next the peak-to-peak amplitude must change by less than 1 %, and the centre of the oscillation, the mid-point between the latest peak and the latest trough, must move by less than 1 % of the amplitude. In addition, the time $\ln 100/r$ in which the slowest term of the transient decays to 1 % must have passed since the last change (restart, parameter change, impact); here $r = \gamma$ for $\zeta \le 1$ and $r = \gamma - \sqrt{\gamma^2 - \omega_0^2}$ for $\zeta > 1$. The first condition alone is not sufficient: a slowly decaying transient changes the amplitude per oscillation only by $e^{rT} - 1$ times its own size, so it can be several times larger than the observed change. A transient term that does not oscillate, such as the slow exponential of an overdamped system, does not change the peak-to-peak amplitude at all; it shifts the centre, which is what the second condition detects. Without damping the waiting time is infinite and no steady state is reported. The phase lag is the drive phase at the instant of the latest peak of the displacement.`,
              r`**Step-response meter.** For a mass released from rest it measures the overshoot, the most extreme sample beyond equilibrium as a fraction of the initial displacement, and the settling time, the instant from which $|x|$ stays within 2 % of the initial displacement. The entry into this band is located by linear interpolation between the last sample outside it and the first one inside; the value is shown once the response has stayed inside for a quarter of that time, and for at least 0.25 s. The theoretical value given next to it is the settling time of the closed-form solutions (2.3) and (2.4) for the damping ratio at hand, found by bisection; for $\zeta = 1$ it equals $5.834/\omega_0$. If a parameter is changed after the release the measurement ends, and it starts again with the next release.`,
            ],
          },
          {
            kind: "p",
            text: r`The Measurements tab lists, for every quantity, the theoretical value, the measured value and the deviation between them. The completion criteria of the task sheets are tied to the readings of these instruments as well; moving a slider to the right position does not complete a sheet, the measurement has to be made.`,
          },
        ],
      },
      {
        id: "olcum-spektrum",
        title: "The amplitude spectrum",
        blocks: [
          {
            kind: "p",
            text: r`The newest samples of the recorded signal are multiplied by a Hann window and analysed with the fast Fourier transform [@cooley1965; @harris1978]. The record analysed has $N$ samples, where $N$ is the largest power of two that the telemetry recorded since the last restart fills: at least 256 (2.56 s at the telemetry rate of 100 Hz) and at most 4096 (41 s). The record is never extended with zeros, so the frequency resolution is that of the record itself, $f_s/N$: at 100 Hz, 0.39 Hz for the shortest record and $100/4096 = 0.024$ Hz for the longest. The sampling rate $f_s$ is taken from the time stamps of the record; it is 100 Hz, except at the step frequencies of 60 Hz and 120 Hz, where it equals the step frequency. The coherent gain of the window is 0.5 and its equivalent noise bandwidth 1.5 bins [@heinzel2002]; the amplitude axis is scaled with the coherent gain, so that a sinusoid whose frequency coincides with a bin is read with its own amplitude. The frequency of a sinusoid generally falls between two bins; the peak frequency and amplitude are then obtained from the two largest bins with the interpolation formula for the Hann window [@grandke1983]. The formula assumes a line of constant amplitude and bins that are one reciprocal record length apart, which is the reason why the record is not extended with zeros. When the line lies close to zero frequency, its image at negative frequency disturbs the formula: in a trial with 20 000 single sinusoids the frequency read-out was wrong by 8 % in the worst case with the peak in the second bin above zero frequency, and by at most 0.05 % from the fourth bin on. The plot therefore states the dominant peak only if the strongest bin of the spectrum lies at $4 f_s/N$ or above. In the verification experiment, with 4096 samples and the line near the 51st bin, the frequency of a 1.2345 Hz sinusoid is recovered with an error of $5 \times 10^{-9}$ Hz and its amplitude with a relative error of $10^{-8}$.`,
          },
          {
            kind: "p",
            text: r`The spectrum shows a distinction that cannot be made out in the time plot: the spectrum of a regular motion consists of a few sharp lines (the normal-mode frequencies and their combinations), that of a chaotic motion is broadband. The theoretical frequencies are marked in the plot.`,
          },
        ],
      },
      {
        id: "olcum-grafikler",
        title: "Plots and colours",
        blocks: [
          {
            kind: "p",
            text: r`The time plot, the phase portrait, the energy ledger, the response curve, the spectrum, the separation plot and the Poincaré section show the same telemetry so as to answer different questions. The vertical axis of the separation plot is logarithmic; exponential growth is there a straight line of slope $\lambda$. Every physical quantity carries the same colour in all views: the vector in the scene, the trace in the plot, the number in the read-out. The colours are taken from the Okabe–Ito palette, which remains distinguishable under colour-vision deficiencies [@okabe2008; @wong2011]; no quantity is identified by its colour alone.`,
          },
        ],
      },
      {
        id: "olcum-veri",
        title: "Data export",
        blocks: [
          {
            kind: "p",
            text: r`The telemetry can be downloaded as a CSV file. Column names carry the unit (for example “t_s” for $t$ and “theta1_rad” for an angle); header lines record the parameters, the initial conditions, the method, the step and the sampling interval. Because a change of solver starts a new experiment, every row of a file was computed with the method and the step named in its header. The parameters, by contrast, are written with their values at the moment of export: a parameter changed while the experiment is running is not recorded as an event, and the rows from before the change belong to the earlier value. The header lines begin with “#” and contain neither the field separator nor a quotation mark, so a program that reads the file by the rules of the CSV format takes each of them as a single field and the table below them stays intact. Two dialects are offered: decimal point with comma separation (Python, MATLAB, R) and decimal comma with semicolon separation (spreadsheets with a Turkish locale). The experiment definition can also be shared as a JSON file or as a link; no data are sent to any server.`,
          },
        ],
      },
      {
        id: "olcum-ses",
        title: "Sonification",
        blocks: [
          {
            kind: "p",
            text: r`The mechanical frequencies of the apparatus are far below the threshold of hearing; the sound heard is not a recording but a deliberate mapping of quantities onto sound [@hermann2011]. For the oscillator the pitch of a sine tone follows the displacement (one octave per 3.5 m) and its loudness the speed; an impact with a stop gives a short click scaled by the impact speed. For the pendulum every passage of the first rod through the vertical is a tick: a single pendulum ticks regularly like a clock, a chaotic chain irregularly. No sound plays unless the user switches it on.`,
          },
        ],
      },
    ],
  },
];
