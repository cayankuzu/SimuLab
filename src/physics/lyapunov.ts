/**
 * Largest Lyapunov exponent by the two-trajectory renormalisation method of
 * Benettin, Galgani & Strelcyn [benettin1976] (see also [benettin1980a, benettin1980b, skokos2010]).
 *
 * A "shadow" trajectory is kept at a tiny phase-space distance d0 from the
 * reference one. After every interval tau both have been advanced by the same
 * integrator; the separation d is measured, ln(d / d0) is accumulated and the
 * shadow is pulled back to distance d0 along the current separation
 * direction. The running estimate is
 *
 *   lambda(t) = (1 / t) * sum_k ln(d_k / d0),
 *
 * which converges to the maximal exponent lambda_1 as t -> infinity. For
 * regular motion lambda(t) decays like ln(t) / t; for chaotic motion it
 * levels off at a positive value. The estimate shown in the interface is a
 * finite-time value and is labelled as such.
 */

export const DEFAULT_SEPARATION = 1e-8;

export class BenettinEstimator {
  private logSum = 0;
  private elapsed = 0;
  private renormalisations = 0;

  /**
   * @param dim number of phase-space components compared (2N for the N-link pendulum)
   * @param d0  reference separation
   */
  constructor(
    readonly dim: number,
    readonly d0: number = DEFAULT_SEPARATION,
  ) {}

  /** Places the shadow at distance d0 from the reference and clears the statistics. */
  seed(reference: Float64Array, shadow: Float64Array): void {
    this.place(reference, shadow);
    this.logSum = 0;
    this.elapsed = 0;
    this.renormalisations = 0;
  }

  /**
   * Deterministic initial offset with a component along every coordinate; the
   * separation vector aligns with the most unstable direction by itself.
   */
  private place(reference: Float64Array, shadow: Float64Array): void {
    shadow.set(reference);
    const component = this.d0 / Math.sqrt(this.dim);
    for (let i = 0; i < this.dim; i++) shadow[i] += i % 2 === 0 ? component : -component;
  }

  /**
   * Call after both trajectories advanced by tau seconds. Measures the
   * separation, accumulates the stretching and renormalises the shadow in place.
   * @returns the stretching factor d / d0 of this interval.
   */
  renormalise(reference: Float64Array, shadow: Float64Array, tau: number): number {
    let sum = 0;
    for (let i = 0; i < this.dim; i++) {
      const d = shadow[i] - reference[i];
      sum += d * d;
    }
    const distance = Math.sqrt(sum);
    this.elapsed += tau;
    if (!(distance > 0) || !Number.isFinite(distance)) {
      // Degenerate separation (coincident states or overflow): start a fresh
      // offset; this interval contributes no stretching.
      this.place(reference, shadow);
      return 1;
    }
    const stretch = distance / this.d0;
    this.logSum += Math.log(stretch);
    this.renormalisations++;
    const scale = 1 / stretch;
    for (let i = 0; i < this.dim; i++) {
      shadow[i] = reference[i] + (shadow[i] - reference[i]) * scale;
    }
    // Auxiliary quadratures beyond the phase-space block simply follow the reference.
    for (let i = this.dim; i < shadow.length; i++) shadow[i] = reference[i];
    return stretch;
  }

  /** Finite-time estimate of the largest Lyapunov exponent [1/s]. */
  get exponent(): number {
    return this.elapsed > 0 ? this.logSum / this.elapsed : 0;
  }

  /** Simulated time over which the estimate has been averaged [s]. */
  get time(): number {
    return this.elapsed;
  }

  get count(): number {
    return this.renormalisations;
  }
}

/**
 * Prediction horizon [strogatz2015, section 9.3]: time until an initial error
 * delta0 grows to the tolerance a, t ~ ln(a / delta0) / lambda.
 */
export function predictionHorizon(lambda: number, delta0: number, tolerance: number): number {
  if (!(lambda > 0) || !(delta0 > 0) || !(tolerance > delta0)) return Number.POSITIVE_INFINITY;
  return Math.log(tolerance / delta0) / lambda;
}
