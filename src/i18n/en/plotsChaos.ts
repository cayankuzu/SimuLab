import type { plotsChaos as source } from "../tr/plotsChaos";

/** Chaos plots: twin separation, Lyapunov estimate and Poincaré section. */
export const plotsChaos: typeof source = {
  divergence: {
    separation: "twin separation δ",
    exponential: "δ₀·e^(λt)",
    lyapunov: "λ estimate",
    separationAxis: "δ [rad]",
    lyapunovAxis: "λ [1/s]",
    threshold: "1 rad",
    twinOff: "The twin trajectory is off; only the Lyapunov estimate is shown.",
    footer: {
      lyapunov: (value: string, seconds: string) => `λ ≈ ${value} s⁻¹ (finite-time estimate, averaged over ${seconds} s)`,
      lyapunovTime: (value: string) => `Lyapunov time 1/λ ≈ ${value} s`,
      horizon: (estimate: string, observed: string) =>
        `estimated prediction horizon ${estimate} s, observed time to divergence after the release of the twin: ${observed}`,
      notYet: "not yet",
      seconds: (value: string) => `${value} s`,
      caution:
        "The horizon formula t ≈ ln(a/δ₀)/λ is an order-of-magnitude estimate: the local stretching rate varies along the orbit, so the observed divergence time can differ from it by a factor of a few.",
      integrable:
        "The single pendulum is an integrable system: λ tends to zero and the finite-time estimate decays roughly like ln t / t.",
    },
  },
  poincare: {
    points: (count: number) => `${count} section points`,
    momentumAxis: "p₁ [kg·m²/s]",
    onlyDouble:
      "A two-dimensional Poincaré section exists only for the double pendulum: its phase space is four-dimensional and the energy surface three-dimensional.",
    waiting: "Collecting section points",
    footer:
      "Section: θ₂ = 0 (mod 2π), crossed with θ₂ increasing. Points lying on closed curves indicate regular (quasi-periodic) motion on an invariant torus; points filling an area indicate chaotic motion. The section restarts with every new trajectory.",
  },
};
