"use client";

import React, { useEffect, useRef } from "react";
import { PhasePoint } from "@/engine/physicsModules";

interface PhaseSpacePlotProps {
  points: PhasePoint[];
  ghostPoints?: PhasePoint[];
  xLabel: string;
  yLabel: string;
  accentColor?: string;
  ghostColor?: string;
}

export const PhaseSpacePlot: React.FC<PhaseSpacePlotProps> = ({
  points,
  ghostPoints,
  xLabel,
  yLabel,
  accentColor = "#38bdf8",
  ghostColor = "#f43f5e",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 165;
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = "#0b0b0a";
    ctx.fillRect(0, 0, width, height);

    // Subtle millimeter grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;
    const stepX = width / 8;
    const stepY = height / 6;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(i * stepX, 0);
      ctx.lineTo(i * stepX, height);
      ctx.stroke();
    }
    for (let j = 1; j < 6; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * stepY);
      ctx.lineTo(width, j * stepY);
      ctx.stroke();
    }

    // Center crosshair axes
    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Auto-scale bounds with smooth minimum range
    let maxQ = 1.0;
    let maxP = 1.0;
    for (let i = 0; i < points.length; i++) {
      const aq = Math.abs(points[i].q);
      const ap = Math.abs(points[i].p);
      if (aq > maxQ) maxQ = aq;
      if (ap > maxP) maxP = ap;
    }
    if (ghostPoints) {
      for (let i = 0; i < ghostPoints.length; i++) {
        const aq = Math.abs(ghostPoints[i].q);
        const ap = Math.abs(ghostPoints[i].p);
        if (aq > maxQ) maxQ = aq;
        if (ap > maxP) maxP = ap;
      }
    }
    maxQ *= 1.2;
    maxP *= 1.2;

    const toScreenX = (q: number) => cx + (q / maxQ) * (width * 0.44);
    const toScreenY = (p: number) => cy - (p / maxP) * (height * 0.42);

    // Draw ghost phase trajectory if provided
    if (ghostPoints && ghostPoints.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < ghostPoints.length; i++) {
        const sx = toScreenX(ghostPoints[i].q);
        const sy = toScreenY(ghostPoints[i].p);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.strokeStyle = ghostColor;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1.0;

      const lastG = ghostPoints[ghostPoints.length - 1];
      ctx.fillStyle = ghostColor;
      ctx.beginPath();
      ctx.arc(toScreenX(lastG.q), toScreenY(lastG.p), 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw primary phase trajectory with gradient opacity
    if (points.length > 1) {
      for (let i = 1; i < points.length; i++) {
        const alpha = 0.15 + 0.85 * (i / points.length);
        ctx.beginPath();
        ctx.moveTo(toScreenX(points[i - 1].q), toScreenY(points[i - 1].p));
        ctx.lineTo(toScreenX(points[i].q), toScreenY(points[i].p));
        ctx.strokeStyle = accentColor;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.75;
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // Draw current state head point
    if (points.length > 0) {
      const last = points[points.length - 1];
      const lx = toScreenX(last.q);
      const ly = toScreenY(last.p);

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(lx, ly, 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(xLabel, width - 6, cy - 5);
    ctx.textAlign = "left";
    ctx.fillText(yLabel, cx + 6, 12);

    // Current numeric readout in bottom-left
    if (points.length > 0) {
      const last = points[points.length - 1];
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.font = "10px monospace";
      ctx.fillText(
        `(${last.q.toFixed(2)}, ${last.p.toFixed(2)})`,
        6,
        height - 6
      );
    }

    ctx.restore();
  }, [points, ghostPoints, xLabel, yLabel, accentColor, ghostColor]);

  return (
    <div className="relative w-full h-[160px] rounded border border-white/[0.08] overflow-hidden bg-[#0b0b0a]">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
