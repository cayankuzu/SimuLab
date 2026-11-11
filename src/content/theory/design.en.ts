import type { TheoryDocument } from "./types";

/**
 * Design chapters: software architecture, interface and interaction,
 * pedagogical design. The figures in the "previous version" column were
 * measured by running the code as it stood before the rewrite (git 0af05e0)
 * without modification.
 */
export const designEn: TheoryDocument = [
  {
    id: "mimari",
    number: "10",
    title: "Software architecture",
    summary:
      "Three layers - physics core, runtime and observers; the fixed-step loop; measurable quality criteria and a comparison with the state before the rewrite.",
    sections: [
      {
        id: "mimari-katmanlar",
        title: "Layers and data flow",
        blocks: [
          {
            kind: "p",
            text: "The code is divided into three layers with dependencies pointing downwards only. The **physics core** (src/physics) depends on no framework: the integrators, the models of the two experiments, the Lyapunov estimator, the measuring instruments, the spectrum analyser and the verification experiments are pure functions and small classes that can be tested without a browser. The **runtime** (src/sim) holds the state: it runs the fixed-step loop, writes telemetry into ring buffers, feeds the virtual instruments and converts an experiment definition to a file or a link. The **observers** only read the runtime: the three-dimensional scene (src/scene), the plots (src/ui/plots) and the React components (src/ui).",
          },
          {
            kind: "p",
            text: "Continuous state (positions, velocities, energy terms) is not kept in React state. Scene and plots draw by reading the runtime directly on every animation frame, whereas numerical read-outs are refreshed at most ten times per second. The physics step, the drawing and the interface are thus independent of each other's cost. Discrete state - parameters, run state, initial conditions - is published as an immutable object, and components subscribe only to the slice they use.",
          },
          {
            kind: "p",
            text: "The hot path allocates no memory: the integrators own their work arrays, the helical geometry of the spring is updated analytically inside the same buffer on every frame, and vector arrows and stroboscope images are pre-allocated instances. The scene is redrawn only when the state, the camera, a layer or the viewport size has changed.",
          },
        ],
      },
      {
        id: "mimari-dongu",
        title: "The fixed-step loop",
        blocks: [
          {
            kind: "p",
            text: "The wall-clock duration of every animation frame is added to a budget; the budget is spent in steps of exactly $h = 1/f_s$, and the remainder is carried over to the next frame [@fiedler2004]. The number of steps per frame is bounded, and time accumulated while the tab is in the background is discarded. With this arrangement the sequence of states depends only on the initial conditions, the parameters, the method and $h$. The test-suite checks this directly: the same experiment is run once with uniform 60 Hz frames and once with random frame durations, and the states at common step counts are verified to be bit-for-bit equal.",
          },
          {
            kind: "note",
            tone: "info",
            title: "Why it matters",
            text: "In a chaotic system the smallest difference in step size grows exponentially. In the previous version, where the step was derived from the frame duration, the same double-pendulum experiment was in states 214° apart after 30 s on a 60 Hz and on a 144 Hz display; the observed trajectory depended on the screen, not on the physics.",
          },
        ],
      },
      {
        id: "mimari-kalite",
        title: "Quality assurance",
        blocks: [
          {
            kind: "list",
            items: [
              "TypeScript is compiled in strict mode; static analysis (ESLint) passes without warnings.",
              "There are 102 automated tests: linear algebra, special functions, integrators, both models, the measuring instruments, the runtime, data exchange and the fourteen verification experiments. For each task sheet there is a test showing that the task really can be completed by measurement and cannot be completed with a wrong setting. The content is tested as well: that the theory text has the same structure in both languages, that every citation exists in the bibliography, that every formula can be typeset, and that the texts of the task sheets and of the verification panel agree with the numbers of criteria and rows in the code.",
              "External data (an experiment file, a shared link) are validated for type and range; invalid input is rejected and out-of-range numbers are clamped.",
              "Continuous integration runs the type check, the static analysis, the tests and the production build on every change.",
            ],
          },
        ],
      },
      {
        id: "mimari-karsilastirma",
        title: "Comparison with the state before the rewrite",
        blocks: [
          {
            kind: "p",
            text: "In the table below the left-hand figures were measured by running the previous code unmodified, the right-hand ones with the verification suite of this version. The Lagrange equations and the single RK4 step of the previous version were correct; what was missing was the measurement and book-keeping around them.",
          },
          {
            kind: "table",
            caption: "Table 10.1. The previous version and this version on measurable criteria.",
            head: ["Criterion", "Previous version", "This version"],
            rows: [
              [
                "Time step",
                "Derived from the frame duration (3.33 ms at 60 Hz; 2.31 ms at 144 Hz)",
                "Fixed $h = 1$ ms; independent of the frame rate",
              ],
              ["The same double-pendulum experiment on a 60 Hz and a 144 Hz display", "States 214° apart after 30 s", "Bit-for-bit identical"],
              ["Double pendulum, relative energy drift over 60 s", "$5.7\\times10^{-7}$", "$2.0\\times10^{-9}$"],
              ["Six-link chain, relative energy drift over 60 s", "$9.0\\times10^{-5}$", "$3.3\\times10^{-7}$"],
              [
                "Impact with a stop",
                "Rebound depends on the frame rate: $x(3\\,\\mathrm{s}) = 2.19$ m (60 Hz), $4.05$ m (120 Hz)",
                "Event location; error in the instant of impact $9\\times10^{-13}$ s",
              ],
              [
                "Energy accounting (driven experiment with stops)",
                "Impact losses and drive work unrecorded; the displayed “total” rises from 0.49 J to 4414 J in 60 s",
                "Five-term ledger; relative residual $1.3\\times10^{-12}$ over 27 impacts",
              ],
              [
                "Heat in the pendulum",
                "Defined as $E_0 - E_\\mathrm{mech}$; jumps from 4.78 J to 66.63 J when $g$ is changed",
                "Integrated as a state variable of its own; the ledger is re-based when a parameter changes",
              ],
              [
                "Exported CSV",
                "In 99.6 % of the rows the energy belongs to a different instant; 4.3 s of record",
                "Every row is a single instant; up to 600 s of record; complete metadata",
              ],
              ["Spring geometry", "Rebuilt every frame: 1031 KiB of memory, 0.57 ms", "Updated in the same buffer; no allocation"],
              ["Automated tests", "None", "102 tests, 14 of them verification experiments"],
              [
                "Accessibility",
                "No ARIA attributes, no keyboard control, no dialog semantics",
                "Every control operable from the keyboard; visible focus; labelled controls",
              ],
              ["English interface", "19 of 68 translation keys in use", "Both languages complete; key parity checked at compile time"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "arayuz",
    number: "11",
    title: "Interface and interaction design",
    summary:
      "Reasons behind the layout, direct manipulation, the quantity-to-colour mapping, vectors drawn to scale, the principles of the plots, accessibility and sonification.",
    sections: [
      {
        id: "arayuz-yerlesim",
        title: "Layout: parameters, scene and plots at the same time",
        blocks: [
          {
            kind: "p",
            text: "At a laboratory bench one watches the oscilloscope while turning a knob. Three regions are therefore kept visible together: the apparatus in the centre, the plot panel below it and the parameter panel to its right. When a parameter is changed its effect is seen at once in the scene, in the plot and in the measurement table; none has to be closed to see another. The numerical state is always visible in the status bar along the bottom edge: solver, step, energy-ledger residual and (for the oscillator) the deviation from the analytical solution.",
          },
          {
            kind: "p",
            text: "The established thresholds for feedback times are respected: a response below about 0.1 s is perceived as instantaneous, 1 s is noticed without interrupting the flow of thought, and 10 s is the limit for holding attention [@nielsen1993; @miller1968; @card1991]. A parameter change takes effect in the same frame; the only long operations, the frequency sweep and the verification suite, run in pieces with a progress indication and can be cancelled.",
          },
        ],
      },
      {
        id: "arayuz-manipulasyon",
        title: "Direct manipulation",
        blocks: [
          {
            kind: "p",
            text: "Bodies are grabbed, dragged and released with the pointer; the object of interest stays visible, the action is physical and its result can be undone at once [@shneiderman1983; @hutchins1985]. The carriage has one degree of freedom: the point of the rail axis closest to the pointer ray is taken, so the mapping is consistent from every camera angle. A pendulum link is turned towards the point where the ray meets its own plane of rotation. The velocity at release is estimated from the pointer motion during the last 90 ms and transferred to the body; if the pointer is stopped before release, the body is released from rest.",
          },
          {
            kind: "p",
            text: "Dragging is not the only way in. The same initial conditions can be entered from the keyboard, as exact values, in the number fields of the parameter panel; both accessibility and reproducibility require this. The reset command returns to the initial conditions of the experiment being run, not to default values.",
          },
        ],
      },
      {
        id: "arayuz-renk",
        title: "Quantity-to-colour mapping",
        blocks: [
          {
            kind: "p",
            text: "A physical quantity has the same colour everywhere: position and angle are sky blue, velocity bluish green, net force orange, spring force yellow, damping force reddish purple, driving force and weight vermilion; kinetic energy carries the colour of velocity and potential energy that of position. The colours are taken from the Okabe–Ito palette [@okabe2008; @wong2011]. Because up to 8 % of men and 0.5 % of women of Northern European ancestry have the common red-green colour-vision deficiency [@wong2011], this choice is a condition of legibility rather than decoration; that colour choices can distort the data in scientific figures has also been documented [@crameri2020]. No information is conveyed by colour alone: every vector has its symbol and numerical value, every curve its label.",
          },
        ],
      },
      {
        id: "arayuz-vektor",
        title: "Vectors to scale and measuring devices in the scene",
        blocks: [
          {
            kind: "p",
            text: "Vector arrows are drawn to scale: length is proportional to magnitude, and the current scale (for example 1 m ≙ 20 N) is written in the scene. The scale is chosen from the 1–2–5 series according to the typical (root-mean-square) magnitude of the last few seconds. So that brief spikes - the rod force in a whipping chain, for instance - do not upset the scale, an arrow exceeding the maximum length is clipped and marked with a double head; its label always shows the true value. In the free-body diagram every force is drawn separately; in the pendulum the rod force is computed from Newton's second law, independently of the equations of motion, and reverses direction under compression.",
          },
          {
            kind: "p",
            text: "The apparatus is drawn together with its measuring devices: for the oscillator a ruler graduated in 0.1 m along the edge of the bench and an index needle attached to the carriage, for the pendulum a protractor behind the pivot. No solid body ever passes through another: the wire diameter of the spring is chosen so that the coils touch exactly at the solid length; the pendulum links turn in successive parallel planes, as in real multi-link pendulums; and the stand extends with the chain so that its lowest point never reaches the bench.",
          },
        ],
      },
      {
        id: "arayuz-grafik",
        title: "Plots",
        blocks: [
          {
            kind: "p",
            text: "Every plot has numbered axes with units, ticks in 1–2–5 steps and a faint grid; there is no ornament [@tufte2001]. Quantitative comparisons use the encoding that is read most accurately, position along a common scale [@cleveland1984]. Axis limits follow the data without jitter: they expand immediately when the data leave the range and contract slowly when the data shrink. Angles are wrapped to $(-\\pi, \\pi]$ and the curve is broken at the wrap, so no misleading vertical strokes appear. The time axis is tied to simulated time, not to a frame count; telemetry is sampled at about 100 Hz whatever the solver rate.",
          },
        ],
      },
      {
        id: "arayuz-erisilebilirlik",
        title: "Accessibility",
        blocks: [
          {
            kind: "p",
            text: "The target is level AA of WCAG 2.2 [@w3c2023wcag22]. The criteria from that document which shape the design most directly are:",
          },
          {
            kind: "list",
            items: [
              "**1.4.3 Contrast (Minimum):** at least 4.5:1 for text. The dimmest text colour in use has a contrast above 6:1 against the panel background.",
              "**1.4.11 Non-text Contrast:** at least 3:1 for control boundaries and graphical objects.",
              "**1.4.1 Use of Color:** information is not conveyed by colour alone; states are given with an icon and a word.",
              "**2.1.1 Keyboard:** every function is operable from the keyboard; the counterpart of dragging is the number fields.",
              "**2.4.7 Focus Visible:** a single, consistent focus indicator.",
              "**2.5.8 Target Size (Minimum):** interactive targets of at least 24 by 24 CSS pixels.",
            ],
          },
          {
            kind: "p",
            text: "Dialogs keep the focus inside, close with Escape and return the focus to the control that opened them. The document language changes with the interface language. If the operating system asks for reduced motion, interface transitions are switched off; the simulation itself is the content, so it continues, and it can be paused at any moment.",
          },
        ],
      },
      {
        id: "arayuz-ses",
        title: "Sonification",
        blocks: [
          {
            kind: "p",
            text: "The mechanical frequencies (below 2 Hz) lie far under the range of hearing, so the sound is not a recording but an auditory display by parameter mapping [@hermann2011]. For the oscillator the pitch follows the position (one octave per 3.5 m) and the loudness follows the speed; an impact with a stop is heard as a short stroke proportional to the impact speed. For the pendulum every passage of the first link through the vertical is marked by a tick whose pitch depends on the direction: a single pendulum sounds as regular as a clock, a chaotic chain does not. Sound plays only when the user has switched it on, while the simulation is running and the tab is visible.",
          },
        ],
      },
    ],
  },
  {
    id: "pedagoji",
    number: "12",
    title: "Pedagogical design",
    summary:
      "Findings on learning with interactive simulations and how they are reflected in the construction of the task sheets.",
    sections: [
      {
        id: "pedagoji-bulgular",
        title: "Findings on learning with simulations",
        blocks: [
          {
            kind: "p",
            text: "The place of interactive simulations in physics teaching is well documented [@wieman2008science; @perkins2006]. A review of 51 publications from 2001–2010 found robust evidence that simulations can enhance traditional instruction, laboratory activities in particular, but also that most studies disregarded teacher support and the place of the simulation within the lesson [@rutten2012]. Other reviews reached similar conclusions [@smetana2012; @dejong2013]. In a controlled study, students who worked on direct-current circuits with a simulation outperformed those who worked with real equipment both on conceptual questions and on the task of building a real circuit [@finkelstein2005].",
          },
          {
            kind: "p",
            text: "These findings do not mean that a simulation teaches by itself. In a survey of 62 introductory courses and 6542 students the average normalised gain was $0.48 \\pm 0.14$ in courses using interactive-engagement methods and $0.23 \\pm 0.04$ in traditional courses [@hake1998]; what matters is not the tool but that the student is led to think actively. It has also been shown that even a simulation which permits clear observations does not guarantee conceptual understanding [@renken2013].",
          },
        ],
      },
      {
        id: "pedagoji-foyler",
        title: "Construction of the task sheets",
        blocks: [
          {
            kind: "p",
            text: "The sheets follow the predict – observe – explain pattern [@white1992; @champagne1980]: the student first commits to a prediction by choosing one of the answers offered to the question of the sheet, then sets up the apparatus and measures; when the sheet is complete, the prediction is compared with the observation and an explanation opens that reconciles the measurement with the theory and names its sources. The criteria are evaluated continuously in the background while the student changes the parameters. Completion of a sheet depends on a measurement, not on the position of a slider: the period is read from zero crossings, the damping from successive peak values, overshoot and settling time from the step response, predictability from the separation of the twin trajectory and from the Lyapunov estimate. The “critical damping” sheet, for instance, is completed not by setting the damping ratio to 1 but by a measured overshoot below 0.5 % and a settling time within 10 % of the critical value; half that damping fails the overshoot criterion and twice that damping fails the time criterion.",
          },
          {
            kind: "p",
            text: "The same phenomenon is presented in several representations - the motion itself, the time series, the phase portrait, the energy ledger, the spectrum - and the representations are consistent in colour and symbol; the benefit of multiple representations depends on the relation between them being made explicit [@ainsworth2006]. To limit cognitive load [@sweller1988; @mayer2009] the detailed derivations are placed in a separate reader, and the working surface carries only the controls and read-outs needed at that moment.",
          },
          {
            kind: "p",
            text: "The interface agrees with the design guidelines published for educational simulations: grabbable objects, intuitive controls, an explicit visual model, consistent representations and limited text [@adams2008b]. Guidance is given through the controls and read-outs themselves rather than through lists of instructions [@podolefsky2010; @podolefsky2013].",
          },
          {
            kind: "note",
            tone: "warning",
            title: "Limit of scope",
            text: "No learning gain has been measured in this work. The sources above are the reasons for design decisions; a claim about the effect of this laboratory on learning could be supported only by a controlled classroom study.",
          },
        ],
      },
    ],
  },
];
