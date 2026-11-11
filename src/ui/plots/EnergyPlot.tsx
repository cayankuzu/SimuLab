"use client";

import { useRef } from "react";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { OSC_CH, PEND_CH } from "@/sim/Simulation";
import type { SeriesBuffer } from "@/sim/SeriesBuffer";
import { useT } from "@/i18n";
import { fixed, scientific } from "../format";
import { Swatch, Tex } from "../kit/core";
import { QUANTITY } from "../palette";
import { usePrefs } from "../prefs";
import {
  clipTo,
  drawFrame,
  drawLine,
  drawMessage,
  linearScale,
  PlotPanel,
  SmoothRange,
  usePlot,
  type LegendItem,
  type PlotSurface,
} from "./plotKit";

interface Layer {
  channel: number;
  color: string;
}

/** Fills the band between two curves given by index. */
function fillBand(
  surface: PlotSurface,
  n: number,
  px: (i: number) => number,
  lower: (i: number) => number,
  upper: (i: number) => number,
  color: string,
): void {
  const { ctx } = surface;
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px(0), upper(0));
  for (let i = 1; i < n; i++) ctx.lineTo(px(i), upper(i));
  for (let i = n - 1; i >= 0; i--) ctx.lineTo(px(i), lower(i));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Energy ledger. The stacked areas are the places the energy can be (kinetic,
 * potential, heat); the dashed line is the energy that was supplied (the
 * initial energy plus the work of the drive). The two coincide exactly as far
 * as the numerical solution is accurate, which makes the conservation law -
 * and the solver error - directly visible.
 */
