"use client";

import React, { useEffect, useRef } from "react";
import { EnergySnapshot } from "@/engine/physicsModules";

interface EnergyWidgetProps {
  current: EnergySnapshot;
  history: EnergySnapshot[];
  labels: {
    kinetic: string;
    kineticDesc: string;
    potential: string;
    potentialDesc: string;
    thermal: string;
    thermalDesc: string;
    totalMech: string;
  };
}

export const EnergyWidget: React.FC<EnergyWidgetProps> = ({
  current,
  history,
  labels,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const scaleDenom = Math.max(
    1e-4,
    current.kinetic + current.potential + current.thermal,
    Math.abs(current.total)
  );

  const kPct = Math.min(100, Math.max(0, (current.kinetic / scaleDenom) * 100));
  const pPct = Math.min(100, Math.max(0, (current.potential / scaleDenom) * 100));
  const thPct = Math.min(100, Math.max(0, (current.thermal / scaleDenom) * 100));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 360;
    const height = canvas.clientHeight || 95;
    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#0b0b0a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let j = 1; j < 4; j++) {
      const y = (height / 4) * j;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (history.length > 1) {
      let maxE = 1.0;
      for (let i = 0; i < history.length; i++) {
        const h = history[i];
        const sum = h.kinetic + h.potential + h.thermal;
        if (sum > maxE) maxE = sum;
        if (Math.abs(h.total) > maxE) maxE = Math.abs(h.total);
      }
      maxE *= 1.15;

      const drawCurve = (
        getter: (e: EnergySnapshot) => number,
        color: string,
        dashed = false
      ) => {
        ctx.beginPath();
        for (let i = 0; i < history.length; i++) {
          const x = (i / Math.max(1, history.length - 1)) * width;
          const val = Math.max(0, getter(history[i]));
          const y = height - 8 - (val / maxE) * (height - 18);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = dashed ? 1.5 : 1.8;
        if (dashed) ctx.setLineDash([4, 3]);
        else ctx.setLineDash([]);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawCurve((e) => e.kinetic, "#10b981");
      drawCurve((e) => e.potential, "#38bdf8");
      drawCurve((e) => e.thermal, "#f97316");
      drawCurve(
        (e) => e.kinetic + e.potential + e.thermal,
        "#e2e8f0",
        true
      );
    }

    ctx.restore();
  }, [history]);

  return (
    <div className="space-y-3">
      {/* Live Educational Energy Bars */}
      <div className="space-y-2.5 text-xs">
        {/* Kinetic */}
        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium text-zinc-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              {labels.kinetic}
            </span>
            <span className="font-mono tabular-nums font-semibold text-emerald-400">
              {current.kinetic.toFixed(1)} J ({kPct.toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">{labels.kineticDesc}</p>
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-75"
              style={{ width: `${kPct}%` }}
            />
          </div>
        </div>

        {/* Potential */}
        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium text-zinc-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" />
              {labels.potential}
            </span>
            <span className="font-mono tabular-nums font-semibold text-sky-400">
              {current.potential.toFixed(1)} J ({pPct.toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">{labels.potentialDesc}</p>
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-sky-400 transition-all duration-75"
              style={{ width: `${pPct}%` }}
            />
          </div>
        </div>

        {/* Thermal */}
        <div className="p-2.5 rounded-lg bg-zinc-900/70 border border-white/[0.06] space-y-1">
          <div className="flex justify-between items-center">
            <span className="font-medium text-zinc-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />
              {labels.thermal}
            </span>
            <span className="font-mono tabular-nums font-semibold text-orange-400">
              {current.thermal.toFixed(1)} J ({thPct.toFixed(0)}%)
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">{labels.thermalDesc}</p>
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 transition-all duration-75"
              style={{ width: `${thPct}%` }}
            />
          </div>
        </div>

        {/* Total Energy */}
        <div className="px-3 py-2 rounded-lg bg-zinc-900 border border-white/[0.1] flex justify-between items-center">
          <span className="text-zinc-200 font-semibold flex items-center gap-2">
            <span className="w-3 h-0.5 bg-zinc-100 inline-block" />
            {labels.totalMech}
          </span>
          <span className="font-mono tabular-nums text-sm text-white font-bold">
            {(current.kinetic + current.potential + current.thermal).toFixed(1)} J
          </span>
        </div>
      </div>

      {/* Time-Series Oscilloscope */}
      <div className="relative w-full h-[90px] rounded-lg border border-white/[0.08] overflow-hidden bg-[#0b0b0a]">
        <canvas ref={canvasRef} className="w-full h-full block" />
        <div className="absolute top-1.5 left-2.5 right-2.5 flex justify-between items-center text-[10px] font-mono text-zinc-400 pointer-events-none">
          <span>Zamanla Enerji Değişimi Grafiği</span>
          <span className="text-emerald-400">RK4 Enerji Korunumu Aktif</span>
        </div>
      </div>
    </div>
  );
};
