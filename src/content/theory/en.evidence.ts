import type { TheoryDocument } from "./types";

const r = String.raw;

/**
 * Chapters 7-9: verification results, common misconceptions corrected with
 * sources, assumptions and limitations. The figures of Table 7.1 are those of
 * the experiments in src/physics/validation.ts with the default solver (RK4,
 * h = 1 ms); "npm run docs" regenerates the complete tables.
 */
export const evidenceEn: TheoryDocument = [
  {
    id: "dogrulama",
    number: "7",
    title: "Verification",
    summary:
      "The errors of the solver measured on fourteen problems whose answers are known independently, and what these results do and do not show.",
    sections: [
      {
        id: "dogrulama-yontem",
        title: "Verification versus validation",
        blocks: [
          {
            kind: "p",
            text: r`Computational science asks two separate questions [@oberkampf2010; @roache1998]. **Verification** asks “are the equations solved correctly?” and is a mathematical matter: it is shown that the code implements the method correctly and that the numerical error stays within known bounds. **Validation** asks “are the correct equations being solved?” and can only be answered by comparison with a physical experiment.`,
          },
          {
            kind: "p",
            text: r`This work does the first. For code verification the observed order of accuracy is measured and comparisons are made with closed-form solutions [@salari2000; @roy2005]; for solution verification conservation laws, step refinement, time reversibility and the agreement of two independent methods are checked. The experiments run from a single source (src/physics/validation.ts) in three places: in the automated test suite, in the Verification tab of this reader and in the appendix of the technical report.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "No validation has been carried out",
            text: r`The model has not been compared with a real spring–mass apparatus or a real multiple pendulum. “Verified” therefore means that the equations are solved correctly; it does not say how well the equations represent a particular physical apparatus (Chapter 9).`,
          },
        ],
      },
      {
        id: "dogrulama-sonuclar",
        title: "Summary of results",
        blocks: [
          {
            kind: "table",
            caption:
              "Table 7.1. Summary of the verification experiments (classical RK4, h = 1 ms). All rows of every experiment are given in the Verification tab and in the appendix of the report.",
            head: ["Experiment", "Quantity measured", "Result", "Tolerance"],
            rows: [
              ["Order of accuracy", r`Observed $p$ (expected 4 for RK4)`, "4.005", r`$\pm 0.1$`],
              ["Free response, four regimes, 20 s", "Largest position error", r`$1.6 \times 10^{-10}$ m`, r`$10^{-9}$ m`],
              ["Steady state, five frequencies", "Relative error of the amplitude", r`$3.3 \times 10^{-8}$`, r`$10^{-5}$`],
              ["Steady state, five frequencies", "Error of the phase lag", r`$3.3 \times 10^{-8}$ rad`, r`$10^{-3}$ rad`],
              ["Critical damping", "Relative error of the 2 % settling time", r`$1.5 \times 10^{-7}$`, r`$2 \times 10^{-3}$`],
              ["Impact with a stop", "Error of the instant of impact", r`$8.6 \times 10^{-13}$ s`, r`$10^{-8}$ s`],
              ["Energy ledger, 27 impacts, 60 s", "Largest relative residual", r`$1.3 \times 10^{-12}$`, r`$10^{-8}$`],
              ["Pendulum period, 10°–170° and rotation", "Relative error", r`$2.3 \times 10^{-10}$`, r`$10^{-7}$`],
              ["Energy drift, 60 s", r`$N = 1;\ 2;\ 3;\ 6$`, r`$4.7 \times 10^{-13}$; $2.0 \times 10^{-9}$; $2.4 \times 10^{-8}$; $3.3 \times 10^{-7}$`, r`$10^{-6}$`],
              ["Eigenfrequencies", "Relative deviation from the Laguerre zeros", r`$8.5 \times 10^{-16}$`, r`$10^{-10}$`],
              ["Lagrangian and Newtonian derivations", "Transverse force / tension", r`$5.3 \times 10^{-15}$`, r`$10^{-10}$`],
              ["Lyapunov exponent, 400 s", "Regular; chaotic", r`$\le 0.017$; $1.04\ \mathrm{s^{-1}}$`, r`$\le 0.05$; $\ge 0.5\ \mathrm{s^{-1}}$`],
              ["Time reversibility, 20 s", "Error in returning to the initial state", r`$4.6 \times 10^{-12}$ rad`, r`$10^{-9}$ rad`],
              ["RK4 against Dormand–Prince", "Error ratio when the step is made four times smaller", "256.6", r`$256 \pm 25\,\%$`],
              ["Spectrum analyser", "Error of the peak frequency", r`$4.6 \times 10^{-9}$ Hz`, r`$10^{-4}$ Hz`],
            ],
          },
          {
            kind: "p",
            text: r`These values were measured on the development machine. The button in the Verification tab runs the same experiments again in the reader's own browser, with the code that is loaded at that moment; the results are expected to be of the same order of magnitude as those given here.`,
          },
        ],
      },
      {
        id: "dogrulama-yorum",
        title: "Interpretation of the results",
        blocks: [
          {
            kind: "list",
            items: [
              r`**The tolerances are wider than the measured errors, but not by the same factor in every criterion.** The margin, i.e. the ratio of the tolerance to the measured error (for a lower bound, of the measured value to the bound), is two orders of magnitude or more in 47 of the 67 criteria, between one and two orders in 12, and less than a factor of ten in 8. Of these eight, Table 7.1 contains the free response without damping (a factor of 6), the energy drift of the six-link chain (3) and the two Lyapunov bounds (3 and 2). The others are the observed order of the Dormand–Prince method (4), the drift of the fixed step in the hardest corner of the parameter range (6), the change of the Lyapunov estimate when the step is halved (4) and the comparison of the six-link chain with the hanging rope (1.3); in the last of these the difference measured is not a numerical error but the physical difference between six links and a continuum. The tolerances were chosen so that the experiments also pass in other runtime environments and still catch a real coding error (a loss of order, a wrong coefficient); whether the criteria with a narrow margin pass in another environment has not been tested (Chapter 9).`,
              r`**Energy drift grows with the number of links.** More links mean higher angular speeds and a stiffer non-linear coupling; with the same step the drift of the six-link chain is about 160 times that of the double pendulum, but still below $10^{-6}$.`,
              r`**The step size is decisive.** For the double pendulum, a step of 3.3 ms instead of 1 ms raises the drift from $2.0 \times 10^{-9}$ to $5.3 \times 10^{-7}$. Explicit Euler produces, in the same experiment with the same step, a deviation of 24 % in the energy ledger; this row is in the suite on purpose as a **lower-bound** criterion.`,
              r`**The order of the method is observed on a chaotic trajectory too.** For the three-link chain the difference between RK4 and the error-controlled reference solution shrinks by a factor of 256.6 when the step is made four times smaller; the value expected of a fourth-order method is $4^4 = 256$.`,
              r`**Two independent derivations agree.** The equations of motion are computed with Lagrange's method and the rod forces with Newton's laws; the inconsistency between them is at the level of machine precision. This is the strongest check against a sign or index error in the coding of the model.`,
            ],
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "yanilgilar",
    number: "8",
    title: "Common misconceptions and their corrections",
    summary:
      "Statements that are often repeated when oscillations and chaos are explained, but that turn out to be wrong or incomplete when the sources are consulted.",
    sections: [
      {
        id: "yanilgilar-rezonans",
        title: "On resonance",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“The Tacoma Narrows bridge collapsed because of resonance”",
            text: r`On 7 November 1940 the bridge collapsed in a steady wind of about 19 m/s with a torsional motion at 0.2 Hz. The vortex-shedding explanation does not hold: at that wind speed the shedding frequency is about 1 Hz, five times the observed frequency, and there is no periodic external force. The event was a self-excited aeroelastic flutter in which the aerodynamic moment, which depends on the motion of the structure itself, made the torsional damping negative [@billah1991; @green2006]. In forced resonance there is an external force on the right-hand side of the equation and damping limits the amplitude; in flutter the damping coefficient itself changes sign. The driven oscillator of this application is a model of the former.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Resonance occurs exactly at the natural frequency”",
            text: r`That is true of the absorbed power and of the velocity amplitude. The displacement amplitude is largest at $\omega_0\sqrt{1-2\zeta^2}$, below the natural frequency, and has no peak at all for $\zeta \ge 1/\sqrt{2}$ (Chapter 2). For light damping the difference is small: at $\zeta = 0.1$ the peak lies 1 % below $\omega_0$, and the amplitude at $\omega_0$ itself is 99.5 % of the peak value. The task sheet “Find the resonance peak” is therefore set up with $\zeta = 0.25$, where the peak lies 6.5 % below $\omega_0$ and the amplitude at $\omega_0$ is 96.8 % of the peak value. The sheet requires the amplitude measured in the steady state to be at least 98 % of the peak value, so it is completed below the natural frequency and not at it.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Bridges collapse because of soldiers marching in step”",
            text: r`The documented case is the Broughton suspension bridge near Manchester on 12 April 1831: the bridge gave way under 74 soldiers marching in step and nobody died; the contemporary report attributes the failure to a defective bolt in the attachment of a stay chain [@broughton1831]. The lateral sway of the Millennium Bridge in London on 10 June 2000 was not marching in step: the sway grew as pedestrians adapted their steps to the motion of the bridge, and in a controlled test the response stayed small up to 166 walkers and then increased rapidly [@dallard2001; @strogatz2005]. Later work shows that the instability can also arise without synchronisation [@belykh2021].`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Opera singers shatter glasses with their voice”",
            text: r`There is no verified case of an opera singer doing this on stage. It is physically possible and has been documented once under controlled conditions without amplification [@schrock2007]; laboratory demonstrations use amplified sound locked to the natural frequency of the glass [@skeldon1998].`,
          },
        ],
      },
      {
        id: "yanilgilar-sonum",
        title: "On damping",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“Car shock absorbers are critically damped”",
            text: r`The damping ratio of passenger-car suspensions is typically between 0.2 and 0.4, i.e. clearly underdamped; for racing cars the value approaches 1 [@gillespie1992; @dixon2007]. Critical damping is too harsh for ride comfort.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“The more damping, the sooner the system comes to rest”",
            text: r`Above the critical value more damping slows the return, because the slowly decaying exponential term dominates. The fastest return without overshoot is at $\zeta = 1$; if a small overshoot is allowed, the shortest settling is near $\zeta \approx 0.78$ (Chapter 2).`,
          },
        ],
      },
      {
        id: "yanilgilar-sarkac",
        title: "On the pendulum",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“The period of a pendulum does not depend on the amplitude”",
            text: r`Galileo's observation of isochronism [@galilei1638; @galilei1914] holds only approximately, for small angles: the period is longer by 0.19 % at an amplitude of 10°, by 1.7 % at 30° and by 18 % at 90°. Huygens found in 1659 that the exactly isochronous curve is the cycloid and published it in *Horologium Oscillatorium* (1673) [@huygens1673; @huygens1986].`,
          },
          {
            kind: "note",
            tone: "info",
            title: "The seconds pendulum and the metre",
            text: r`A pendulum with a period of 2 s has, at standard gravity, the length $g/\pi^2 = 0.9936$ m. The closeness is no coincidence: in 1790 the length of the seconds pendulum was proposed as the unit of length, and the Academy commission preferred one ten-millionth of the quarter meridian in its report of 19 March 1791 [@borda1791].`,
          },
        ],
      },
      {
        id: "yanilgilar-kaos",
        title: "On chaos",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“Chaos is randomness”",
            text: r`A chaotic system is completely deterministic; the same initial conditions give the same trajectory, and in the application every experiment can be repeated exactly. Unpredictability arises from the finite precision with which initial conditions are known and from the exponential growth of the error [@strogatz2015].`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“The double pendulum is chaotic”",
            text: r`Chaos is a property of the trajectory, not of the system. The same double pendulum is regular at low energy, largely chaotic at intermediate energies and regular again at very high energy [@rafat2009; @stachowiak2006]. The task sheet “An island of regular motion” has this measured.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“A single pendulum becomes chaotic at large angles”",
            text: r`The phase space of the undriven single pendulum is two-dimensional and the Poincaré–Bendixson theorem rules out chaos [@strogatz2015]. What changes at large angles is the period, not the predictability. A single pendulum becomes chaotic only with a periodic drive, i.e. with a third phase-space dimension [@baker1996]; that model is not included here.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“The tip of a whip breaks the sound barrier and cracks”",
            text: r`The acceleration towards the free end of a chain of many links is often explained with the whip. The crack really is a shock wave, but it is produced not by the tip but by the loop travelling along the whip: the crack occurs when the loop, accelerated by the taper, reaches the speed of sound; at that moment the tip moves at about twice the speed of the loop [@goriely2002]. The speed of sound in air at 20 °C is about 343 m/s [@cramer1993].`,
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "sinirlar",
    number: "9",
    title: "Assumptions and limitations",
    summary: "What the model does not contain, how far the numerical results can be trusted, and the studies that have not been done.",
    sections: [
      {
        id: "sinirlar-model",
        title: "The physical model",
        blocks: [
          {
            kind: "list",
            items: [
              r`**Point masses, massless rigid rods.** The rods have neither moment of inertia nor elasticity. Real double pendulums are compound pendulums [@shinbrot1992; @rafat2009]; the numerical values given here (periods, thresholds, Lyapunov exponent) cannot be compared directly with such an apparatus.`,
              r`**Planar motion.** The chain moves in a vertical plane. Rods and masses are placed in successive parallel planes; this is how full freedom of rotation and the requirement that no part passes through another are met together. The effect of the small distance between the planes on the dynamics is not modelled.`,
              r`**Viscous friction only.** There is no dry friction and no air drag; the damping force is proportional to the velocity at every speed. For the eddy-current brake this is an approximation valid only at low speed [@wiederick1987; @heald1988].`,
              r`**Linear, massless spring.** The spring force is exactly linear down to the solid length and the spring has no mass of its own. The spring drawn is not a design to scale: made of steel wire, the same geometry would give about $10^5$ N/m from $k = Gd^4/(8D^3N_a)$ [@budynas2015; @budynas2020]. The metre-scale dimensions of the apparatus were chosen for visibility.`,
              r`**Rigid stops, constant coefficient of restitution.** An impact is instantaneous; the duration of contact, a speed-dependent restitution and the deformation of the buffer are not modelled.`,
              r`**Ideal drive.** The drive is an ideal force source that is not affected by the motion of the carriage.`,
            ],
          },
        ],
      },
      {
        id: "sinirlar-sayisal",
        title: "The numerical results",
        blocks: [
          {
            kind: "list",
            items: [
              r`**Energy drift accumulates.** RK4 is not symplectic; the drift grows with time. The values given belong to 60-second experiments; in a run lasting hours the residual should be watched and, if necessary, the step reduced or the adaptive method selected. Either change starts the experiment afresh (Chapter 4).`,
              r`**A solution can diverge.** With a low-order method and a coarse step the solution of the pendulum chain can leave the finite range. The experiment is then halted (Chapter 4); restarted unchanged with the same solver, it is halted again at the same instant.`,
              r`**Chaotic trajectories are not individually meaningful beyond the horizon.** As explained in Chapter 5, after a few tens of seconds the state shown is not the state of the exact solution; what is meaningful are the statistical and geometric properties.`,
              r`**The Lyapunov exponent is a finite-time estimate** and depends on the trajectory; no single number can be given as “the exponent” of an apparatus.`,
              r`**There is no real-time guarantee.** When a slow device or a high step frequency makes a frame last longer than 0.1 s, the part of the frame beyond 0.1 s is not simulated and simulated time falls behind the wall clock; the status bar shows the number of these frames since the last restart once they recur (four within two seconds), so that a single long frame does not raise the notice. The physical result is not affected, because the sequence of steps stays the same.`,
              r`**Repeatability across runtime environments has not been tested** (Chapter 4).`,
            ],
          },
        ],
      },
      {
        id: "sinirlar-gecerleme",
        title: "Validation and educational effect",
        blocks: [
          {
            kind: "p",
            text: r`Two important studies have not been done. First, the model has not been compared with a physical apparatus. Second, the usability of the tool and its effect on learning have not been measured with users. The principles relied on in the design of the interface and of the task sheets come from published research (Chapters 11 and 12), but that they produce the same result here is an assumption. Chapter 1 noted that the evidence on virtual laboratories is mixed; the simulation is meant to stand beside real measurement, not to replace it.`,
          },
        ],
      },
      {
        id: "sinirlar-gelecek",
        title: "Future work",
        blocks: [
          {
            kind: "list",
            items: [
              r`A compound-pendulum model with distributed rod mass and its comparison with a real double pendulum by video analysis [@brown2009].`,
              r`Contact models with dry friction and speed-dependent restitution [@hunt1975; @stronge2000].`,
              r`The periodically driven single pendulum: the chaotic mechanical system with the fewest degrees of freedom [@baker1996; @baker2005].`,
              r`Symplectic or variational integrators for long runs [@hairer2006].`,
              r`Computation of the full Lyapunov spectrum [@benettin1980b].`,
              r`A user study with students, with pre- and post-measurements.`,
            ],
          },
        ],
      },
    ],
  },
];
