"use client";

import { useRef, useState } from "react";
import { OSC_GEOMETRY } from "@/physics/constants";
import { wrapAngle } from "@/physics/special";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { OSC_CH, PEND_CH } from "@/sim/Simulation";
import type { SeriesBuffer } from "@/sim/SeriesBuffer";
import { useT } from "@/i18n";
import { fixed } from "../format";
import { Segmented } from "../kit/controls";
import { LINK_COLORS, QUANTITY, SURFACE } from "../palette";
import {
  clipTo,
  drawFrame,
  drawLine,
  drawMarker,
  drawMessage,
  drawReference,
  linearScale,
  piTicks,
  PlotPanel,
  SmoothRange,
  usePlot,
  type LegendItem,
  type PlotSurface,
  type Scale,
} from "./plotKit";

/** Length of trajectory shown [s]. */
const HISTORY_SECONDS = 30;
/** Opacity of the age bands, oldest first. */
const FADE = [0.16, 0.3, 0.5, 0.75, 1];
const SEPARATRIX_POINTS = 96;

/** Draws samples [first, first + n) as a polyline whose older parts are fainter. */
function drawFadingPath(
  surface: PlotSurface,
  n: number,
  px: (i: number) => number,
  py: (i: number) => number,
  color: string,
  breakAt?: (i: number) => boolean,
  dash?: number[],
): void {
  const bands = FADE.length;
  for (let band = 0; band < bands; band++) {
    const from = Math.floor((band * n) / bands);
    // One sample of overlap keeps consecutive bands joined.
    const to = Math.min(n, Math.floor(((band + 1) * n) / bands) + 1);
    if (to - from < 2) continue;
    drawLine(
      surface,
      to - from,
      (i) => px(from + i),
      (i) => py(from + i),
      { color, width: 1.5, alpha: FADE[band], dash },
      breakAt ? (i) => i > 0 && breakAt(from + i) : undefined,
    );
  }
}

/**
 * Phase portrait: the state as a point in the (position, velocity) plane.
 * Oscillator: (x, v). Pendulum: (theta_k, omega_k) of a selectable link, with
 * the twin's trajectory for the last link and, for N = 1, the separatrix
 * between libration and rotation.
 */
