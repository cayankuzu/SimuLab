"use client";

import { useRef } from "react";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { POINCARE_CH } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { LINK_COLORS, SURFACE } from "../palette";
import {
  clipTo,
  drawFrame,
  drawMessage,
  linearScale,
  piTicks,
  PlotPanel,
  SmoothRange,
  usePlot,
} from "./plotKit";

const RECENT = 200;

/**
 * Poincare section of the double pendulum: (theta_1, p_1) each time theta_2
 * passes through zero while increasing. p_1 is the canonical momentum
 * conjugate to theta_1, so the section map is area-preserving.
 */
export function PoincarePlot() {
  const t = useT();
  const sim = useSim();
  const epoch = useSimState((state) => state.epoch);
  const count = useSimState((state) => state.pendulum.count);
  useLiveTick(2);

  const text = t.plotsChaos.poincare;
  const range = useRef(new SmoothRange(2, 0.1, true));
  const seen = useRef(-1);

  const canvasRef = usePlot(
    (surface, simulation) => {
      if (seen.current !== epoch) {
        seen.current = epoch;
        range.current.reset();
      }
      const points = simulation.poincare;
      const n = count === 2 ? points.length : 0;
      const area = surface.area();
      let pMin = Infinity;
      let pMax = -Infinity;
      for (let i = 0; i < n; i++) {
        const p = points.get(POINCARE_CH.momentum, i);
        if (p < pMin) pMin = p;
        if (p > pMax) pMax = p;
      }
      const [p0, p1] = range.current.update(pMin, pMax);
      const xScale = linearScale(-Math.PI * 1.04, Math.PI * 1.04, area.x, area.x + area.w);
      const yScale = linearScale(p0, p1, area.y + area.h, area.y);
      const angle = piTicks(-Math.PI, Math.PI);
      drawFrame(surface, area, xScale, yScale, {
        x: { title: "θ₁ [rad]", ticks: angle.ticks, format: angle.format },
        y: { title: text.momentumAxis },
        zeroLine: true,
      });
      if (count !== 2) {
        drawMessage(surface, area, "N ≠ 2");
        return;
      }
      if (n === 0) {
        drawMessage(surface, area, text.waiting);
        return;
      }
      clipTo(surface, area);
      const { ctx } = surface;
      ctx.fillStyle = LINK_COLORS[0];
      ctx.globalAlpha = 0.55;
      const recentFrom = Math.max(0, n - RECENT);
      for (let i = 0; i < recentFrom; i++) {
        ctx.fillRect(xScale(points.get(POINCARE_CH.theta, i)) - 0.75, yScale(points.get(POINCARE_CH.momentum, i)) - 0.75, 1.5, 1.5);
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = SURFACE.ink;
      for (let i = recentFrom; i < n; i++) {
        ctx.fillRect(xScale(points.get(POINCARE_CH.theta, i)) - 1, yScale(points.get(POINCARE_CH.momentum, i)) - 1, 2, 2);
      }
      ctx.restore();
    },
    [epoch, count, t],
  );

  return (
    <PlotPanel
      title={t.plots.poincare.title}
      description={t.plots.poincare.description}
      legend={count === 2 ? [{ color: LINK_COLORS[0], label: text.points(sim.poincare.length) }] : undefined}
      canvasRef={canvasRef}
      footer={
        <p className="px-1 pt-1.5 text-[11.5px] leading-snug text-ink-3">{count === 2 ? text.footer : text.onlyDouble}</p>
      }
    />
  );
}
