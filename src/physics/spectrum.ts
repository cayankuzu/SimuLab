/**
 * Discrete Fourier analysis of sampled telemetry.
 * Radix-2 Cooley-Tukey FFT [cooley1965] with a Hann window [harris1978].
 */

/** In-place complex FFT; the length must be a power of two. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  if (n !== im.length || n === 0 || (n & (n - 1)) !== 0) {
    throw new RangeError("fft: array length must be a power of two");
  }
  // Bit-reversal permutation.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i];
      re[i] = re[j];
      re[j] = tr;
      const ti = im[i];
      im[i] = im[j];
      im[j] = ti;
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const angle = (-2 * Math.PI) / size;
    const wr = Math.cos(angle);
    const wi = Math.sin(angle);
    for (let start = 0; start < n; start += size) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < half; k++) {
        const a = start + k;
        const b = a + half;
        const xr = re[b] * cr - im[b] * ci;
        const xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr;
        im[b] = im[a] - xi;
        re[a] += xr;
        im[a] += xi;
        const next = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = next;
      }
    }
  }
}

export interface AmplitudeSpectrum {
  /** Bin frequencies [Hz], length N/2 + 1. */
  frequency: Float64Array;
  /** Single-sided amplitude spectrum in signal units (a sine of amplitude A peaks at about A). */
  amplitude: Float64Array;
  /** Frequency resolution fs / N [Hz]. */
  resolution: number;
}

/**
 * Single-sided amplitude spectrum of the last `size` samples (size a power of
 * two). The mean is removed and a periodic Hann window applied; amplitudes are
 * corrected for the window's coherent gain of 1/2.
 */
export function amplitudeSpectrum(samples: ArrayLike<number>, sampleRate: number, size: number): AmplitudeSpectrum {
  if ((size & (size - 1)) !== 0) throw new RangeError("amplitudeSpectrum: size must be a power of two");
  const available = Math.min(size, samples.length);
  const offset = samples.length - available;
  const re = new Float64Array(size);
  const im = new Float64Array(size);

  let mean = 0;
  for (let i = 0; i < available; i++) mean += samples[offset + i];
  mean /= Math.max(1, available);

  let windowSum = 0;
  for (let i = 0; i < available; i++) {
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / available));
    windowSum += w;
    re[i] = (samples[offset + i] - mean) * w;
  }
  fft(re, im);

  const half = size >> 1;
  const frequency = new Float64Array(half + 1);
  const amplitude = new Float64Array(half + 1);
  const norm = windowSum > 0 ? 2 / windowSum : 0;
  for (let k = 0; k <= half; k++) {
    frequency[k] = (k * sampleRate) / size;
    amplitude[k] = Math.hypot(re[k], im[k]) * norm;
  }
  amplitude[0] *= 0.5;
  return { frequency, amplitude, resolution: sampleRate / size };
}

export interface SpectralPeak {
  /** Interpolated peak frequency [Hz]. */
  frequency: number;
  amplitude: number;
  bin: number;
}

/**
 * Strongest spectral line above `minFrequency`, refined with the two-bin
 * interpolation that is exact for a single sinusoid under a Hann window
 * [grandke1983]. With alpha the ratio of the larger neighbour to the peak bin,
 * the fractional bin offset is  d = (2 alpha - 1) / (alpha + 1)  and the
 * scalloping loss is corrected by  pi d (1 - d^2) / sin(pi d).
 */
export function dominantPeak(spectrum: AmplitudeSpectrum, minFrequency = 0): SpectralPeak | null {
  const { frequency, amplitude, resolution } = spectrum;
  let best = -1;
  for (let k = 1; k < amplitude.length - 1; k++) {
    if (frequency[k] < minFrequency) continue;
    if (amplitude[k] > amplitude[k - 1] && amplitude[k] >= amplitude[k + 1]) {
      if (best < 0 || amplitude[k] > amplitude[best]) best = k;
    }
  }
  if (best < 0 || !(amplitude[best] > 0)) return null;
  const peak = amplitude[best];
  const right = amplitude[best + 1];
  const left = amplitude[best - 1];
  const towardsRight = right >= left;
  const alpha = (towardsRight ? right : left) / peak;
  const offset = Math.min(0.5, Math.max(0, (2 * alpha - 1) / (alpha + 1)));
  const shift = towardsRight ? offset : -offset;
  const correction = offset < 1e-9 ? 1 : (Math.PI * offset * (1 - offset * offset)) / Math.sin(Math.PI * offset);
  return {
    frequency: (best + shift) * resolution,
    amplitude: peak * correction,
    bin: best,
  };
}
