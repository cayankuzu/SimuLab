"use client";

import React, { useEffect, useRef } from "react";

export interface OscilloscopeSample {
  t: number;
  val1: number; // e.g. position x (m) or theta (rad)
  val2: number; // e.g. velocity v (m/s) or omega (rad/s)
}

interface OscilloscopePlotProps {
  samples: OscilloscopeSample[];
  label1: string;
  label2: string;
  unit1?: string;
  unit2?: string;
  color1?: string;
  color2?: string;
}

export const OscilloscopePlot: React.FC<OscilloscopePlotProps> = ({
  samples,
  label1,
  label2,
  unit1 = "m",
  unit2 = "m/s",
  color1 = "#38bdf8",
  color2 = "#10b981",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 180;
    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark sleek phosphor CRT background
    ctx.fillStyle = "#090c10";
    ctx.fillRect(0, 0, width, height);

    // Oscilloscope reticle grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const cols = 8;
    const rows = 6;
    for (let i = 1; i < cols; i++) {
      const x = (i * width) / cols;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let j = 1; j < rows; j++) {
      const y = (j * height) / rows;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Horizontal Zero reference axis
    const cy = height / 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();
    ctx.setLineDash([]);

    if (samples.length < 2) {
      ctx.restore();
      return;
    }

    // Time window calculation: show last 6.0 seconds
    const tLatest = samples[samples.length - 1].t;
    const tWindow = 6.0;
    const tStart = Math.max(0, tLatest - tWindow);

    // Compute dynamic min/max bounds for auto-ranging
    let maxAbs1 = 0.5;
    let maxAbs2 = 0.5;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].t >= tStart) {
        maxAbs1 = Math.max(maxAbs1, Math.abs(samples[i].val1));
        maxAbs2 = Math.max(maxAbs2, Math.abs(samples[i].val2));
      }
    }
    maxAbs1 = Math.max(0.2, maxAbs1 * 1.25);
    maxAbs2 = Math.max(0.2, maxAbs2 * 1.25);

    const toScreenX = (t: number) => {
      const frac = (t - tStart) / tWindow;
      return frac * (width - 16) + 8;
    };
    const toScreenY1 = (v: number) => cy - (v / maxAbs1) * (cy - 14);
    const toScreenY2 = (v: number) => cy - (v / maxAbs2) * (cy - 14);

    // Channel 2 Trace (Velocity / Omega)
    ctx.beginPath();
    let started2 = false;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].t < tStart) continue;
      const sx = toScreenX(samples[i].t);
      const sy = toScreenY2(samples[i].val2);
      if (!started2) {
        ctx.moveTo(sx, sy);
        started2 = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.strokeStyle = color2;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.75;
    ctx.stroke();

    // Channel 1 Trace (Position / Theta)
    ctx.beginPath();
    let started1 = false;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].t < tStart) continue;
      const sx = toScreenX(samples[i].t);
      const sy = toScreenY1(samples[i].val1);
      if (!started1) {
        ctx.moveTo(sx, sy);
        started1 = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.strokeStyle = color1;
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = 1.0;
    ctx.stroke();

    // Live Beam Head Indicators (Pulsing circles at tLatest)
    const lastSample = samples[samples.length - 1];
    const headX = toScreenX(lastSample.t);
    const headY1 = toScreenY1(lastSample.val1);
    const headY2 = toScreenY2(lastSample.val2);

    ctx.fillStyle = color1;
    ctx.beginPath();
    ctx.arc(headX, headY1, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(headX, headY2, 3.0, 0, Math.PI * 2);
    ctx.fill();

    // Top-left legend and telemetry badges
    ctx.font = "10px monospace";
    ctx.textAlign = "left";

    // Channel 1 Legend
    ctx.fillStyle = color1;
    ctx.fillText(`${label1}: ${lastSample.val1.toFixed(2)} ${unit1}`, 8, 14);

    // Channel 2 Legend
    ctx.fillStyle = color2;
    ctx.fillText(`${label2}: ${lastSample.val2.toFixed(2)} ${unit2}`, 8, 27);

    // Time window readout bottom right
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.textAlign = "right";
    ctx.fillText(`Pencere: ${tWindow}s | t = ${tLatest.toFixed(1)}s`, width - 8, height - 6);

    ctx.restore();
  }, [samples, label1, label2, unit1, unit2, color1, color2]);

  return (
    <div className="relative w-full h-[175px] rounded-lg border border-white/[0.08] overflow-hidden bg-[#090c10] shadow-inner">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
