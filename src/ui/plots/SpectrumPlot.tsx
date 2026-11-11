"use client";

import { useMemo, useRef } from "react";
import { oscillatorTheory } from "@/physics/oscillator";
import { linearModes } from "@/physics/pendulum";
import { amplitudeSpectrum, dominantPeak, type AmplitudeSpectrum, type SpectralPeak } from "@/physics/spectrum";
import { useLiveTick, useSimState } from "@/sim/react";
import { OSC_CH, PEND_CH } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { deviation, fixed, scientific } from "../format";
import { QUANTITY, SURFACE } from "../palette";
import {
  clipTo,
  drawFrame,
  drawLine,
  drawMarker,
  drawMessage,
  drawReference,
  linearScale,
  logScale,
  PlotPanel,
  usePlot,
  type LegendItem,
} from "./plotKit";

const FFT_SIZE = 4096;
const MIN_SAMPLES = 256;
const DECADES = 4;
/** Minimum time between two transforms [ms]. */
const REFRESH_MS = 500;

interface Cache {
  time: number;
  key: string;
  spectrum: AmplitudeSpectrum | null;
  peak: SpectralPeak | null;
  samples: number;
  sampleRate: number;
}

/**
 * Amplitude spectrum of the recorded motion (Hann window, 4096-point FFT).
 * Oscillator: x(t). Pendulum: the angular velocity of the last link, which is
 * bounded and has no wrap-around. Theoretical frequencies are marked.
 */
