"use client";

import { useRef } from "react";
import { predictionHorizon } from "@/physics/lyapunov";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { DIVERGENCE_THRESHOLD, PEND_CH } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { fixed, scientific } from "../format";
import { QUANTITY, SURFACE } from "../palette";
import {
  clipTo,
  drawFrame,
  drawLine,
  drawMessage,
  drawReference,
  linearScale,
  logScale,
  PlotPanel,
  SmoothRange,
  usePlot,
  type LegendItem,
  type Margins,
} from "./plotKit";

const MARGINS: Margins = { left: 50, right: 46, top: 10, bottom: 30 };
/** The estimate is dominated by the seed direction at first; hide that transient. */
const SKIP_SECONDS = 2;
const REFERENCE_POINTS = 64;

/**
 * Sensitivity to initial conditions, quantitatively: the separation of the
 * twin trajectory on a logarithmic axis (exponential growth is a straight
 * line) together with the running finite-time estimate of the largest
 * Lyapunov exponent.
 */
export function DivergencePlot() {
  const t = useT();
  const sim = useSim();
  const epoch = useSimState((state) => state.epoch);
  const twin = useSimState((state) => state.twin);
  const count = useSimState((state) => state.pendulum.count);
  useLiveTick(4);

  const text = t.plotsChaos.divergence;
  const lambdaRange = useRef(new SmoothRange(0.5, 0.1));
  const seen = useRef(-1);

  const canvasRef = usePlot(
    (surface, simulation) => {
      if (seen.current !== epoch) {
        seen.current = epoch;
        lambdaRange.current.reset();
      }
      const series = simulation.pendSeries;
      const n = series.length;
      const area = surface.area(MARGINS);
      const tStart = n > 0 ? series.get(PEND_CH.t, 0) : 0;
      const tEnd = Math.max(tStart + 20, series.latest(PEND_CH.t) || 0);
      const xScale = linearScale(tStart, tEnd, area.x, area.x + area.w);
      const px = (i: number) => xScale(series.get(PEND_CH.t, i));

      // Right axis: lambda(t)
      const firstLambda = series.lowerBound(PEND_CH.t, tStart + SKIP_SECONDS);
      let lMin = 0;
      let lMax = 0;
      for (let i = firstLambda; i < n; i++) {
        const value = series.get(PEND_CH.lyapunov, i);
        if (value < lMin) lMin = value;
        if (value > lMax) lMax = value;
      }
      const [l0, l1] = lambdaRange.current.update(lMin, lMax);
      const lambdaScale = linearScale(l0, l1, area.y + area.h, area.y);
      const lambdaLine = () =>
        drawLine(surface, n - firstLambda, (i) => px(firstLambda + i), (i) => lambdaScale(series.get(PEND_CH.lyapunov, firstLambda + i)), {
          color: QUANTITY.lyapunov,
          width: 1.2,
        });

      if (!twin.enabled) {
        drawFrame(surface, area, xScale, lambdaScale, {
          x: { title: t.plots.axes.time },
          y: { title: text.lyapunovAxis, color: QUANTITY.lyapunov },
          zeroLine: true,
        });
        if (n - firstLambda < 2) {
          drawMessage(surface, area, t.plots.waiting);
          return;
        }
        clipTo(surface, area);
        lambdaLine();
        surface.ctx.restore();
        return;
      }

      // Left axis: separation, decades chosen from the offset and the data.
      let dMax = 10;
      for (let i = 0; i < n; i++) {
        const value = series.get(PEND_CH.separation, i);
        if (value > dMax) dMax = value;
      }
      const lowDecade = Math.floor(Math.log10(Math.abs(twin.offset))) - 1;
      const highDecade = Math.ceil(Math.log10(dMax));
      const yScale = logScale(Math.pow(10, lowDecade), Math.pow(10, highDecade), area.y + area.h, area.y);
      const span = highDecade - lowDecade;
      const every = span > 8 ? 2 : 1;
      const decades: number[] = [];
      for (let d = lowDecade; d <= highDecade; d += every) decades.push(Math.pow(10, d));
      drawFrame(surface, area, xScale, yScale, {
        x: { title: t.plots.axes.time },
        y: {
          title: text.separationAxis,
          color: QUANTITY.twin,
          ticks: decades,
          format: (value) => scientific(value, 0).replace("1×", ""),
        },
        yRight: { scale: lambdaScale, title: text.lyapunovAxis, color: QUANTITY.lyapunov },
      });
      drawReference(surface, area, "horizontal", yScale(DIVERGENCE_THRESHOLD), SURFACE.ink3, text.threshold);
      if (simulation.divergenceTime !== null) {
        drawReference(surface, area, "vertical", xScale(simulation.divergenceTime), QUANTITY.twin, `${fixed(simulation.divergenceTime, 1)} s`);
      }
      if (n < 2) {
        drawMessage(surface, area, t.plots.waiting);
        return;
      }
      clipTo(surface, area);
      // Exponential reference with the current estimate of lambda. It starts with the offset at the
      // instant the twin was launched, which is later than the start of the record if the twin was
      // switched on during the run.
      const lambda = simulation.lyapunov.exponent;
      if (lambda > 0 && simulation.lyapunov.time > SKIP_SECONDS) {
        const launch = simulation.twinSince;
        const from = Math.max(tStart, launch);
        const time = (i: number) => from + ((tEnd - from) * i) / REFERENCE_POINTS;
        drawLine(
          surface,
          REFERENCE_POINTS + 1,
          (i) => xScale(time(i)),
          (i) => yScale(Math.abs(twin.offset) * Math.exp(lambda * (time(i) - launch))),
          { color: QUANTITY.lyapunov, width: 1.1, dash: [5, 4], alpha: 0.85 },
        );
      }
      lambdaLine();
      drawLine(surface, n, px, (i) => yScale(series.get(PEND_CH.separation, i)), { color: QUANTITY.twin, width: 1.6 });
      surface.ctx.restore();
    },
    [epoch, twin, t],
  );

  const lambda = sim.lyapunov.exponent;
  const averaged = sim.lyapunov.time;
  const ready = averaged > 5;
  const horizon = predictionHorizon(lambda, Math.abs(twin.offset), DIVERGENCE_THRESHOLD);
  const legend: LegendItem[] = [
    ...(twin.enabled
      ? [
          { color: QUANTITY.twin, label: text.separation, value: `${scientific(sim.separation, 1)} rad` },
          { color: QUANTITY.lyapunov, label: text.exponential, dashed: true },
        ]
      : []),
    { color: QUANTITY.lyapunov, label: text.lyapunov },
  ];
  const footer = text.footer;

  return (
    <PlotPanel
      title={t.plots.divergence.title}
      description={t.plots.divergence.description}
      legend={legend}
      canvasRef={canvasRef}
      footer={
        <p className="px-1 pt-1.5 text-[11.5px] leading-snug text-ink-3">
          {!twin.enabled ? `${text.twinOff} ` : null}
          {ready ? (
            <span className="num text-ink-2">
              {footer.lyapunov(fixed(lambda, 3), fixed(averaged, 0))}
              {lambda > 0.02 ? ` · ${footer.lyapunovTime(fixed(1 / lambda, 2))}` : ""}
              {twin.enabled && Number.isFinite(horizon)
                ? ` · ${footer.horizon(
                    fixed(horizon, 1),
                    // The horizon is a duration: compare it with the time the twin took, not with the clock.
                    sim.divergenceTime === null ? footer.notYet : footer.seconds(fixed(sim.divergenceTime - sim.twinSince, 1)),
                  )}`
                : ""}
              .{" "}
            </span>
          ) : null}
          {count === 1 ? footer.integrable : footer.caution}
        </p>
      }
    />
  );
}
