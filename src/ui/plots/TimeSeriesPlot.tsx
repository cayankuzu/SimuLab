"use client";

import { useRef } from "react";
import { MAX_LINKS } from "@/physics/constants";
import { wrapAngle } from "@/physics/special";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { OSC_CH, PEND_CH } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { fixed } from "../format";
import { LINK_COLORS, QUANTITY } from "../palette";
import { usePrefs } from "../prefs";
import {
  clipTo,
  drawFrame,
  drawLine,
  drawMarker,
  drawMessage,
  linearScale,
  piTicks,
  PlotPanel,
  SmoothRange,
  usePlot,
  type LegendItem,
  type Margins,
} from "./plotKit";

const OSC_MARGINS: Margins = { left: 46, right: 46, top: 10, bottom: 30 };
const PEND_MARGINS: Margins = { left: 46, right: 12, top: 10, bottom: 30 };
/**
 * Opacity of the closed-form trace, a wide band under x(t). At 0.4 the ink
 * colour has a contrast of 3.5:1 against the plot background and against the
 * panel behind its legend key (WCAG 1.4.11 asks for 3:1; 0.28 gave 2.3:1).
 */
const EXACT_ALPHA = 0.4;

/**
 * Strip chart of the state variables over a sliding time window.
 * Oscillator: x(t) on the left axis, v(t) on the right axis and, optionally,
 * the closed-form solution as a dashed reference under x(t).
 * Pendulum: the link angles, wrapped to (-pi, pi] with the trace broken at
 * every wrap so that no spurious vertical strokes appear.
 */
export function TimeSeriesPlot() {
  const t = useT();
  const sim = useSim();
  const moduleId = useSimState((state) => state.module);
  const epoch = useSimState((state) => state.epoch);
  const count = useSimState((state) => state.pendulum.count);
  const windowSeconds = usePrefs((prefs) => prefs.timeWindow);
  const showExact = usePrefs((prefs) => prefs.showExact);
  useLiveTick(8);

  const xRange = useRef(new SmoothRange(0.5, 0.1, true));
  const vRange = useRef(new SmoothRange(0.5, 0.1, true));
  const seenEpoch = useRef(-1);

  const canvasRef = usePlot(
    (surface, simulation) => {
      if (seenEpoch.current !== epoch) {
        seenEpoch.current = epoch;
        xRange.current.reset();
        vRange.current.reset();
      }
      const oscillator = moduleId === "oscillator";
      const series = oscillator ? simulation.oscSeries : simulation.pendSeries;
      const timeChannel = oscillator ? OSC_CH.t : PEND_CH.t;
      const area = surface.area(oscillator ? OSC_MARGINS : PEND_MARGINS);
      const tEnd = Math.max(windowSeconds, series.latest(timeChannel) || 0);
      const tStart = tEnd - windowSeconds;
      const first = series.lowerBound(timeChannel, tStart);
      const n = series.length - first;
      const xScale = linearScale(tStart, tEnd, area.x, area.x + area.w);
      const px = (i: number) => xScale(series.get(timeChannel, first + i));

      if (oscillator) {
        let xMin = Infinity;
        let xMax = -Infinity;
        let vMin = Infinity;
        let vMax = -Infinity;
        for (let i = 0; i < n; i++) {
          const x = series.get(OSC_CH.x, first + i);
          const v = series.get(OSC_CH.v, first + i);
          if (x < xMin) xMin = x;
          if (x > xMax) xMax = x;
          if (v < vMin) vMin = v;
          if (v > vMax) vMax = v;
        }
        const [x0, x1] = xRange.current.update(xMin, xMax);
        const [v0, v1] = vRange.current.update(vMin, vMax);
        const yScale = linearScale(x0, x1, area.y + area.h, area.y);
        const vScale = linearScale(v0, v1, area.y + area.h, area.y);
        drawFrame(surface, area, xScale, yScale, {
          x: { title: t.plots.axes.time },
          y: { title: t.plots.axes.position, color: QUANTITY.position },
          yRight: { scale: vScale, title: t.plots.axes.velocity, color: QUANTITY.velocity },
          zeroLine: true,
        });
        if (n < 2) {
          drawMessage(surface, area, t.plots.waiting);
          return;
        }
        clipTo(surface, area);
        drawLine(surface, n, px, (i) => vScale(series.get(OSC_CH.v, first + i)), { color: QUANTITY.velocity, width: 1.4 });
        if (showExact) {
          drawLine(surface, n, px, (i) => yScale(series.get(OSC_CH.xExact, first + i)), {
            color: QUANTITY.exact,
            width: 3.2,
            alpha: EXACT_ALPHA,
          });
        }
        drawLine(surface, n, px, (i) => yScale(series.get(OSC_CH.x, first + i)), { color: QUANTITY.position, width: 1.7 });
        surface.ctx.restore();
        drawMarker(surface, px(n - 1), vScale(series.latest(OSC_CH.v)), QUANTITY.velocity, 3);
        drawMarker(surface, px(n - 1), yScale(series.latest(OSC_CH.x)), QUANTITY.position);
        return;
      }

      const yScale = linearScale(-Math.PI * 1.06, Math.PI * 1.06, area.y + area.h, area.y);
      const angle = piTicks(-Math.PI, Math.PI);
      drawFrame(surface, area, xScale, yScale, {
        x: { title: t.plots.axes.time },
        y: { title: t.plots.axes.angle, ticks: angle.ticks, format: angle.format },
        zeroLine: true,
      });
      if (n < 2) {
        drawMessage(surface, area, t.plots.waiting);
        return;
      }
      clipTo(surface, area);
      const links = Math.min(count, MAX_LINKS);
      // Draw the first link last so that it stays on top.
      for (let link = links - 1; link >= 0; link--) {
        const channel = PEND_CH.theta + link;
        const value = (i: number) => wrapAngle(series.get(channel, first + i));
        drawLine(
          surface,
          n,
          px,
          (i) => yScale(value(i)),
          { color: LINK_COLORS[link], width: link === links - 1 ? 1.7 : 1.3, alpha: link === links - 1 ? 1 : 0.8 },
          (i) => i > 0 && Math.abs(value(i) - value(i - 1)) > Math.PI,
        );
      }
      surface.ctx.restore();
      for (let link = 0; link < links; link++) {
        drawMarker(surface, px(n - 1), yScale(wrapAngle(series.latest(PEND_CH.theta + link))), LINK_COLORS[link], 3);
      }
    },
    [moduleId, epoch, count, windowSeconds, showExact, t],
  );

  const legend: LegendItem[] =
    moduleId === "oscillator"
      ? [
          { color: QUANTITY.position, label: t.plots.timeSeries.position, value: `${fixed(sim.osc.x, 3)} m` },
          { color: QUANTITY.velocity, label: t.plots.timeSeries.velocity, value: `${fixed(sim.osc.v, 3)} m/s` },
          // The legend key shows the trace as it is drawn: QUANTITY.exact at the same opacity.
          ...(showExact ? [{ color: `rgba(238,241,245,${EXACT_ALPHA})`, label: t.plots.timeSeries.exact }] : []),
        ]
      : Array.from({ length: count }, (_, link) => ({
          color: LINK_COLORS[link],
          label: t.plots.timeSeries.link(link + 1),
          value: fixed(wrapAngle(sim.pend.y[link] ?? 0), 2),
        }));

  return (
    <PlotPanel
      title={t.plots.timeSeries.title}
      description={t.plots.timeSeries.description}
      legend={legend}
      canvasRef={canvasRef}
    />
  );
}