export function SpectrumPlot() {
  const t = useT();
  const moduleId = useSimState((state) => state.module);
  const epoch = useSimState((state) => state.epoch);
  const oscillator = useSimState((state) => state.oscillator);
  const pendulum = useSimState((state) => state.pendulum);
  useLiveTick(2);

  const isOscillator = moduleId === "oscillator";
  const theory = useMemo(() => oscillatorTheory(oscillator), [oscillator]);
  const modes = useMemo(
    () => (pendulum.gravity > 0 ? Array.from(linearModes(pendulum).omega, (omega) => omega / (2 * Math.PI)) : []),
    [pendulum],
  );
  const cache = useRef<Cache>({ time: 0, key: "", spectrum: null, peak: null, samples: 0, sampleRate: 0 });
  const text = t.plotsFrequency.spectrum;
  const unit = isOscillator ? "m" : "rad/s";

  const canvasRef = usePlot(
    (surface, simulation) => {
      const series = isOscillator ? simulation.oscSeries : simulation.pendSeries;
      const channel = isOscillator ? OSC_CH.x : PEND_CH.omega + pendulum.count - 1;
      const sampleRate = 1 / simulation.sampleInterval;
      const key = `${moduleId}:${epoch}:${channel}`;
      const now = performance.now();
      const stored = cache.current;
      if (stored.key !== key || now - stored.time >= REFRESH_MS) {
        stored.key = key;
        stored.time = now;
        stored.samples = Math.min(series.length, FFT_SIZE);
        stored.sampleRate = sampleRate;
        if (series.length >= MIN_SAMPLES) {
          stored.spectrum = amplitudeSpectrum(series.tail(channel, FFT_SIZE), sampleRate, FFT_SIZE);
          stored.peak = dominantPeak(stored.spectrum, 2 * stored.spectrum.resolution);
        } else {
          stored.spectrum = null;
          stored.peak = null;
        }
      }

      const nyquist = sampleRate / 2;
      const fMax = isOscillator
        ? Math.min(nyquist, Math.max(2.5 * (theory.omega0 / (2 * Math.PI)), (1.5 * oscillator.driveFrequency) / (2 * Math.PI), 1.5))
        : Math.min(nyquist, Math.max(2, 1.6 * (modes.length > 0 ? modes[modes.length - 1] : 1)));
      const area = surface.area();
      const spectrum = stored.spectrum;

      let peakValue = 1e-3;
      if (spectrum) {
        for (let k = 1; k < spectrum.amplitude.length && spectrum.frequency[k] <= fMax; k++) {
          if (spectrum.amplitude[k] > peakValue) peakValue = spectrum.amplitude[k];
        }
      }
      const topDecade = Math.ceil(Math.log10(peakValue * 1.2));
      const yMax = Math.pow(10, topDecade);
      const yMin = Math.pow(10, topDecade - DECADES);
      const xScale = linearScale(0, fMax, area.x, area.x + area.w);
      const yScale = logScale(yMin, yMax, area.y + area.h, area.y);
      const decades = Array.from({ length: DECADES + 1 }, (_, i) => Math.pow(10, topDecade - DECADES + i));
      drawFrame(surface, area, xScale, yScale, {
        x: { title: t.plots.axes.frequency },
        y: { title: text.amplitudeAxis(unit), ticks: decades, format: (value) => scientific(value, 0).replace("1×", "") },
      });

      // Theoretical frequencies
      if (isOscillator) {
        const f0 = theory.omega0 / (2 * Math.PI);
        drawReference(surface, area, "vertical", xScale(f0), QUANTITY.theory, text.natural);
        if (theory.omegaD !== null && theory.omega0 - theory.omegaD > 0.02 * theory.omega0) {
          drawReference(surface, area, "vertical", xScale(theory.omegaD / (2 * Math.PI)), SURFACE.ink3, text.damped);
        }
        if (oscillator.driveAmplitude > 0) {
          drawReference(surface, area, "vertical", xScale(oscillator.driveFrequency / (2 * Math.PI)), QUANTITY.drive, text.drive);
        }
      } else {
        modes.forEach((frequency, index) => {
          drawReference(surface, area, "vertical", xScale(frequency), QUANTITY.theory, text.mode(index + 1));
        });
      }

      if (!spectrum) {
        drawMessage(surface, area, text.need(MIN_SAMPLES));
        return;
      }
      const bins = Math.min(spectrum.amplitude.length, Math.ceil(fMax / spectrum.resolution) + 2);
      clipTo(surface, area);
      drawLine(
        surface,
        bins - 1,
        (i) => xScale(spectrum.frequency[i + 1]),
        (i) => yScale(spectrum.amplitude[i + 1]),
        { color: isOscillator ? QUANTITY.position : QUANTITY.velocity, width: 1.4 },
      );
      surface.ctx.restore();
      if (stored.peak && stored.peak.frequency <= fMax) {
        drawMarker(
          surface,
          xScale(stored.peak.frequency),
          yScale(Math.min(stored.peak.amplitude, yMax)),
          isOscillator ? QUANTITY.position : QUANTITY.velocity,
          3,
        );
      }
    },
    [moduleId, epoch, oscillator, pendulum, theory, modes, t],
  );

  const stored = cache.current;
  const peak = stored.peak;
  // For free motion compare the measured line with the frequency the linear theory predicts.
  const expected =
    isOscillator && oscillator.driveAmplitude === 0 && theory.omegaD !== null ? theory.omegaD / (2 * Math.PI) : null;
  const legend: LegendItem[] = [
    {
      color: isOscillator ? QUANTITY.position : QUANTITY.velocity,
      label: isOscillator ? text.signalOscillator : text.signalPendulum(pendulum.count),
    },
    ...(peak
      ? [
          {
            color: SURFACE.ink2,
            label: text.peak,
            value: `${fixed(peak.frequency, 4)} Hz${expected !== null ? ` (${deviation(peak.frequency, expected)})` : ""}`,
          },
        ]
      : []),
  ];

  return (
    <PlotPanel
      title={t.plots.spectrum.title}
      description={t.plots.spectrum.description}
      legend={legend}
      canvasRef={canvasRef}
      footer={
        stored.spectrum ? (
          <p className="px-1 pt-1.5 text-[11.5px] leading-snug text-ink-3">
            {text.footer(fixed(stored.spectrum.resolution, 4), fixed(stored.samples / stored.sampleRate, 1))}
          </p>
        ) : null
      }
    />
  );
}