export function PhasePlot() {
  const t = useT();
  const sim = useSim();
  const moduleId = useSimState((state) => state.module);
  const epoch = useSimState((state) => state.epoch);
  const pendulum = useSimState((state) => state.pendulum);
  const twinEnabled = useSimState((state) => state.twin.enabled);
  const [choice, setChoice] = useState<number | null>(null);
  useLiveTick(6);

  const count = pendulum.count;
  const link = Math.min(choice ?? count - 1, count - 1);
  const showTwin = twinEnabled && link === count - 1;
  const showSeparatrix = count === 1 && pendulum.gravity > 0;

  const qRange = useRef(new SmoothRange(1, 0.1, true));
  const pRange = useRef(new SmoothRange(1, 0.1, true));
  const seen = useRef("");

  const canvasRef = usePlot(
    (surface, simulation) => {
      const key = `${moduleId}:${epoch}:${link}`;
      if (seen.current !== key) {
        seen.current = key;
        qRange.current.reset();
        pRange.current.reset();
      }
      const oscillator = moduleId === "oscillator";
      const series: SeriesBuffer = oscillator ? simulation.oscSeries : simulation.pendSeries;
      const timeChannel = oscillator ? OSC_CH.t : PEND_CH.t;
      const area = surface.area();
      const first = series.lowerBound(timeChannel, series.latest(timeChannel) - HISTORY_SECONDS);
      const n = series.length - first;

      if (oscillator) {
        let qMin = Infinity;
        let qMax = -Infinity;
        let pMin = Infinity;
        let pMax = -Infinity;
        for (let i = 0; i < n; i++) {
          const q = series.get(OSC_CH.x, first + i);
          const p = series.get(OSC_CH.v, first + i);
          if (q < qMin) qMin = q;
          if (q > qMax) qMax = q;
          if (p < pMin) pMin = p;
          if (p > pMax) pMax = p;
        }
        const [q0, q1] = qRange.current.update(qMin, qMax);
        const [p0, p1] = pRange.current.update(pMin, pMax);
        const xScale = linearScale(q0, q1, area.x, area.x + area.w);
        const yScale = linearScale(p0, p1, area.y + area.h, area.y);
        drawFrame(surface, area, xScale, yScale, {
          x: { title: t.plots.axes.position },
          y: { title: t.plots.axes.velocity },
          zeroLine: true,
        });
        drawReference(surface, area, "vertical", xScale(0), SURFACE.gridStrong);
        drawReference(surface, area, "vertical", xScale(OSC_GEOMETRY.xMin), SURFACE.ink3, t.plotsState.phase.stop);
        drawReference(surface, area, "vertical", xScale(OSC_GEOMETRY.xMax), SURFACE.ink3, t.plotsState.phase.stop);
        if (n < 2) {
          drawMessage(surface, area, t.plots.waiting);
          return;
        }
        clipTo(surface, area);
        drawFadingPath(
          surface,
          n,
          (i) => xScale(series.get(OSC_CH.x, first + i)),
          (i) => yScale(series.get(OSC_CH.v, first + i)),
          QUANTITY.position,
        );
        surface.ctx.restore();
        drawMarker(surface, xScale(series.latest(OSC_CH.x)), yScale(series.latest(OSC_CH.v)), QUANTITY.position);
        return;
      }

      const thetaChannel = PEND_CH.theta + link;
      const omegaChannel = PEND_CH.omega + link;
      const theta = (i: number) => wrapAngle(series.get(thetaChannel, first + i));
      const twinTheta = (i: number) => wrapAngle(series.get(PEND_CH.twinTheta, first + i));
      let pMin = Infinity;
      let pMax = -Infinity;
      for (let i = 0; i < n; i++) {
        const p = series.get(omegaChannel, first + i);
        if (p < pMin) pMin = p;
        if (p > pMax) pMax = p;
        if (showTwin) {
          const g = series.get(PEND_CH.twinOmega, first + i);
          if (g < pMin) pMin = g;
          if (g > pMax) pMax = g;
        }
      }
      const separatrixPeak = showSeparatrix ? 2 * Math.sqrt(pendulum.gravity / pendulum.lengths[0]) : 0;
      if (showSeparatrix) {
        pMin = Math.min(pMin, -separatrixPeak);
        pMax = Math.max(pMax, separatrixPeak);
      }
      const [p0, p1] = pRange.current.update(pMin, pMax);
      const xScale = linearScale(-Math.PI * 1.04, Math.PI * 1.04, area.x, area.x + area.w);
      const yScale = linearScale(p0, p1, area.y + area.h, area.y);
      const angle = piTicks(-Math.PI, Math.PI);
      drawFrame(surface, area, xScale, yScale, {
        x: { title: t.plots.axes.angle, ticks: angle.ticks, format: angle.format },
        y: { title: t.plots.axes.angularVelocity },
        zeroLine: true,
      });
      drawReference(surface, area, "vertical", xScale(0), SURFACE.gridStrong);
      if (n < 2) {
        drawMessage(surface, area, t.plots.waiting);
        return;
      }
      clipTo(surface, area);
      if (showSeparatrix) drawSeparatrix(surface, xScale, yScale, separatrixPeak);
      if (showTwin) {
        drawFadingPath(
          surface,
          n,
          (i) => xScale(twinTheta(i)),
          (i) => yScale(series.get(PEND_CH.twinOmega, first + i)),
          QUANTITY.twin,
          (i) => Math.abs(twinTheta(i) - twinTheta(i - 1)) > Math.PI,
          [4, 3],
        );
      }
      drawFadingPath(
        surface,
        n,
        (i) => xScale(theta(i)),
        (i) => yScale(series.get(omegaChannel, first + i)),
        LINK_COLORS[link],
        (i) => Math.abs(theta(i) - theta(i - 1)) > Math.PI,
      );
      surface.ctx.restore();
      if (showTwin) {
        drawMarker(surface, xScale(twinTheta(n - 1)), yScale(series.latest(PEND_CH.twinOmega)), QUANTITY.twin, 3);
      }
      drawMarker(surface, xScale(theta(n - 1)), yScale(series.latest(omegaChannel)), LINK_COLORS[link]);
    },
    [moduleId, epoch, link, showTwin, showSeparatrix, pendulum, t],
  );

  const oscillator = moduleId === "oscillator";
  const legend: LegendItem[] = oscillator
    ? [
        {
          color: QUANTITY.position,
          label: t.plots.phase.trajectory,
          value: `(${fixed(sim.osc.x, 2)} m, ${fixed(sim.osc.v, 2)} m/s)`,
        },
      ]
    : [
        {
          color: LINK_COLORS[link],
          label: `${t.plots.phase.link} ${link + 1}`,
          value: `(${fixed(wrapAngle(sim.pend.y[link] ?? 0), 2)}, ${fixed(sim.pend.y[count + link] ?? 0, 2)} rad/s)`,
        },
        ...(showTwin ? [{ color: QUANTITY.twin, label: t.plots.phase.twin, dashed: true }] : []),
        ...(showSeparatrix ? [{ color: QUANTITY.theory, label: t.plotsState.phase.separatrix, dashed: true }] : []),
      ];

  return (
    <PlotPanel
      title={t.plots.phase.title}
      description={`${t.plots.phase.description} ${t.plotsState.phase.history(HISTORY_SECONDS)}`}
      legend={legend}
      canvasRef={canvasRef}
      actions={
        !oscillator && count > 1 ? (
          <Segmented
            size="sm"
            ariaLabel={t.plots.phase.link}
            value={String(link)}
            onChange={(value) => setChoice(Number(value))}
            options={Array.from({ length: count }, (_, index) => ({ value: String(index), label: String(index + 1) }))}
          />
        ) : undefined
      }
    />
  );
}

/** omega = +-2 sqrt(g/L) cos(theta/2): the orbit through the unstable upright equilibrium. */
function drawSeparatrix(surface: PlotSurface, xScale: Scale, yScale: Scale, peak: number): void {
  for (const sign of [1, -1]) {
    drawLine(
      surface,
      SEPARATRIX_POINTS + 1,
      (i) => xScale(-Math.PI + (2 * Math.PI * i) / SEPARATRIX_POINTS),
      (i) => yScale(sign * peak * Math.cos((-Math.PI + (2 * Math.PI * i) / SEPARATRIX_POINTS) / 2)),
      { color: QUANTITY.theory, width: 1.1, dash: [5, 4], alpha: 0.9 },
    );
  }
}
