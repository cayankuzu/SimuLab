# SimuLab: A Verified, Interactive Computational-Physics Laboratory for Oscillations and Deterministic Chaos

**Technical report: theory, numerical methods and verification**

*This document was generated from the source code with “npm run docs” on 2026-11-11. To change the text, edit the files under src/content/theory.*

## Abstract

This report documents the theoretical basis, the numerical methods and the verification results of SimuLab, a three-dimensional physics laboratory that runs in the browser. The laboratory contains two experiments: a damped, harmonically driven spring–mass oscillator with rigid end stops, and a planar pendulum chain of N = 1…6 links. The equations of motion are integrated with fixed-step explicit Runge–Kutta methods (default: the classical fourth-order method, h = 1 ms). The sequence of steps does not depend on the display refresh rate, so even chaotic trajectories are reproduced exactly from the same initial conditions. An energy ledger in which every term is integrated separately (kinetic and potential energy, damping heat, impact heat, work done by the drive) keeps the numerical error visible throughout a run. Fourteen verification experiments compare the solver with closed-form solutions, conservation laws and independent derivations: the observed order of accuracy of the classical Runge–Kutta method is 4.005; the largest position error of the free response over 20 s, in four damping regimes, is 1.6×10⁻¹⁰ m; the measured period of the finite-amplitude pendulum deviates from the elliptic-integral solution by less than 3×10⁻¹⁰ in relative terms; the relative energy drift of the frictionless double pendulum over 60 s is 2×10⁻⁹. Chaos is examined quantitatively: the largest Lyapunov exponent estimated by Benettin's method, the separation of a twin trajectory, a Poincaré section and the amplitude spectrum are presented together. Nine measurement-based task sheets require quantities such as period, damping ratio and resonance amplitude to be measured with virtual instruments and compared with theory. The report also corrects, with sources, several misconceptions common in textbooks and states the assumptions and limitations of the model explicitly.

**Keywords:** computational physics; harmonic oscillator; resonance; multiple pendulum; deterministic chaos; Lyapunov exponent; Runge–Kutta methods; verification and validation; physics education.

## Contents

