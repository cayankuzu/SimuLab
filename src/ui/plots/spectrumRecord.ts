/**
 * What the spectrum plot analyses and what it reads off: the record, its
 * sampling rate and the dominant line. Kept apart from the component so that
 * these rules can be tested without a canvas.
 */

import { amplitudeSpectrum, dominantPeak, type AmplitudeSpectrum, type SpectralPeak } from "@/physics/spectrum";
import type { SeriesBuffer } from "@/sim/SeriesBuffer";

/** Longest record analysed [samples]. */
export const FFT_SIZE = 4096;
/** Shortest record for which a spectrum is shown [samples]. */
export const MIN_SAMPLES = 256;
/**
 * Lowest bin in which the interpolated peak is reported. Nearer to zero the
 * image of the line at negative frequency leaks into the two bins the
 * interpolation uses: over 20 000 random sinusoids (records of 256 to 4656
 * samples) the frequency read-out was wrong by up to 8 % with the peak in
 * bin 2, by 0.2 % in bin 3 and by 0.05 % from bin 4 on.
 */
export const PEAK_MIN_BIN = 4;

export interface UniformRecord {
  /** Number of newest samples that are equally spaced in time. */
  count: number;
  /** Their mean spacing [s]; 0 with fewer than two samples. */
  interval: number;
}

/**
 * The newest samples of a series that are equally spaced in time, at most
 * `limit` of them. The frequency axis of a spectrum is derived from the record
 * itself, so it can never be scaled with a sampling rate other than the one
 * its samples were recorded at, whatever the solver setting is by now.
 */
export function uniformRecord(series: SeriesBuffer, timeChannel: number, limit: number = FFT_SIZE): UniformRecord {
  const last = series.length - 1;
  if (last < 1) return { count: series.length, interval: 0 };
  const newest = series.get(timeChannel, last) - series.get(timeChannel, last - 1);
  // Wide enough for the round-off of the clock after years of simulated time, far narrower than
  // the difference between two telemetry rates (60, 100 and 120 Hz).
  const tolerance = 1e-4 * newest;
  let count = 2;
  while (
    count < limit &&
    count <= last &&
    Math.abs(series.get(timeChannel, last - count + 1) - series.get(timeChannel, last - count) - newest) <= tolerance
  ) {
    count++;
  }
  // Mean spacing of the run: the round-off of a single interval averages out.
  const span = series.get(timeChannel, last) - series.get(timeChannel, last - count + 1);
  return { count, interval: span / (count - 1) };
}

/** The interpolated dominant line, or null while the strongest content of the spectrum is not a resolved line. */
export function resolvedPeak(spectrum: AmplitudeSpectrum): SpectralPeak | null {
  const peak = dominantPeak(spectrum, PEAK_MIN_BIN * spectrum.resolution);
  if (peak === null) return null;
  // dominantPeak ignores everything below the limit and returns the strongest local maximum above
  // it. If the strongest bin of the whole spectrum is a different one (a line too close to zero,
  // or the monotonic spectrum of a decay without oscillation), that maximum is not the dominant line.
  const { amplitude } = spectrum;
  let strongest = 1;
  for (let k = 2; k < amplitude.length; k++) {
    if (amplitude[k] > amplitude[strongest]) strongest = k;
  }
  return peak.bin === strongest ? peak : null;
}

export interface RecordSpectrum {
  spectrum: AmplitudeSpectrum;
  peak: SpectralPeak | null;
  /** Sampling rate of the analysed record [Hz], taken from its own time stamps. */
  sampleRate: number;
}

/**
 * Amplitude spectrum of the newest uniformly sampled record of `channel`, or
 * null while that record is shorter than MIN_SAMPLES. The transform takes the
 * largest power of two the record fills (at most FFT_SIZE), so the resolution
 * is sampleRate / spectrum.samples and the record lasts spectrum.samples / sampleRate.
 */
export function recordSpectrum(series: SeriesBuffer, timeChannel: number, channel: number): RecordSpectrum | null {
  const record = uniformRecord(series, timeChannel);
  if (record.count < MIN_SAMPLES || !(record.interval > 0)) return null;
  const sampleRate = 1 / record.interval;
  const spectrum = amplitudeSpectrum(series.tail(channel, record.count), sampleRate, FFT_SIZE);
  return { spectrum, peak: resolvedPeak(spectrum), sampleRate };
}
