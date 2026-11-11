/**
 * Virtual instruments: they turn the sampled solution into the quantities an
 * experimenter would read off a stopwatch, a ruler or an oscilloscope, so that
 * theory can be compared with a *measurement* rather than with itself.
 *
 * Event times are refined by linear interpolation between samples; because the
 * solver also supplies the derivative of the signal, extrema are located from
 * the zero crossing of the velocity, which is far more accurate than
 * searching for the largest sample.
 */

export interface Extremum {
  t: number;
  value: number;
  /** Auxiliary signal interpolated to the instant of the extremum (e.g. drive phase). */
  aux: number;
}

const HISTORY = 12;

export class OscillationMeter {
  private hasPrevious = false;
  private tPrev = 0;
  private qPrev = 0;
  private vPrev = 0;
  private auxPrev = 0;
  private gatePrev = true;

  private lastUp = Number.NaN;
  private lastDown = Number.NaN;
  private readonly intervals: number[] = [];
  private totalCycles = 0;

  private readonly maxima: Extremum[] = [];
  private readonly minima: Extremum[] = [];

  reset(): void {
    this.hasPrevious = false;
    this.lastUp = Number.NaN;
    this.lastDown = Number.NaN;
    this.intervals.length = 0;
    this.totalCycles = 0;
    this.maxima.length = 0;
    this.minima.length = 0;
  }

  /**
   * Feeds one sample.
   * @param t    time [s]
   * @param q    signal whose zero crossings and extrema are measured
   * @param v    dq/dt at the same instant
   * @param gate crossings are only accepted while gate is true (used to reject
   *             the antipodal zero of a periodic signal such as sin(theta))
   * @param aux  optional companion signal sampled at the extrema
   */
  push(t: number, q: number, v: number, gate = true, aux = 0): void {
    if (this.hasPrevious) {
      const dt = t - this.tPrev;
      if (dt > 0) {
        const qPrev = this.qPrev;
        if (gate && this.gatePrev && qPrev !== q) {
          if (qPrev < 0 && q >= 0) {
            const tc = this.tPrev + (dt * -qPrev) / (q - qPrev);
            if (!Number.isNaN(this.lastUp)) this.addInterval(tc - this.lastUp);
            this.lastUp = tc;
          } else if (qPrev > 0 && q <= 0) {
            const tc = this.tPrev + (dt * qPrev) / (qPrev - q);
            if (!Number.isNaN(this.lastDown)) this.addInterval(tc - this.lastDown);
            this.lastDown = tc;
          }
        }
        const vPrev = this.vPrev;
        if (vPrev >= 0 && v < 0) this.addExtremum(this.maxima, dt, vPrev, v, aux);
        else if (vPrev <= 0 && v > 0) this.addExtremum(this.minima, dt, vPrev, v, aux);
      }
    }
    this.hasPrevious = true;
    this.tPrev = t;
    this.qPrev = q;
    this.vPrev = v;
    this.auxPrev = aux;
    this.gatePrev = gate;
  }

  private addInterval(interval: number): void {
    if (!(interval > 0)) return;
    this.intervals.push(interval);
    if (this.intervals.length > HISTORY) this.intervals.shift();
    this.totalCycles++;
  }

  private addExtremum(list: Extremum[], dt: number, vPrev: number, v: number, aux: number): void {
    const fraction = vPrev === v ? 0 : vPrev / (vPrev - v);
    const tau = fraction * dt;
    list.push({
      t: this.tPrev + tau,
      value: this.qPrev + 0.5 * vPrev * tau,
      aux: this.auxPrev + (aux - this.auxPrev) * fraction,
    });
    if (list.length > HISTORY) list.shift();
  }

  /** Mean of the most recent crossing-to-crossing intervals [s], or null before the first full cycle. */
  get period(): number | null {
    const n = this.intervals.length;
    if (n === 0) return null;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += this.intervals[i];
    return sum / n;
  }

  /** Most recent single interval [s]. */
  get lastPeriod(): number | null {
    const n = this.intervals.length;
    return n > 0 ? this.intervals[n - 1] : null;
  }

  /** Sample standard deviation of the recent intervals [s] (null with fewer than two). */
  get periodSpread(): number | null {
    const n = this.intervals.length;
    if (n < 2) return null;
    const mean = this.period as number;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += (this.intervals[i] - mean) ** 2;
    return Math.sqrt(sum / (n - 1));
  }

  /** Number of period intervals measured since the last reset. */
  get cycles(): number {
    return this.totalCycles;
  }

  get lastMaximum(): Extremum | null {
    return this.maxima.length > 0 ? this.maxima[this.maxima.length - 1] : null;
  }

  get lastMinimum(): Extremum | null {
    return this.minima.length > 0 ? this.minima[this.minima.length - 1] : null;
  }

  get recentMaxima(): readonly Extremum[] {
    return this.maxima;
  }

  /** Half the distance between the latest maximum and minimum. */
  get amplitude(): number | null {
    const max = this.lastMaximum;
    const min = this.lastMinimum;
    return max && min ? 0.5 * (max.value - min.value) : null;
  }

  /** Mid-point between the latest maximum and minimum. */
  get centre(): number | null {
    const max = this.lastMaximum;
    const min = this.lastMinimum;
    return max && min ? 0.5 * (max.value + min.value) : null;
  }

