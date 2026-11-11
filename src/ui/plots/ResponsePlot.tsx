"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { OSC_GEOMETRY } from "@/physics/constants";
import {
  oscillatorTheory,
  steadyStateAmplitude,
  steadyStatePhaseLag,
  type OscillatorParams,
} from "@/physics/oscillator";
import { steadyState } from "@/physics/measure";
import { measureSteadyState, type SteadyStateMeasurement } from "@/physics/validation";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { RESPONSE_CH } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { deviation, fixed } from "../format";
import { Button, Tooltip } from "../kit/core";
import { QUANTITY, SURFACE } from "../palette";
import {
  clipTo,
  drawFrame,
  drawLine,
  drawMarker,
  drawMessage,
  drawReference,
  linearScale,
  PlotPanel,
  usePlot,
  type LegendItem,
  type PlotSurface,
  type Rect,
} from "./plotKit";

const CURVE_POINTS = 300;
const SWEEP_POINTS = 25;
const SWEEP_STEP = 1 / 500;
/** A sweep point is read after the slowest transient term has decayed by exp(-12), about 6e-6. */
const SWEEP_SETTLE = 12;
const MIN_SWEEP_ZETA = 0.01;
/** Largest amplitude the carriage can reach symmetrically before touching a stop. */
const STOP_LIMIT = Math.min(Math.abs(OSC_GEOMETRY.xMin), OSC_GEOMETRY.xMax);

interface Sweep {
  params: OscillatorParams;
  points: SteadyStateMeasurement[];
  total: number;
  running: boolean;
}

/** Sweep frequencies between 0.3 and 2 omega0, concentrated around omega0 where the curve bends. */
function sweepFrequencies(omega0: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < SWEEP_POINTS; i++) {
    const u = -1 + (2 * i) / (SWEEP_POINTS - 1);
    out.push(omega0 * (u < 0 ? 1 - 0.7 * u * u : 1 + u * u));
  }
  return out;
}

