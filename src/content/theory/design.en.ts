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
            text: "Continuous state (positions, velocities, energy terms) is not kept in React state. Scene and plots draw by reading the runtime directly on every animation frame, whereas numerical read-outs are refreshed at most twelve times per second. The physics step, the drawing and the interface are thus independent of each other's cost. Discrete state - parameters, run state, initial conditions - is published as an immutable object, and components subscribe only to the slice they use.",
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
            text: "The wall-clock duration of every animation frame is added to a budget; the budget is spent in steps of exactly $h = 1/f_s$, and the remainder is carried over to the next frame [@fiedler2004]. A frame adds at most 0.1 s of wall-clock time to the budget, which bounds the number of steps per frame (400 at the highest step frequency and time scale); a longer frame is cut to that length and counted in the status bar, and the time a tab spends in the background is discarded. With this arrangement the sequence of states depends only on the initial conditions, the parameters, the method and $h$. The test-suite checks this directly: the same experiment is run once with uniform 60 Hz frames and once with random frame durations, and the states at common step counts are verified to be bit-for-bit equal.",
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
              "There are 153 automated tests: linear algebra, special functions, integrators, both models, the measuring instruments, the runtime, data exchange and the fourteen verification experiments; the contrast ratios of the interface colours (and that this chapter quotes the values they give), the reading of numeric entries, the validation of stored preferences and the record and peak rules of the spectrum read-out are tested too. For every task sheet the tests show that the sheet is completed by the intended measurement and that it stays open with a wrong setting. The content is tested as well: that the theory text has the same structure in both languages, that every citation exists in the bibliography, that every formula can be typeset, and that the texts of the task sheets and of the verification panel agree with the numbers of criteria and rows in the code.",
              "External data (an experiment file, a shared link) are validated before use. Data with a wrong structure, an unknown method, a step frequency other than the six offered or a value that is not a finite number are rejected as a whole. A parameter outside its range is set to the nearest limit, and the initial conditions get the limits of the number fields: the position between the two stops, the speed within ±30 m/s, the angles within ±1800° and the angular velocities within ±40 rad/s. An angle beyond the limit is reduced by whole turns into (−180°, 180°], which keeps the configuration of the chain; a chain grabbed with the pointer is stored the same way at its release. Preferences kept in the browser's storage are validated in the same way: a value the interface cannot use is replaced by its default.",
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
                "Every row is a single instant; up to 60 000 rows (600 s at the default step frequency); header with parameters, initial conditions, method and step",
              ],
              ["Spring geometry", "Rebuilt every frame: 1031 KiB of memory, 0.57 ms", "Updated in the same buffer; no allocation"],
              ["Automated tests", "None", "153 tests, 14 of them verification experiments"],
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
            text: "At a laboratory bench one watches the oscilloscope while turning a knob. Three regions are therefore kept visible together: the apparatus in the centre, the plot panel below it and the parameter panel to its right. When a parameter is changed its effect is seen at once in the scene and in the plots; the measurement table and the task sheets are further tabs of the right-hand panel. In a window narrower than 1024 px that panel opens as a sheet over the scene instead. The status bar along the bottom edge shows the numerical state: the energy-ledger residual at every width, the deviation from the analytical solution (for the oscillator) from 1024 px, and solver, step and order from 1280 px; in a narrower window the solver button of the top bar still names the method and, from 640 px, the step frequency. When the status bar reports late frames or offers the adaptive solver, these notices take precedence over the read-outs.",
          },
          {
            kind: "p",
            text: "The established thresholds for feedback times are respected: a response below about 0.1 s is perceived as instantaneous, 1 s is noticed without interrupting the flow of thought, and 10 s is the limit for holding attention [@nielsen1993; @miller1968; @card1991]. A parameter change takes effect in the same frame; the only long operations, the frequency sweep and the verification suite, run in pieces with a progress indication, and the sweep can be cancelled.",
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
            text: "A physical quantity has the same colour everywhere: position and angle are sky blue, velocity bluish green, net force orange, spring force yellow, damping force reddish purple, driving force and weight vermilion; kinetic energy carries the colour of velocity and potential energy that of position. In a chain of several links each link has a colour of its own instead, which it keeps in the scene, the plots and the tables (link 1 sky blue, then orange, bluish green, yellow, blue and vermilion). The colours are taken from the Okabe–Ito palette [@okabe2008; @wong2011]. Because up to 8 % of men and 0.5 % of women of Northern European ancestry have the common red-green colour-vision deficiency [@wong2011], this choice is a condition of legibility rather than decoration; that colour choices can distort the data in scientific figures has also been documented [@crameri2020]. No quantity is identified by its colour alone: every vector has its symbol and numerical value, every curve its label.",
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
            text: "Every plot has numbered axes with units, ticks in 1–2–5 steps and a faint grid; there is no ornament [@tufte2001]. Quantitative comparisons use the encoding that is read most accurately, position along a common scale [@cleveland1984]. Axis limits follow the data without jitter: they expand immediately when the data leave the range and contract slowly when the data shrink. Angles are wrapped to $(-\\pi, \\pi]$ and the curve is broken at the wrap, so no misleading vertical strokes appear. The time axis is tied to simulated time, not to a frame count; telemetry is recorded at 100 Hz for step frequencies of 300 Hz and above, and at every step at 60 Hz and 120 Hz.",
          },
        ],
      },
      {
        id: "arayuz-erisilebilirlik",
        title: "Accessibility",
        blocks: [
          {
            kind: "p",
            text: "The target is level AA of WCAG 2.2 [@w3c2023wcag22]. The criteria from that document which shape the design most directly are listed below together with what the interface does to meet them. The contrast ratios are computed from the colour values with the formula of that document; the automated tests repeat the computation, assert that the thresholds of 4.5:1 and 3:1 are met on the surfaces named, and check that the figures quoted below are the ones the colour values give.",
          },
          {
            kind: "list",
            items: [
              "**1.1.1 Non-text Content:** every typeset formula is output twice, as the visual rendering and as MathML, which is what assistive technology reads. The scene and the plots carry a text description, and the quantities measured in them are listed as text in the Measurements tab.",
              "**1.4.3 Contrast (Minimum):** at least 4.5:1 for text. The three principal text colours reach at least 5.17:1 on every surface. The dimmest text colour, used for labels and units, reaches 5.50:1 on the panel and at least 4.76:1 on every surface it appears on; the lowest value is that on the surface of an item under the pointer. On the lightest surface, that of selected items and tooltips, it would reach only 4.21:1, and it is not used there.",
              "**1.4.11 Non-text Contrast:** at least 3:1 for what identifies a control or its state. Where an outline or a mark is the only such sign, it is drawn in one colour that reaches at least 3.06:1 on every surface (4.01:1 on the panel): the outline of the number fields, of the switch and of the option rings of the task sheets, the track of the sliders, the outline of the selected item of a segmented control and the grip of the handle of the plot dock. The focus ring reaches at least 6.43:1 and the thumb of the scroll bars at least 3.10:1. A pressed toggle button carries an outline in the accent colour that reaches at least 3.59:1 against its tinted fill and against the surface around it. The hairlines that separate regions and frame buttons are kept below 3:1 on purpose (between 1.1:1 and 1.6:1); they are decoration, and a button is identified by its label.",
              "**1.4.1 Use of Color:** the following states are marked by more than their colour. The run state is written next to its coloured dot, a non-default solver changes the icon of the solver button as well as its tint, the selected item of a segmented control and a pressed toggle button (scene layers, sound) carry an outline, the current entry of the contents list of the theory reader carries a bar at its leading edge, a rejected entry gets a message with an icon in addition to the outline in the error colour, and verification results and completed task sheets are marked by a check or a cross and by a text for screen readers.",
              "**2.1.1 Keyboard:** every control can be reached and operated from the keyboard, the handle of the plot dock included. The mass of the pendulum on which the vectors are drawn is chosen with a selector beside the vector scale; a click on the mass does the same. While the scene has the focus, the arrow keys orbit the camera in steps of 3° and, with Shift, pan it; the views and the zoom have buttons. Grabbing and throwing a body is the one function that needs a pointer; its counterpart is the number fields for the initial conditions.",
              "**2.1.4 Character Key Shortcuts:** the single-key shortcuts can be switched off in the shortcuts dialog; the space bar keeps working. They do nothing while a dialog, a menu or a list is open, while text is being entered in a field and while a body is held.",
              "**2.4.7 Focus Visible:** the focused control carries a 2 px outline in the accent colour; a number field shows the focus as an accent-coloured border and a menu as the highlighted row.",
              "**2.4.11 Focus Not Obscured (Minimum):** the two scrolling panels whose header stays in place reserve at least its height, so that a control brought into view by the focus is not covered by it.",
              "**2.5.7 Dragging Movements:** every setting made by dragging can also be made without a drag: the height of the plot dock by clicking its handle, which steps through four heights (180, 288, 404 and 520 px); a slider by a click on its track or through its number field; the camera with the view buttons and the arrow keys; the position of a body through the number fields for the initial conditions.",
              "**2.5.8 Target Size (Minimum):** the controls are dimensioned at no less than 24 by 24 CSS pixels. The smallest are 24 px high: the items of the small segmented controls, the switch (40 by 24), the buttons that set the gravity of a celestial body, the handle of the plot dock, the offer in the status bar and the links of the reference list. The citation numbers in the running text rely on the exception the criterion makes for targets inside a sentence.",
              "**3.3.1 Error Identification:** a number field does not accept text that is not a number: the text stays in the field, the field is marked, and a message naming the admissible range appears and is announced to screen readers. A number outside the range is set to the nearest limit: the field shows the value that is used, and a short note, also announced to screen readers, names the range and the limit.",
            ],
          },
          {
            kind: "p",
            text: "Dialogs keep the focus inside, close with Escape and return the focus to the control that opened them. The clock is exposed as a timer without live announcements, so that a running experiment does not interrupt a screen reader. The document language changes with the interface language. Below 1024 px the top bar wraps onto further rows instead of cutting controls off. The time scale, for which the top bar has room only from 1536 px, is also set at the head of the parameter panel, and while it differs from 1 the scale key in the scene names it, at every size of the scene. If the operating system asks for reduced motion, the transitions of the interface are shortened to an imperceptible duration, the camera is placed at a new view at once instead of gliding there, and the orbit control loses its inertia; the motion of the experiment is the content, so it continues, and it can be paused at any moment.",
          },
          {
            kind: "note",
            tone: "warning",
            title: "What these measures do not cover",
            text: "One control and four read-outs exist only in wider windows: the switch “Show the analytical solution” of the time plot and the clock of the top bar from 768 px, and in the status bar the frame rate (from 640 px; from 768 px while late frames are reported), the physics time per frame (from 1280 px) and the number of recorded samples (from 1536 px). In a narrower window, or at a zoom level that makes the window that narrow in CSS pixels, they cannot be reached. In a window narrower than 640 px the status bar, while it shows a notice, gives the run state by the colour of its dot alone; the run button then shows the state by its icon, and a divergence is stated in words by the banner above the scene. A body can be grabbed and thrown with a pointer only. This report contains no test with a screen reader or with people who rely on assistive technology; the statements above rest on the source code and on computation.",
          },
        ],
      },
      {
        id: "arayuz-ses",
        title: "Sonification",
        blocks: [
          {
            kind: "p",
            text: "The mechanical frequencies (a few hertz at most) lie far under the range of hearing, so the sound is not a recording but an auditory display by parameter mapping [@hermann2011]. For the oscillator the pitch follows the position (one octave per 3.5 m) and the loudness follows the speed; an impact with a stop is heard as a short stroke proportional to the impact speed. For the pendulum every passage of the first link through the vertical is marked by a tick whose pitch depends on the direction: a single pendulum sounds as regular as a clock, a chaotic chain does not. Sound plays only when the user has switched it on, while the simulation is running and the tab is visible.",
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
            text: "The sheets follow the predict – observe – explain pattern [@white1992; @champagne1980]: the student first commits to a prediction by choosing one of the answers offered to the question of the sheet, then sets up the apparatus and measures; when the sheet is complete, the prediction is compared with the observation and an explanation opens that reconciles the measurement with the theory and names its sources. The criteria are evaluated continuously in the background while the student changes the parameters. Completion of a sheet depends on a measurement, not on the position of a slider: the period is read from zero crossings, the damping from successive peak values, overshoot and settling time from the step response, predictability from the separation of the twin trajectory and from the Lyapunov estimate. The “critical damping” sheet, for instance, is completed not by setting the damping ratio to 1 but by a measured overshoot of at most 0.5 % and a measured settling time of at most 1.1 times the value at critical damping; half the critical damping fails the overshoot criterion and twice the critical damping fails the time criterion. A measurement made before a parameter was changed does not count: the step response is measured anew from the next release.",
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