export function EnergyPlot() {
  const t = useT();
  const sim = useSim();
  const moduleId = useSimState((state) => state.module);
  const epoch = useSimState((state) => state.epoch);
  const driven = useSimState((state) => state.oscillator.driveAmplitude > 0);
  const windowSeconds = usePrefs((prefs) => prefs.timeWindow);
  useLiveTick(5);

  const oscillator = moduleId === "oscillator";
  const range = useRef(new SmoothRange(1, 0.06));
  const seen = useRef("");
  const stack = useRef(new Float64Array(0));

  const canvasRef = usePlot(
    (surface, simulation) => {
      const key = `${moduleId}:${epoch}`;
      if (seen.current !== key) {
        seen.current = key;
        range.current.reset();
      }
      const series: SeriesBuffer = oscillator ? simulation.oscSeries : simulation.pendSeries;
      const timeChannel = oscillator ? OSC_CH.t : PEND_CH.t;
      const residualChannel = oscillator ? OSC_CH.residual : PEND_CH.residual;
      const layers: Layer[] = oscillator
        ? [
            { channel: OSC_CH.kinetic, color: QUANTITY.kinetic },
            { channel: OSC_CH.potential, color: QUANTITY.potential },
            { channel: OSC_CH.damperHeat, color: QUANTITY.heat },
            { channel: OSC_CH.impactHeat, color: QUANTITY.impact },
          ]
        : [
            { channel: PEND_CH.kinetic, color: QUANTITY.kinetic },
            { channel: PEND_CH.potential, color: QUANTITY.potential },
            { channel: PEND_CH.heat, color: QUANTITY.heat },
          ];

      const area = surface.area();
      const tEnd = Math.max(windowSeconds, series.latest(timeChannel) || 0);
      const tStart = tEnd - windowSeconds;
      const first = series.lowerBound(timeChannel, tStart);
      const n = series.length - first;
      const xScale = linearScale(tStart, tEnd, area.x, area.x + area.w);
      const px = (i: number) => xScale(series.get(timeChannel, first + i));

      // Cumulative sums, layer by layer: cumulative[l * n + i].
      const levels = layers.length;
      if (stack.current.length < levels * n) stack.current = new Float64Array(levels * Math.max(n, 256) * 2);
      const cumulative = stack.current;
      let top = 0;
      let bottom = 0;
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let l = 0; l < levels; l++) {
          sum += series.get(layers[l].channel, first + i);
          cumulative[l * n + i] = sum;
        }
        const supplied = sum - series.get(residualChannel, first + i);
        if (Math.max(sum, supplied) > top) top = Math.max(sum, supplied);
        if (oscillator && driven) {
          const work = series.get(OSC_CH.driveWork, first + i);
          if (work < bottom) bottom = work;
          if (work > top) top = work;
        }
      }
      const [y0, y1] = range.current.update(bottom, top);
      const yScale = linearScale(bottom < 0 ? y0 : 0, y1, area.y + area.h, area.y);
      drawFrame(surface, area, xScale, yScale, {
        x: { title: t.plots.axes.time },
        y: { title: t.plots.axes.energy },
        zeroLine: bottom < 0,
      });
      if (n < 2) {
        drawMessage(surface, area, t.plots.waiting);
        return;
      }
      clipTo(surface, area);
      for (let l = 0; l < levels; l++) {
        const upper = (i: number) => yScale(cumulative[l * n + i]);
        const lower = l === 0 ? () => yScale(0) : (i: number) => yScale(cumulative[(l - 1) * n + i]);
        fillBand(surface, n, px, lower, upper, layers[l].color);
        drawLine(surface, n, px, upper, { color: layers[l].color, width: 1.2 });
      }
      if (oscillator && driven) {
        drawLine(surface, n, px, (i) => yScale(series.get(OSC_CH.driveWork, first + i)), { color: QUANTITY.work, width: 1.2 });
      }
      drawLine(
        surface,
        n,
        px,
        (i) => yScale(cumulative[(levels - 1) * n + i] - series.get(residualChannel, first + i)),
        { color: QUANTITY.total, width: 1.3, dash: [5, 4] },
      );
      surface.ctx.restore();
    },
    [moduleId, epoch, driven, windowSeconds, t],
  );

  const text = t.plots.energy;
  const legend: LegendItem[] = [
    { color: QUANTITY.kinetic, label: text.kinetic },
    { color: QUANTITY.potential, label: text.potential },
    { color: QUANTITY.heat, label: text.heat },
    ...(oscillator ? [{ color: QUANTITY.impact, label: text.impact }] : []),
    ...(oscillator && driven ? [{ color: QUANTITY.work, label: text.work }] : []),
    {
      color: QUANTITY.total,
      dashed: true,
      label: oscillator ? t.plotsState.energy.supplied : t.plotsState.energy.reference,
    },
  ];

  /* ---- ledger table (live) ---- */
  const oscEnergy = sim.osc.energy();
  const pendEnergy = sim.pend.energy();
  const rows: Array<{ sign: string; symbol: string; name: string; value: number; color: string }> = oscillator
    ? [
        { sign: "+", symbol: "E_k", name: text.kinetic, value: oscEnergy.kinetic, color: QUANTITY.kinetic },
        { sign: "+", symbol: "E_p", name: text.potential, value: oscEnergy.potential, color: QUANTITY.potential },
        { sign: "+", symbol: "Q_c", name: text.heat, value: oscEnergy.damperHeat, color: QUANTITY.heat },
        { sign: "+", symbol: "Q_e", name: text.impact, value: oscEnergy.impactHeat, color: QUANTITY.impact },
        { sign: "−", symbol: "W", name: text.work, value: oscEnergy.driveWork, color: QUANTITY.work },
      ]
    : [
        { sign: "+", symbol: "E_k", name: text.kinetic, value: pendEnergy.kinetic, color: QUANTITY.kinetic },
        { sign: "+", symbol: "E_p", name: text.potential, value: pendEnergy.potential, color: QUANTITY.potential },
        { sign: "+", symbol: "Q_b", name: text.heat, value: pendEnergy.heat, color: QUANTITY.heat },
      ];
  const total = oscillator
    ? oscEnergy.mechanical + oscEnergy.damperHeat + oscEnergy.impactHeat - oscEnergy.driveWork
    : pendEnergy.mechanical + pendEnergy.heat;
  const residual = oscillator ? oscEnergy.residual : pendEnergy.residual;
  const scale = oscillator ? sim.osc.energyScale() : sim.pend.energyScale();
  const ledger = t.plotsState.energy.ledger;

  return (
    <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
      <PlotPanel
        title={text.title}
        description={oscillator ? t.plotsState.energy.description.oscillator : t.plotsState.energy.description.pendulum}
        legend={legend}
        canvasRef={canvasRef}
      />
      <div className="relative hidden min-h-0 overflow-y-auto md:block">
        <table className="w-full text-[12px]">
          <caption className="pb-1.5 text-left text-[12px] font-medium text-ink-2">{ledger.caption}</caption>
          <thead>
            <tr className="border-b border-line text-left text-ink-3">
              <th scope="col" className="w-6 py-1 font-normal">
                <span className="sr-only">{ledger.sign}</span>
              </th>
              <th scope="col" className="py-1 font-normal">
                {ledger.term}
              </th>
              <th scope="col" className="py-1 text-right font-normal">
                {ledger.value} [J]
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-b border-line/60">
                <td className="num py-1 text-ink-3">{row.sign}</td>
                <th scope="row" className="py-1 text-left font-normal text-ink-2">
                  <span className="inline-flex items-center gap-2">
                    <Swatch color={row.color} />
                    <Tex>{row.symbol}</Tex>
                    <span className="text-ink-3">{row.name}</span>
                  </span>
                </th>
                <td className="num py-1 text-right text-ink">{fixed(row.value, 3)}</td>
              </tr>
            ))}
            <tr className="border-b border-line/60">
              <td className="num py-1 text-ink-3">=</td>
              <th scope="row" className="py-1 text-left font-normal text-ink-2">
                <span className="inline-flex items-center gap-2">
                  <Swatch color={QUANTITY.total} dashed />
                  <Tex>{String.raw`\Sigma`}</Tex>
                  <span className="text-ink-3">{text.total}</span>
                </span>
              </th>
              <td className="num py-1 text-right text-ink">{fixed(total, 3)}</td>
            </tr>
            <tr className="border-b border-line/60">
              <td />
              <th scope="row" className="py-1 text-left font-normal text-ink-2">
                <span className="inline-flex items-center gap-2 pl-[22px]">
                  <Tex>{String.raw`\Delta E = \Sigma - E_0`}</Tex>
                  <span className="text-ink-3">{text.residual}</span>
                </span>
              </th>
              <td className="num py-1 text-right text-ink">{scientific(residual, 2)}</td>
            </tr>
            <tr>
              <td />
              <th scope="row" className="py-1 text-left font-normal text-ink-2">
                <span className="inline-flex items-center gap-2 pl-[22px]">
                  <Tex>{String.raw`|\Delta E| / E`}</Tex>
                  <span className="text-ink-3">{t.plotsState.energy.relativeResidual}</span>
                </span>
              </th>
              <td className="num py-1 text-right text-ink">{scientific(Math.abs(residual) / scale, 1)}</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-[12px] leading-snug text-ink-3">{t.plotsState.energy.note}</p>
      </div>
    </div>
  );
}