function hollowCircle(surface: PlotSurface, x: number, y: number, color: string, cross: boolean): void {
  const { ctx } = surface;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  if (cross) {
    ctx.moveTo(x - 3, y - 3);
    ctx.lineTo(x + 3, y + 3);
    ctx.moveTo(x - 3, y + 3);
    ctx.lineTo(x + 3, y - 3);
  } else {
    ctx.arc(x, y, 3.2, 0, 2 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Frequency response of the driven oscillator: theoretical steady-state
 * amplitude and phase lag, the amplitude actually measured in the running
 * experiment (one point per oscillation, converging onto the curve as the
 * transient decays) and, on request, an independent numerical sweep.
 */
export function ResponsePlot() {
  const t = useT();
  const sim = useSim();
  const params = useSimState((state) => state.oscillator);
  const epoch = useSimState((state) => state.epoch);
  const theory = useMemo(() => oscillatorTheory(params), [params]);
  const [sweep, setSweep] = useState<Sweep | null>(null);
  const timer = useRef(0);
  const reasonId = useId();
  useLiveTick(4);

  const text = t.plotsFrequency.response;
  const driven = params.driveAmplitude > 0;
  const canSweep = driven && theory.zeta >= MIN_SWEEP_ZETA;
  const current = sweep && sweep.params === params ? sweep : null;

  const cancelSweep = useCallback(() => {
    window.clearTimeout(timer.current);
    setSweep((previous) => (previous ? { ...previous, running: false } : previous));
  }, []);

  // A sweep belongs to one parameter set: stop it when the parameters change or the plot unmounts.
  useEffect(() => () => window.clearTimeout(timer.current), [params]);

  const runSweep = useCallback(() => {
    window.clearTimeout(timer.current);
    const target = params;
    const frequencies = sweepFrequencies(Math.sqrt(target.stiffness / target.mass));
    const points: SteadyStateMeasurement[] = [];
    const next = () => {
      // One frequency per macrotask keeps the interface responsive.
      points.push(measureSteadyState(target, frequencies[points.length], SWEEP_STEP, SWEEP_SETTLE));
      const running = points.length < frequencies.length;
      setSweep({ params: target, points: [...points], total: frequencies.length, running });
      if (running) timer.current = window.setTimeout(next, 0);
    };
    setSweep({ params: target, points: [], total: frequencies.length, running: true });
    timer.current = window.setTimeout(next, 0);
  }, [params]);

  const curve = useRef<{ params: OscillatorParams | null; max: number; amplitude: Float64Array; phase: Float64Array }>({
    params: null,
    max: 0,
    amplitude: new Float64Array(CURVE_POINTS + 1),
    phase: new Float64Array(CURVE_POINTS + 1),
  });

  const canvasRef = usePlot(
    (surface, simulation) => {
      const omegaMax = Math.max(2.2 * theory.omega0, 1.15 * params.driveFrequency);
      const cache = curve.current;
      if (cache.params !== params || cache.max !== omegaMax) {
        cache.params = params;
        cache.max = omegaMax;
        for (let i = 0; i <= CURVE_POINTS; i++) {
          const omega = (omegaMax * i) / CURVE_POINTS;
          cache.amplitude[i] = steadyStateAmplitude(params, omega);
          cache.phase[i] = steadyStatePhaseLag(params, omega);
        }
      }

      const left = 46;
      const right = 12;
      const gap = 10;
      const full = surface.height - 10 - 30 - gap;
      const upper: Rect = { x: left, y: 10, w: Math.max(10, surface.width - left - right), h: Math.max(10, full * 0.62) };
      const lower: Rect = { x: left, y: upper.y + upper.h + gap, w: upper.w, h: Math.max(10, full * 0.38) };
      const xUpper = linearScale(0, omegaMax, upper.x, upper.x + upper.w);

      // Amplitude range: the theoretical peak, but never far beyond what the stops allow.
      const trail = simulation.responseTrail;
      let top = 0;
      for (let i = 0; i <= CURVE_POINTS; i++) {
        if (Number.isFinite(cache.amplitude[i]) && cache.amplitude[i] > top) top = cache.amplitude[i];
      }
      for (let i = 0; i < trail.length; i++) top = Math.max(top, trail.get(RESPONSE_CH.amplitude, i));
      if (current) for (const point of current.points) if (Number.isFinite(point.amplitude)) top = Math.max(top, point.amplitude);
      top = Math.min(Math.max(top, 0.05) * 1.12, 1.5 * STOP_LIMIT);
      const yAmplitude = linearScale(0, top, upper.y + upper.h, upper.y);
      const yPhase = linearScale(0, Math.PI, lower.y + lower.h, lower.y);
      const pxCurve = (i: number) => xUpper((omegaMax * i) / CURVE_POINTS);

      drawFrame(surface, upper, xUpper, yAmplitude, {
        x: { format: () => "" },
        y: { title: t.plots.axes.amplitude },
      });
      drawFrame(surface, lower, xUpper, yPhase, {
        x: { title: t.plots.axes.driveFrequency },
        y: {
          title: t.plots.axes.phaseLag,
          ticks: [0, Math.PI / 2, Math.PI],
          format: (value) => (value === 0 ? "0" : value > 2 ? "π" : "π/2"),
        },
      });
      if (!driven) {
        drawMessage(surface, upper, text.off);
        return;
      }

      for (const area of [upper, lower]) {
        drawReference(surface, area, "vertical", xUpper(theory.omega0), QUANTITY.theory, area === upper ? "ω₀" : undefined);
        if (theory.omegaPeak !== null && theory.omega0 - theory.omegaPeak > 0.01 * omegaMax) {
          drawReference(surface, area, "vertical", xUpper(theory.omegaPeak), SURFACE.ink3, area === upper ? "ωᵣ" : undefined);
        }
      }
      drawReference(surface, upper, "horizontal", yAmplitude(STOP_LIMIT), SURFACE.ink3, text.stopLimit);

      // Theory
      clipTo(surface, upper);
      drawLine(surface, CURVE_POINTS + 1, pxCurve, (i) => yAmplitude(Math.min(cache.amplitude[i], 4 * top)), {
        color: SURFACE.ink2,
        width: 1.5,
      });
      surface.ctx.restore();
      clipTo(surface, lower);
      drawLine(surface, CURVE_POINTS + 1, pxCurve, (i) => yPhase(cache.phase[i]), { color: SURFACE.ink2, width: 1.5 });
      surface.ctx.restore();

      // Current drive frequency
      const driveX = xUpper(params.driveFrequency);
      const { ctx } = surface;
      ctx.save();
      ctx.strokeStyle = QUANTITY.drive;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(surface.crisp(driveX), upper.y);
      ctx.lineTo(surface.crisp(driveX), upper.y + upper.h);
      ctx.moveTo(surface.crisp(driveX), lower.y);
      ctx.lineTo(surface.crisp(driveX), lower.y + lower.h);
      ctx.stroke();
      ctx.restore();

      // Independent numerical sweep
      if (current) {
        for (const point of current.points) {
          const x = xUpper(point.omega);
          const impacted = point.impacts > 0;
          hollowCircle(surface, x, yAmplitude(Math.min(point.amplitude, top)), QUANTITY.netForce, impacted);
          hollowCircle(surface, x, yPhase(Math.min(point.phaseLag, Math.PI)), QUANTITY.netForce, impacted);
        }
      }

      // Live measurement: one point per oscillation maximum, fading with age.
      const count = trail.length;
      ctx.save();
      ctx.fillStyle = QUANTITY.position;
      for (let i = Math.max(0, count - 160); i < count - 1; i++) {
        ctx.globalAlpha = 0.12 + 0.5 * ((i - (count - 160)) / 160);
        const x = xUpper(trail.get(RESPONSE_CH.omega, i));
        ctx.fillRect(x - 1, yAmplitude(Math.min(trail.get(RESPONSE_CH.amplitude, i), top)) - 1, 2, 2);
        ctx.fillRect(x - 1, yPhase(Math.min(trail.get(RESPONSE_CH.phaseLag, i), Math.PI)) - 1, 2, 2);
      }
      ctx.restore();
      if (count > 0) {
        const x = xUpper(trail.get(RESPONSE_CH.omega, count - 1));
        drawMarker(surface, x, yAmplitude(Math.min(trail.get(RESPONSE_CH.amplitude, count - 1), top)), QUANTITY.position);
        drawMarker(surface, x, yPhase(Math.min(trail.get(RESPONSE_CH.phaseLag, count - 1), Math.PI)), QUANTITY.position, 3);
      }
    },
    [params, theory, driven, current, epoch, t],
  );

  const anyImpact = current?.points.some((point) => point.impacts > 0) ?? false;
  const legend: LegendItem[] = [
    { color: SURFACE.ink2, label: text.theory },
    { color: QUANTITY.position, label: text.live },
    { color: QUANTITY.drive, label: text.drive },
    ...(current && current.points.length > 0 ? [{ color: QUANTITY.netForce, label: anyImpact ? text.sweepImpacts : text.sweep }] : []),
  ];

  /* ---- footer: theory against the live measurement at the current drive frequency ---- */
  const measuredAmplitude = sim.oscMeter.amplitude;
  const settled = steadyState(
    sim.oscMeter.amplitudeDrift,
    sim.oscMeter.centreDrift,
    sim.oscUndisturbedFor,
    theory.transientRate,
  );
  // The same three-condition test as in the Measurements panel and in the task sheets.
  const steady = settled.steady;
  const trail = sim.responseTrail;
  const measuredPhase = trail.length > 0 ? trail.latest(RESPONSE_CH.phaseLag) : null;

  return (
    <PlotPanel
      title={t.plots.response.title}
      description={`${t.plots.response.description} ${text.sweepHint}`}
      legend={legend}
      canvasRef={canvasRef}
      actions={
        current?.running || canSweep ? (
          <>
            {current?.running ? (
              <span className="num text-[12px] text-ink-3" role="status">
                {text.progress(current.points.length, current.total)}
              </span>
            ) : null}
            {/* One button starts and cancels: the keyboard focus stays on it when a sweep begins or ends. */}
            <Tooltip label={text.sweepHint} side="top">
              <Button size="sm" onClick={current?.running ? cancelSweep : runSweep}>
                {current?.running ? text.cancelSweep : text.runSweep}
              </Button>
            </Tooltip>
          </>
        ) : (
          <>
            {/*
              Why the sweep is unavailable is written next to the button. A tooltip on a disabled
              control can be reached neither with the keyboard nor by a screen reader.
            */}
            <span id={reasonId} className="text-[12px] leading-snug text-ink-3">
              {driven ? text.sweepBlocked.damping : text.sweepBlocked.drive}
            </span>
            <Button size="sm" disabled aria-describedby={reasonId}>
              {text.runSweep}
            </Button>
          </>
        )
      }
      footer={
        driven ? (
          <p className="num px-1 pt-1.5 text-[11.5px] leading-snug text-ink-3">
            <span className="font-sans">{text.footer.amplitude}: </span>
            {fixed(theory.steadyAmplitude, 4)} m ({text.theory}) · {fixed(measuredAmplitude, 4)} m ·{" "}
            {deviation(measuredAmplitude, theory.steadyAmplitude)}
            <span className="mx-2 text-ink-4">|</span>
            <span className="font-sans">{text.footer.phaseLag}: </span>
            {fixed(theory.phaseLag, 4)} · {fixed(measuredPhase, 4)} rad
            <span className="mx-2 text-ink-4">|</span>
            <span className={`font-sans ${steady ? "text-ok" : "text-warn"}`}>{steady ? text.footer.steady : text.footer.transient}
              {!steady && Number.isFinite(settled.remaining) && settled.remaining > 0
                ? ` (${text.footer.wait(fixed(Math.ceil(settled.remaining), 0))})`
                : ""}
            </span>
            {anyImpact ? <span className="font-sans"> {text.footer.impactNote}</span> : null}
          </p>
        ) : null
      }
    />
  );
}
