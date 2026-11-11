import type { plotsState as source } from "../tr/plotsState";

/** State plots: phase portrait (Signals tab) and energy ledger (Energy tab). */
export const plotsState: typeof source = {
  phase: {
    history: (seconds: number) => `The trajectory of the last ${seconds} seconds is drawn; older parts are fainter.`,
    stop: "stop",
    stopsNote: "When a mechanical stop falls inside the visible range, its position is marked by a vertical dashed line.",
    twinNote: "The dashed purple curve is the trajectory of the twin pendulum.",
    separatrix: "separatrix",
    separatrixHint:
      "Separatrix of the undamped pendulum: ω = ±2√(g/L) cos(θ/2). Trajectories inside it are librations, those outside are rotations.",
    separatrixNote: "The dashed orange curve is the separatrix, which divides libration from rotation.",
  },

  energy: {
    description: {
      oscillator:
        "The energy ledger versus time. The stacked areas are, from bottom to top, the kinetic energy, the potential energy, the energy turned into heat in the damper and the energy turned into heat in impacts with the stops. The dashed line is the energy supplied to the system (E₀ + W); the thin line is the work done by the drive (W). If the numerical solution is accurate, the top of the stack coincides with the dashed line.",
      pendulum:
        "The energy ledger versus time. The stacked areas are, from bottom to top, the kinetic energy, the potential energy and the energy turned into heat in the joints. The dashed line is the reference energy E₀. If the numerical solution is accurate, the top of the stack coincides with the dashed line.",
    },
    supplied: "supplied energy",
    reference: "reference energy",
    relativeResidual: "relative residual",
    ledger: {
      caption: "Current values of the energy ledger",
      sign: "Sign",
      term: "Term",
      value: "Value",
    },
    note: "The residual (ΔE = Σ − E₀) is the numerical error of the solver, not a physical loss of energy.",
  },
};
