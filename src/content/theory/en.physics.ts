import type { TheoryDocument } from "./types";

const r = String.raw;

/**
 * Chapters 1-3: scope and related work, the spring-mass oscillator, the N-link pendulum.
 * Numerical values come either from closed-form relations or from the experiments of
 * src/physics/validation.ts; reference keys resolve in src/content/references.ts.
 */
export const physicsEn: TheoryDocument = [
  {
    id: "kapsam",
    number: "1",
    title: "Scope, related work and notation",
    summary: "What the laboratory models, where it differs from similar tools, and the symbols used throughout the text.",
    sections: [
      {
        id: "kapsam-amac",
        title: "Purpose and scope",
        blocks: [
          {
            kind: "p",
            text: r`SimuLab solves two classical mechanical systems in the browser, in a three-dimensional scene and in real time: a damped, harmonically driven **spring–mass oscillator** with rigid end stops, and a planar **pendulum chain** of $N = 1,\dots,6$ links. The first gathers all the basic concepts of linear vibration theory (natural frequency, damping ratio, resonance, phase lag, transient and steady state) in one equation; the second is the non-linear end of the same mechanics and shows deterministic chaos for $N \ge 2$.`,
          },
          {
            kind: "p",
            text: r`The claim of this work is not visual appeal but **verifiability**. Every numerical result has been compared with a problem whose answer is known independently (Chapter 7); an energy ledger shows the numerical error throughout a run; the trajectory seen on screen depends only on the initial conditions, the parameters and the chosen method, not on the display refresh rate (Chapter 4). Every factual statement in the text rests on a derivation, on a measured verification result or on a publication whose bibliographic record was checked against a primary source.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "The third dimension belongs to the visualisation",
            text: r`The dynamics of both systems are planar: the oscillator has one degree of freedom and the pendulum chain moves in a vertical plane. The three-dimensional scene lets the apparatus be inspected like a laboratory bench; a spherical pendulum or out-of-plane motion is not modelled.`,
          },
        ],
      },
      {
        id: "kapsam-ilgili",
        title: "Related work",
        blocks: [
          {
            kind: "p",
            text: r`Table 1.1 summarises the models and time-stepping methods of widely used free tools for oscillations and pendulums. The information was compiled from the tools' own pages, their documentation and, where accessible, their source code.`,
          },
          {
            kind: "table",
            caption: "Table 1.1. Similar tools: model and time-stepping method.",
            head: ["Tool", "Model", "Time stepping", "Source"],
            rows: [
              [
                "PhET Pendulum Lab",
                "One or two independent simple pendulums, two-dimensional",
                "Classical RK4, at least 7 sub-steps per frame",
                "[@phet_pendulumlab]",
              ],
              [
                "PhET Masses and Springs",
                "Vertical spring–mass, two-dimensional",
                "No time stepping: the closed-form solution of the damped oscillator is evaluated every frame",
                "[@phet_massessprings]",
              ],
              [
                "myPhysicsLab",
                "About 50 simulations including the double pendulum, all two-dimensional",
                "RK4 by default, step 0.025 s; Euler only as an option",
                "[@neumann_myphysicslab]",
              ],
              [
                "Easy Java/JavaScript Simulations, Open Source Physics",
                "Authoring tool and model collection; includes a double pendulum with a Poincaré section",
                "Default for a new ODE page: adaptive Cash–Karp 5(4)",
                "[@ejswiki_ode; @christian2007; @christian2009dp]",
              ],
              [
                "GeoGebra, oPhysics",
                "Applets written by users",
                "The SolveODE command is based on Runge–Kutta methods",
                "[@geogebra_manual; @walsh2017]",
              ],
              ["Algodoo", "Two-dimensional sandbox", "Variational integrators, according to the vendor", "[@algodoo; @gregorcic2017]"],
              ["Falstad, W. Fendt", "Two-dimensional applets", "Normal-mode or closed-form formulas", "[@falstad; @fendt]"],
              ["Web VPython", "Three-dimensional programming environment", "Euler–Cromer by design in introductory courses", "[@chabay2008]"],
            ],
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Educational simulations use Euler's method”",
            text: r`This generalisation does not hold for the tools named: PhET Pendulum Lab and myPhysicsLab use the fourth-order Runge–Kutta method, PhET Masses and Springs does not step in time at all, and Easy Java/JavaScript Simulations starts with an adaptive method. Euler-type stepping is a deliberate choice in introductory courses where students write the code themselves [@chabay2008]. The contribution of this work is therefore not “a better integrator”; it is that the error is measured, displayed and documented.`,
          },
          {
            kind: "p",
            text: r`To the best of our knowledge, none of the widely used free tools surveyed (PhET, myPhysicsLab, Open Source Physics and EJS, GeoGebra and oPhysics, Algodoo, Falstad, W. Fendt) offers the following together: a pendulum chain of up to six links, an estimate of the largest Lyapunov exponent during the run, an always-on energy ledger and exportable telemetry. This is a negative search result, not a proof. There are open-source personal projects with little adoption that overlap in part; for example the GitHub repository “Chaotic-n-Pendulums-Visualizer” offers a Benettin estimate on demand for a planar N-link pendulum. For a recent review on teaching chaos with the double pendulum see [@oliveira2024]; for examples of browser-based laboratories see [@chopyk2024; @halder2026].`,
          },
          {
            kind: "p",
            text: r`The evidence on the effect of virtual laboratories on learning is mixed. In one study students who worked with a simulation outperformed those who worked with real equipment both on conceptual questions and in building a real circuit [@finkelstein2005]; physical and virtual materials were found equally effective for teaching experimental design [@triona2003]; in a study with seventh-graders on pendulum problems no difference was found between simulation and hands-on experiment, and students controlled variables less often in the simulation [@renken2013]. A review covering 2001–2010 reports that simulations can support laboratory activities in particular, but that most studies ignored teacher support and the lesson scenario [@rutten2012]; for a comparative assessment of physical and virtual laboratories see [@dejong2013]. This report claims no learning gain for its own tool (Chapter 9).`,
          },
        ],
      },
      {
        id: "kapsam-gosterim",
        title: "Notation and units",
        blocks: [
          {
            kind: "p",
            text: r`All quantities are given in SI units; the symbols follow ISO 80000 [@iso80000-3; @iso80000-4; @bipm2019si]. A dot denotes the derivative with respect to time. Angles are measured from the downward vertical, counter-clockwise, in radians; the interface also shows degrees for convenience. Numbers are written with a decimal point in the interface and in this text, so that a value read on screen can be typed back into a numeric field and is identical to the exported data.`,
          },
          {
            kind: "table",
            caption: "Table 1.2. Principal symbols.",
            head: ["Symbol", "Meaning", "Unit"],
            rows: [
              [r`$m$, $k$, $c$`, "Mass, spring constant, viscous damping coefficient", "kg, N/m, N·s/m"],
              [r`$F_0$, $\omega$, $\varphi$`, "Amplitude, angular frequency and phase of the driving force", "N, rad/s, rad"],
              [r`$\omega_0$, $\zeta$, $\gamma$`, r`Natural angular frequency, damping ratio, amplitude decay rate $c/(2m)$`, "rad/s, –, 1/s"],
              [r`$A$, $\delta$`, "Steady-state amplitude and phase lag of the displacement behind the force", "m, rad"],
              [r`$e$`, "Coefficient of restitution", "–"],
              [r`$\theta_i$, $m_i$, $L_i$`, r`Angle of rod $i$, the mass at its end and the length of the rod`, "rad, kg, m"],
              [r`$\mu_i$`, r`Total mass from joint $i$ downwards, $\sum_{k \ge i} m_k$`, "kg"],
              [r`$b$`, "Viscous friction coefficient of a joint", "N·m·s/rad"],
              [r`$E_k$, $E_p$, $Q$, $W$`, "Kinetic energy, potential energy, energy converted to heat, work done by the drive", "J"],
              [r`$h$, $p$`, "Time step, order of the method", "s, –"],
              [r`$\lambda$`, "Largest Lyapunov exponent", "1/s"],
            ],
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "osilator",
    number: "2",
    title: "The damped, driven oscillator",
    summary:
      "Equation of motion, the three damping regimes, driven steady state and resonance, mechanical stops, and an energy balance in which every term is tracked separately.",
    sections: [
      {
        id: "osilator-model",
        title: "Model and equation of motion",
        blocks: [
          {
            kind: "p",
            text: r`A carriage of mass $m$ moves on a frictionless rail, is attached to the wall by a linear spring of constant $k$ and is acted on by a damping force proportional to its velocity and by a harmonic driving force. For the displacement $x$ measured from equilibrium,`,
          },
          { kind: "eq", label: "2.1", tex: r`m\ddot{x} + c\dot{x} + kx = F_0\cos\varphi, \qquad \dot{\varphi} = \omega` },
          {
            kind: "p",
            text: r`The phase $\varphi$ of the drive is integrated as a separate state variable. The force therefore has no discontinuity when the frequency is changed during a run; a real function generator is phase-continuous too. Damping proportional to velocity is represented in the apparatus by an eddy-current brake: the motion of a conducting strip between the poles of a magnet produces, at low speed, a force of the form $F = -c\dot{x}$ [@wiederick1987; @heald1988]. Two parameters make the equation dimensionless:`,
          },
          {
            kind: "eq",
            label: "2.2",
            tex: r`\omega_0 = \sqrt{\frac{k}{m}}, \qquad \zeta = \frac{c}{2\sqrt{km}}, \qquad \gamma = \frac{c}{2m} = \zeta\omega_0`,
          },
          {
            kind: "table",
            caption: "Table 2.1. Parameter ranges adjustable in the interface.",
            head: ["Parameter", "Range"],
            rows: [
              [r`Mass $m$`, "0.5 – 10 kg"],
              [r`Spring constant $k$`, "4 – 80 N/m"],
              [r`Damping coefficient $c$`, "0 – 60 N·s/m"],
              [r`Drive amplitude $F_0$`, "0 – 25 N"],
              [r`Drive angular frequency $\omega$`, "0.2 – 14 rad/s"],
            ],
          },
        ],
      },
      {
        id: "osilator-serbest",
        title: "Free response and damping regimes",
        blocks: [
          {
            kind: "p",
            text: r`For $F_0 = 0$ the form of the solution is set by the damping ratio [@french1971; @taylor2005; @rao2017]. With initial conditions $x(0) = x_0$, $\dot{x}(0) = v_0$, the underdamped motion ($\zeta < 1$) is an oscillation inside an exponential envelope:`,
          },
          {
            kind: "eq",
            label: "2.3",
            tex: r`x(t) = e^{-\gamma t}\left[x_0\cos\omega_d t + \frac{v_0 + \gamma x_0}{\omega_d}\sin\omega_d t\right], \qquad \omega_d = \omega_0\sqrt{1-\zeta^2}`,
          },
          {
            kind: "p",
            text: r`At critical damping ($\zeta = 1$) and for overdamping ($\zeta > 1$, $s = \omega_0\sqrt{\zeta^2 - 1}$) there is no oscillation:`,
          },
          {
            kind: "eq",
            label: "2.4",
            tex: r`x(t) = \left[x_0 + (v_0 + \omega_0 x_0)\,t\right]e^{-\omega_0 t}, \qquad x(t) = e^{-\gamma t}\left[x_0\cosh st + \frac{v_0 + \gamma x_0}{s}\sinh st\right]`,
          },
          {
            kind: "p",
            text: r`The application evaluates this closed-form solution alongside the numerical one and shows the largest difference; as long as no stop is hit, the difference is the error of the solver. In the underdamped case the ratio of two successive peaks is constant. Its natural logarithm is the **logarithmic decrement**, and the sharpness of the oscillation is measured by the **quality factor**:`,
          },
          {
            kind: "eq",
            label: "2.5",
            tex: r`\Lambda = \ln\frac{x_k}{x_{k+1}} = \gamma T_d = \frac{2\pi\zeta}{\sqrt{1-\zeta^2}}, \qquad Q = \frac{\omega_0 m}{c} = \frac{1}{2\zeta}`,
          },
          {
            kind: "p",
            text: r`The first overshoot of a mass released from rest is $M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}$ times the initial displacement. At critical damping there is no overshoot, and solving $(1+\omega_0 t)e^{-\omega_0 t} = 0.02$ gives the 2 % settling time $t_s = 5.834/\omega_0$. If overshoot is allowed, settling becomes shorter still: the condition $M_p = 0.02$ holds at $\zeta \approx 0.78$, and the mass then stays inside the 2 % band from its first entry.`,
          },
        ],
      },
      {
        id: "osilator-surulen",
        title: "Driven steady state and resonance",
        blocks: [
          {
            kind: "p",
            text: r`With damping the transient decays as $e^{-\gamma t}$ and what remains is an oscillation at the drive frequency that lags the drive by $\delta$: $x(t) = A\cos(\omega t - \delta)$. Amplitude and phase lag are [@french1971; @taylor2005; @thornton2004]`,
          },
          {
            kind: "eq",
            label: "2.6",
            tex: r`A(\omega) = \frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2 + (2\gamma\omega)^2}}, \qquad \tan\delta = \frac{c\,\omega}{k - m\omega^2}, \quad 0 \le \delta \le \pi`,
          },
          {
            kind: "p",
            text: r`The amplitude is largest slightly below the natural frequency; this peak exists only for $\zeta < 1/\sqrt{2}$:`,
          },
          {
            kind: "eq",
            label: "2.7",
            tex: r`\omega_r = \omega_0\sqrt{1-2\zeta^2}, \qquad A_\mathrm{max} = \frac{F_0/k}{2\zeta\sqrt{1-\zeta^2}}`,
          },
          {
            kind: "p",
            text: r`The mean power delivered by the drive over a period, however, is largest exactly at $\omega_0$, and the full width at half maximum of the power curve is exactly $c/m$ for any damping:`,
          },
          {
            kind: "eq",
            label: "2.8",
            tex: r`\langle P\rangle = \tfrac12 c\,\omega^2 A^2, \qquad \langle P\rangle_\mathrm{max} = \frac{F_0^2}{2c}\ \ (\omega = \omega_0), \qquad \Delta\omega = \frac{c}{m} = \frac{\omega_0}{Q}`,
          },
          {
            kind: "p",
            text: r`Without damping ($c = 0$) no steady state forms. Exactly at resonance the amplitude grows in proportion to time, $x(t) = \dfrac{F_0}{2m\omega_0}\,t\sin\omega_0 t$; near resonance the interference of the two frequencies produces **beats**, with an envelope period of $2\pi/|\omega_0 - \omega|$. Both cases are among the ready-made experiments.`,
          },
          {
            kind: "note",
            tone: "info",
            title: "The measured response curve",
            text: r`The curve in the Frequency tab is relation (2.6); the points on it are amplitudes measured by the virtual instruments in steady state. The “frequency sweep” performs the same measurement automatically for a series of frequencies. At five frequencies the relative deviation of the measured amplitude from theory is at most $3.3 \times 10^{-8}$ (Chapter 7).`,
          },
        ],
      },
      {
        id: "osilator-durdurucu",
        title: "Mechanical stops and impact",
        blocks: [
          {
            kind: "p",
            text: r`The motion of the carriage is limited in both directions. On the wall side the limit is set by the **solid length** of the spring: once the coils touch, the spring cannot shorten further. For a compression spring with plain ends the solid length is $L_s = d\,(N_t + 1)$ [@budynas2015]; with $N_t = 14$ coils and $L_s = 1.45$ m the wire diameter is $d = 0.097$ m. The fixed end of the spring is at $x = -7.05$ m and the half-length of the carriage is 0.85 m, so the centre of the carriage cannot pass $x_\mathrm{min} = -7.05 + 1.45 + 0.85 = -4.75$ m. In the other direction the stop at the end of the rail sets $x_\mathrm{max} = 6.50$ m. All parts of the scene are drawn with these dimensions; no part passes through another.`,
          },
          {
            kind: "p",
            text: r`A stop is modelled as a rigid unilateral constraint. At the instant of impact Newton's kinematic law of restitution is applied [@stronge2000]:`,
          },
          { kind: "eq", label: "2.9", tex: r`v^{+} = -e\,v^{-}, \qquad \Delta Q_e = \tfrac12 m\,(v^{-})^2\,(1-e^2)` },
          {
            kind: "p",
            text: r`The kinetic energy lost is booked in the ledger as impact heat. If the net applied force keeps pressing the carriage against the stop, it rests there and leaves when the force changes sign. The instant of impact is located inside the time step by bisection (Chapter 4); compared with the closed-form solution, the error of the impact time is of order $10^{-12}$ s.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "e = 0.45 is a model parameter",
            text: r`No handbook value of the coefficient of restitution was found for a steel body striking a rubber buffer. Values measured for rigid grains striking a rubber block lie between 0.37 and 0.44 [@sandeep2021]; the chosen value is of that magnitude and means that about 80 % of the kinetic energy is lost in an impact. The coefficient of restitution really depends on the impact speed; continuous contact models that give this dependence [@hunt1975] are not used here.`,
          },
        ],
      },
      {
        id: "osilator-enerji",
        title: "The energy ledger",
        blocks: [
          {
            kind: "p",
            text: r`Multiplying equation (2.1) by $\dot{x}$ and integrating over time, with the impacts added, gives a balance that must hold at every instant:`,
          },
          {
            kind: "eq",
            label: "2.10",
            tex: r`\underbrace{\tfrac12 m\dot{x}^2}_{E_k} + \underbrace{\tfrac12 kx^2}_{E_p} + \underbrace{\int_0^t c\,\dot{x}^2\,dt'}_{Q_c} + Q_e - \underbrace{\int_0^t F_0\cos\varphi\;\dot{x}\,dt'}_{W} = E_0`,
          },
          {
            kind: "p",
            text: r`$Q_c$ and $W$ are part of the state vector and are integrated with the same method and the same step as the motion; $Q_e$ increases at impacts according to (2.9). The difference between the left-hand side and $E_0$, the **residual** $\Delta E$, is zero for an exact solution; any non-zero value is numerical error. The residual is shown continuously in the status bar and in the Energy tab; its relative value uses as denominator the largest of $|E_0|$, the instantaneous mechanical energy and $Q + |W|$. In a 60-second verification experiment with damping, drive and 27 impacts together, the relative residual does not exceed $1.3 \times 10^{-12}$.`,
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "sarkac",
    number: "3",
    title: "The N-link pendulum",
    summary:
      "Lagrangian and equations of motion, joint friction, the exact period of the single pendulum, small-oscillation modes, rod forces and the energy threshold for going over the top.",
    sections: [
      {
        id: "sarkac-model",
        title: "Model and Lagrangian",
        blocks: [
          {
            kind: "p",
            text: r`The chain consists of $N$ massless rigid rods; rod $i$ has length $L_i$ and carries a point mass $m_i$ at its lower end. The generalised coordinates are the absolute angles of the rods from the downward vertical, $\theta_1,\dots,\theta_N$. With the total mass below a joint written as $\mu_i = \sum_{k \ge i} m_k$, the kinetic and potential energies are [@goldstein2002; @landau1976; @konishi2023]`,
          },
          {
            kind: "eq",
            label: "3.1",
            tex: r`T = \frac12\sum_{i=1}^{N}\sum_{j=1}^{N}\mu_{\max(i,j)}\,L_iL_j\cos(\theta_i-\theta_j)\,\dot\theta_i\dot\theta_j, \qquad V = g\sum_{i=1}^{N}\mu_iL_i\,(1-\cos\theta_i)`,
          },
          {
            kind: "p",
            text: r`The potential energy is measured from the hanging equilibrium; its largest value, $2g\sum_i\mu_iL_i$, belongs to the chain standing straight up. Choosing absolute angles keeps the mass matrix symmetric and its structure simple; the price is that joint friction depends on the difference of neighbouring angular velocities.`,
          },
          {
            kind: "table",
            caption: "Table 3.1. Parameter ranges and ready-made values of gravity.",
            head: ["Quantity", "Value", "Source"],
            rows: [
              [r`Masses $m_i$`, "0.3 – 6 kg", "–"],
              [r`Rod lengths $L_i$`, "0.4 – 1.8 m", "–"],
              [r`Joint damping $b$`, "0 – 2 N·m·s/rad", "–"],
              ["Earth (standard acceleration of gravity)", r`$9.80665\ \mathrm{m/s^2}$, exact by definition`, "[@cgpm1901; @bipm2019si]"],
              ["Moon", r`$1.62\ \mathrm{m/s^2}$`, "[@nasa_moonfact]"],
              ["Mars", r`$3.73\ \mathrm{m/s^2}$ (mean surface gravity)`, "[@nasa_marsfact]"],
              ["Jupiter", r`$25.92\ \mathrm{m/s^2}$ (mean, 1 bar level)`, "[@nasa_jupiterfact]"],
              [
                "Free fall",
                r`The idealisation $g = 0$; on the International Space Station the quasi-steady residual acceleration is of order $10^{-6}g$`,
                "[@delombard2006]",
              ],
            ],
          },
        ],
      },
      {
        id: "sarkac-denklem",
        title: "Equations of motion",
        blocks: [
          { kind: "p", text: r`The Euler–Lagrange equations read, for every $i$,` },
          {
            kind: "eq",
            label: "3.2",
            tex: r`\sum_{j=1}^{N}\mu_{\max(i,j)}L_iL_j\left[\cos(\theta_i-\theta_j)\,\ddot\theta_j + \sin(\theta_i-\theta_j)\,\dot\theta_j^{\,2}\right] + \mu_i\,g\,L_i\sin\theta_i = Q_i`,
          },
          {
            kind: "p",
            text: r`where $Q_i$ is the non-conservative generalised force. The coefficient matrix of the accelerations, $A_{ij} = \mu_{\max(i,j)}L_iL_j\cos(\theta_i-\theta_j)$, is symmetric and positive definite, because $T = \tfrac12\dot{\boldsymbol\theta}^{\mathsf T}\mathbf{A}\,\dot{\boldsymbol\theta}$ is positive for every non-zero velocity. The accelerations are therefore obtained at every step by Cholesky factorisation [@golub2013]; a failure of the factorisation would indicate an error in the model. For $N = 1$ the equation reduces to the familiar $\ddot\theta = -(g/L)\sin\theta$. The same Lagrangian for the multiple pendulum is given in peer-reviewed publications [@konishi2023; @braun2003; @udwadia2015].`,
          },
        ],
      },
      {
        id: "sarkac-surtunme",
        title: "Joint friction",
        blocks: [
          {
            kind: "p",
            text: r`Every joint exerts a friction torque proportional to the relative angular velocity of the two rods it connects; for the fixed pivot $\dot\theta_0 = 0$. The Rayleigh dissipation function, quadratic in the velocities [@rayleigh1873; @goldstein2002], and the generalised forces derived from it are`,
          },
          {
            kind: "eq",
            label: "3.3",
            tex: r`D = \frac{b}{2}\sum_{i=1}^{N}\left(\dot\theta_i - \dot\theta_{i-1}\right)^2, \qquad Q_i = -\frac{\partial D}{\partial\dot\theta_i} = -b\,(\dot\theta_i-\dot\theta_{i-1}) + b\,(\dot\theta_{i+1}-\dot\theta_i)`,
          },
          {
            kind: "p",
            text: r`the last term being absent for the lowest rod. The power converted to heat is $2D$. It is integrated as an additional state variable, and the energy ledger is monitored in the form $T + V + Q_b = E_0$. The model is viscous friction; it contains neither dry (Coulomb) friction nor air drag.`,
          },
        ],
      },
      {
        id: "sarkac-periyot",
        title: "The single pendulum: exact period",
        blocks: [
          {
            kind: "p",
            text: r`With $\sin\theta \approx \theta$ for small angles the period is independent of the amplitude, $T_0 = 2\pi\sqrt{L/g}$. The approximation fails as the amplitude $\theta_0$ grows. The exact period, obtained from the conservation of energy, is given by the complete elliptic integral of the first kind $K$ [@belendez2007; @dlmf; @nelson1986]:`,
          },
          {
            kind: "eq",
            label: "3.4",
            tex: r`T = 4\sqrt{\frac{L}{g}}\;K\!\left(\sin\frac{\theta_0}{2}\right) = T_0\left(1 + \frac{\theta_0^2}{16} + \frac{11\,\theta_0^4}{3072} + \cdots\right)`,
          },
          {
            kind: "p",
            text: r`$K$ is computed with the arithmetic–geometric mean: $K(k) = \pi/\bigl(2\,\mathrm{AGM}(1,\sqrt{1-k^2})\bigr)$, hence $T = T_0/\mathrm{AGM}(1,\cos(\theta_0/2))$ [@carvalhaes2008]. The iteration converges quadratically; five or six steps suffice in double precision. If the pendulum has enough energy to go over the top, the motion is continuous rotation rather than oscillation. The parameter $\kappa^2 = E/(2mgL) = \sin^2(\theta/2) + L\dot\theta^2/(4g)$, defined with the energy measured from the lowest point, separates the two: $\kappa < 1$ is libration, $\kappa > 1$ rotation, and $\kappa = 1$ the separatrix, whose period is infinite. The time of one full revolution is`,
          },
          { kind: "eq", label: "3.5", tex: r`T_\mathrm{rot} = \frac{2}{\kappa}\sqrt{\frac{L}{g}}\;K\!\left(\frac{1}{\kappa}\right), \qquad \kappa > 1` },
          {
            kind: "table",
            caption: "Table 3.2. Ratio of the period of the single pendulum to its small-angle value.",
            head: [r`Amplitude $\theta_0$`, "5°", "10°", "30°", "60°", "90°", "120°", "150°", "170°"],
            rows: [[r`$T/T_0$`, "1.0005", "1.0019", "1.0174", "1.0732", "1.1803", "1.3729", "1.7622", "2.4394"]],
          },
          {
            kind: "p",
            text: r`The Measurements tab computes these theoretical values from the instantaneous energy and compares them with the reading of the period meter. In the verification experiments the relative difference between the measured period and (3.4) or (3.5) does not exceed $2.4 \times 10^{-10}$ for amplitudes from 10° to 170° and for rotation.`,
          },
        ],
      },
      {
        id: "sarkac-modlar",
        title: "Small oscillations and normal modes",
        blocks: [
          {
            kind: "p",
            text: r`Linearised about the hanging equilibrium, the frictionless equations become $\mathbf{M}\ddot{\boldsymbol\theta} + \mathbf{K}\boldsymbol\theta = \mathbf{0}$ with $M_{ij} = \mu_{\max(i,j)}L_iL_j$ and $\mathbf{K} = g\,\mathrm{diag}(\mu_iL_i)$. The ansatz $\boldsymbol\theta = \mathbf{a}\cos(\omega t + \varphi)$ gives the generalised symmetric eigenvalue problem`,
          },
          { kind: "eq", label: "3.6", tex: r`\left(\mathbf{K} - \omega^2\mathbf{M}\right)\mathbf{a} = \mathbf{0}` },
          {
            kind: "p",
            text: r`It has $N$ positive eigenvalues, each a **normal mode** in which all parts oscillate with the same frequency. For a double pendulum with equal masses and equal lengths, $\omega^2 = (2 \mp \sqrt{2})\,g/L$ with angle ratios $\theta_2/\theta_1 = \pm\sqrt{2}$ [@taylor2005]. For a chain of $N$ links with equal masses and equal lengths the eigenfrequencies are given by the zeros of the Laguerre polynomial [@muller2007; @braun2003]:`,
          },
          { kind: "eq", label: "3.7", tex: r`\omega_k^2 = \frac{g}{\ell}\,x_k, \qquad L_N(x_k) = 0, \quad k = 1,\dots,N` },
          {
            kind: "p",
            text: r`As the number of links grows, the chain approaches a hanging rope of total length $\Lambda$, whose frequencies are given by the zeros of the Bessel function $J_0$, $\omega_k = \tfrac12 j_{0,k}\sqrt{g/\Lambda}$ with $j_{0,1} = 2.4048$ [@verbin2015; @dlmf10]. The oscillations of the hanging chain were first solved by Daniel Bernoulli [@bernoulli1738; @bernoulli1740; @cannon1981]. Convergence is slow: the fundamental frequency of a chain of six equal links is 3.8 % below the rope value. The application solves problem (3.6) numerically for the chain at hand; for equal chains the result agrees with (3.7) to a relative error of $10^{-15}$.`,
          },
        ],
      },
      {
        id: "sarkac-kuvvet",
        title: "Rod forces: an independent check",
        blocks: [
          {
            kind: "p",
            text: r`The forces in the free-body diagram are not computed from the Lagrangian equations but from Newton's second law written for every mass separately: once the accelerations are known, the force each rod must carry is found starting from the lowest mass. An ideal rod carries force only along its own direction; the component of the computed force perpendicular to the rod must therefore vanish if the two derivations are consistent. Over 200 randomly chosen states the ratio of the perpendicular component to the tension does not exceed $6 \times 10^{-15}$. For the single pendulum the result reduces to the known relation $T = m(g\cos\theta + L\dot\theta^2)$.`,
          },
          {
            kind: "note",
            tone: "info",
            title: "Negative tension",
            text: r`In fast motion the axial force in a rod can change sign: the rod is pushed instead of pulled. A rigid rod carries this; had the same apparatus been built with strings, the string would go slack at that instant. The Measurements tab marks this state as “compression”.`,
          },
        ],
      },
      {
        id: "sarkac-esik",
        title: "The energy threshold for going over the top",
        blocks: [
          {
            kind: "p",
            text: r`For rod $k$ to pass through the upright position ($\theta_k = \pi$), the mechanical energy must be at least the potential-energy term belonging to that rod. The smallest threshold over all rods is`,
          },
          { kind: "eq", label: "3.8", tex: r`E^{\ast} = \min_k\; 2\,g\,\mu_kL_k` },
          {
            kind: "p",
            text: r`Below it no rod can go over the top; being above it is a necessary but not a sufficient condition. For a double pendulum of point masses with equal masses and equal lengths released from rest, the condition takes the form $2\cos\theta_1 + \cos\theta_2 > 1$: a pendulum released from this region can never flip.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "The condition “3 cos θ₁ + cos θ₂ > 2” belongs to a different model",
            text: r`This frequently quoted inequality holds for the compound double pendulum made of two identical rods with uniformly distributed mass [@heyl2008; @rafat2009]. The model used here has point masses, so the coefficients differ; the two conditions are not interchangeable.`,
          },
        ],
      },
    ],
  },
];