  /**
   * Relative change between the two most recent peak-to-peak amplitudes; small
   * values indicate that a driven oscillation has reached its steady state.
   */
  get amplitudeDrift(): number | null {
    const a = this.maxima;
    const b = this.minima;
    if (a.length < 2 || b.length < 2) return null;
    const latest = a[a.length - 1].value - b[b.length - 1].value;
    const before = a[a.length - 2].value - b[b.length - 2].value;
    return latest === 0 ? null : Math.abs(latest - before) / Math.abs(latest);
  }

  /**
   * Logarithmic decrement averaged over the recent positive maxima,
   * delta = ln(x_n / x_{n+m}) / m.
   */
  get logDecrement(): number | null {
    const list = this.maxima;
    let first = -1;
    for (let i = 0; i < list.length; i++) {
      if (list[i].value > 0) {
        first = i;
        break;
      }
    }
    const last = list.length - 1;
    if (first < 0 || last <= first || !(list[last].value > 0)) return null;
    return Math.log(list[first].value / list[last].value) / (last - first);
  }
}

/** Relative tolerance below which a driven response counts as steady. */
export const STEADY_TOLERANCE = 0.01;

/** Time after which a transient decaying as exp(-gamma t) has fallen to `tolerance` of its initial size [s]. */
export function transientDecayTime(gamma: number, tolerance: number = STEADY_TOLERANCE): number {
  return gamma > 0 ? Math.log(1 / tolerance) / gamma : Number.POSITIVE_INFINITY;
}

export interface SteadyState {
  steady: boolean;
  /** Time still to wait for the transient to have decayed [s]; Infinity without damping. */
  remaining: number;
}

/**
 * Steady-state test for a driven oscillation. Two conditions must hold:
 *  1. the peak-to-peak amplitude changes by less than `tolerance` from one
 *     cycle to the next (`drift`, see OscillationMeter.amplitudeDrift);
 *  2. the last disturbance (restart, parameter change, impact) lies at least
 *     one transient decay time ln(1/tolerance)/gamma back (`elapsed`).
 * The first condition alone is not sufficient: a transient that decays slowly
 * changes the amplitude only a little per cycle, by about (exp(gamma T) - 1)
 * times its own size, so it can still be several times larger than the
 * observed change.
 */
export function steadyState(
  drift: number | null,
  elapsed: number,
  gamma: number,
  tolerance: number = STEADY_TOLERANCE,
): SteadyState {
  const remaining = Math.max(0, transientDecayTime(gamma, tolerance) - elapsed);
  return { steady: drift !== null && drift < tolerance && remaining === 0, remaining };
}

/** Damping ratio implied by a logarithmic decrement: zeta = delta / sqrt(4 pi^2 + delta^2). */
export function dampingRatioFromDecrement(delta: number): number {
  return delta / Math.sqrt(4 * Math.PI * Math.PI + delta * delta);
}

/**
 * Step-response instrument for a release from rest at displacement x0:
 * overshoot past the equilibrium and the time after which |x| stays inside a
 * tolerance band around it.
 */
export class StepResponseMeter {
  private t0 = 0;
  private x0 = 0;
  private sign = 1;
  private worst = 0;
  private lastOutside = 0;
  private tNow = 0;
  private active = false;

  constructor(readonly band = 0.02) {}

  reset(t0: number, x0: number): void {
    this.t0 = t0;
    this.x0 = x0;
    this.sign = x0 >= 0 ? 1 : -1;
    this.worst = 0;
    this.lastOutside = t0;
    this.tNow = t0;
    this.active = Math.abs(x0) > 0;
  }

  push(t: number, x: number): void {
    if (!this.active) return;
    this.tNow = t;
    const signed = x * this.sign;
    if (signed < this.worst) this.worst = signed;
    if (Math.abs(x) > this.band * Math.abs(this.x0)) this.lastOutside = t;
  }

  get initialDisplacement(): number {
    return this.x0;
  }

  /** Largest excursion beyond equilibrium as a fraction of |x0| (0 = no overshoot). */
  get overshoot(): number {
    return this.active ? Math.max(0, -this.worst) / Math.abs(this.x0) : 0;
  }

  /** Time since release after which the response has stayed inside the band, or null if not yet settled. */
  get settlingTime(): number | null {
    if (!this.active) return null;
    const quiet = this.tNow - this.lastOutside;
    const elapsed = this.lastOutside - this.t0;
    // Require the response to have stayed inside the band for a while before reporting.
    return quiet > Math.max(0.25, 0.25 * elapsed) ? elapsed : null;
  }

  get elapsed(): number {
    return this.tNow - this.t0;
  }
}

/**
 * Settling time of the critically damped oscillator released from rest,
 * x(t) = x0 (1 + w0 t) exp(-w0 t): the response enters the band |x| <= band |x0|
 * for good at t_s = s / w0, where s solves (1 + s) exp(-s) = band.
 */
export function criticalSettlingFactor(band = 0.02): number {
  let s = 6;
  for (let i = 0; i < 50; i++) {
    const f = (1 + s) * Math.exp(-s) - band;
    const step = f / (-s * Math.exp(-s));
    s -= step;
    if (Math.abs(step) < 1e-15 * s) break;
  }
  return s;
}

/** s = 5.8339... for the customary 2 % band. */
export const CRITICAL_SETTLING_FACTOR = criticalSettlingFactor(0.02);
