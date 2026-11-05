"use client";

import React, { useEffect, useRef } from "react";

interface ResonanceCurveProps {
  mass: number;
  stiffness: number;
  damping: number;
  driveAmp: number;
  driveFreq: number;
}

export const ResonanceCurve: React.FC<ResonanceCurveProps> = ({
  mass,
  stiffness,
  damping,
  driveAmp,
  driveFreq,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const omega0 = Math.sqrt(stiffness / Math.max(0.1, mass));
  const gamma = damping / Math.max(0.1, mass); // 2*zeta*omega0
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  const f0 = driveAmp > 0 ? driveAmp : 10.0; // Reference force amplitude

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 320;
    const height = canvas.clientHeight || 140;
    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }
    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark sleek background
    ctx.fillStyle = "#0c0f14";
    ctx.fillRect(0, 0, width, height);

    // Padding
    const padL = 36;
    const padR = 16;
    const padT = 16;
    const padB = 24;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;

    // Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const gx = padL + (i * plotW) / 5;
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();
    }
    for (let j = 1; j < 4; j++) {
      const gy = padT + (j * plotH) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(padL + plotW, gy);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    // Frequency range: 0 to 2.2 * omega0
    const maxOmega = Math.max(6.0, omega0 * 2.2);

    // Compute amplitude curve
    const calcAmp = (w: number) => {
      const denomSq = Math.pow(omega0 * omega0 - w * w, 2) + Math.pow(gamma * w, 2);
      const denom = Math.sqrt(Math.max(1e-4, denomSq));
      return (f0 / Math.max(0.1, mass)) / denom;
    };

    // Find peak amplitude for vertical scaling
    let peakAmp = calcAmp(omega0);
    peakAmp = Math.max(1.0, Math.min(25.0, peakAmp * 1.15));

    const toScreenX = (w: number) => padL + (w / maxOmega) * plotW;
    const toScreenY = (a: number) => padT + plotH - (Math.min(peakAmp, a) / peakAmp) * plotH;

    // Draw theoretical curve
    ctx.beginPath();
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const w = (s / steps) * maxOmega;
      const a = calcAmp(w);
      const sx = toScreenX(w);
      const sy = toScreenY(a);
      if (s === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.0;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(toScreenX(maxOmega), padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(245, 158, 11, 0.25)");
    grad.addColorStop(1, "rgba(245, 158, 11, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Resonance peak vertical dashed marker (omega0)
    const peakX = toScreenX(omega0);
    ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(peakX, padT);
    ctx.lineTo(peakX, padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Live motor frequency marker point
    const curW = driveFreq;
    const curA = calcAmp(curW);
    const curX = toScreenX(curW);
    const curY = toScreenY(curA);

    // Beacon circle
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Labels
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("ω₀", peakX, padT + plotH + 14);
    ctx.fillText("ω (rad/s)", padL + plotW / 2, height - 3);

    ctx.textAlign = "right";
    ctx.fillText("A", padL - 6, padT + 10);
    ctx.fillText("0", padL - 6, padT + plotH);

    // Top status text
    ctx.textAlign = "left";
    const isNearResonance = Math.abs(curW - omega0) / omega0 < 0.12;
    ctx.fillStyle = isNearResonance ? "#ef4444" : "#94a3b8";
    ctx.font = "10px monospace";
    ctx.fillText(
      `Doğal ω₀ = ${omega0.toFixed(2)} | Motor ω = ${curW.toFixed(2)}${isNearResonance ? " [💥 REZONANS!]" : ""}`,
      padL + 4,
      padT + 10
    );

    ctx.restore();
  }, [mass, stiffness, damping, driveAmp, driveFreq, omega0, gamma]);

  return (
    <div className="relative w-full h-[140px] rounded-lg border border-white/[0.08] overflow-hidden bg-[#0c0f14]">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