- [1. Scope, related work and notation](#kapsam)
  - [Purpose and scope](#kapsam-amac)
  - [Related work](#kapsam-ilgili)
  - [Notation and units](#kapsam-gosterim)
- [2. The damped, driven oscillator](#osilator)
  - [Model and equation of motion](#osilator-model)
  - [Free response and damping regimes](#osilator-serbest)
  - [Driven steady state and resonance](#osilator-surulen)
  - [Mechanical stops and impact](#osilator-durdurucu)
  - [The energy ledger](#osilator-enerji)
- [3. The N-link pendulum](#sarkac)
  - [Model and Lagrangian](#sarkac-model)
  - [Equations of motion](#sarkac-denklem)
  - [Joint friction](#sarkac-surtunme)
  - [The single pendulum: exact period](#sarkac-periyot)
  - [Small oscillations and normal modes](#sarkac-modlar)
  - [Rod forces: an independent check](#sarkac-kuvvet)
  - [The energy threshold for going over the top](#sarkac-esik)
- [4. Numerical methods](#sayisal)
  - [Explicit one-step methods](#sayisal-yontemler)
  - [Stability and energy behaviour](#sayisal-kararlilik)
  - [The fixed-step loop and reproducibility](#sayisal-dongu)
  - [Locating the instant of impact](#sayisal-olay)
  - [Adaptive stepping: Dormand–Prince 5(4)](#sayisal-uyarlamali)
  - [Linear algebra and special functions](#sayisal-cebir)
- [5. Deterministic chaos](#kaos)
  - [Sensitivity to initial conditions](#kaos-duyarlilik)
  - [Estimating the Lyapunov exponent](#kaos-benettin)
  - [The prediction horizon](#kaos-ufuk)
  - [When chaos is possible](#kaos-kosul)
  - [The Poincaré section](#kaos-poincare)
  - [What numerical accuracy means on chaotic trajectories](#kaos-dogruluk)
- [6. Measurement and analysis tools](#olcum)
  - [Virtual instruments](#olcum-cihazlar)
  - [The amplitude spectrum](#olcum-spektrum)
  - [Plots and colours](#olcum-grafikler)
  - [Data export](#olcum-veri)
  - [Sonification](#olcum-ses)
- [7. Verification](#dogrulama)
  - [Verification versus validation](#dogrulama-yontem)
  - [Summary of results](#dogrulama-sonuclar)
  - [Interpretation of the results](#dogrulama-yorum)
- [8. Common misconceptions and their corrections](#yanilgilar)
  - [On resonance](#yanilgilar-rezonans)
  - [On damping](#yanilgilar-sonum)
  - [On the pendulum](#yanilgilar-sarkac)
  - [On chaos](#yanilgilar-kaos)
- [9. Assumptions and limitations](#sinirlar)
  - [The physical model](#sinirlar-model)
  - [The numerical results](#sinirlar-sayisal)
  - [Validation and educational effect](#sinirlar-gecerleme)
  - [Future work](#sinirlar-gelecek)
- [10. Software architecture](#mimari)
  - [Layers and data flow](#mimari-katmanlar)
  - [The fixed-step loop](#mimari-dongu)
  - [Quality assurance](#mimari-kalite)
  - [Comparison with the state before the rewrite](#mimari-karsilastirma)
- [11. Interface and interaction design](#arayuz)
  - [Layout: parameters, scene and plots at the same time](#arayuz-yerlesim)
  - [Direct manipulation](#arayuz-manipulasyon)
  - [Quantity-to-colour mapping](#arayuz-renk)
  - [Vectors to scale and measuring devices in the scene](#arayuz-vektor)
  - [Plots](#arayuz-grafik)
  - [Accessibility](#arayuz-erisilebilirlik)
  - [Sonification](#arayuz-ses)
- [12. Pedagogical design](#pedagoji)
  - [Findings on learning with simulations](#pedagoji-bulgular)
  - [Construction of the task sheets](#pedagoji-foyler)
- [Appendix A. Verification tables](#verification)
- [References](#references)

<a id="kapsam"></a>

## 1. Scope, related work and notation

*What the laboratory models, where it differs from similar tools, and the symbols used throughout the text.*

<a id="kapsam-amac"></a>

### Purpose and scope

SimuLab solves two classical mechanical systems in the browser, in a three-dimensional scene and in real time: a damped, harmonically driven **spring–mass oscillator** with rigid end stops, and a planar **pendulum chain** of $`N = 1,\dots,6`$ links. The first gathers all the basic concepts of linear vibration theory (natural frequency, damping ratio, resonance, phase lag, transient and steady state) in one equation; the second is the non-linear end of the same mechanics and shows deterministic chaos for $`N \ge 2`$.

The claim of this work is not visual appeal but **verifiability**. Every numerical result has been compared with a problem whose answer is known independently (Chapter 7); an energy ledger shows the numerical error throughout a run; the trajectory seen on screen depends only on the initial conditions, the parameters and the chosen method, not on the display refresh rate (Chapter 4). Every factual statement in the text rests on a derivation, on a measured verification result or on a publication whose bibliographic record was checked against a primary source.

> **Limitation — The third dimension belongs to the visualisation**
>
> The dynamics of both systems are planar: the oscillator has one degree of freedom and the pendulum chain moves in a vertical plane. The three-dimensional scene lets the apparatus be inspected like a laboratory bench; a spherical pendulum or out-of-plane motion is not modelled.

<a id="kapsam-ilgili"></a>

### Related work

Table 1.1 summarises the models and time-stepping methods of widely used free tools for oscillations and pendulums. The information was compiled from the tools' own pages, their documentation and, where accessible, their source code.

*Table 1.1. Similar tools: model and time-stepping method.*

| Tool | Model | Time stepping | Source |
| --- | --- | --- | --- |
| PhET Pendulum Lab | One or two independent simple pendulums, two-dimensional | Classical RK4, at least 7 sub-steps per frame | [[1](#ref-1)] |
| PhET Masses and Springs | Vertical spring–mass, two-dimensional | No time stepping: the closed-form solution of the damped oscillator is evaluated every frame | [[2](#ref-2)] |
| myPhysicsLab | About 50 simulations including the double pendulum, all two-dimensional | RK4 by default, step 0.025 s; Euler only as an option | [[3](#ref-3)] |
| Easy Java/JavaScript Simulations, Open Source Physics | Authoring tool and model collection; includes a double pendulum with a Poincaré section | Default for a new ODE page: adaptive Cash–Karp 5(4) | [[4](#ref-4), [5](#ref-5), [6](#ref-6)] |
| GeoGebra, oPhysics | Applets written by users | The SolveODE command is based on Runge–Kutta methods | [[7](#ref-7), [8](#ref-8)] |
| Algodoo | Two-dimensional sandbox | Variational integrators, according to the vendor | [[9](#ref-9), [10](#ref-10)] |
| Falstad, W. Fendt | Two-dimensional applets | Normal-mode or closed-form formulas | [[11](#ref-11), [12](#ref-12)] |
| Web VPython | Three-dimensional programming environment | Euler–Cromer by design in introductory courses | [[13](#ref-13)] |

> **Common misconception — “Educational simulations use Euler's method”**
>
> This generalisation does not hold for the tools named: PhET Pendulum Lab and myPhysicsLab use the fourth-order Runge–Kutta method, PhET Masses and Springs does not step in time at all, and Easy Java/JavaScript Simulations starts with an adaptive method. Euler-type stepping is a deliberate choice in introductory courses where students write the code themselves [[13](#ref-13)]. The contribution of this work is therefore not “a better integrator”; it is that the error is measured, displayed and documented.

To the best of our knowledge, none of the widely used free tools surveyed (PhET, myPhysicsLab, Open Source Physics and EJS, GeoGebra and oPhysics, Algodoo, Falstad, W. Fendt) offers the following together: a pendulum chain of up to six links, an estimate of the largest Lyapunov exponent during the run, an always-on energy ledger and exportable telemetry. This is a negative search result, not a proof. There are open-source personal projects with little adoption that overlap in part; for example the GitHub repository “Chaotic-n-Pendulums-Visualizer” offers a Benettin estimate on demand for a planar N-link pendulum. For a recent review on teaching chaos with the double pendulum see [[14](#ref-14)]; for examples of browser-based laboratories see [[15](#ref-15), [16](#ref-16)].

The evidence on the effect of virtual laboratories on learning is mixed. In one study students who worked with a simulation outperformed those who worked with real equipment both on conceptual questions and in building a real circuit [[17](#ref-17)]; physical and virtual materials were found equally effective for teaching experimental design [[18](#ref-18)]; in a study with seventh-graders on pendulum problems no difference was found between simulation and hands-on experiment, and students controlled variables less often in the simulation [[19](#ref-19)]. A review covering 2001–2010 reports that simulations can support laboratory activities in particular, but that most studies ignored teacher support and the lesson scenario [[20](#ref-20)]; for a comparative assessment of physical and virtual laboratories see [[21](#ref-21)]. This report claims no learning gain for its own tool (Chapter 9).

<a id="kapsam-gosterim"></a>

### Notation and units

All quantities are given in SI units; the symbols follow ISO 80000 [[22](#ref-22), [23](#ref-23), [24](#ref-24)]. A dot denotes the derivative with respect to time. Angles are measured from the downward vertical, counter-clockwise, in radians; the interface also shows degrees for convenience. Numbers are written with a decimal point in the interface and in this text, so that a value read on screen can be typed back into a numeric field and is identical to the exported data.

*Table 1.2. Principal symbols.*

| Symbol | Meaning | Unit |
| --- | --- | --- |
| $`m`$, $`k`$, $`c`$ | Mass, spring constant, viscous damping coefficient | kg, N/m, N·s/m |
| $`F_0`$, $`\omega`$, $`\varphi`$ | Amplitude, angular frequency and phase of the driving force | N, rad/s, rad |
| $`\omega_0`$, $`\zeta`$, $`\gamma`$ | Natural angular frequency, damping ratio, amplitude decay rate $`c/(2m)`$ | rad/s, –, 1/s |
| $`A`$, $`\delta`$ | Steady-state amplitude and phase lag of the displacement behind the force | m, rad |
| $`e`$ | Coefficient of restitution | – |
| $`\theta_i`$, $`m_i`$, $`L_i`$ | Angle of rod $`i`$, the mass at its end and the length of the rod | rad, kg, m |
| $`\mu_i`$ | Total mass from joint $`i`$ downwards, $`\sum_{k \ge i} m_k`$ | kg |
| $`b`$ | Viscous friction coefficient of a joint | N·m·s/rad |
| $`E_k`$, $`E_p`$, $`Q`$, $`W`$ | Kinetic energy, potential energy, energy converted to heat, work done by the drive | J |
| $`h`$, $`p`$ | Time step, order of the method | s, – |
| $`\lambda`$ | Largest Lyapunov exponent | 1/s |

<a id="osilator"></a>

## 2. The damped, driven oscillator

*Equation of motion, the three damping regimes, driven steady state and resonance, mechanical stops, and an energy balance in which every term is tracked separately.*

<a id="osilator-model"></a>

### Model and equation of motion

A carriage of mass $`m`$ moves on a frictionless rail, is attached to the wall by a linear spring of constant $`k`$ and is acted on by a damping force proportional to its velocity and by a harmonic driving force. For the displacement $`x`$ measured from equilibrium,

```math
m\ddot{x} + c\dot{x} + kx = F_0\cos\varphi, \qquad \dot{\varphi} = \omega \tag{2.1}
```

The phase $`\varphi`$ of the drive is a state variable of its own. The force therefore has no discontinuity when the frequency is changed during a run; a real function generator is phase-continuous too. Between two changes of a parameter $`\dot{\varphi} = \omega`$ is constant, so the phase is not accumulated step by step: at the end of every step it is set to $`\varphi_b + \omega\,(t - t_b)`$, where $`t_b`$ and $`\varphi_b`$ are the time and the phase at the start of the run or at the last such change (Chapter 4). Damping proportional to velocity is represented in the apparatus by an eddy-current brake: the motion of a conducting strip between the poles of a magnet produces, at low speed, a force of the form $`F = -c\dot{x}`$ [[25](#ref-25), [26](#ref-26)]. Two parameters make the equation dimensionless:

```math
\omega_0 = \sqrt{\frac{k}{m}}, \qquad \zeta = \frac{c}{2\sqrt{km}}, \qquad \gamma = \frac{c}{2m} = \zeta\omega_0 \tag{2.2}
```

*Table 2.1. Parameter ranges adjustable in the interface.*

| Parameter | Range |
| --- | --- |
| Mass $`m`$ | 0.5 – 10 kg |
| Spring constant $`k`$ | 4 – 80 N/m |
| Damping coefficient $`c`$ | 0 – 60 N·s/m |
| Drive amplitude $`F_0`$ | 0 – 25 N |
| Drive angular frequency $`\omega`$ | 0.2 – 14 rad/s |

<a id="osilator-serbest"></a>

### Free response and damping regimes

For $`F_0 = 0`$ the form of the solution is set by the damping ratio [[27](#ref-27), [28](#ref-28), [29](#ref-29)]. With initial conditions $`x(0) = x_0`$, $`\dot{x}(0) = v_0`$, the underdamped motion ($`\zeta < 1`$) is an oscillation inside an exponential envelope:

```math
x(t) = e^{-\gamma t}\left[x_0\cos\omega_d t + \frac{v_0 + \gamma x_0}{\omega_d}\sin\omega_d t\right], \qquad \omega_d = \omega_0\sqrt{1-\zeta^2} \tag{2.3}
```

At critical damping ($`\zeta = 1`$) and for overdamping ($`\zeta > 1`$, $`s = \omega_0\sqrt{\zeta^2 - 1}`$) there is no oscillation:

```math
x(t) = \left[x_0 + (v_0 + \omega_0 x_0)\,t\right]e^{-\omega_0 t}, \qquad x(t) = e^{-\gamma t}\left[x_0\cosh st + \frac{v_0 + \gamma x_0}{s}\sinh st\right] \tag{2.4}
```

The application evaluates this closed-form solution alongside the numerical one and shows the largest difference; as long as no stop is hit, the difference is the error of the solver. In the ready-made experiment “Undamped” ($`m = 2`$ kg, $`k = 24`$ N/m, $`x_0 = 2`$ m) it amounts to $`4.9 \times 10^{-10}`$ m after 60 s with the default step of 1 ms and to $`3.1 \times 10^{-11}`$ m with half that step: the factor of 16 that a fourth-order method must show. In the underdamped case the ratio of two successive peaks is constant. Its natural logarithm is the **logarithmic decrement**, and the sharpness of the oscillation is measured by the **quality factor**:

```math
\Lambda = \ln\frac{x_k}{x_{k+1}} = \gamma T_d = \frac{2\pi\zeta}{\sqrt{1-\zeta^2}}, \qquad Q = \frac{\omega_0 m}{c} = \frac{1}{2\zeta} \tag{2.5}
```

The first overshoot of a mass released from rest is $`M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}`$ times the initial displacement. At critical damping there is no overshoot, and solving $`(1+\omega_0 t)e^{-\omega_0 t} = 0.02`$ gives the 2 % settling time $`t_s = 5.834/\omega_0`$. If overshoot is allowed, settling becomes shorter still: the condition $`M_p = 0.02`$ holds at $`\zeta \approx 0.78`$, and the mass then stays inside the 2 % band from its first entry.

<a id="osilator-surulen"></a>

### Driven steady state and resonance

With damping the transient decays, at the rate $`\gamma`$ for $`\zeta \le 1`$ and at the rate $`\gamma - \sqrt{\gamma^2 - \omega_0^2}`$ of its slower term for $`\zeta > 1`$. What remains is an oscillation at the drive frequency that lags the drive by $`\delta`$: $`x(t) = A\cos(\omega t - \delta)`$. Amplitude and phase lag are [[27](#ref-27), [28](#ref-28), [30](#ref-30)]

```math
A(\omega) = \frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2 + (2\gamma\omega)^2}}, \qquad \tan\delta = \frac{c\,\omega}{k - m\omega^2}, \quad 0 \le \delta \le \pi \tag{2.6}
```

The amplitude is largest slightly below the natural frequency; this peak exists only for $`\zeta < 1/\sqrt{2}`$:

```math
\omega_r = \omega_0\sqrt{1-2\zeta^2}, \qquad A_\mathrm{max} = \frac{F_0/k}{2\zeta\sqrt{1-\zeta^2}} \tag{2.7}
```

The mean power delivered by the drive over a period, however, is largest exactly at $`\omega_0`$, and the full width at half maximum of the power curve is exactly $`c/m`$ for any damping:

```math
\langle P\rangle = \tfrac12 c\,\omega^2 A^2, \qquad \langle P\rangle_\mathrm{max} = \frac{F_0^2}{2c}\ \ (\omega = \omega_0), \qquad \Delta\omega = \frac{c}{m} = \frac{\omega_0}{Q} \tag{2.8}
```

Without damping ($`c = 0`$) no steady state forms. Exactly at resonance the amplitude grows in proportion to time, $`x(t) = \dfrac{F_0}{2m\omega_0}\,t\sin\omega_0 t`$; near resonance the interference of the two frequencies produces **beats**, with an envelope period of $`2\pi/|\omega_0 - \omega|`$. Both cases are among the ready-made experiments.

> **Note — The measured response curve**
>
> The curve in the Frequency tab is relation (2.6); the points on it are amplitudes measured by the virtual instruments. The running experiment adds one point per oscillation, and these points settle onto the curve as the transient decays. The “frequency sweep” makes the measurement in the steady state at 25 frequencies between $`0.3\,\omega_0`$ and $`2\,\omega_0`$: for each of them the equation is integrated separately (RK4, $`h = 2`$ ms) until the slowest term of the transient has decayed by a factor of $`e^{-12}`$. The sweep is offered for $`\zeta \ge 0.01`$; with less damping the steady state takes impractically long to reach. In the verification experiment, at five frequencies, the relative deviation of the measured amplitude from theory is at most $`3.3 \times 10^{-8}`$ (Chapter 7).

<a id="osilator-durdurucu"></a>

### Mechanical stops and impact

The motion of the carriage is limited in both directions. On the wall side the limit is set by the **solid length** of the spring: once the coils touch, the spring cannot shorten further. For a compression spring with plain ends the solid length is $`L_s = d\,(N_t + 1)`$ [[31](#ref-31)]; with $`N_t = 14`$ coils and $`L_s = 1.45`$ m the wire diameter is $`d = 0.097`$ m. The fixed end of the spring is at $`x = -7.05`$ m and the half-length of the carriage is 0.85 m, so the centre of the carriage cannot pass $`x_\mathrm{min} = -7.05 + 1.45 + 0.85 = -4.75`$ m. In the other direction the stop at the end of the rail sets $`x_\mathrm{max} = 6.50`$ m. All parts of the scene are drawn with these dimensions; no part passes through another.

A stop is modelled as a rigid unilateral constraint. At the instant of impact Newton's kinematic law of restitution is applied [[32](#ref-32)]:

```math
v^{+} = -e\,v^{-}, \qquad \Delta Q_e = \tfrac12 m\,(v^{-})^2\,(1-e^2) \tag{2.9}
```

The kinetic energy lost is booked in the ledger as impact heat. If the net applied force keeps pressing the carriage against the stop, it rests there and leaves when the force changes sign. The instant of impact is located inside the time step by bisection (Chapter 4); compared with the closed-form solution, the error of the impact time is of order $`10^{-12}`$ s.

> **Limitation — e = 0.45 is a model parameter**
>
> No handbook value of the coefficient of restitution was found for a steel body striking a rubber buffer. Values measured for rigid grains striking a rubber block lie between 0.37 and 0.44 [[33](#ref-33)]; the chosen value is of that magnitude and means that about 80 % of the kinetic energy is lost in an impact. The coefficient of restitution really depends on the impact speed; continuous contact models that give this dependence [[34](#ref-34)] are not used here.

<a id="osilator-enerji"></a>

### The energy ledger

Multiplying equation (2.1) by $`\dot{x}`$ and integrating over time, with the impacts added, gives a balance that must hold at every instant:

```math
\underbrace{\tfrac12 m\dot{x}^2}_{E_k} + \underbrace{\tfrac12 kx^2}_{E_p} + \underbrace{\int_0^t c\,\dot{x}^2\,dt'}_{Q_c} + Q_e - \underbrace{\int_0^t F_0\cos\varphi\;\dot{x}\,dt'}_{W} = E_0 \tag{2.10}
```

$`Q_c`$ and $`W`$ are part of the state vector and are integrated with the same method and the same step as the motion; $`Q_e`$ increases at impacts according to (2.9). The difference between the left-hand side and $`E_0`$, the **residual** $`\Delta E`$, is zero for an exact solution; any non-zero value is numerical error. The residual is shown continuously in the status bar and in the Energy tab; its relative value uses as denominator the largest of $`|E_0|`$, the instantaneous mechanical energy and $`Q + |W|`$. In a 60-second verification experiment with damping, drive and 27 impacts together, the relative residual does not exceed $`1.3 \times 10^{-12}`$.

<a id="sarkac"></a>

## 3. The N-link pendulum

*Lagrangian and equations of motion, joint friction, the exact period of the single pendulum, small-oscillation modes, rod forces and the energy threshold for going over the top.*

<a id="sarkac-model"></a>

### Model and Lagrangian

The chain consists of $`N`$ massless rigid rods; rod $`i`$ has length $`L_i`$ and carries a point mass $`m_i`$ at its lower end. The generalised coordinates are the absolute angles of the rods from the downward vertical, $`\theta_1,\dots,\theta_N`$. With the total mass below a joint written as $`\mu_i = \sum_{k \ge i} m_k`$, the kinetic and potential energies are [[35](#ref-35), [36](#ref-36), [37](#ref-37)]

```math
T = \frac12\sum_{i=1}^{N}\sum_{j=1}^{N}\mu_{\max(i,j)}\,L_iL_j\cos(\theta_i-\theta_j)\,\dot\theta_i\dot\theta_j, \qquad V = g\sum_{i=1}^{N}\mu_iL_i\,(1-\cos\theta_i) \tag{3.1}
```

The potential energy is measured from the hanging equilibrium; its largest value, $`2g\sum_i\mu_iL_i`$, belongs to the chain standing straight up. Choosing absolute angles keeps the mass matrix symmetric and its structure simple; the price is that joint friction depends on the difference of neighbouring angular velocities.

*Table 3.1. Parameter ranges and ready-made values of gravity.*

| Quantity | Value | Source |
| --- | --- | --- |
| Masses $`m_i`$ | 0.3 – 6 kg | – |
| Rod lengths $`L_i`$ | 0.4 – 1.8 m | – |
| Joint damping $`b`$ | 0 – 2 N·m·s/rad | – |
| Earth (standard acceleration of gravity) | $`9.80665\ \mathrm{m/s^2}`$, exact by definition | [[38](#ref-38), [24](#ref-24)] |
| Moon | $`1.62\ \mathrm{m/s^2}`$ | [[39](#ref-39)] |
| Mars | $`3.73\ \mathrm{m/s^2}`$ (mean surface gravity) | [[40](#ref-40)] |
| Jupiter | $`25.92\ \mathrm{m/s^2}`$ (mean, 1 bar level) | [[41](#ref-41)] |
| Free fall | The idealisation $`g = 0`$; on the International Space Station the quasi-steady residual acceleration is of order $`10^{-6}g`$ | [[42](#ref-42)] |

<a id="sarkac-denklem"></a>

### Equations of motion

The Euler–Lagrange equations read, for every $`i`$,

```math
\sum_{j=1}^{N}\mu_{\max(i,j)}L_iL_j\left[\cos(\theta_i-\theta_j)\,\ddot\theta_j + \sin(\theta_i-\theta_j)\,\dot\theta_j^{\,2}\right] + \mu_i\,g\,L_i\sin\theta_i = Q_i \tag{3.2}
```

where $`Q_i`$ is the non-conservative generalised force. The coefficient matrix of the accelerations, $`A_{ij} = \mu_{\max(i,j)}L_iL_j\cos(\theta_i-\theta_j)`$, is symmetric and positive definite, because $`T = \tfrac12\dot{\boldsymbol\theta}^{\mathsf T}\mathbf{A}\,\dot{\boldsymbol\theta}`$ is positive for every non-zero velocity. The accelerations are therefore obtained at every step by Cholesky factorisation [[43](#ref-43)]; for a finite state a failure of the factorisation would indicate an error in the model. A state that contains a value which is not a finite number cannot be factorised either; the model then hands the non-finite result on, and the runtime halts the run (Chapter 4). For $`N = 1`$ the equation reduces to the familiar $`\ddot\theta = -(g/L)\sin\theta`$. The same Lagrangian for the multiple pendulum is given in peer-reviewed publications [[37](#ref-37), [44](#ref-44), [45](#ref-45)].

<a id="sarkac-surtunme"></a>

### Joint friction

Every joint exerts a friction torque proportional to the relative angular velocity of the two rods it connects; for the fixed pivot $`\dot\theta_0 = 0`$. The Rayleigh dissipation function, quadratic in the velocities [[46](#ref-46), [35](#ref-35)], and the generalised forces derived from it are

```math
D = \frac{b}{2}\sum_{i=1}^{N}\left(\dot\theta_i - \dot\theta_{i-1}\right)^2, \qquad Q_i = -\frac{\partial D}{\partial\dot\theta_i} = -b\,(\dot\theta_i-\dot\theta_{i-1}) + b\,(\dot\theta_{i+1}-\dot\theta_i) \tag{3.3}
```

the last term being absent for the lowest rod. The power converted to heat is $`2D`$. It is integrated as an additional state variable, and the energy ledger is monitored in the form $`T + V + Q_b = E_0`$. The model is viscous friction; it contains neither dry (Coulomb) friction nor air drag.

<a id="sarkac-periyot"></a>

### The single pendulum: exact period

With $`\sin\theta \approx \theta`$ for small angles the period is independent of the amplitude, $`T_0 = 2\pi\sqrt{L/g}`$. The approximation fails as the amplitude $`\theta_0`$ grows. The exact period, obtained from the conservation of energy, is given by the complete elliptic integral of the first kind $`K`$ [[47](#ref-47), [48](#ref-48), [49](#ref-49)]:

```math
T = 4\sqrt{\frac{L}{g}}\;K\!\left(\sin\frac{\theta_0}{2}\right) = T_0\left(1 + \frac{\theta_0^2}{16} + \frac{11\,\theta_0^4}{3072} + \cdots\right) \tag{3.4}
```

$`K`$ is computed with the arithmetic–geometric mean: $`K(k) = \pi/\bigl(2\,\mathrm{AGM}(1,\sqrt{1-k^2})\bigr)`$, hence $`T = T_0/\mathrm{AGM}(1,\cos(\theta_0/2))`$ [[50](#ref-50)]. The iteration converges quadratically; five or six steps suffice in double precision. If the pendulum has enough energy to go over the top, the motion is continuous rotation rather than oscillation. The parameter $`\kappa^2 = E/(2mgL) = \sin^2(\theta/2) + L\dot\theta^2/(4g)`$, defined with the energy measured from the lowest point, separates the two: $`\kappa < 1`$ is libration, $`\kappa > 1`$ rotation, and $`\kappa = 1`$ the separatrix, whose period is infinite. The time of one full revolution is

```math
T_\mathrm{rot} = \frac{2}{\kappa}\sqrt{\frac{L}{g}}\;K\!\left(\frac{1}{\kappa}\right), \qquad \kappa > 1 \tag{3.5}
```

*Table 3.2. Ratio of the period of the single pendulum to its small-angle value.*

| Amplitude $`\theta_0`$ | 5° | 10° | 30° | 60° | 90° | 120° | 150° | 170° |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $`T/T_0`$ | 1.0005 | 1.0019 | 1.0174 | 1.0732 | 1.1803 | 1.3729 | 1.7622 | 2.4394 |

The Measurements tab computes these theoretical values from the instantaneous energy and compares them with the reading of the period meter. In the verification experiments the relative difference between the measured period and (3.4) or (3.5) does not exceed $`2.4 \times 10^{-10}`$ for amplitudes from 10° to 170° and for rotation.

<a id="sarkac-modlar"></a>

### Small oscillations and normal modes

Linearised about the hanging equilibrium, the frictionless equations become $`\mathbf{M}\ddot{\boldsymbol\theta} + \mathbf{K}\boldsymbol\theta = \mathbf{0}`$ with $`M_{ij} = \mu_{\max(i,j)}L_iL_j`$ and $`\mathbf{K} = g\,\mathrm{diag}(\mu_iL_i)`$. The ansatz $`\boldsymbol\theta = \mathbf{a}\cos(\omega t + \varphi)`$ gives the generalised symmetric eigenvalue problem

```math
\left(\mathbf{K} - \omega^2\mathbf{M}\right)\mathbf{a} = \mathbf{0} \tag{3.6}
```

It has $`N`$ positive eigenvalues, each a **normal mode** in which all parts oscillate with the same frequency. For a double pendulum with equal masses and equal lengths, $`\omega^2 = (2 \mp \sqrt{2})\,g/L`$ with angle ratios $`\theta_2/\theta_1 = \pm\sqrt{2}`$ [[28](#ref-28)]. For a chain of $`N`$ links with equal masses and equal lengths the eigenfrequencies are given by the zeros of the Laguerre polynomial [[51](#ref-51), [44](#ref-44)]:

```math
\omega_k^2 = \frac{g}{\ell}\,x_k, \qquad L_N(x_k) = 0, \quad k = 1,\dots,N \tag{3.7}
```

As the number of links grows, the chain approaches a hanging rope of total length $`\Lambda`$, whose frequencies are given by the zeros of the Bessel function $`J_0`$, $`\omega_k = \tfrac12 j_{0,k}\sqrt{g/\Lambda}`$ with $`j_{0,1} = 2.4048`$ [[52](#ref-52), [53](#ref-53)]. The oscillations of the hanging chain were first solved by Daniel Bernoulli [[54](#ref-54), [55](#ref-55), [56](#ref-56)]. Convergence is slow: the fundamental frequency of a chain of six equal links is 3.8 % below the rope value. The application solves problem (3.6) numerically for the chain at hand; for equal chains the result agrees with (3.7) to a relative error of $`10^{-15}`$.

<a id="sarkac-kuvvet"></a>

### Rod forces: an independent check

The forces in the free-body diagram are not computed from the Lagrangian equations but from Newton's second law written for every mass separately: once the accelerations are known, the force each rod must carry is found starting from the lowest mass. An ideal rod carries force only along its own direction; the component of the computed force perpendicular to the rod must therefore vanish if the two derivations are consistent. Over 200 randomly chosen states the ratio of the perpendicular component to the tension does not exceed $`6 \times 10^{-15}`$. For the single pendulum the result reduces to the known relation $`T = m(g\cos\theta + L\dot\theta^2)`$.

> **Note — Negative tension**
>
> In fast motion the axial force in a rod can change sign: the rod is pushed instead of pulled. A rigid rod carries this; had the same apparatus been built with strings, the string would go slack at that instant. The Measurements tab marks this state as “compression”.

<a id="sarkac-esik"></a>

### The energy threshold for going over the top

For rod $`k`$ to pass through the upright position ($`\theta_k = \pi`$), the mechanical energy must be at least the potential-energy term belonging to that rod. The smallest threshold over all rods is

```math
E^{\ast} = \min_k\; 2\,g\,\mu_kL_k \tag{3.8}
```

Below it no rod can go over the top; being above it is a necessary but not a sufficient condition. For a double pendulum of point masses with equal masses and equal lengths released from rest, the condition takes the form $`2\cos\theta_1 + \cos\theta_2 > 1`$: a pendulum released from this region can never flip.

> **Common misconception — The condition “3 cos θ₁ + cos θ₂ > 2” belongs to a different model**
>
> This frequently quoted inequality holds for the compound double pendulum made of two identical rods with uniformly distributed mass [[57](#ref-57), [58](#ref-58)]. The model used here has point masses, so the coefficients differ; the two conditions are not interchangeable.

<a id="sayisal"></a>

## 4. Numerical methods

*The one-step methods used, their stability and energy behaviour, the fixed-step loop that is independent of the display rate, locating the instant of impact, and adaptive stepping.*

<a id="sayisal-yontemler"></a>

### Explicit one-step methods

Both models are written as a first-order system, $`\dot{\mathbf{y}} = \mathbf{f}(t,\mathbf{y})`$; for the oscillator $`\mathbf{y} = (x, \dot{x}, \varphi, Q_c, W)`$ and for the pendulum $`\mathbf{y} = (\theta_1,\dots,\theta_N, \dot\theta_1,\dots,\dot\theta_N, Q_b)`$. The integral terms of the energy ledger are part of the state vector, so they are integrated with the same accuracy as the motion. The default method is the classical fourth-order Runge–Kutta method [[59](#ref-59), [60](#ref-60), [61](#ref-61)]:

```math
\begin{aligned} \mathbf{k}_1 &= \mathbf{f}(t_n, \mathbf{y}_n), & \mathbf{k}_2 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_1\right), \\ \mathbf{k}_3 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_2\right), & \mathbf{k}_4 &= \mathbf{f}(t_n + h,\, \mathbf{y}_n + h\,\mathbf{k}_3), \\ \mathbf{y}_{n+1} &= \mathbf{y}_n + \tfrac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right) \end{aligned} \tag{4.1}
```

A method of order $`p`$ has an error of $`O(h^{p+1})`$ in a single step and of $`O(h^p)`$ at the end of a fixed time interval [[61](#ref-61), [62](#ref-62)]. The other methods of Table 4.1 can be selected for comparison and for teaching: seeing what a low-order method does is the shortest way to understand why a high-order one is needed.

*Table 4.1. Selectable methods and the orders observed in the verification experiment.*

| Method | Order | Observed order | Derivative evaluations per step | Remark |
| --- | --- | --- | --- | --- |
| Explicit Euler | 1 | 1.007 | 1 | Energy of the undamped oscillator grows at every step |
| Symplectic Euler | 1 | 1.005 | 1 | Energy error of the oscillator stays bounded |
| Midpoint (RK2) | 2 | 2.0005 | 2 | – |
| Classical Runge–Kutta (RK4) | 4 | 4.005 | 4 | Default |
| Dormand–Prince 5(4) | 5 | 5.02 | 7 | Embedded error estimate, adaptive step |

The observed order is computed by solving a problem with a known closed-form solution at two step sizes, $`p = \ln(e_1/e_2)/\ln(h_1/h_2)`$; it is the most direct evidence that the code implements the method correctly [[63](#ref-63), [64](#ref-64), [65](#ref-65)].

<a id="sayisal-kararlilik"></a>

### Stability and energy behaviour

The behaviour of the methods on the undamped oscillator is known in closed form. With $`z = h\omega_0`$, an explicit Euler step multiplies the energy by exactly $`1 + z^2`$ at every step; however small the step, the energy grows exponentially. For classical RK4 the factor is

```math
\frac{E_{n+1}}{E_n} = 1 - \frac{z^6}{72} + \frac{z^8}{576}, \qquad z = h\omega_0 \tag{4.2}
```

so the method very slowly **loses** energy, and it is stable on the imaginary axis for $`|z| \le 2\sqrt{2}`$ [[66](#ref-66), [67](#ref-67)]. With the default step $`h = 1`$ ms and the stiffest oscillator of the parameter range ($`k = 80`$ N/m, $`m = 0.5`$ kg, $`\omega_0 = 12.6`$ rad/s) the relative loss is $`6 \times 10^{-14}`$ per step and $`3 \times 10^{-9}`$ in total over 60 seconds. The symplectic Euler method conserves a modified energy of the oscillator exactly and stays bounded for $`z < 2`$ [[68](#ref-68)].

> **Limitation — Explicit Runge–Kutta methods are not symplectic**
>
> No explicit Runge–Kutta method preserves the phase-space structure of Hamiltonian systems exactly [[69](#ref-69), [67](#ref-67)]. The symplectic Euler method used here is symplectic only for separable Hamiltonians; the mass matrix of the pendulum chain depends on the angles, so the property does not hold for the chain. In the general case with damping, drive and impacts the system is not Hamiltonian anyway. In this work energy conservation is not assumed but measured: the residual of the energy ledger is on screen at every instant.

<a id="sayisal-dongu"></a>

### The fixed-step loop and reproducibility

The wall-clock duration of every animation frame, multiplied by the time scale, is added to a budget. The budget is spent in steps of exactly $`h = 1/f_s`$; what is left carries over to the next frame [[70](#ref-70)]. The step frequency $`f_s`$ can be set to 60, 120, 300, 600, 1000 or 2000 Hz; the default is 1000 Hz. A single frame adds at most 0.1 s of wall-clock time to the budget, which at 2000 Hz and at the largest time scale, 2, amounts to 400 steps. A frame that lasts longer is cut to 0.1 s: the remainder is not simulated, simulated time falls behind the wall clock, and such frames are counted from the last restart. The status bar shows the count (“Late frames”) once they recur, four within two seconds of wall-clock time: loading the page, switching the experiment or opening the theory reader costs one or two long frames, which do not mean that the simulation cannot keep up. When a tab returns from the background the measurement of the frame duration starts afresh, so the time spent there is neither simulated nor counted. The step size never changes. Telemetry is recorded every 10 ms at step frequencies of 300 Hz and above, and at every step at 60 Hz and 120 Hz.

With this arrangement the sequence of states depends only on the initial conditions, the parameters, the method and the value of $`h`$. The automated tests check this directly: the same experiment is run once with uniform 60 Hz frames and once with random frame durations, and the states at common step counts are found to be equal bit for bit. The experiment file and the shared link carry only these inputs; the recipient reproduces the same trajectory. For the same reason a change of the method or of the step frequency does not continue the experiment in progress: both experiments start again from their initial conditions, so that a record, its energy ledger and its error statistics always belong to one method and one step.

Simulated time is a sum of steps, and this sum has a round-off error of its own. Adding $`h = 1`$ ms 600 000 times in ordinary floating-point arithmetic loses $`7 \times 10^{-9}`$ s. In the ready-made experiment “Undamped”, where the carriage reaches 6.9 m/s, this loss alone would shift the closed-form reference solution of Chapter 2 by about $`5 \times 10^{-8}`$ m where the carriage is fastest, ten times the error of RK4 over the same 600 s. The clock of the oscillator is therefore advanced with compensated (Kahan) summation, and the phase of the drive is computed from the clock instead of being accumulated. The equations of the pendulum do not contain the time explicitly; its clock is an ordinary sum, and the round-off reaches only the time stamps of the record.

After every step the runtime tests whether the solution is still within the finite range. For the pendulum this means that every angle and every angular velocity is below $`10^7`$ in magnitude (rad and rad/s); the test covers the reference trajectory, the twin while it is shown and the shadow trajectory of the Lyapunov estimate. For the oscillator the position must be finite and the speed below $`10^6`$ m/s. If the test fails, the state before that step is put back, the experiment is halted and the interface reports that the solution has diverged; an exception raised in the physics core halts the experiment in the same way. A low-order method with a coarse step can end in this way: the ready-made six-link chain integrated with explicit Euler at 60 Hz is halted after 12 s. The halt applies to both experiments; it is lifted when one of them is restarted or a solver is chosen, and either action restarts the experiment that diverged as well.

> **Limitation — The limit of reproducibility**
>
> The computations use IEEE 754 double-precision numbers (53-bit significand, $`\varepsilon = 2^{-52} \approx 2.2 \times 10^{-16}`$) [[71](#ref-71), [72](#ref-72)]. The four arithmetic operations and the square root are fully specified by the standard; the last digit of the trigonometric functions, however, may differ between runtime environments. On a chaotic trajectory a difference of $`10^{-16}`$ grows to 1 rad in about $`\ln(10^{16})/\lambda \approx 37`$ s when the exponent is $`\lambda \approx 1\ \mathrm{s^{-1}}`$. Bit-for-bit repeatability has therefore been tested for one and the same runtime environment; no comparison between different browser engines has been made.

<a id="sayisal-olay"></a>

### Locating the instant of impact

The stops make the equation of motion piecewise; if the instant of impact is not located inside the step, the error becomes proportional to the step size and the order of the method is lost. If the carriage is beyond a limit at the end of a step, a bisection is carried out on the fraction $`s \in [0,1]`$ of the step: the state at the start of the step is advanced by $`s\,h`$ and the largest $`s`$ for which the carriage is still inside is sought. 52 iterations exhaust all digits of double precision. The state is then advanced to that instant, (2.9) is applied and the rest of the step is integrated. If more than six impacts occur within one step (ever smaller bounces of the carriage on the stop), the carriage is taken to rest on the stop and the remaining kinetic energy is booked as heat.

In the verification experiment the instant of impact deviates from the closed-form value by $`9 \times 10^{-13}`$ s and the impact speed by $`3 \times 10^{-14}`$ in relative terms.

<a id="sayisal-uyarlamali"></a>

### Adaptive stepping: Dormand–Prince 5(4)

The Dormand–Prince pair produces, from the same derivative evaluations, a fifth-order solution and a fourth-order comparison solution; their difference is an estimate of the local error [[73](#ref-73), [61](#ref-61)]. MATLAB's ode45 solver is based on the same pair [[74](#ref-74)]. In the application the fixed outer step $`h`$ is kept; the method divides this step into its own internal steps such that the estimated error stays below a relative tolerance of $`10^{-10}`$ and an absolute tolerance of $`10^{-12}`$. The sequence of steps thus remains independent of the frame duration.

Fixed-step RK4 is sufficient with the default parameters: the relative energy drift over 60 seconds is $`2 \times 10^{-9}`$ for the double pendulum and $`3 \times 10^{-7}`$ for the six-link chain. In the hardest corner of the admissible range (three heavy, long links driving three light, short ones; angular speeds beyond 140 rad/s) the drift of the fixed step rises to $`1.5 \times 10^{-3}`$, while Dormand–Prince gives $`4 \times 10^{-9}`$ in the same experiment. When the relative residual of an experiment integrated with a fixed-step method reaches $`10^{-5}`$, the status bar offers a restart with the adaptive method; accepting the offer, like every change of solver, starts both experiments afresh.

<a id="sayisal-cebir"></a>

### Linear algebra and special functions

- **Accelerations.** The symmetric positive-definite matrix of system (3.2) is solved by Cholesky factorisation at every derivative evaluation [[43](#ref-43)].
- **Normal modes.** Problem (3.6) is reduced to a standard symmetric eigenvalue problem with the Cholesky factor of $`\mathbf{M}`$ and solved with Jacobi rotations [[75](#ref-75), [43](#ref-43)].
- **Laguerre zeros.** The zeros used as reference values in the verification are computed as the eigenvalues of the tridiagonal matrix built from the three-term recurrence [[76](#ref-76)].
- **Elliptic integral.** $`K(k)`$ is computed with the arithmetic–geometric mean [[48](#ref-48), [50](#ref-50)].

<a id="kaos"></a>

## 5. Deterministic chaos

*Sensitivity to initial conditions, estimating the Lyapunov exponent, the prediction horizon, the conditions under which chaos is possible, and the Poincaré section.*

<a id="kaos-duyarlilik"></a>

### Sensitivity to initial conditions

In a deterministic system the same initial conditions always give the same trajectory. In a chaotic system, however, trajectories that start from very close initial conditions separate, on average, at an exponential rate. For two trajectories initially separated by $`\delta_0`$ in phase space,

```math
\lVert\delta(t)\rVert \approx \lVert\delta_0\rVert\,e^{\lambda t}, \qquad \lambda = \lim_{t\to\infty}\,\lim_{\lVert\delta_0\rVert\to 0}\frac{1}{t}\ln\frac{\lVert\delta(t)\rVert}{\lVert\delta_0\rVert} \tag{5.1}
```

defines the **largest Lyapunov exponent** $`\lambda`$; its existence, and the fact that it takes the same value for almost every initial direction, are guaranteed by the multiplicative ergodic theorem [[77](#ref-77), [78](#ref-78)]. A positive exponent is the quantitative signature of chaos. The application shows this separation in two ways: a visible **twin pendulum** released with its first angle differing by $`\delta_0`$, and an estimate of the exponent that runs continuously in the background.

> **Common misconception — Lorenz's rounded number**
>
> The famous episode of the discovery of sensitivity does not date from the 1963 paper [[79](#ref-79)] but from the winter of 1961, and it concerns not the well-known three-variable system but a weather model with twelve variables. In his own account Lorenz says that he re-entered a line of output that had been rounded to three decimals, but gives no digits [[80](#ref-80)]; the often quoted numbers 0.506127 and 0.506 come from Gleick's book [[81](#ref-81)]. The “butterfly” is the title of a talk given in 1972 [[82](#ref-82)].

<a id="kaos-benettin"></a>

### Estimating the Lyapunov exponent

The exponent is estimated with the two-trajectory method of Benettin, Galgani and Strelcyn [[83](#ref-83), [84](#ref-84)]. Next to the reference trajectory, a shadow trajectory at a phase-space distance $`d_0 = 10^{-8}`$ is integrated with the same method and the same step. After every interval $`\tau`$ the separation $`d_k`$ is measured and the shadow is pulled back to the distance $`d_0`$ along the current direction of the separation; $`\tau`$ is 0.01 s at step frequencies of 300 Hz and above, and one step at 60 Hz and 120 Hz. The running estimate is

```math
\lambda(t) = \frac{1}{t}\sum_{k=1}^{t/\tau}\ln\frac{d_k}{d_0} \tag{5.2}
```

The rescaling keeps the separation in the regime of linear growth; for the generalisation of the same idea that yields all exponents see [[85](#ref-85), [86](#ref-86)], and for estimation from experimental time series [[87](#ref-87)]. The distance is measured with the Euclidean norm in the $`2N`$-dimensional space of angles and angular velocities.

> **Limitation — The value shown is a finite-time estimate**
>
> $`\lambda(t)`$ converges to the exponent only in the limit $`t \to \infty`$. For regular motion the estimate decays to zero roughly like $`\ln t/t`$; a small but positive value after a short observation is therefore no evidence of chaos. In the verification experiments the 400-second estimate is 0.017 for the single pendulum, 0.003 for the small-angle double pendulum and 1.04 $`\mathrm{s^{-1}}`$ for the chaotic double pendulum. Halving the step changes the chaotic value by 7 %: the difference reflects the uncertainty of the finite-time average, not of the method.

<a id="kaos-ufuk"></a>

### The prediction horizon

If the initial state is known with an uncertainty $`\delta_0`$ and an error of size $`a`$ counts as failure of the prediction, the prediction is meaningful for roughly [[88](#ref-88)]

```math
t_\mathrm{u} \approx \frac{1}{\lambda}\,\ln\frac{a}{\delta_0} \tag{5.3}
```

The dependence is logarithmic: making the initial uncertainty a thousand times smaller extends the horizon only by $`\ln 1000/\lambda \approx 6.9/\lambda`$. The relation is an order-of-magnitude estimate; the local growth rate varies along the trajectory, so the observed divergence time can differ from it by a factor of a few. The application shows the estimated horizon side by side with the time the twin actually needed, counted from its release, to reach a separation of 1 rad.

> **Note — Weather prediction**
>
> Applied to the atmosphere, the same idea gives an **intrinsic** limit of about two weeks for the predictability of day-to-day midlatitude weather and a **practical** limit of about ten days with present models and analyses [[89](#ref-89)]; the classical work on the existence of such a limit is due to Lorenz [[90](#ref-90)].

<a id="kaos-kosul"></a>

### When chaos is possible

The phase space of the undriven single pendulum is two-dimensional, $`(\theta, \dot\theta)`$. By the Poincaré–Bendixson theorem, a bounded trajectory of an autonomous flow in the plane can only approach a fixed point, a closed orbit or curves connecting them; chaos needs a phase space of at least three dimensions [[88](#ref-88), [91](#ref-91)]. A single pendulum can therefore not be chaotic, however large the release angle; its exponent estimate decays to zero. The phase space of the double pendulum is four-dimensional and conservation of energy confines the motion to a three-dimensional surface: chaos is possible.

That it is possible does not mean that every trajectory is chaotic. At low energy the motion of the double pendulum is the sum of two normal modes and is regular; as the energy increases, a growing part of phase space becomes chaotic [[92](#ref-92), [93](#ref-93)]; at very high energy gravity becomes negligible beside the rotational energy and the motion is regular again [[58](#ref-58), [94](#ref-94)]. The divergence rate measured on a real double pendulum from stroboscopic photographs is $`7.5 \pm 1.5\ \mathrm{s^{-1}}`$ [[95](#ref-95)]; this value is specific to the apparatus and the energy and scales with $`\sqrt{g/L}`$.

<a id="kaos-poincare"></a>

### The Poincaré section

The way to see a trajectory on the three-dimensional energy surface of the double pendulum is to cut it with a two-dimensional surface. The application records every crossing of the surface $`\theta_2 = 0`$ (mod $`2\pi`$) with $`\theta_2`$ increasing and plots the point $`(\theta_1, p_1)`$, where $`p_1`$ is the canonical momentum conjugate to $`\theta_1`$:

```math
p_1 = \frac{\partial L}{\partial\dot\theta_1} = \sum_{j=1}^{N}\mu_{\max(1,j)}\,L_1L_j\cos(\theta_1-\theta_j)\,\dot\theta_j \tag{5.4}
```

Choosing canonical variables makes the section map area-preserving. A regular trajectory stays on an invariant torus and traces a closed curve in the section; a chaotic trajectory fills an area [[96](#ref-96), [78](#ref-78)]. The instant of crossing is found by linear interpolation between two successive steps, which at $`h = 1`$ ms gives an error far below the resolution of the plot. For a method that lands exactly on the surface of section see [[97](#ref-97)].

<a id="kaos-dogruluk"></a>

### What numerical accuracy means on chaotic trajectories

On a chaotic trajectory numerical error grows exponentially, just like a physical separation. For the double pendulum the relative energy error per step is of order $`10^{-14}`$; even so small a difference separates the trajectory completely from the exact solution within about $`\ln(10^{14})/\lambda \approx 30`$ s when $`\lambda \approx 1\ \mathrm{s^{-1}}`$. This is a limit no finite-precision computation can pass, not a defect of the solver. What is meaningful in a long chaotic simulation is not the individual states but the statistical and geometric properties of the trajectory: the Lyapunov exponent, the structure of the Poincaré section, the conservation of energy. The verification experiments measure this: when the chaotic double pendulum is integrated 5 s forwards and 5 s backwards, it returns to its initial state with an error of $`4 \times 10^{-10}`$ rad; for regular motion the same experiment over 20 s gives $`5 \times 10^{-12}`$ rad.

<a id="olcum"></a>

## 6. Measurement and analysis tools

*The virtual instruments and plots that allow theory to be compared with measurements made on the simulation rather than with the simulation's own formulas.*

<a id="olcum-cihazlar"></a>

### Virtual instruments

Writing the theoretical value on the screen of a simulation is easy, but it is not a verification. The instruments here see only the sampled solution and make the measurement an experimenter would make with a stopwatch, a ruler and an oscilloscope:

- **Period meter.** Measures the time between successive zero crossings of the signal in the same direction; the instant of crossing is found by linear interpolation between two samples. Upward and downward crossings are followed separately, so every period of an oscillation yields two intervals (every turn of a rotating pendulum yields one). The mean and the standard deviation of the last twelve intervals are shown. For the pendulum, $`\sin\theta`$ is monitored and only the crossings at the bottom are counted, so that the rotation period of a pendulum going over the top is measured as well.
- **Peak detector.** Extrema are found not by searching for the largest sample but from the zero crossing of the velocity, which gives a time resolution far finer than the sampling interval. The amplitude is half the difference between the latest peak and the latest trough.
- **Logarithmic decrement.** Computed from successive positive peaks with (2.5); the damping ratio follows from $`\zeta = \Lambda/\sqrt{4\pi^2 + \Lambda^2}`$.
- **Steady-state criterion.** Three conditions are required together. From one oscillation to the next the peak-to-peak amplitude must change by less than 1 %, and the centre of the oscillation, the mid-point between the latest peak and the latest trough, must move by less than 1 % of the amplitude. In addition, the time $`\ln 100/r`$ in which the slowest term of the transient decays to 1 % must have passed since the last change (restart, parameter change, impact); here $`r = \gamma`$ for $`\zeta \le 1`$ and $`r = \gamma - \sqrt{\gamma^2 - \omega_0^2}`$ for $`\zeta > 1`$. The first condition alone is not sufficient: a slowly decaying transient changes the amplitude per oscillation only by $`e^{rT} - 1`$ times its own size, so it can be several times larger than the observed change. A transient term that does not oscillate, such as the slow exponential of an overdamped system, does not change the peak-to-peak amplitude at all; it shifts the centre, which is what the second condition detects. Without damping the waiting time is infinite and no steady state is reported. The phase lag is the drive phase at the instant of the latest peak of the displacement.
- **Step-response meter.** For a mass released from rest it measures the overshoot, the most extreme sample beyond equilibrium as a fraction of the initial displacement, and the settling time, the instant from which $`|x|`$ stays within 2 % of the initial displacement. The entry into this band is located by linear interpolation between the last sample outside it and the first one inside; the value is shown once the response has stayed inside for a quarter of that time, and for at least 0.25 s. The theoretical value given next to it is the settling time of the closed-form solutions (2.3) and (2.4) for the damping ratio at hand, found by bisection; for $`\zeta = 1`$ it equals $`5.834/\omega_0`$. If a parameter is changed after the release the measurement ends, and it starts again with the next release.

The Measurements tab lists, for every quantity, the theoretical value, the measured value and the deviation between them. The completion criteria of the task sheets are tied to the readings of these instruments as well; moving a slider to the right position does not complete a sheet, the measurement has to be made.

<a id="olcum-spektrum"></a>

### The amplitude spectrum

The newest samples of the recorded signal are multiplied by a Hann window and analysed with the fast Fourier transform [[98](#ref-98), [99](#ref-99)]. The record analysed has $`N`$ samples, where $`N`$ is the largest power of two that the telemetry recorded since the last restart fills: at least 256 (2.56 s at the telemetry rate of 100 Hz) and at most 4096 (41 s). The record is never extended with zeros, so the frequency resolution is that of the record itself, $`f_s/N`$: at 100 Hz, 0.39 Hz for the shortest record and $`100/4096 = 0.024`$ Hz for the longest. The sampling rate $`f_s`$ is taken from the time stamps of the record; it is 100 Hz, except at the step frequencies of 60 Hz and 120 Hz, where it equals the step frequency. The coherent gain of the window is 0.5 and its equivalent noise bandwidth 1.5 bins [[100](#ref-100)]; the amplitude axis is scaled with the coherent gain, so that a sinusoid whose frequency coincides with a bin is read with its own amplitude. The frequency of a sinusoid generally falls between two bins; the peak frequency and amplitude are then obtained from the two largest bins with the interpolation formula for the Hann window [[101](#ref-101)]. The formula assumes a line of constant amplitude and bins that are one reciprocal record length apart, which is the reason why the record is not extended with zeros. When the line lies close to zero frequency, its image at negative frequency disturbs the formula: in a trial with 20 000 single sinusoids the frequency read-out was wrong by 8 % in the worst case with the peak in the second bin above zero frequency, and by at most 0.05 % from the fourth bin on. The plot therefore states the dominant peak only if the strongest bin of the spectrum lies at $`4 f_s/N`$ or above. In the verification experiment, with 4096 samples and the line near the 51st bin, the frequency of a 1.2345 Hz sinusoid is recovered with an error of $`5 \times 10^{-9}`$ Hz and its amplitude with a relative error of $`10^{-8}`$.

The spectrum shows a distinction that cannot be made out in the time plot: the spectrum of a regular motion consists of a few sharp lines (the normal-mode frequencies and their combinations), that of a chaotic motion is broadband. The theoretical frequencies are marked in the plot.

<a id="olcum-grafikler"></a>

### Plots and colours

The time plot, the phase portrait, the energy ledger, the response curve, the spectrum, the separation plot and the Poincaré section show the same telemetry so as to answer different questions. The vertical axis of the separation plot is logarithmic; exponential growth is there a straight line of slope $`\lambda`$. Every physical quantity carries the same colour in all views: the vector in the scene, the trace in the plot, the number in the read-out. The colours are taken from the Okabe–Ito palette, which remains distinguishable under colour-vision deficiencies [[102](#ref-102), [103](#ref-103)]; no quantity is identified by its colour alone.

<a id="olcum-veri"></a>

### Data export

The telemetry can be downloaded as a CSV file. Column names carry the unit (for example “t_s” for $`t`$ and “theta1_rad” for an angle); header lines record the parameters, the initial conditions, the method, the step and the sampling interval. Because a change of solver starts a new experiment, every row of a file was computed with the method and the step named in its header. The parameters, by contrast, are written with their values at the moment of export: a parameter changed while the experiment is running is not recorded as an event, and the rows from before the change belong to the earlier value. The header lines begin with “#” and contain neither the field separator nor a quotation mark, so a program that reads the file by the rules of the CSV format takes each of them as a single field and the table below them stays intact. Two dialects are offered: decimal point with comma separation (Python, MATLAB, R) and decimal comma with semicolon separation (spreadsheets with a Turkish locale). The experiment definition can also be shared as a JSON file or as a link; no data are sent to any server.

<a id="olcum-ses"></a>

### Sonification

The mechanical frequencies of the apparatus are far below the threshold of hearing; the sound heard is not a recording but a deliberate mapping of quantities onto sound [[104](#ref-104)]. For the oscillator the pitch of a sine tone follows the displacement (one octave per 3.5 m) and its loudness the speed; an impact with a stop gives a short click scaled by the impact speed. For the pendulum every passage of the first rod through the vertical is a tick: a single pendulum ticks regularly like a clock, a chaotic chain irregularly. No sound plays unless the user switches it on.

<a id="dogrulama"></a>

## 7. Verification

*The errors of the solver measured on fourteen problems whose answers are known independently, and what these results do and do not show.*

<a id="dogrulama-yontem"></a>

### Verification versus validation

Computational science asks two separate questions [[105](#ref-105), [63](#ref-63)]. **Verification** asks “are the equations solved correctly?” and is a mathematical matter: it is shown that the code implements the method correctly and that the numerical error stays within known bounds. **Validation** asks “are the correct equations being solved?” and can only be answered by comparison with a physical experiment.

This work does the first. For code verification the observed order of accuracy is measured and comparisons are made with closed-form solutions [[64](#ref-64), [65](#ref-65)]; for solution verification conservation laws, step refinement, time reversibility and the agreement of two independent methods are checked. The experiments run from a single source (src/physics/validation.ts) in three places: in the automated test suite, in the Verification tab of this reader and in the appendix of the technical report.

> **Limitation — No validation has been carried out**
>
> The model has not been compared with a real spring–mass apparatus or a real multiple pendulum. “Verified” therefore means that the equations are solved correctly; it does not say how well the equations represent a particular physical apparatus (Chapter 9).

<a id="dogrulama-sonuclar"></a>

### Summary of results

*Table 7.1. Summary of the verification experiments (classical RK4, h = 1 ms). All rows of every experiment are given in the Verification tab and in the appendix of the report.*

| Experiment | Quantity measured | Result | Tolerance |
| --- | --- | --- | --- |
| Order of accuracy | Observed $`p`$ (expected 4 for RK4) | 4.005 | $`\pm 0.1`$ |
| Free response, four regimes, 20 s | Largest position error | $`1.6 \times 10^{-10}`$ m | $`10^{-9}`$ m |
| Steady state, five frequencies | Relative error of the amplitude | $`3.3 \times 10^{-8}`$ | $`10^{-5}`$ |
| Steady state, five frequencies | Error of the phase lag | $`3.3 \times 10^{-8}`$ rad | $`10^{-3}`$ rad |
| Critical damping | Relative error of the 2 % settling time | $`1.5 \times 10^{-7}`$ | $`2 \times 10^{-3}`$ |
| Impact with a stop | Error of the instant of impact | $`8.6 \times 10^{-13}`$ s | $`10^{-8}`$ s |
| Energy ledger, 27 impacts, 60 s | Largest relative residual | $`1.3 \times 10^{-12}`$ | $`10^{-8}`$ |
| Pendulum period, 10°–170° and rotation | Relative error | $`2.3 \times 10^{-10}`$ | $`10^{-7}`$ |
| Energy drift, 60 s | $`N = 1;\ 2;\ 3;\ 6`$ | $`4.7 \times 10^{-13}`$; $`2.0 \times 10^{-9}`$; $`2.4 \times 10^{-8}`$; $`3.3 \times 10^{-7}`$ | $`10^{-6}`$ |
| Eigenfrequencies | Relative deviation from the Laguerre zeros | $`8.5 \times 10^{-16}`$ | $`10^{-10}`$ |
| Lagrangian and Newtonian derivations | Transverse force / tension | $`5.3 \times 10^{-15}`$ | $`10^{-10}`$ |
| Lyapunov exponent, 400 s | Regular; chaotic | $`\le 0.017`$; $`1.04\ \mathrm{s^{-1}}`$ | $`\le 0.05`$; $`\ge 0.5\ \mathrm{s^{-1}}`$ |
| Time reversibility, 20 s | Error in returning to the initial state | $`4.6 \times 10^{-12}`$ rad | $`10^{-9}`$ rad |
| RK4 against Dormand–Prince | Error ratio when the step is made four times smaller | 256.6 | $`256 \pm 25\,\%`$ |
| Spectrum analyser | Error of the peak frequency | $`4.6 \times 10^{-9}`$ Hz | $`10^{-4}`$ Hz |

These values were measured on the development machine. The button in the Verification tab runs the same experiments again in the reader's own browser, with the code that is loaded at that moment; the results are expected to be of the same order of magnitude as those given here.

<a id="dogrulama-yorum"></a>

### Interpretation of the results

- **The tolerances are wider than the measured errors, but not by the same factor in every criterion.** The margin, i.e. the ratio of the tolerance to the measured error (for a lower bound, of the measured value to the bound), is two orders of magnitude or more in 47 of the 67 criteria, between one and two orders in 12, and less than a factor of ten in 8. Of these eight, Table 7.1 contains the free response without damping (a factor of 6), the energy drift of the six-link chain (3) and the two Lyapunov bounds (3 and 2). The others are the observed order of the Dormand–Prince method (4), the drift of the fixed step in the hardest corner of the parameter range (6), the change of the Lyapunov estimate when the step is halved (4) and the comparison of the six-link chain with the hanging rope (1.3); in the last of these the difference measured is not a numerical error but the physical difference between six links and a continuum. The tolerances were chosen so that the experiments also pass in other runtime environments and still catch a real coding error (a loss of order, a wrong coefficient); whether the criteria with a narrow margin pass in another environment has not been tested (Chapter 9).
- **Energy drift grows with the number of links.** More links mean higher angular speeds and a stiffer non-linear coupling; with the same step the drift of the six-link chain is about 160 times that of the double pendulum, but still below $`10^{-6}`$.
- **The step size is decisive.** For the double pendulum, a step of 3.3 ms instead of 1 ms raises the drift from $`2.0 \times 10^{-9}`$ to $`5.3 \times 10^{-7}`$. Explicit Euler produces, in the same experiment with the same step, a deviation of 24 % in the energy ledger; this row is in the suite on purpose as a **lower-bound** criterion.
- **The order of the method is observed on a chaotic trajectory too.** For the three-link chain the difference between RK4 and the error-controlled reference solution shrinks by a factor of 256.6 when the step is made four times smaller; the value expected of a fourth-order method is $`4^4 = 256`$.
- **Two independent derivations agree.** The equations of motion are computed with Lagrange's method and the rod forces with Newton's laws; the inconsistency between them is at the level of machine precision. This is the strongest check against a sign or index error in the coding of the model.

<a id="yanilgilar"></a>

## 8. Common misconceptions and their corrections

*Statements that are often repeated when oscillations and chaos are explained, but that turn out to be wrong or incomplete when the sources are consulted.*

<a id="yanilgilar-rezonans"></a>

### On resonance

> **Common misconception — “The Tacoma Narrows bridge collapsed because of resonance”**
>
> On 7 November 1940 the bridge collapsed in a steady wind of about 19 m/s with a torsional motion at 0.2 Hz. The vortex-shedding explanation does not hold: at that wind speed the shedding frequency is about 1 Hz, five times the observed frequency, and there is no periodic external force. The event was a self-excited aeroelastic flutter in which the aerodynamic moment, which depends on the motion of the structure itself, made the torsional damping negative [[106](#ref-106), [107](#ref-107)]. In forced resonance there is an external force on the right-hand side of the equation and damping limits the amplitude; in flutter the damping coefficient itself changes sign. The driven oscillator of this application is a model of the former.

> **Common misconception — “Resonance occurs exactly at the natural frequency”**
>
> That is true of the absorbed power and of the velocity amplitude. The displacement amplitude is largest at $`\omega_0\sqrt{1-2\zeta^2}`$, below the natural frequency, and has no peak at all for $`\zeta \ge 1/\sqrt{2}`$ (Chapter 2). For light damping the difference is small: at $`\zeta = 0.1`$ the peak lies 1 % below $`\omega_0`$, and the amplitude at $`\omega_0`$ itself is 99.5 % of the peak value. The task sheet “Find the resonance peak” is therefore set up with $`\zeta = 0.25`$, where the peak lies 6.5 % below $`\omega_0`$ and the amplitude at $`\omega_0`$ is 96.8 % of the peak value. The sheet requires the amplitude measured in the steady state to be at least 98 % of the peak value, so it is completed below the natural frequency and not at it.

> **Common misconception — “Bridges collapse because of soldiers marching in step”**
>
> The documented case is the Broughton suspension bridge near Manchester on 12 April 1831: the bridge gave way under 74 soldiers marching in step and nobody died; the contemporary report attributes the failure to a defective bolt in the attachment of a stay chain [[108](#ref-108)]. The lateral sway of the Millennium Bridge in London on 10 June 2000 was not marching in step: the sway grew as pedestrians adapted their steps to the motion of the bridge, and in a controlled test the response stayed small up to 166 walkers and then increased rapidly [[109](#ref-109), [110](#ref-110)]. Later work shows that the instability can also arise without synchronisation [[111](#ref-111)].

> **Common misconception — “Opera singers shatter glasses with their voice”**
>
> There is no verified case of an opera singer doing this on stage. It is physically possible and has been documented once under controlled conditions without amplification [[112](#ref-112)]; laboratory demonstrations use amplified sound locked to the natural frequency of the glass [[113](#ref-113)].

<a id="yanilgilar-sonum"></a>

### On damping

> **Common misconception — “Car shock absorbers are critically damped”**
>
> The damping ratio of passenger-car suspensions is typically between 0.2 and 0.4, i.e. clearly underdamped; for racing cars the value approaches 1 [[114](#ref-114), [115](#ref-115)]. Critical damping is too harsh for ride comfort.

> **Common misconception — “The more damping, the sooner the system comes to rest”**
>
> Above the critical value more damping slows the return, because the slowly decaying exponential term dominates. The fastest return without overshoot is at $`\zeta = 1`$; if a small overshoot is allowed, the shortest settling is near $`\zeta \approx 0.78`$ (Chapter 2).

<a id="yanilgilar-sarkac"></a>

### On the pendulum

> **Common misconception — “The period of a pendulum does not depend on the amplitude”**
>
> Galileo's observation of isochronism [[116](#ref-116), [117](#ref-117)] holds only approximately, for small angles: the period is longer by 0.19 % at an amplitude of 10°, by 1.7 % at 30° and by 18 % at 90°. Huygens found in 1659 that the exactly isochronous curve is the cycloid and published it in *Horologium Oscillatorium* (1673) [[118](#ref-118), [119](#ref-119)].

> **Note — The seconds pendulum and the metre**
>
> A pendulum with a period of 2 s has, at standard gravity, the length $`g/\pi^2 = 0.9936`$ m. The closeness is no coincidence: in 1790 the length of the seconds pendulum was proposed as the unit of length, and the Academy commission preferred one ten-millionth of the quarter meridian in its report of 19 March 1791 [[120](#ref-120)].

<a id="yanilgilar-kaos"></a>

### On chaos

> **Common misconception — “Chaos is randomness”**
>
> A chaotic system is completely deterministic; the same initial conditions give the same trajectory, and in the application every experiment can be repeated exactly. Unpredictability arises from the finite precision with which initial conditions are known and from the exponential growth of the error [[88](#ref-88)].

> **Common misconception — “The double pendulum is chaotic”**
>
> Chaos is a property of the trajectory, not of the system. The same double pendulum is regular at low energy, largely chaotic at intermediate energies and regular again at very high energy [[58](#ref-58), [92](#ref-92)]. The task sheet “An island of regular motion” has this measured.

> **Common misconception — “A single pendulum becomes chaotic at large angles”**
>
> The phase space of the undriven single pendulum is two-dimensional and the Poincaré–Bendixson theorem rules out chaos [[88](#ref-88)]. What changes at large angles is the period, not the predictability. A single pendulum becomes chaotic only with a periodic drive, i.e. with a third phase-space dimension [[121](#ref-121)]; that model is not included here.

> **Common misconception — “The tip of a whip breaks the sound barrier and cracks”**
>
> The acceleration towards the free end of a chain of many links is often explained with the whip. The crack really is a shock wave, but it is produced not by the tip but by the loop travelling along the whip: the crack occurs when the loop, accelerated by the taper, reaches the speed of sound; at that moment the tip moves at about twice the speed of the loop [[122](#ref-122)]. The speed of sound in air at 20 °C is about 343 m/s [[123](#ref-123)].

<a id="sinirlar"></a>

## 9. Assumptions and limitations

*What the model does not contain, how far the numerical results can be trusted, and the studies that have not been done.*

<a id="sinirlar-model"></a>

### The physical model

- **Point masses, massless rigid rods.** The rods have neither moment of inertia nor elasticity. Real double pendulums are compound pendulums [[95](#ref-95), [58](#ref-58)]; the numerical values given here (periods, thresholds, Lyapunov exponent) cannot be compared directly with such an apparatus.
- **Planar motion.** The chain moves in a vertical plane. Rods and masses are placed in successive parallel planes; this is how full freedom of rotation and the requirement that no part passes through another are met together. The effect of the small distance between the planes on the dynamics is not modelled.
- **Viscous friction only.** There is no dry friction and no air drag; the damping force is proportional to the velocity at every speed. For the eddy-current brake this is an approximation valid only at low speed [[25](#ref-25), [26](#ref-26)].
- **Linear, massless spring.** The spring force is exactly linear down to the solid length and the spring has no mass of its own. The spring drawn is not a design to scale: made of steel wire, the same geometry would give about $`10^5`$ N/m from $`k = Gd^4/(8D^3N_a)`$ [[31](#ref-31), [124](#ref-124)]. The metre-scale dimensions of the apparatus were chosen for visibility.
- **Rigid stops, constant coefficient of restitution.** An impact is instantaneous; the duration of contact, a speed-dependent restitution and the deformation of the buffer are not modelled.
- **Ideal drive.** The drive is an ideal force source that is not affected by the motion of the carriage.

<a id="sinirlar-sayisal"></a>

### The numerical results

- **Energy drift accumulates.** RK4 is not symplectic; the drift grows with time. The values given belong to 60-second experiments; in a run lasting hours the residual should be watched and, if necessary, the step reduced or the adaptive method selected. Either change starts the experiment afresh (Chapter 4).
- **A solution can diverge.** With a low-order method and a coarse step the solution of the pendulum chain can leave the finite range. The experiment is then halted (Chapter 4); restarted unchanged with the same solver, it is halted again at the same instant.
- **Chaotic trajectories are not individually meaningful beyond the horizon.** As explained in Chapter 5, after a few tens of seconds the state shown is not the state of the exact solution; what is meaningful are the statistical and geometric properties.
- **The Lyapunov exponent is a finite-time estimate** and depends on the trajectory; no single number can be given as “the exponent” of an apparatus.
- **There is no real-time guarantee.** When a slow device or a high step frequency makes a frame last longer than 0.1 s, the part of the frame beyond 0.1 s is not simulated and simulated time falls behind the wall clock; the status bar shows the number of these frames since the last restart once they recur (four within two seconds), so that a single long frame does not raise the notice. The physical result is not affected, because the sequence of steps stays the same.
- **Repeatability across runtime environments has not been tested** (Chapter 4).

<a id="sinirlar-gecerleme"></a>

### Validation and educational effect

Two important studies have not been done. First, the model has not been compared with a physical apparatus. Second, the usability of the tool and its effect on learning have not been measured with users. The principles relied on in the design of the interface and of the task sheets come from published research (Chapters 11 and 12), but that they produce the same result here is an assumption. Chapter 1 noted that the evidence on virtual laboratories is mixed; the simulation is meant to stand beside real measurement, not to replace it.

<a id="sinirlar-gelecek"></a>

### Future work

- A compound-pendulum model with distributed rod mass and its comparison with a real double pendulum by video analysis [[125](#ref-125)].
- Contact models with dry friction and speed-dependent restitution [[34](#ref-34), [32](#ref-32)].
- The periodically driven single pendulum: the chaotic mechanical system with the fewest degrees of freedom [[121](#ref-121), [126](#ref-126)].
- Symplectic or variational integrators for long runs [[67](#ref-67)].
- Computation of the full Lyapunov spectrum [[86](#ref-86)].
- A user study with students, with pre- and post-measurements.

<a id="mimari"></a>

## 10. Software architecture

*Three layers - physics core, runtime and observers; the fixed-step loop; measurable quality criteria and a comparison with the state before the rewrite.*

<a id="mimari-katmanlar"></a>

### Layers and data flow

The code is divided into three layers with dependencies pointing downwards only. The **physics core** (src/physics) depends on no framework: the integrators, the models of the two experiments, the Lyapunov estimator, the measuring instruments, the spectrum analyser and the verification experiments are pure functions and small classes that can be tested without a browser. The **runtime** (src/sim) holds the state: it runs the fixed-step loop, writes telemetry into ring buffers, feeds the virtual instruments and converts an experiment definition to a file or a link. The **observers** only read the runtime: the three-dimensional scene (src/scene), the plots (src/ui/plots) and the React components (src/ui).

Continuous state (positions, velocities, energy terms) is not kept in React state. Scene and plots draw by reading the runtime directly on every animation frame, whereas numerical read-outs are refreshed at most twelve times per second. The physics step, the drawing and the interface are thus independent of each other's cost. Discrete state - parameters, run state, initial conditions - is published as an immutable object, and components subscribe only to the slice they use.

The hot path allocates no memory: the integrators own their work arrays, the helical geometry of the spring is updated analytically inside the same buffer on every frame, and vector arrows and stroboscope images are pre-allocated instances. The scene is redrawn only when the state, the camera, a layer or the viewport size has changed.

<a id="mimari-dongu"></a>

### The fixed-step loop

The wall-clock duration of every animation frame is added to a budget; the budget is spent in steps of exactly $`h = 1/f_s`$, and the remainder is carried over to the next frame [[70](#ref-70)]. A frame adds at most 0.1 s of wall-clock time to the budget, which bounds the number of steps per frame (400 at the highest step frequency and time scale); a longer frame is cut to that length and counted (the status bar shows the count once such frames recur), and the time a tab spends in the background is discarded. With this arrangement the sequence of states depends only on the initial conditions, the parameters, the method and $`h`$. The test-suite checks this directly: the same experiment is run once with uniform 60 Hz frames and once with random frame durations, and the states at common step counts are verified to be bit-for-bit equal.

> **Note — Why it matters**
>
> In a chaotic system the smallest difference in step size grows exponentially. In the previous version, where the step was derived from the frame duration, the same double-pendulum experiment was in states 214° apart after 30 s on a 60 Hz and on a 144 Hz display; the observed trajectory depended on the screen, not on the physics.

<a id="mimari-kalite"></a>

### Quality assurance

- TypeScript is compiled in strict mode; static analysis (ESLint) passes without warnings.
- There are 154 automated tests: linear algebra, special functions, integrators, both models, the measuring instruments, the runtime, data exchange and the fourteen verification experiments; the contrast ratios of the interface colours (and that this chapter quotes the values they give), the reading of numeric entries, the validation of stored preferences and the record and peak rules of the spectrum read-out are tested too. For every task sheet the tests show that the sheet is completed by the intended measurement and that it stays open with a wrong setting. The content is tested as well: that the theory text has the same structure in both languages, that every citation exists in the bibliography, that every formula can be typeset, and that the texts of the task sheets and of the verification panel agree with the numbers of criteria and rows in the code.
- External data (an experiment file, a shared link) are validated before use. Data with a wrong structure, an unknown method, a step frequency other than the six offered or a value that is not a finite number are rejected as a whole. A parameter outside its range is set to the nearest limit, and the initial conditions get the limits of the number fields: the position between the two stops, the speed within ±30 m/s, the angles within ±1800° and the angular velocities within ±40 rad/s. An angle beyond the limit is reduced by whole turns into (−180°, 180°], which keeps the configuration of the chain; a chain grabbed with the pointer is stored the same way at its release. Preferences kept in the browser's storage are validated in the same way: a value the interface cannot use is replaced by its default.
- Continuous integration runs the type check, the static analysis, the tests and the production build on every change.

<a id="mimari-karsilastirma"></a>

### Comparison with the state before the rewrite

In the table below the left-hand figures were measured by running the previous code unmodified, the right-hand ones with the verification suite of this version. The Lagrange equations and the single RK4 step of the previous version were correct; what was missing was the measurement and book-keeping around them.

*Table 10.1. The previous version and this version on measurable criteria.*

| Criterion | Previous version | This version |
| --- | --- | --- |
| Time step | Derived from the frame duration (3.33 ms at 60 Hz; 2.31 ms at 144 Hz) | Fixed $`h = 1`$ ms; independent of the frame rate |
| The same double-pendulum experiment on a 60 Hz and a 144 Hz display | States 214° apart after 30 s | Bit-for-bit identical |
| Double pendulum, relative energy drift over 60 s | $`5.7\times10^{-7}`$ | $`2.0\times10^{-9}`$ |
| Six-link chain, relative energy drift over 60 s | $`9.0\times10^{-5}`$ | $`3.3\times10^{-7}`$ |
| Impact with a stop | Rebound depends on the frame rate: $`x(3\,\mathrm{s}) = 2.19`$ m (60 Hz), $`4.05`$ m (120 Hz) | Event location; error in the instant of impact $`9\times10^{-13}`$ s |
| Energy accounting (driven experiment with stops) | Impact losses and drive work unrecorded; the displayed “total” rises from 0.49 J to 4414 J in 60 s | Five-term ledger; relative residual $`1.3\times10^{-12}`$ over 27 impacts |
| Heat in the pendulum | Defined as $`E_0 - E_\mathrm{mech}`$; jumps from 4.78 J to 66.63 J when $`g`$ is changed | Integrated as a state variable of its own; the ledger is re-based when a parameter changes |
| Exported CSV | In 99.6 % of the rows the energy belongs to a different instant; 4.3 s of record | Every row is a single instant; up to 60 000 rows (600 s at the default step frequency); header with parameters, initial conditions, method and step |
| Spring geometry | Rebuilt every frame: 1031 KiB of memory, 0.57 ms | Updated in the same buffer; no allocation |
| Automated tests | None | 154 tests, 14 of them verification experiments |
| Accessibility | No ARIA attributes, no keyboard control, no dialog semantics | Every control operable from the keyboard; visible focus; labelled controls |
| English interface | 19 of 68 translation keys in use | Both languages complete; key parity checked at compile time |

<a id="arayuz"></a>

## 11. Interface and interaction design

*Reasons behind the layout, direct manipulation, the quantity-to-colour mapping, vectors drawn to scale, the principles of the plots, accessibility and sonification.*

<a id="arayuz-yerlesim"></a>

### Layout: parameters, scene and plots at the same time

At a laboratory bench one watches the oscilloscope while turning a knob. Three regions are therefore kept visible together: the apparatus in the centre, the plot panel below it and the parameter panel to its right. When a parameter is changed its effect is seen at once in the scene and in the plots; the measurement table and the task sheets are further tabs of the right-hand panel. In a window narrower than 1024 px that panel opens as a sheet over the scene instead. The status bar along the bottom edge shows the numerical state: the energy-ledger residual at every width, the deviation from the analytical solution (for the oscillator) from 1024 px, and solver, step and order from 1280 px; in a narrower window the solver button of the top bar still names the method and, from 640 px, the step frequency. When the status bar reports late frames or offers the adaptive solver, these notices take precedence over the read-outs.

The established thresholds for feedback times are respected: a response below about 0.1 s is perceived as instantaneous, 1 s is noticed without interrupting the flow of thought, and 10 s is the limit for holding attention [[127](#ref-127), [128](#ref-128), [129](#ref-129)]. A parameter change takes effect in the same frame; the only long operations, the frequency sweep and the verification suite, run in pieces with a progress indication, and the sweep can be cancelled.

<a id="arayuz-manipulasyon"></a>

### Direct manipulation

Bodies are grabbed, dragged and released with the pointer; the object of interest stays visible, the action is physical and its result can be undone at once [[130](#ref-130), [131](#ref-131)]. The carriage has one degree of freedom: the point of the rail axis closest to the pointer ray is taken, so the mapping is consistent from every camera angle. A pendulum link is turned towards the point where the ray meets its own plane of rotation. The velocity at release is estimated from the pointer motion during the last 90 ms and transferred to the body; if the pointer is stopped before release, the body is released from rest.

Dragging is not the only way in. The same initial conditions can be entered from the keyboard, as exact values, in the number fields of the parameter panel; both accessibility and reproducibility require this. The reset command returns to the initial conditions of the experiment being run, not to default values.

<a id="arayuz-renk"></a>

### Quantity-to-colour mapping

A physical quantity has the same colour everywhere: position and angle are sky blue, velocity bluish green, net force orange, spring force yellow, damping force reddish purple, driving force and weight vermilion; kinetic energy carries the colour of velocity and potential energy that of position. In a chain of several links each link has a colour of its own instead, which it keeps in the scene, the plots and the tables (link 1 sky blue, then orange, bluish green, yellow, blue and vermilion). The colours are taken from the Okabe–Ito palette [[102](#ref-102), [103](#ref-103)]. Because up to 8 % of men and 0.5 % of women of Northern European ancestry have the common red-green colour-vision deficiency [[103](#ref-103)], this choice is a condition of legibility rather than decoration; that colour choices can distort the data in scientific figures has also been documented [[132](#ref-132)]. No quantity is identified by its colour alone: every vector has its symbol and numerical value, every curve its label.

<a id="arayuz-vektor"></a>

### Vectors to scale and measuring devices in the scene

Vector arrows are drawn to scale: length is proportional to magnitude, and the current scale (for example 1 m ≙ 20 N) is written in the scene. The scale is chosen from the 1–2–5 series according to the typical (root-mean-square) magnitude of the last few seconds. So that brief spikes - the rod force in a whipping chain, for instance - do not upset the scale, an arrow exceeding the maximum length is clipped and marked with a double head; its label always shows the true value. In the free-body diagram every force is drawn separately; in the pendulum the rod force is computed from Newton's second law, independently of the equations of motion, and reverses direction under compression.

The apparatus is drawn together with its measuring devices: for the oscillator a ruler graduated in 0.1 m along the edge of the bench and an index needle attached to the carriage, for the pendulum a protractor behind the pivot. No solid body ever passes through another: the wire diameter of the spring is chosen so that the coils touch exactly at the solid length; the pendulum links turn in successive parallel planes, as in real multi-link pendulums; and the stand extends with the chain so that its lowest point never reaches the bench.

<a id="arayuz-grafik"></a>

### Plots

Every plot has numbered axes with units, ticks in 1–2–5 steps and a faint grid; there is no ornament [[133](#ref-133)]. Quantitative comparisons use the encoding that is read most accurately, position along a common scale [[134](#ref-134)]. Axis limits follow the data without jitter: they expand immediately when the data leave the range and contract slowly when the data shrink. Angles are wrapped to $`(-\pi, \pi]`$ and the curve is broken at the wrap, so no misleading vertical strokes appear. The time axis is tied to simulated time, not to a frame count; telemetry is recorded at 100 Hz for step frequencies of 300 Hz and above, and at every step at 60 Hz and 120 Hz.

<a id="arayuz-erisilebilirlik"></a>

### Accessibility

The target is level AA of WCAG 2.2 [[135](#ref-135)]. The criteria from that document which shape the design most directly are listed below together with what the interface does to meet them. The contrast ratios are computed from the colour values with the formula of that document; the automated tests repeat the computation, assert that the thresholds of 4.5:1 and 3:1 are met on the surfaces named, and check that the figures quoted below are the ones the colour values give.

- **1.1.1 Non-text Content:** every typeset formula is output twice, as the visual rendering and as MathML, which is what assistive technology reads. The scene and the plots carry a text description, and the quantities measured in them are listed as text in the Measurements tab.
- **1.4.3 Contrast (Minimum):** at least 4.5:1 for text. The three principal text colours reach at least 5.17:1 on every surface. The dimmest text colour, used for labels and units, reaches 5.50:1 on the panel and at least 4.76:1 on every surface it appears on; the lowest value is that on the surface of an item under the pointer. On the lightest surface, that of selected items and tooltips, it would reach only 4.21:1, and it is not used there.
- **1.4.11 Non-text Contrast:** at least 3:1 for what identifies a control or its state. Where an outline or a mark is the only such sign, it is drawn in one colour that reaches at least 3.06:1 on every surface (4.01:1 on the panel): the outline of the number fields, of the switch and of the option rings of the task sheets, the track of the sliders, the outline of the selected item of a segmented control and the grip of the handle of the plot dock. The focus ring reaches at least 6.43:1 and the thumb of the scroll bars at least 3.10:1. A pressed toggle button carries an outline in the accent colour that reaches at least 3.59:1 against its tinted fill and against the surface around it. The hairlines that separate regions and frame buttons are kept below 3:1 on purpose (between 1.1:1 and 1.6:1); they are decoration, and a button is identified by its label.
- **1.4.1 Use of Color:** the following states are marked by more than their colour. The run state is written next to its coloured dot, a non-default solver changes the icon of the solver button as well as its tint, the selected item of a segmented control and a pressed toggle button (scene layers, sound) carry an outline, the current entry of the contents list of the theory reader carries a bar at its leading edge, a rejected entry gets a message with an icon in addition to the outline in the error colour, and verification results and completed task sheets are marked by a check or a cross and by a text for screen readers.
- **2.1.1 Keyboard:** every control can be reached and operated from the keyboard, the handle of the plot dock included. The mass of the pendulum on which the vectors are drawn is chosen with a selector beside the vector scale; a click on the mass does the same. While the scene has the focus, the arrow keys orbit the camera in steps of 3° and, with Shift, pan it; the views and the zoom have buttons. Grabbing and throwing a body is the one function that needs a pointer; its counterpart is the number fields for the initial conditions.
- **2.1.4 Character Key Shortcuts:** the single-key shortcuts can be switched off in the shortcuts dialog; the space bar keeps working. They do nothing while a dialog, a menu or a list is open, while text is being entered in a field and while a body is held.
- **2.4.7 Focus Visible:** the focused control carries a 2 px outline in the accent colour; a number field shows the focus as an accent-coloured border and a menu as the highlighted row.
- **2.4.11 Focus Not Obscured (Minimum):** the two scrolling panels whose header stays in place reserve at least its height, so that a control brought into view by the focus is not covered by it.
- **2.5.7 Dragging Movements:** every setting made by dragging can also be made without a drag: the height of the plot dock by clicking its handle, which steps through four heights (180, 288, 404 and 520 px); a slider by a click on its track or through its number field; the camera with the view buttons and the arrow keys; the position of a body through the number fields for the initial conditions.
- **2.5.8 Target Size (Minimum):** the controls are dimensioned at no less than 24 by 24 CSS pixels. The smallest are 24 px high: the items of the small segmented controls, the switch (40 by 24), the buttons that set the gravity of a celestial body, the handle of the plot dock, the offer in the status bar and the links of the reference list. The citation numbers in the running text rely on the exception the criterion makes for targets inside a sentence.
- **3.3.1 Error Identification:** a number field does not accept text that is not a number: the text stays in the field, the field is marked, and a message naming the admissible range appears and is announced to screen readers. A number outside the range is set to the nearest limit: the field shows the value that is used, and a short note, also announced to screen readers, names the range and the limit.

Dialogs keep the focus inside, close with Escape and return the focus to the control that opened them. The clock is exposed as a timer without live announcements, so that a running experiment does not interrupt a screen reader. The document language changes with the interface language. Below 1024 px the top bar wraps onto further rows instead of cutting controls off. The time scale, for which the top bar has room only from 1536 px, is also set at the head of the parameter panel, and while it differs from 1 the scale key in the scene names it, at every size of the scene. If the operating system asks for reduced motion, the transitions of the interface are shortened to an imperceptible duration, the camera is placed at a new view at once instead of gliding there, and the orbit control loses its inertia; the motion of the experiment is the content, so it continues, and it can be paused at any moment.

> **Limitation — What these measures do not cover**
>
> One control and four read-outs exist only in wider windows: the switch “Show the analytical solution” of the time plot and the clock of the top bar from 768 px, and in the status bar the frame rate (from 640 px; from 768 px while late frames are reported), the physics time per frame (from 1280 px) and the number of recorded samples (from 1536 px). In a narrower window, or at a zoom level that makes the window that narrow in CSS pixels, they cannot be reached. In a window narrower than 640 px the status bar, while it shows a notice, gives the run state by the colour of its dot alone; the run button then shows the state by its icon, and a divergence is stated in words by the banner above the scene. A body can be grabbed and thrown with a pointer only. This report contains no test with a screen reader or with people who rely on assistive technology; the statements above rest on the source code and on computation.

<a id="arayuz-ses"></a>

### Sonification

The mechanical frequencies (a few hertz at most) lie far under the range of hearing, so the sound is not a recording but an auditory display by parameter mapping [[104](#ref-104)]. For the oscillator the pitch follows the position (one octave per 3.5 m) and the loudness follows the speed; an impact with a stop is heard as a short stroke proportional to the impact speed. For the pendulum every passage of the first link through the vertical is marked by a tick whose pitch depends on the direction: a single pendulum sounds as regular as a clock, a chaotic chain does not. Sound plays only when the user has switched it on, while the simulation is running and the tab is visible.

<a id="pedagoji"></a>

## 12. Pedagogical design

*Findings on learning with interactive simulations and how they are reflected in the construction of the task sheets.*

<a id="pedagoji-bulgular"></a>

### Findings on learning with simulations

The place of interactive simulations in physics teaching is well documented [[136](#ref-136), [137](#ref-137)]. A review of 51 publications from 2001–2010 found robust evidence that simulations can enhance traditional instruction, laboratory activities in particular, but also that most studies disregarded teacher support and the place of the simulation within the lesson [[20](#ref-20)]. Other reviews reached similar conclusions [[138](#ref-138), [21](#ref-21)]. In a controlled study, students who worked on direct-current circuits with a simulation outperformed those who worked with real equipment both on conceptual questions and on the task of building a real circuit [[17](#ref-17)].

These findings do not mean that a simulation teaches by itself. In a survey of 62 introductory courses and 6542 students the average normalised gain was $`0.48 \pm 0.14`$ in courses using interactive-engagement methods and $`0.23 \pm 0.04`$ in traditional courses [[139](#ref-139)]; what matters is not the tool but that the student is led to think actively. It has also been shown that even a simulation which permits clear observations does not guarantee conceptual understanding [[19](#ref-19)].

<a id="pedagoji-foyler"></a>

### Construction of the task sheets

The sheets follow the predict – observe – explain pattern [[140](#ref-140), [141](#ref-141)]: the student first commits to a prediction by choosing one of the answers offered to the question of the sheet, then sets up the apparatus and measures; when the sheet is complete, the prediction is compared with the observation and an explanation opens that reconciles the measurement with the theory and names its sources. The criteria are evaluated continuously in the background while the student changes the parameters. Completion of a sheet depends on a measurement, not on the position of a slider: the period is read from zero crossings, the damping from successive peak values, overshoot and settling time from the step response, predictability from the separation of the twin trajectory and from the Lyapunov estimate. The “critical damping” sheet, for instance, is completed not by setting the damping ratio to 1 but by a measured overshoot of at most 0.5 % and a measured settling time of at most 1.1 times the value at critical damping; half the critical damping fails the overshoot criterion and twice the critical damping fails the time criterion. A measurement made before a parameter was changed does not count: the step response is measured anew from the next release.

The same phenomenon is presented in several representations - the motion itself, the time series, the phase portrait, the energy ledger, the spectrum - and the representations are consistent in colour and symbol; the benefit of multiple representations depends on the relation between them being made explicit [[142](#ref-142)]. To limit cognitive load [[143](#ref-143), [144](#ref-144)] the detailed derivations are placed in a separate reader, and the working surface carries only the controls and read-outs needed at that moment.

The interface agrees with the design guidelines published for educational simulations: grabbable objects, intuitive controls, an explicit visual model, consistent representations and limited text [[145](#ref-145)]. Guidance is given through the controls and read-outs themselves rather than through lists of instructions [[146](#ref-146), [147](#ref-147)].

> **Limitation — Limit of scope**
>
> No learning gain has been measured in this work. The sources above are the reasons for design decisions; a claim about the effect of this laboratory on learning could be supported only by a controlled classroom study.

<a id="verification"></a>

## Appendix A. Verification tables

The values below were measured when this document was generated (Node.js 26.11.1, Windows_NT x64; RK4, h = 1 ms). The error column is the relative or absolute difference between the measured value and the reference value. In rows without a reference value the measured value itself is compared with a bound. The same experiments can be run inside the application: Theory and references → Verification.

### A.1 Observed order of accuracy

A driven, damped oscillator with a known closed-form solution ($`m = 1`$ kg, $`k = 4\pi^2`$ N/m, $`c = 0.4`$ N·s/m, $`F_0 = 3`$ N, $`\omega = 4`$ rad/s) is integrated to $`t = 2`$ s with two step sizes. The observed order $`p = \ln(e_1/e_2)/\ln(h_1/h_2)`$ computed from the two errors is compared with the theoretical order of the method [[63](#ref-63), [105](#ref-105)].

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Explicit Euler | 1.007261 | 1 | 0.007260591 | ≤ 0.1 | passed |
| Symplectic Euler | 1.005086 | 1 | 0.005086394 | ≤ 0.1 | passed |
| Midpoint (RK2) | 2.000519 | 2 | 5.19×10⁻⁴ | ≤ 0.1 | passed |
| Classical Runge–Kutta (RK4) | 4.004818 | 4 | 0.004817861 | ≤ 0.1 | passed |
| Dormand–Prince 5 | 5.023805 | 5 | 0.02380499 | ≤ 0.1 | passed |

### A.2 Free response against the closed-form solution

The oscillator with $`m = 2`$ kg and $`k = 24`$ N/m is released from rest at $`x_0 = 2`$ m and integrated with RK4 at $`h = 1`$ ms for 20 s. The table gives the largest deviation of the numerical position from the analytical solution in the four damping regimes.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`\zeta = 0`$ (undamped) | 1.62×10⁻¹⁰ m | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`\zeta = 0.1`$ (underdamped) | 8.86×10⁻¹² m | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`\zeta = 1`$ (critically damped) | 2.77×10⁻¹² m | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`\zeta = 2.5`$ (overdamped) | 2.15×10⁻¹¹ m | — | — | ≤ 1.00×10⁻⁹ | passed |

### A.3 Driven steady state: amplitude and phase lag

$`m = 2`$ kg, $`k = 24.5`$ N/m, $`c = 0.55`$ N·s/m, $`F_0 = 1`$ N. The oscillator is driven at five frequencies until the transient has decayed by a factor $`e^{-16}`$; amplitude and phase lag are measured with the virtual instruments of the application and compared with the theoretical $`A(\omega)`$ and $`\delta(\omega)`$.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`A(0.5\,\omega_0)`$ | 0.05434726 m | 0.05434726 m | 9.48×10⁻¹⁰ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(0.5\,\omega_0)`$ | 0.05233312 rad | 0.05233312 rad | 4.15×10⁻⁹ | ≤ 0.001 | passed |
| $`A(0.9\,\omega_0)`$ | 0.2013308 m | 0.2013308 m | 2.43×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(0.9\,\omega_0)`$ | 0.3562965 rad | 0.3562964 rad | 1.09×10⁻⁸ | ≤ 0.001 | passed |
| $`A(\omega_0)`$ | 0.5194805 m | 0.5194805 m | 2.62×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(\omega_0)`$ | 1.570796 rad | 1.570796 rad | 8.74×10⁻⁹ | ≤ 0.001 | passed |
| $`A(1.1\,\omega_0)`$ | 0.1797363 m | 0.1797363 m | 3.30×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(1.1\,\omega_0)`$ | 2.751157 rad | 2.751157 rad | 1.63×10⁻⁹ | ≤ 0.001 | passed |
| $`A(1.5\,\omega_0)`$ | 0.03250888 m | 0.03250888 m | 1.05×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(1.5\,\omega_0)`$ | 3.047585 rad | 3.047585 rad | 3.28×10⁻⁸ | ≤ 0.001 | passed |

### A.4 Step response: overshoot and settling time

$`m = 4`$ kg, $`k = 36`$ N/m, $`x_0 = 2`$ m. At critical damping there must be no overshoot and the 2 % settling time must equal $`5.834/\omega_0`$; for $`\zeta = 0.5`$ the overshoot must equal $`e^{-\pi\zeta/\sqrt{1-\zeta^2}}`$. The step-response meter receives a sample after every step of 1 ms and places the entry into the 2 % band between two samples by linear interpolation.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Overshoot, $`\zeta = 1`$ | 0 | — | — | ≤ 1.00×10⁻⁹ | passed |
| 2 % settling time, $`\zeta = 1`$ | 1.944641 s | 1.944641 s | 1.47×10⁻⁷ | ≤ 0.002 | passed |
| Overshoot, $`\zeta = 0.5`$ | 0.1630335 | 0.1630335 | 1.79×10⁻⁷ | ≤ 1.00×10⁻⁴ | passed |

### A.5 Impact with a stop: instant, speed and energy loss

The undamped oscillator ($`m = 2`$ kg, $`k = 24`$ N/m) is released at $`x_0 = 6`$ m and hits the stop at $`x_\mathrm{min} = -4.75`$ m. The instant of impact $`\arccos(x_\mathrm{min}/x_0)/\omega_0`$, the impact speed $`\omega_0\sqrt{x_0^2 - x_\mathrm{min}^2}`$ and the energy lost $`\tfrac12 m v^2(1-e^2)`$ are known in closed form. The instant of impact is located inside the step by bisection.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Instant of impact | 0.7171639 s | 0.7171639 s | 8.64×10⁻¹³ | ≤ 1.00×10⁻⁸ | passed |
| Impact speed | 12.69843 m/s | 12.69843 m/s | 2.70×10⁻¹⁴ | ≤ 1.00×10⁻⁸ | passed |
| Energy lost in the impact | 128.5969 J | 128.5969 J | 5.41×10⁻¹⁴ | ≤ 1.00×10⁻⁸ | passed |
| Mechanical energy after the impact | 303.4031 J | 303.4031 J | 6.00×10⁻¹⁵ | ≤ 1.00×10⁻⁸ | passed |

### A.6 Closure of the energy ledger

Damping, drive and stops act together ($`c = 0.55`$ N·s/m, $`F_0 = 12`$ N, $`\omega = 3.5`$ rad/s; 27 impacts in 60 s). The largest relative deviation of $`E_k + E_p + Q_c + Q_e - W`$ from the initial energy is measured.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| RK4, 1000 Hz | 1.27×10⁻¹² | — | — | ≤ 1.00×10⁻⁸ | passed |
| RK4, 300 Hz | 1.49×10⁻¹⁰ | — | — | ≤ 1.00×10⁻⁶ | passed |

### A.7 Period of the finite-amplitude pendulum

The measured period of a single pendulum of length $`L = 1`$ m is compared with the elliptic-integral solution $`T = 4\sqrt{L/g}\,K(\sin(\theta_0/2))`$ [[47](#ref-47), [48](#ref-48)]. The last row is a pendulum that goes over the top and rotates continuously: $`T = (2/\kappa)\sqrt{L/g}\,K(1/\kappa)`$.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`\theta_0 = 10^\circ`$ | 2.010236 s | 2.010236 s | 3.61×10⁻¹¹ | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 45^\circ`$ | 2.086612 s | 2.086612 s | 3.74×10⁻¹² | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 90^\circ`$ | 2.368246 s | 2.368246 s | 1.03×10⁻¹⁰ | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 135^\circ`$ | 3.065688 s | 3.065688 s | 1.85×10⁻¹¹ | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 170^\circ`$ | 4.89436 s | 4.89436 s | 7.25×10⁻¹² | ≤ 1.00×10⁻⁷ | passed |
| Rotation, $`\kappa = 1.2`$ | 1.100227 s | 1.100227 s | 2.33×10⁻¹⁰ | ≤ 1.00×10⁻⁷ | passed |

### A.8 Energy drift of the frictionless chain

The chain with the default masses and lengths is released from large angles and followed for 60 s; the table gives the largest relative deviation of the energy ledger. The explicit-Euler row is there to show the inadequacy of that method and is a lower-bound criterion. The last two rows are the hardest corner of the admissible parameter range (three heavy, long links driving three light, short ones): the error of the fixed-step method is visible there, that of the error-controlled method is not.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 1`$, RK4, 1000 Hz | 4.67×10⁻¹³ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 2`$, RK4, 1000 Hz | 2.04×10⁻⁹ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 3`$, RK4, 1000 Hz | 2.41×10⁻⁸ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 6`$, RK4, 1000 Hz | 3.34×10⁻⁷ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 2`$, RK4, 300 Hz | 5.34×10⁻⁷ | — | — | ≤ 1.00×10⁻⁴ | passed |
| $`N = 2`$, Dormand–Prince 5 | 6.53×10⁻¹² | — | — | ≤ 1.00×10⁻⁷ | passed |
| $`N = 2`$, viscous joint friction ($`b = 0.3`$) | 5.54×10⁻¹¹ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 2`$, explicit Euler, 1000 Hz (lower bound) | 0.2415891 | — | — | ≥ 0.01 | passed |
| $`N = 6`$, extreme mass ratio, RK4, 1000 Hz | 0.00154048 | — | — | ≤ 0.01 | passed |
| $`N = 6`$, extreme mass ratio, Dormand–Prince 5 | 4.21×10⁻⁹ | — | — | ≤ 1.00×10⁻⁷ | passed |

### A.9 Small-oscillation spectrum

The numerical eigenfrequencies of a chain with equal masses and equal lengths are compared with the Laguerre zeros in $`\omega_k^2 = (g/\ell)\,x_k`$ [[51](#ref-51), [44](#ref-44)]; those of the double pendulum with the closed-form result $`(2 \mp \sqrt2)\,g/\ell`$ [[28](#ref-28)]; and the fundamental of the six-link chain with the value given by the Bessel zero of the hanging rope [[52](#ref-52)]. The last row checks that the non-linear simulation reproduces the period of the first mode at small amplitude.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$: eigenfrequencies against Laguerre zeros | 1.31×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 3`$: eigenfrequencies against Laguerre zeros | 2.65×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 6`$: eigenfrequencies against Laguerre zeros | 8.50×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 2`$: $`\omega_1`$ | 3.389573 rad/s | 3.389573 rad/s | 0 | ≤ 1.00×10⁻¹² | passed |
| $`N = 2`$: $`\omega_2`$ | 8.183153 rad/s | 8.183153 rad/s | 2.17×10⁻¹⁶ | ≤ 1.00×10⁻¹² | passed |
| $`N = 6`$: fundamental against the hanging-rope limit | 2.090636 rad/s | 2.173969 rad/s | 0.03833225 | ≤ 0.05 | passed |
| $`N = 2`$: period of mode 1 measured in the simulation | 2.736786 s | 2.736775 s | 4.04×10⁻⁶ | ≤ 1.00×10⁻⁴ | passed |

### A.10 Agreement of the Lagrangian and Newtonian derivations

The equations of motion are derived with Lagrange's method. The rod forces are computed separately from Newton's second law for every mass; an ideal rod carries force only along its own direction, so the transverse component must vanish if the two derivations are consistent. The criterion is the ratio of the transverse component to the tension over 200 randomly chosen states. The last row is the known tension of the single pendulum: $`T = m(g\cos\theta + L\dot\theta^2)`$.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$: transverse force / tension | 3.62×10⁻¹⁵ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 6`$: transverse force / tension | 5.29×10⁻¹⁵ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 1`$: rod tension | 18.36231 N | 18.36231 N | 0 | ≤ 1.00×10⁻¹³ | passed |

### A.11 Largest Lyapunov exponent

The exponent estimated with Benettin's method [[83](#ref-83)] over 400 s must be close to zero for regular motion and clearly positive for the chaotic double pendulum. The last two rows measure the sensitivity of the estimate to the numerical parameters: the step is halved and the initial separation is made ten times larger.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 1`$, $`\theta_0 = 120^\circ`$ (regular) | 0.01664401 1/s | — | — | ≤ 0.05 | passed |
| $`N = 2`$, small angles (regular) | 0.003477017 1/s | — | — | ≤ 0.05 | passed |
| $`N = 2`$, $`\theta = (2.15,\ 1.65)`$ rad (chaotic) | 1.040591 1/s | — | — | ≥ 0.5 | passed |
| Same experiment, step halved | 0.96936 1/s | 1.040591 1/s | 0.06845228 | ≤ 0.25 | passed |
| Same experiment, $`d_0 = 10^{-7}`$ | 1.040513 1/s | 1.040591 1/s | 7.50×10⁻⁵ | ≤ 0.25 | passed |

### A.12 Time reversibility

The frictionless equations of motion are reversible in time. The chain is integrated forwards, the signs of the velocities are changed and it is integrated again for the same time; the table gives the largest error in returning to the initial state. On a chaotic trajectory the error grows exponentially, so the time is short and the tolerance wide.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$, regular; 20 s out and back | 4.57×10⁻¹² rad | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`N = 3`$, regular; 20 s out and back | 3.14×10⁻¹² rad | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`N = 2`$, chaotic; 5 s out and back | 3.92×10⁻¹⁰ rad | — | — | ≤ 1.00×10⁻⁶ | passed |

### A.13 Agreement of two independent methods

The three-link chain is integrated for 5 s with fixed-step RK4 and with the error-controlled Dormand–Prince method. When the step is made four times smaller, the difference between RK4 and the reference solution must shrink by a factor of about $`4^4 = 256`$, as expected of a fourth-order method.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Difference between RK4 (1000 Hz) and DP5 | 8.43×10⁻⁸ rad | — | — | ≤ 1.00×10⁻⁶ | passed |
| Difference between RK4 (4000 Hz) and DP5 | 3.28×10⁻¹⁰ rad | — | — | ≤ 1.00×10⁻⁸ | passed |
| Error ratio (expected: about 256) | 256.6497 | 256 | 0.002537926 | ≤ 0.25 | passed |

### A.14 Spectrum analyser

A sine of frequency 1.2345 Hz and amplitude 0.7 with a constant offset is sampled at 100 Hz (4096 samples). The frequency does not coincide with any FFT bin; the peak frequency and amplitude are recovered with a Hann window [[99](#ref-99)] and two-bin interpolation [[101](#ref-101)].

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Peak frequency | 1.2345 Hz | 1.2345 Hz | 4.62×10⁻⁹ | ≤ 1.00×10⁻⁴ | passed |
| Peak amplitude | 0.7 | 0.7 | 1.02×10⁻⁸ | ≤ 0.001 | passed |

<a id="references"></a>

## References

Sources are numbered in order of first appearance in the text. Every entry was checked against a primary source on 2026-11-10, which is also the access date of the web resources.

<a id="ref-1"></a>1. PhET Interactive Simulations (2026). Pendulum Lab (HTML5 simulation, version 1.0.37). *PhET Interactive Simulations, University of Colorado Boulder*. University of Colorado Boulder. <https://phet.colorado.edu/en/simulations/pendulum-lab>

<a id="ref-2"></a>2. PhET Interactive Simulations (2026). Masses and Springs (HTML5 simulation, version 1.0.31). *PhET Interactive Simulations, University of Colorado Boulder*. University of Colorado Boulder. <https://phet.colorado.edu/en/simulations/masses-and-springs>

<a id="ref-3"></a>3. Neumann, E. (2024). myPhysicsLab [interactive physics simulations; website and open-source TypeScript library, Apache License 2.0]. *myphysicslab.com; GitHub repository myphysicslab/myphysicslab*. Erik Neumann. <https://github.com/myphysicslab/myphysicslab>

<a id="ref-4"></a>4. Easy Java/JavaScript Simulations (EjsS) Wiki (n.d.). ModelODESolvers (survey of the ODE solvers included in EJS version 4.2 and later). *EjsS Wiki, Universidad de Murcia*. Universidad de Murcia. <https://www.um.es/fem/EjsWiki/Main/ModelODESolvers>

<a id="ref-5"></a>5. Christian, W.; Esquembre, F. (2007). Modeling Physics with Easy Java Simulations. *The Physics Teacher* 45(8), 475-480. American Association of Physics Teachers. [doi:10.1119/1.2798358](https://doi.org/10.1119/1.2798358)

<a id="ref-6"></a>6. Christian, W.; Hampton, D. (2009). Double Pendulum With Poincare Map Model (Version 1.0) [Computer software]. *Open Source Physics collection, AAPT ComPADRE*. AAPT ComPADRE. <https://www.compadre.org/osp/items/detail.cfm?ID=9384>

<a id="ref-7"></a>7. GeoGebra (n.d.). GeoGebra Manual: SolveODE Command; NSolveODE Command; 3D Graphics View. *GeoGebra Manual (online documentation)*. GeoGebra. <https://geogebra.github.io/docs/manual/en/commands/SolveODE/>

<a id="ref-8"></a>8. Walsh, T. (2017). Creating interactive physics simulations using the power of GeoGebra. *The Physics Teacher* 55(5), 316-317. American Association of Physics Teachers. [doi:10.1119/1.4981047](https://doi.org/10.1119/1.4981047)

<a id="ref-9"></a>9. Algoryx Simulation AB (n.d.). Algodoo (Version 2.2.4) [Computer software]. *algodoo.com*. Algoryx Simulation AB. <https://www.algodoo.com/what-is-it/>

<a id="ref-10"></a>10. Gregorcic, B.; Bodin, M. (2017). Algodoo: A Tool for Encouraging Creativity in Physics Teaching and Learning. *The Physics Teacher* 55(1), 25-28. American Association of Physics Teachers. [doi:10.1119/1.4972493](https://doi.org/10.1119/1.4972493)

<a id="ref-11"></a>11. Falstad, P. (n.d.). Math, Physics, and Engineering Applets (including Coupled Oscillations Applet). *falstad.com*. <https://www.falstad.com/mathphysics.html>

<a id="ref-12"></a>12. Fendt, W. (2025). Apps on Physics (HTML5). *walter-fendt.de*. <https://www.walter-fendt.de/html5/phen/>

<a id="ref-13"></a>13. Chabay, R.; Sherwood, B. (2008). Computational physics in the introductory calculus-based course. *American Journal of Physics* 76(4), 307-313. American Association of Physics Teachers. [doi:10.1119/1.2835054](https://doi.org/10.1119/1.2835054)

<a id="ref-14"></a>14. Oliveira, S. R. de (2024). Deterministic chaos: A pedagogical review of the double pendulum case. *Revista Brasileira de Ensino de Física* 46, e20240060. Sociedade Brasileira de Física (SciELO). [doi:10.1590/1806-9126-RBEF-2024-0060](https://doi.org/10.1590/1806-9126-RBEF-2024-0060)

<a id="ref-15"></a>15. Chopyk, P. I.; Oleksiuk, V. P.; Chukhrai, O. P. (2024). Using the Three.js library to develop remote physical laboratory to investigate diffraction. *Proceedings of the 6th Workshop for Young Scientists in Computer Science & Software Engineering (CS&SE@SW 2023), Virtual Event, Kryvyi Rih, Ukraine, February 2, 2024. CEUR Workshop Proceedings (eds. S. O. Semerikov, A. M. Striuk)* 3662, 246-259. CEUR-WS.org. <https://ceur-ws.org/Vol-3662/paper23.pdf>

<a id="ref-16"></a>16. Halder, A.; Banerjee, S. (2026). Bridging the gap between virtual and physical laboratories: a web-based interactive platform for undergraduate physics practicals. *Physics Education* 61(1), 015044. IOP Publishing. [doi:10.1088/1361-6552/ae29d5](https://doi.org/10.1088/1361-6552/ae29d5)

<a id="ref-17"></a>17. Finkelstein, N. D.; Adams, W. K.; Keller, C. J.; Kohl, P. B.; Perkins, K. K.; Podolefsky, N. S.; Reid, S.; LeMaster, R. (2005). When learning about the real world is better done virtually: A study of substituting computer simulations for laboratory equipment. *Physical Review Special Topics - Physics Education Research* 1(1), 010103 (8 pp.). American Physical Society. [doi:10.1103/PhysRevSTPER.1.010103](https://doi.org/10.1103/PhysRevSTPER.1.010103)

<a id="ref-18"></a>18. Triona, L. M.; Klahr, D. (2003). Point and Click or Grab and Heft: Comparing the Influence of Physical and Virtual Instructional Materials on Elementary School Students' Ability to Design Experiments. *Cognition and Instruction* 21(2), 149-173. Taylor & Francis (Informa UK). [doi:10.1207/S1532690XCI2102_02](https://doi.org/10.1207/S1532690XCI2102_02)

<a id="ref-19"></a>19. Renken, M. D.; Nunez, N. (2013). Computer simulations and clear observations do not guarantee conceptual understanding. *Learning and Instruction* 23, 10-23. Elsevier. [doi:10.1016/j.learninstruc.2012.08.006](https://doi.org/10.1016/j.learninstruc.2012.08.006)

<a id="ref-20"></a>20. Rutten, N.; van Joolingen, W. R.; van der Veen, J. T. (2012). The learning effects of computer simulations in science education. *Computers & Education* 58(1), 136-153. Elsevier. [doi:10.1016/j.compedu.2011.07.017](https://doi.org/10.1016/j.compedu.2011.07.017)

<a id="ref-21"></a>21. de Jong, T.; Linn, M. C.; Zacharia, Z. C. (2013). Physical and Virtual Laboratories in Science and Engineering Education. *Science* 340(6130), 305-308. American Association for the Advancement of Science. [doi:10.1126/science.1230579](https://doi.org/10.1126/science.1230579)

<a id="ref-22"></a>22. International Organization for Standardization (ISO) (2019). *ISO 80000-3:2019, Quantities and units - Part 3: Space and time* (Edition 2 (2019-10; catalogue date 2019-10-22); amended by ISO 80000-3:2019/Amd 1:2025 (2025-07-24, 3 pp.)). 11 pp.. ISO, Geneva (ISO/TC 12 with IEC/TC 25). <https://www.iso.org/standard/64974.html>

<a id="ref-23"></a>23. International Organization for Standardization (ISO) (2019). *ISO 80000-4:2019, Quantities and units - Part 4: Mechanics* (Edition 2 (2019-08; catalogue date 2019-08-26); amended by ISO 80000-4:2019/Amd 1:2025 (2025-07-24, 1 p.)). 15 pp.. ISO, Geneva (ISO/TC 12 with IEC/TC 25). <https://www.iso.org/standard/64975.html>

<a id="ref-24"></a>24. Bureau International des Poids et Mesures (BIPM) (2019). *The International System of Units (SI) [Le Système international d'unités (SI)]* (9th edition (2019); text online on 2026-11-10 is version V4.01, updated June 2026). g_n: Appendix 1, pp. 153-154 (English text, V4.01). Bureau International des Poids et Mesures, Pavillon de Breteuil, F-92312 Sèvres Cedex, France (ISBN 978-92-822-2272-0). [doi:10.59161/AUEZ1291](https://doi.org/10.59161/AUEZ1291)

<a id="ref-25"></a>25. Wiederick, H. D.; Gauthier, N.; Campbell, D. A.; Rochon, P. (1987). Magnetic braking: Simple theory and experiment. *American Journal of Physics* 55(6), 500-503. American Association of Physics Teachers. [doi:10.1119/1.15103](https://doi.org/10.1119/1.15103)

<a id="ref-26"></a>26. Heald, M. A. (1988). Magnetic braking: Improved theory. *American Journal of Physics* 56(6), 521-522. American Association of Physics Teachers. [doi:10.1119/1.15570](https://doi.org/10.1119/1.15570)

<a id="ref-27"></a>27. French, A. P. (1971). *Vibrations and Waves* (1st). *The M.I.T. Introductory Physics Series*. W. W. Norton, New York. <https://openlibrary.org/isbn/9780393099362>

<a id="ref-28"></a>28. Taylor, J. R. (2005). *Classical Mechanics*. University Science Books, Sausalito, CA. <https://lccn.loc.gov/2004054971>

<a id="ref-29"></a>29. Rao, S. S. (2017). *Mechanical Vibrations* (6th). Pearson, Hoboken, NJ. <https://www.pearson.com/us/higher-education/program/Rao-Mechanical-Vibrations-6th-Edition/PGM173840.html>

<a id="ref-30"></a>30. Thornton, S. T.; Marion, J. B. (2004). *Classical Dynamics of Particles and Systems* (5th). Brooks/Cole (Thomson), Belmont, CA. <https://openlibrary.org/isbn/9780534408961>

<a id="ref-31"></a>31. Budynas, R. G.; Nisbett, J. K. (2015). *Shigley's Mechanical Engineering Design* (10th). *McGraw-Hill Series in Mechanical Engineering*. McGraw-Hill Education, New York. <https://highered.mheducation.com/sites/0073398209/information_center_view0>

<a id="ref-32"></a>32. Stronge, W. J. (2000). *Impact Mechanics* (1st). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511626432](https://doi.org/10.1017/CBO9780511626432)

<a id="ref-33"></a>33. Sandeep, C. S.; Senetakis, K.; Cheung, D.; Choi, C. E.; Wang, Y.; Coop, M. R.; Ng, C. W. W. (2021). Experimental study on the coefficient of restitution of grain against block interfaces for natural and engineered materials. *Canadian Geotechnical Journal* 58(1), 35-48. Canadian Science Publishing. [doi:10.1139/cgj-2018-0712](https://doi.org/10.1139/cgj-2018-0712)

<a id="ref-34"></a>34. Hunt, K. H.; Crossley, F. R. E. (1975). Coefficient of Restitution Interpreted as Damping in Vibroimpact. *Journal of Applied Mechanics* 42(2), 440-445. American Society of Mechanical Engineers (ASME). [doi:10.1115/1.3423596](https://doi.org/10.1115/1.3423596)

<a id="ref-35"></a>35. Goldstein, H.; Poole, C. P.; Safko, J. L. (2002). *Classical Mechanics* (3rd). Addison Wesley (San Francisco). <https://openlibrary.org/isbn/9780201657029>

<a id="ref-36"></a>36. Landau, L. D.; Lifshitz, E. M. (1976). *Mechanics* (3rd). *Course of Theoretical Physics, Vol. 1*. Pergamon Press, Oxford (reprinted by Butterworth-Heinemann/Elsevier). <https://openlibrary.org/isbn/9780750628969>

<a id="ref-37"></a>37. Konishi, T.; Yanagita, T. (2023). Multiple pendulum and nonuniform distribution of average kinetic energy. *Physical Review E* 108(1), 014204. American Physical Society. [doi:10.1103/PhysRevE.108.014204](https://doi.org/10.1103/PhysRevE.108.014204)

<a id="ref-38"></a>38. Conférence Générale des Poids et Mesures (CGPM) (1901). Declaration 2 of the 3rd CGPM (1901): Declaration on the unit of mass and on the definition of weight; conventional value of g_n. *Proceedings of the 3rd CGPM (1901) (Comptes Rendus, CR)*, 70. Bureau International des Poids et Mesures (BIPM). [doi:10.59161/CGPM1901DECL2E](https://doi.org/10.59161/CGPM1901DECL2E)

<a id="ref-39"></a>39. Williams, D. R. (2024). Moon Fact Sheet. *NASA Space Science Data Coordinated Archive (NSSDCA), Planetary Fact Sheets*. NASA Goddard Space Flight Center, Greenbelt, MD. <https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html>

<a id="ref-40"></a>40. Williams, D. R. (2025). Mars Fact Sheet. *NASA Space Science Data Coordinated Archive (NSSDCA), Planetary Fact Sheets*. NASA Goddard Space Flight Center, Greenbelt, MD. <https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html>

<a id="ref-41"></a>41. Williams, D. R. (2024). Jupiter Fact Sheet. *NASA Space Science Data Coordinated Archive (NSSDCA), Planetary Fact Sheets*. NASA Goddard Space Flight Center, Greenbelt, MD. <https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html>

<a id="ref-42"></a>42. DeLombard, R.; Kelly, E. M.; Hrovat, K.; Nelson, E. S.; Pettit, D. R. (2006). *Motion of Air Bubbles in Water Subjected to Microgravity Accelerations*. *NASA Technical Memorandum NASA/TM-2006-214327 (also AIAA-2005-0722; prepared for the 43rd AIAA Aerospace Sciences Meeting and Exhibit, Reno, Nevada, 10-13 January 2005)*, p. 2 (ISS quasi-steady microgravity environment). NASA Glenn Research Center, Cleveland, Ohio. <https://ntrs.nasa.gov/citations/20060017837>

<a id="ref-43"></a>43. Golub, G. H.; Van Loan, C. F. (2013). *Matrix Computations* (4th ed.). *Johns Hopkins Studies in the Mathematical Sciences*, xxi, 756 pp.. The Johns Hopkins University Press, Baltimore, MD. <https://zbmath.org/?q=an:1268.65037>

<a id="ref-44"></a>44. Braun, M. (2003). On some properties of the multiple pendulum. *Archive of Applied Mechanics* 72(11), 899-910. Springer. [doi:10.1007/s00419-002-0263-4](https://doi.org/10.1007/s00419-002-0263-4)

<a id="ref-45"></a>45. Udwadia, F. E.; Koganti, P. B. (2015). Dynamics and control of a multi-body planar pendulum. *Nonlinear Dynamics* 81(1-2), 845-866. Springer. [doi:10.1007/s11071-015-2034-0](https://doi.org/10.1007/s11071-015-2034-0)

<a id="ref-46"></a>46. Strutt, J. W. (Lord Rayleigh) (1873). Some General Theorems relating to Vibrations. *Proceedings of the London Mathematical Society (Series 1; paper read 12 June 1873)* s1-4(1), 357-368. London Mathematical Society (online edition: Wiley). [doi:10.1112/plms/s1-4.1.357](https://doi.org/10.1112/plms/s1-4.1.357)

<a id="ref-47"></a>47. Beléndez, A.; Pascual, C.; Méndez, D. I.; Beléndez, T.; Neipp, C. (2007). Exact solution for the nonlinear pendulum. *Revista Brasileira de Ensino de Física* 29(4), 645-648. Sociedade Brasileira de Física (SciELO). [doi:10.1590/S1806-11172007000400024](https://doi.org/10.1590/S1806-11172007000400024)

<a id="ref-48"></a>48. Carlson, B. C. (2026). Chapter 19: Elliptic Integrals. *NIST Digital Library of Mathematical Functions, https://dlmf.nist.gov/, Release 1.2.8 of 2026-09-15 (F. W. J. Olver, A. B. Olde Daalhuis, D. W. Lozier, B. I. Schneider, R. F. Boisvert, C. W. Clark, B. R. Miller, B. V. Saunders, H. S. Cohl, M. A. McClain, eds.)*. National Institute of Standards and Technology. <https://dlmf.nist.gov/19>

<a id="ref-49"></a>49. Nelson, R. A.; Olsson, M. G. (1986). The pendulum - Rich physics from a simple system. *American Journal of Physics* 54(2), 112-121. American Association of Physics Teachers. [doi:10.1119/1.14703](https://doi.org/10.1119/1.14703)

<a id="ref-50"></a>50. Carvalhaes, C. G.; Suppes, P. (2008). Approximations for the period of the simple pendulum based on the arithmetic-geometric mean. *American Journal of Physics* 76(12), 1150-1154. American Association of Physics Teachers. [doi:10.1119/1.2968864](https://doi.org/10.1119/1.2968864)

<a id="ref-51"></a>51. Müller, P. C. (2007). On Natural Frequencies of Conservative Multi-Degree-of-Freedom Mass-Spring Vibration Systems. *Proceedings of the XII International Symposium on Dynamic Problems of Mechanics (DINAME 2007), P. S. Varoto and M. A. Trindade (eds.), Ilhabela, SP, Brazil, 26 February - 2 March 2007*, paper DIN07-0055, 7 pp.. ABCM (Brazilian Society of Mechanical Sciences and Engineering). <https://www.abcm.org.br/anais/diname/2007/PDF/DIN07-0055.pdf>

<a id="ref-52"></a>52. Verbin, Y. (2015). Boundary conditions and modes of the vertically hanging chain. *European Journal of Physics* 36(1), 015005. IOP Publishing. [doi:10.1088/0143-0807/36/1/015005](https://doi.org/10.1088/0143-0807/36/1/015005)

<a id="ref-53"></a>53. Olver, F. W. J.; Maximon, L. C. (2026). Chapter 10: Bessel Functions. *NIST Digital Library of Mathematical Functions, https://dlmf.nist.gov/, Release 1.2.8 of 2026-09-15 (F. W. J. Olver, A. B. Olde Daalhuis, D. W. Lozier, B. I. Schneider, R. F. Boisvert, C. W. Clark, B. R. Miller, B. V. Saunders, H. S. Cohl, M. A. McClain, eds.)*, §10.21 Zeros (gives no numerical values of the zeros); published tables are listed in §10.75(iii). National Institute of Standards and Technology. <https://dlmf.nist.gov/10>

<a id="ref-54"></a>54. Bernoulli, D. (1738). Theoremata de oscillationibus corporum filo flexili connexorum et catenae verticaliter suspensae. *Commentarii Academiae Scientiarum Imperialis Petropolitanae* 6 (for 1732-33), 108-122. Academia Scientiarum Imperialis Petropolitana, St Petersburg.

<a id="ref-55"></a>55. Bernoulli, D. (1740). Demonstrationes theorematum suorum de oscillationibus corporum filo flexili connexorum et catenae verticaliter suspensae. *Commentarii Academiae Scientiarum Imperialis Petropolitanae* 7 (for 1734-35), 162-173. Academia Scientiarum Imperialis Petropolitana, St Petersburg.

<a id="ref-56"></a>56. Cannon, J. T.; Dostrovsky, S. (1981). *The Evolution of Dynamics: Vibration Theory from 1687 to 1742* (1st). *Studies in the History of Mathematics and Physical Sciences, vol. 6*, ix + 184 (chapter 9, 'Daniel Bernoulli (1733; 1734); Euler (1736)', pp. 53-69). Springer-Verlag, New York. [doi:10.1007/978-1-4613-9461-7](https://doi.org/10.1007/978-1-4613-9461-7)

<a id="ref-57"></a>57. Heyl, J. S. (2008). *The Double Pendulum Fractal*. *Unpublished manuscript, Department of Physics and Astronomy, University of British Columbia (dated 11 August 2008)*, 5 pp.. <https://www.famaf.unc.edu.ar/~vmarconi/fiscomp/Double.pdf>

<a id="ref-58"></a>58. Rafat, M. Z.; Wheatland, M. S.; Bedding, T. R. (2009). Dynamics of a double pendulum with distributed mass. *American Journal of Physics* 77(3), 216-223. American Association of Physics Teachers. [doi:10.1119/1.3052072](https://doi.org/10.1119/1.3052072)

<a id="ref-59"></a>59. Runge, C. (1895). Ueber die numerische Auflösung von Differentialgleichungen. *Mathematische Annalen* 46(2), 167-178. Springer. [doi:10.1007/BF01446807](https://doi.org/10.1007/BF01446807)

<a id="ref-60"></a>60. Kutta, W. (1901). Beitrag zur näherungsweisen Integration totaler Differentialgleichungen. *Zeitschrift für Mathematik und Physik* 46, 435-453. B. G. Teubner, Leipzig. <https://archive.org/details/zeitschriftfrma12runggoog>

<a id="ref-61"></a>61. Hairer, E.; Nørsett, S. P.; Wanner, G. (1993). *Solving Ordinary Differential Equations I: Nonstiff Problems* (2nd rev. ed.). *Springer Series in Computational Mathematics* 8, xv, 528 pp.. Springer-Verlag, Berlin. [doi:10.1007/978-3-540-78862-1](https://doi.org/10.1007/978-3-540-78862-1)

<a id="ref-62"></a>62. Butcher, J. C. (2016). *Numerical Methods for Ordinary Differential Equations* (3rd ed.). John Wiley & Sons. [doi:10.1002/9781119121534](https://doi.org/10.1002/9781119121534)

<a id="ref-63"></a>63. Roache, P. J. (1998). *Verification and Validation in Computational Science and Engineering*. Hermosa Publishers, Albuquerque, NM. <https://openlibrary.org/books/OL400789M>

<a id="ref-64"></a>64. Salari, K.; Knupp, P. (2000). *Code Verification by the Method of Manufactured Solutions*. *Sandia National Laboratories Report SAND2000-1444*. Sandia National Laboratories, Albuquerque, NM, and Livermore, CA. [doi:10.2172/759450](https://doi.org/10.2172/759450)

<a id="ref-65"></a>65. Roy, C. J. (2005). Review of code and solution verification procedures for computational simulation. *Journal of Computational Physics* 205(1), 131-156. Elsevier. [doi:10.1016/j.jcp.2004.10.036](https://doi.org/10.1016/j.jcp.2004.10.036)

<a id="ref-66"></a>66. Hairer, E.; Wanner, G. (1996). *Solving Ordinary Differential Equations II: Stiff and Differential-Algebraic Problems* (2nd rev. ed.). *Springer Series in Computational Mathematics* 14, xvi, 614 pp.. Springer, Berlin. [doi:10.1007/978-3-642-05221-7](https://doi.org/10.1007/978-3-642-05221-7)

<a id="ref-67"></a>67. Hairer, E.; Lubich, C.; Wanner, G. (2006). *Geometric Numerical Integration: Structure-Preserving Algorithms for Ordinary Differential Equations* (2nd ed.). *Springer Series in Computational Mathematics* 31, xvii, 644 pp.. Springer, Berlin. [doi:10.1007/3-540-30666-8](https://doi.org/10.1007/3-540-30666-8)

<a id="ref-68"></a>68. Hairer, E.; Lubich, C.; Wanner, G. (2003). Geometric numerical integration illustrated by the Störmer–Verlet method. *Acta Numerica* 12, 399-450. Cambridge University Press. [doi:10.1017/S0962492902000144](https://doi.org/10.1017/S0962492902000144)

<a id="ref-69"></a>69. Sanz-Serna, J. M. (1988). Runge-Kutta schemes for Hamiltonian systems. *BIT* 28(4), 877-883. Springer. [doi:10.1007/BF01954907](https://doi.org/10.1007/BF01954907)

<a id="ref-70"></a>70. Fiedler, G. (2004). Fix Your Timestep!. *Gaffer On Games*. <https://gafferongames.com/post/fix_your_timestep/>

<a id="ref-71"></a>71. IEEE (Microprocessor Standards Committee of the IEEE Computer Society) (2019). *IEEE Standard for Floating-Point Arithmetic* (Approved 13 June 2019; published 22 July 2019). *IEEE Std 754-2019 (Revision of IEEE Std 754-2008)*, 1-84. IEEE, New York (ISBN 978-1-5044-5924-2, electronic). [doi:10.1109/IEEESTD.2019.8766229](https://doi.org/10.1109/IEEESTD.2019.8766229)

<a id="ref-72"></a>72. Goldberg, D. (1991). What every computer scientist should know about floating-point arithmetic. *ACM Computing Surveys* 23(1), 5-48. ACM. [doi:10.1145/103162.103163](https://doi.org/10.1145/103162.103163)

<a id="ref-73"></a>73. Dormand, J. R.; Prince, P. J. (1980). A family of embedded Runge-Kutta formulae. *Journal of Computational and Applied Mathematics* 6(1), 19-26. Elsevier. [doi:10.1016/0771-050X(80)90013-3](https://doi.org/10.1016/0771-050X(80)90013-3)

<a id="ref-74"></a>74. Shampine, L. F.; Reichelt, M. W. (1997). The MATLAB ODE Suite. *SIAM Journal on Scientific Computing* 18(1), 1-22. SIAM. [doi:10.1137/S1064827594276424](https://doi.org/10.1137/S1064827594276424)

<a id="ref-75"></a>75. Jacobi, C. G. J. (1846). Über ein leichtes Verfahren die in der Theorie der Säcularstörungen vorkommenden Gleichungen numerisch aufzulösen. *Journal für die reine und angewandte Mathematik (Crelles Journal)* 30(1), 51-94. G. Reimer, Berlin (now Walter de Gruyter). [doi:10.1515/crll.1846.30.51](https://doi.org/10.1515/crll.1846.30.51)

<a id="ref-76"></a>76. Golub, G. H.; Welsch, J. H. (1969). Calculation of Gauss quadrature rules. *Mathematics of Computation* 23(106), 221-230. American Mathematical Society. [doi:10.1090/S0025-5718-69-99647-1](https://doi.org/10.1090/S0025-5718-69-99647-1)

<a id="ref-77"></a>77. Oseledec, V. I. (1968). A multiplicative ergodic theorem. Ljapunov characteristic numbers for dynamical systems. *Trudy Moskovskogo Matematicheskogo Obshchestva (in Russian); English translation: Transactions of the Moscow Mathematical Society 19 (1968), 197-231* 19, 179-210. Moscow State University (original); American Mathematical Society (translation). <https://www.mathnet.ru/eng/mmo214>

<a id="ref-78"></a>78. Ott, E. (2002). *Chaos in Dynamical Systems* (2nd). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511803260](https://doi.org/10.1017/CBO9780511803260)

<a id="ref-79"></a>79. Lorenz, E. N. (1963). Deterministic Nonperiodic Flow. *Journal of the Atmospheric Sciences* 20(2), 130-141. American Meteorological Society. [doi:10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2](https://doi.org/10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2)

<a id="ref-80"></a>80. Lorenz, E. N. (1993). *The Essence of Chaos*. *The Jessie and John Danz Lectures*, xii+227 pp.. University of Washington Press, Seattle. <https://lccn.loc.gov/93001835>

<a id="ref-81"></a>81. Gleick, J. (1987). *Chaos: Making a New Science*. Viking, New York. <https://lccn.loc.gov/87040025>

<a id="ref-82"></a>82. Lorenz, E. N. (1972). Predictability: Does the Flap of a Butterfly's Wings in Brazil Set Off a Tornado in Texas?. *Talk presented at the 139th Meeting of the American Association for the Advancement of Science, Washington, DC, 29 December 1972 (unpublished press-release text). Reprinted as Appendix 1, 'The Butterfly Effect', in: Lorenz, E. N. (1993), The Essence of Chaos*, Appendix 1, beginning on p. 181 (usually cited as pp. 181-184; the end page was not confirmed in this run). University of Washington Press, Seattle (reprint). <https://mathsciencehistory.com/wp-content/uploads/2020/03/132_kap6_lorenz_artikel_the_butterfly_effect.pdf>

<a id="ref-83"></a>83. Benettin, G.; Galgani, L.; Strelcyn, J.-M. (1976). Kolmogorov entropy and numerical experiments. *Physical Review A* 14(6), 2338-2345. American Physical Society. [doi:10.1103/PhysRevA.14.2338](https://doi.org/10.1103/PhysRevA.14.2338)

<a id="ref-84"></a>84. Skokos, Ch. (2010). The Lyapunov Characteristic Exponents and Their Computation. *Dynamics of Small Solar System Bodies and Exoplanets (eds. J. J. Souchay and R. Dvorak), Lecture Notes in Physics* 790, 63-135. Springer, Berlin, Heidelberg. [doi:10.1007/978-3-642-04458-8_2](https://doi.org/10.1007/978-3-642-04458-8_2)

<a id="ref-85"></a>85. Benettin, G.; Galgani, L.; Giorgilli, A.; Strelcyn, J.-M. (1980). Lyapunov characteristic exponents for smooth dynamical systems and for Hamiltonian systems; a method for computing all of them. Part 1: Theory. *Meccanica* 15(1), 9-20. Springer. [doi:10.1007/BF02128236](https://doi.org/10.1007/BF02128236)

<a id="ref-86"></a>86. Benettin, G.; Galgani, L.; Giorgilli, A.; Strelcyn, J.-M. (1980). Lyapunov characteristic exponents for smooth dynamical systems and for Hamiltonian systems; a method for computing all of them. Part 2: Numerical application. *Meccanica* 15(1), 21-30. Springer. [doi:10.1007/BF02128237](https://doi.org/10.1007/BF02128237)

<a id="ref-87"></a>87. Wolf, A.; Swift, J. B.; Swinney, H. L.; Vastano, J. A. (1985). Determining Lyapunov exponents from a time series. *Physica D: Nonlinear Phenomena* 16(3), 285-317. Elsevier. [doi:10.1016/0167-2789(85)90011-9](https://doi.org/10.1016/0167-2789(85)90011-9)

<a id="ref-88"></a>88. Strogatz, S. H. (2015). *Nonlinear Dynamics and Chaos: With Applications to Physics, Biology, Chemistry, and Engineering* (2nd). Westview Press (Perseus Books Group), Boulder, CO; reissued 2018 by CRC Press. [doi:10.1201/9780429492563](https://doi.org/10.1201/9780429492563)

<a id="ref-89"></a>89. Zhang, F.; Sun, Y. Q.; Magnusson, L.; Buizza, R.; Lin, S.-J.; Chen, J.-H.; Emanuel, K. (2019). What Is the Predictability Limit of Midlatitude Weather?. *Journal of the Atmospheric Sciences* 76(4), 1077-1091. American Meteorological Society. [doi:10.1175/JAS-D-18-0269.1](https://doi.org/10.1175/JAS-D-18-0269.1)

<a id="ref-90"></a>90. Lorenz, E. N. (1969). The predictability of a flow which possesses many scales of motion. *Tellus* 21(3), 289-307. Stockholm University Press (current DOI registrant). [doi:10.1111/j.2153-3490.1969.tb00444.x](https://doi.org/10.1111/j.2153-3490.1969.tb00444.x)

<a id="ref-91"></a>91. Bendixson, I. (1901). Sur les courbes définies par des équations différentielles. *Acta Mathematica* 24, 1-88. Institut Mittag-Leffler. [doi:10.1007/BF02403068](https://doi.org/10.1007/BF02403068)

<a id="ref-92"></a>92. Stachowiak, T.; Okada, T. (2006). A numerical analysis of chaos in the double pendulum. *Chaos, Solitons & Fractals* 29(2), 417-422. Elsevier. [doi:10.1016/j.chaos.2005.08.032](https://doi.org/10.1016/j.chaos.2005.08.032)

<a id="ref-93"></a>93. Levien, R. B.; Tan, S. M. (1993). Double pendulum: An experiment in chaos. *American Journal of Physics* 61(11), 1038-1044. American Association of Physics Teachers. [doi:10.1119/1.17335](https://doi.org/10.1119/1.17335)

<a id="ref-94"></a>94. Richter, P. H.; Scholz, H.-J. (1984). Chaos in Classical Mechanics: The Double Pendulum. *Stochastic Phenomena and Chaotic Behaviour in Complex Systems (ed. P. Schuster), Springer Series in Synergetics* 21, 86-97. Springer, Berlin, Heidelberg. [doi:10.1007/978-3-642-69591-9_9](https://doi.org/10.1007/978-3-642-69591-9_9)

<a id="ref-95"></a>95. Shinbrot, T.; Grebogi, C.; Wisdom, J.; Yorke, J. A. (1992). Chaos in a double pendulum. *American Journal of Physics* 60(6), 491-499. American Association of Physics Teachers. [doi:10.1119/1.16860](https://doi.org/10.1119/1.16860)

<a id="ref-96"></a>96. Lichtenberg, A. J.; Lieberman, M. A. (1992). *Regular and Chaotic Dynamics* (2nd). *Applied Mathematical Sciences* 38, xxii+692 pp.. Springer-Verlag, New York. [doi:10.1007/978-1-4757-2184-3](https://doi.org/10.1007/978-1-4757-2184-3)

<a id="ref-97"></a>97. Hénon, M. (1982). On the numerical computation of Poincaré maps. *Physica D: Nonlinear Phenomena* 5(2-3), 412-414. Elsevier. [doi:10.1016/0167-2789(82)90034-3](https://doi.org/10.1016/0167-2789(82)90034-3)

<a id="ref-98"></a>98. Cooley, J. W.; Tukey, J. W. (1965). An algorithm for the machine calculation of complex Fourier series. *Mathematics of Computation* 19(90), 297-301. American Mathematical Society. [doi:10.1090/S0025-5718-1965-0178586-1](https://doi.org/10.1090/S0025-5718-1965-0178586-1)

<a id="ref-99"></a>99. Harris, F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. *Proceedings of the IEEE* 66(1), 51-83. IEEE. [doi:10.1109/PROC.1978.10837](https://doi.org/10.1109/PROC.1978.10837)

<a id="ref-100"></a>100. Heinzel, G.; Rüdiger, A.; Schilling, R. (2002). *Spectrum and spectral density estimation by the Discrete Fourier transform (DFT), including a comprehensive list of window functions and some new flat-top windows*. *Technical report, Max-Planck-Institut für Gravitationsphysik (Albert-Einstein-Institut), Teilinstitut Hannover*. Max-Planck-Institut für Gravitationsphysik (Albert-Einstein-Institut), Hannover. <https://hdl.handle.net/11858/00-001M-0000-0013-557A-5>

<a id="ref-101"></a>101. Grandke, T. (1983). Interpolation Algorithms for Discrete Fourier Transforms of Weighted Signals. *IEEE Transactions on Instrumentation and Measurement* 32(2), 350-355. IEEE. [doi:10.1109/TIM.1983.4315077](https://doi.org/10.1109/TIM.1983.4315077)

<a id="ref-102"></a>102. Okabe, M.; Ito, K. (2002 (revised 2008)). Color Universal Design (CUD): How to make figures and presentations that are friendly to Colorblind people. *J*FLY (web site, University of Cologne mirror)*. <https://jfly.uni-koeln.de/color/>

<a id="ref-103"></a>103. Wong, B. (2011). Points of view: Color blindness. *Nature Methods* 8(6), 441. Nature Publishing Group (Springer Nature). [doi:10.1038/nmeth.1618](https://doi.org/10.1038/nmeth.1618)

<a id="ref-104"></a>104. Hermann, T.; Hunt, A.; Neuhoff, J. G. (eds.) (2011). *The Sonification Handbook* (1st). Logos Publishing House (Logos Verlag), Berlin. <https://sonification.de/handbook/>

<a id="ref-105"></a>105. Oberkampf, W. L.; Roy, C. J. (2010). *Verification and Validation in Scientific Computing* (1st ed.). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511760396](https://doi.org/10.1017/CBO9780511760396)

<a id="ref-106"></a>106. Billah, K. Y.; Scanlan, R. H. (1991). Resonance, Tacoma Narrows bridge failure, and undergraduate physics textbooks. *American Journal of Physics* 59(2), 118-124. American Association of Physics Teachers. [doi:10.1119/1.16590](https://doi.org/10.1119/1.16590)

<a id="ref-107"></a>107. Green, D.; Unruh, W. G. (2006). The failure of the Tacoma Bridge: A physical model. *American Journal of Physics* 74(8), 706-716. American Association of Physics Teachers. [doi:10.1119/1.2201854](https://doi.org/10.1119/1.2201854)

<a id="ref-108"></a>108. Anonymous (1831). Fall of the Broughton suspension bridge, near Manchester. *The Philosophical Magazine (Series 2; full title: The Philosophical Magazine, or Annals of Chemistry, Mathematics, Astronomy, Natural History, and General Science)* 9(53), 384-389. Richard Taylor, London (now Taylor & Francis). [doi:10.1080/14786443108647630](https://doi.org/10.1080/14786443108647630)

<a id="ref-109"></a>109. Dallard, P.; Fitzpatrick, A. J.; Flint, A.; Le Bourva, S.; Low, A.; Ridsdill Smith, R. M.; Willford, M. (2001). The London Millennium Footbridge. *The Structural Engineer* 79(22), 17-33. The Institution of Structural Engineers. <https://www.istructe.org/journal/volumes/volume-79-(published-in-2001)/issue-22/the-london-millennium-footbridge/>

<a id="ref-110"></a>110. Strogatz, S. H.; Abrams, D. M.; McRobie, A.; Eckhardt, B.; Ott, E. (2005). Crowd synchrony on the Millennium Bridge. *Nature* 438(7064), 43-44. Nature Publishing Group. [doi:10.1038/438043a](https://doi.org/10.1038/438043a)

<a id="ref-111"></a>111. Belykh, I.; Bocian, M.; Champneys, A. R.; Daley, K.; Jeter, R.; Macdonald, J. H. G.; McRobie, A. (2021). Emergence of the London Millennium Bridge instability without synchronisation. *Nature Communications* 12(1), 7223. Springer Nature. [doi:10.1038/s41467-021-27568-y](https://doi.org/10.1038/s41467-021-27568-y)

<a id="ref-112"></a>112. Schrock, K. (2007). Fact or Fiction?: An Opera Singer's Piercing Voice Can Shatter Glass. *Scientific American (online), 23 August 2007*. Scientific American. <https://www.scientificamerican.com/article/fact-or-fiction-opera-singer-can-shatter-glass/>

<a id="ref-113"></a>113. Skeldon, K. D.; Nadeau, V. J.; Adams, C. (1998). The resonant excitation of a wineglass using positive feedback with optical sensing. *American Journal of Physics* 66(10), 851-860. American Association of Physics Teachers. [doi:10.1119/1.19031](https://doi.org/10.1119/1.19031)

<a id="ref-114"></a>114. Gillespie, T. D. (1992). *Fundamentals of Vehicle Dynamics* (1st). *SAE book R-114*. SAE International (Society of Automotive Engineers), Warrendale, PA. [doi:10.4271/R-114](https://doi.org/10.4271/R-114)

<a id="ref-115"></a>115. Dixon, J. C. (2007). *The Shock Absorber Handbook* (2nd). John Wiley & Sons, Chichester. [doi:10.1002/9780470516430](https://doi.org/10.1002/9780470516430)

<a id="ref-116"></a>116. Galilei, G. (1638). *Discorsi e dimostrazioni matematiche intorno a due nuove scienze* (1st). Appresso gli Elsevirii, Leida (Leiden). <https://openlibrary.org/works/OL15231447W>

<a id="ref-117"></a>117. Galilei, G. (1914). *Dialogues Concerning Two New Sciences* (English translation by Henry Crew and Alfonso de Salvio, with an introduction by Antonio Favaro). Macmillan, New York. <https://archive.org/details/dialoguesconcern00galiuoft>

<a id="ref-118"></a>118. Huygens, C. (1673). *Horologium oscillatorium sive de motu pendulorum ad horologia aptato demonstrationes geometricae* (1st). F. Muguet, Paris (Parisiis, apud F. Muguet). <https://openlibrary.org/works/OL4850524W>

<a id="ref-119"></a>119. Huygens, C. (1986). *Christiaan Huygens' The Pendulum Clock, or Geometrical Demonstrations Concerning the Motion of Pendula as Applied to Clocks* (English translation with notes by Richard J. Blackwell; introduction by H. J. M. Bos). Iowa State University Press, Ames. <https://openlibrary.org/isbn/9780813809335>

<a id="ref-120"></a>120. Borda, J.-C. de; Lagrange, J.-L.; Laplace, P.-S.; Monge, G.; Condorcet, N. de (1791). *Rapport sur le choix d'une unité de mesure, lu à l'Académie des sciences le 19 mars 1791*. *Imprimé par ordre de l'Assemblée nationale*, 12 pp.. De l'Imprimerie nationale, Paris. <https://archive.org/details/rapportsurlechoi00bord>

<a id="ref-121"></a>121. Baker, G. L.; Gollub, J. P. (1996). *Chaotic Dynamics: An Introduction* (2nd). Cambridge University Press, Cambridge; New York. [doi:10.1017/CBO9781139170864](https://doi.org/10.1017/CBO9781139170864)

<a id="ref-122"></a>122. Goriely, A.; McMillen, T. (2002). Shape of a Cracking Whip. *Physical Review Letters* 88(24), 244301. American Physical Society. [doi:10.1103/PhysRevLett.88.244301](https://doi.org/10.1103/PhysRevLett.88.244301)

<a id="ref-123"></a>123. Cramer, O. (1993). The variation of the specific heat ratio and the speed of sound in air with temperature, pressure, humidity, and CO2 concentration. *The Journal of the Acoustical Society of America* 93(5), 2510-2516. Acoustical Society of America. [doi:10.1121/1.405827](https://doi.org/10.1121/1.405827)

<a id="ref-124"></a>124. Budynas, R. G.; Nisbett, J. K. (2020). *Shigley's Mechanical Engineering Design* (11th edition). McGraw-Hill Education, New York (ISBN 978-0-07-339821-1). <https://scholarsmine.mst.edu/mec_aereng_facwork/2395>

<a id="ref-125"></a>125. Brown, D.; Cox, A. J. (2009). Innovative Uses of Video Analysis. *The Physics Teacher* 47(3), 145-150. American Association of Physics Teachers. [doi:10.1119/1.3081296](https://doi.org/10.1119/1.3081296)

<a id="ref-126"></a>126. Baker, G. L.; Blackburn, J. A. (2005). *The Pendulum: A Case Study in Physics*. Oxford University Press, Oxford; New York. [doi:10.1093/oso/9780198567547.001.0001](https://doi.org/10.1093/oso/9780198567547.001.0001)

<a id="ref-127"></a>127. Nielsen, J. (1993). *Usability Engineering* (1st). Academic Press, Boston. [doi:10.1016/C2009-0-21512-1](https://doi.org/10.1016/C2009-0-21512-1)

<a id="ref-128"></a>128. Miller, R. B. (1968). Response time in man-computer conversational transactions. *Proceedings of the December 9-11, 1968, Fall Joint Computer Conference, Part I (AFIPS '68), San Francisco, California; AFIPS Conference Proceedings vol. 33* 33, 267-277. ACM, New York. [doi:10.1145/1476589.1476628](https://doi.org/10.1145/1476589.1476628)

<a id="ref-129"></a>129. Card, S. K.; Robertson, G. G.; Mackinlay, J. D. (1991). The information visualizer, an information workspace. *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems: Reaching Through Technology (CHI '91), New Orleans, Louisiana, 27 April - 2 May 1991*, 181-186. ACM, New York. [doi:10.1145/108844.108874](https://doi.org/10.1145/108844.108874)

<a id="ref-130"></a>130. Shneiderman, B. (1983). Direct Manipulation: A Step Beyond Programming Languages. *Computer* 16(8), 57-69. IEEE Computer Society. [doi:10.1109/MC.1983.1654471](https://doi.org/10.1109/MC.1983.1654471)

<a id="ref-131"></a>131. Hutchins, E. L.; Hollan, J. D.; Norman, D. A. (1985). Direct Manipulation Interfaces. *Human-Computer Interaction* 1(4), 311-338. Lawrence Erlbaum Associates (now Taylor & Francis). [doi:10.1207/s15327051hci0104_2](https://doi.org/10.1207/s15327051hci0104_2)

<a id="ref-132"></a>132. Crameri, F.; Shephard, G. E.; Heron, P. J. (2020). The misuse of colour in science communication. *Nature Communications* 11(1), 5444. Springer Nature. [doi:10.1038/s41467-020-19160-7](https://doi.org/10.1038/s41467-020-19160-7)

<a id="ref-133"></a>133. Tufte, E. R. (2001). *The Visual Display of Quantitative Information* (2nd). Graphics Press, Cheshire, Connecticut. <https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/>

<a id="ref-134"></a>134. Cleveland, W. S.; McGill, R. (1984). Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods. *Journal of the American Statistical Association* 79(387), 531-554. American Statistical Association (Taylor & Francis). [doi:10.1080/01621459.1984.10478080](https://doi.org/10.1080/01621459.1984.10478080)

<a id="ref-135"></a>135. World Wide Web Consortium (W3C); Campbell, A.; Adams, C.; Montgomery, R. B.; Cooper, M.; Kirkpatrick, A. (eds.) (2023). *Web Content Accessibility Guidelines (WCAG) 2.2* (W3C Recommendation 5 October 2023; republished with updates 12 December 2024). *W3C Recommendation*. World Wide Web Consortium. <https://www.w3.org/TR/2023/REC-WCAG22-20231005/>

<a id="ref-136"></a>136. Wieman, C. E.; Adams, W. K.; Perkins, K. K. (2008). PhET: Simulations That Enhance Learning. *Science* 322(5902), 682-683. American Association for the Advancement of Science. [doi:10.1126/science.1161948](https://doi.org/10.1126/science.1161948)

<a id="ref-137"></a>137. Perkins, K.; Adams, W.; Dubson, M.; Finkelstein, N.; Reid, S.; Wieman, C.; LeMaster, R. (2006). PhET: Interactive Simulations for Teaching and Learning Physics. *The Physics Teacher* 44(1), 18-23. American Association of Physics Teachers. [doi:10.1119/1.2150754](https://doi.org/10.1119/1.2150754)

<a id="ref-138"></a>138. Smetana, L. K.; Bell, R. L. (2012). Computer Simulations to Support Science Instruction and Learning: A critical review of the literature. *International Journal of Science Education* 34(9), 1337-1370. Routledge (Taylor & Francis). [doi:10.1080/09500693.2011.605182](https://doi.org/10.1080/09500693.2011.605182)

<a id="ref-139"></a>139. Hake, R. R. (1998). Interactive-engagement versus traditional methods: A six-thousand-student survey of mechanics test data for introductory physics courses. *American Journal of Physics* 66(1), 64-74. American Association of Physics Teachers. [doi:10.1119/1.18809](https://doi.org/10.1119/1.18809)

<a id="ref-140"></a>140. White, R.; Gunstone, R. (1992). *Probing Understanding* (1st). The Falmer Press, London. [doi:10.4324/9780203761342](https://doi.org/10.4324/9780203761342)

<a id="ref-141"></a>141. Champagne, A. B.; Klopfer, L. E.; Anderson, J. H. (1980). Factors influencing the learning of classical mechanics. *American Journal of Physics* 48(12), 1074-1079. American Association of Physics Teachers. [doi:10.1119/1.12290](https://doi.org/10.1119/1.12290)

<a id="ref-142"></a>142. Ainsworth, S. (2006). DeFT: A conceptual framework for considering learning with multiple representations. *Learning and Instruction* 16(3), 183-198. Elsevier. [doi:10.1016/j.learninstruc.2006.03.001](https://doi.org/10.1016/j.learninstruc.2006.03.001)

<a id="ref-143"></a>143. Sweller, J. (1988). Cognitive Load During Problem Solving: Effects on Learning. *Cognitive Science* 12(2), 257-285. Wiley (Cognitive Science Society). [doi:10.1207/s15516709cog1202_4](https://doi.org/10.1207/s15516709cog1202_4)

<a id="ref-144"></a>144. Mayer, R. E. (2009). *Multimedia Learning* (2nd). Cambridge University Press. [doi:10.1017/CBO9780511811678](https://doi.org/10.1017/CBO9780511811678)

<a id="ref-145"></a>145. Adams, W. K.; Reid, S.; LeMaster, R.; McKagan, S. B.; Perkins, K. K.; Dubson, M.; Wieman, C. E. (2008). A Study of Educational Simulations Part II - Interface Design. *Journal of Interactive Learning Research* 19(4), 551-577. Association for the Advancement of Computing in Education (AACE), Chesapeake, VA. <https://eric.ed.gov/?id=EJ810084>

<a id="ref-146"></a>146. Podolefsky, N. S.; Perkins, K. K.; Adams, W. K. (2010). Factors promoting engaged exploration with computer simulations. *Physical Review Special Topics - Physics Education Research* 6(2), 020117 (11 pp.). American Physical Society. [doi:10.1103/PhysRevSTPER.6.020117](https://doi.org/10.1103/PhysRevSTPER.6.020117)

<a id="ref-147"></a>147. Podolefsky, N. S.; Moore, E. B.; Perkins, K. K. (2013). *Implicit scaffolding in interactive simulations: Design strategies to support multiple educational goals*. *arXiv e-prints (physics.ed-ph)*, arXiv:1306.6544. arXiv. [doi:10.48550/arXiv.1306.6544](https://doi.org/10.48550/arXiv.1306.6544)
