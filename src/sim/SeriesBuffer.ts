/**
 * Fixed-capacity ring buffer for multi-channel telemetry (structure of arrays).
 * Writing never allocates; when the buffer is full the oldest sample is
 * overwritten. Index 0 always refers to the oldest retained sample.
 */
export class SeriesBuffer {
  private readonly data: Float64Array[];
  private start = 0;
  private count = 0;
  private pushed = 0;

  constructor(
    readonly channels: number,
    readonly capacity: number,
  ) {
    this.data = Array.from({ length: channels }, () => new Float64Array(capacity));
  }

  /** Number of retained samples. */
  get length(): number {
    return this.count;
  }

  /** Total number of samples ever pushed since the last clear (change detection). */
  get total(): number {
    return this.pushed;
  }

  clear(): void {
    this.start = 0;
    this.count = 0;
    this.pushed = 0;
  }

  /** Appends one sample; `values` must provide at least `channels` numbers. */
  push(values: ArrayLike<number>): void {
    let index: number;
    if (this.count < this.capacity) {
      index = (this.start + this.count) % this.capacity;
      this.count++;
    } else {
      index = this.start;
      this.start = (this.start + 1) % this.capacity;
    }
    for (let c = 0; c < this.channels; c++) this.data[c][index] = values[c];
    this.pushed++;
  }

  /** Value of `channel` at logical index i (0 = oldest, length - 1 = newest). */
  get(channel: number, i: number): number {
    return this.data[channel][(this.start + i) % this.capacity];
  }

  /** Newest value of a channel, or NaN if the buffer is empty. */
  latest(channel: number): number {
    return this.count > 0 ? this.get(channel, this.count - 1) : Number.NaN;
  }

  /**
   * Smallest logical index whose value in `channel` is >= `value`, assuming
   * the channel is non-decreasing (e.g. time). Returns `length` if none.
   */
  lowerBound(channel: number, value: number): number {
    let lo = 0;
    let hi = this.count;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.get(channel, mid) < value) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  /** Copies the most recent `n` values of a channel into a new array (oldest first). */
  tail(channel: number, n: number): Float64Array {
    const size = Math.min(n, this.count);
    const out = new Float64Array(size);
    const first = this.count - size;
    for (let i = 0; i < size; i++) out[i] = this.get(channel, first + i);
    return out;
  }
}
