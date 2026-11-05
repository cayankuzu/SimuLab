"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  ModuleId,
  OscillatorParams,
  OscillatorState,
  PendulumParams,
  PendulumState,
  getNPendulumKinematics,
  computePendulumAngularDifferenceDeg,
  PENDULUM_BOB_COLORS,
} from "@/engine/physicsModules";
import { Language, translations } from "@/i18n/translations";
import { Hand, Eye, Sparkles } from "lucide-react";

export interface ViewOverlays {
  velocityVec: boolean;
  forceVec: boolean;
  trail: boolean;
  grid: boolean;
}

interface PhysicsViewportProps {
  moduleId: ModuleId;
  lang: Language;
  overlays: ViewOverlays;
  onToggleOverlay: (key: keyof ViewOverlays) => void;
  isRunning: boolean;
  fps: number;
  oscParams: OscillatorParams;
  oscState: OscillatorState;
  onOscDrag: (x0: number) => void;
  pendParams: PendulumParams;
  pendState: PendulumState;
  onPendDragBob: (bobIndex: number, newTheta: number) => void;
  onChangePendCount: (newCount: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function drawPrecisionArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  label?: string
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 4) return;

  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(10, Math.max(6, len * 0.22));

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.0;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headLen * Math.cos(angle - Math.PI / 6),
    y2 - headLen * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    x2 - headLen * Math.cos(angle + Math.PI / 6),
    y2 - headLen * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();

  if (label && len > 14) {
    ctx.font = "600 10px monospace";
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.fillText(label, x2 + Math.cos(angle) * 10, y2 + Math.sin(angle) * 10 + 3);
  }
  ctx.restore();
}

export const PhysicsViewport: React.FC<PhysicsViewportProps> = ({
  moduleId,
  lang,
  overlays,
  onToggleOverlay,
  oscParams,
  oscState,
  onOscDrag,
  pendParams,
  pendState,
  onPendDragBob,
  onChangePendCount,
  onDragStart,
  onDragEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<string | null>(null);
  const t = translations[lang];

  const getCanvasMetrics = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { width: 800, height: 600 };
    return {
      width: canvas.clientWidth || 800,
      height: canvas.clientHeight || 600,
    };
  }, []);

  const getPendulumScaleAndPivot = useCallback(
    (width: number, height: number) => {
      const n = Math.max(
        1,
        Math.min(6, Math.floor(Number(pendParams.count) || 2))
      );
      let totalLen = 0;
      for (let i = 0; i < n; i++) {
        totalLen += pendParams.lengths[i] ?? 1.0;
      }

      const pivotX = width * 0.5;
      const pivotY =
        n === 1
          ? height * 0.38
          : n === 2
          ? height * 0.33
          : Math.max(110, Math.min(190, height * 0.28));

      const maxAllowedDrop = height - pivotY - 60;
      const maxAllowedWidth = width * 0.44;
      const maxAllowedRadius = Math.min(maxAllowedDrop, maxAllowedWidth);

      const maxScaleCap = n === 1 ? 190 : n === 2 ? 148 : 115;
      const minLenDivisor = n === 1 ? 0.4 : n === 2 ? 0.6 : 0.75;
      const scale = Math.min(
        maxScaleCap,
        Math.max(22, maxAllowedRadius / Math.max(minLenDivisor, totalLen))
      );
      return { scale, pivotX, pivotY, n, totalLen };
    },
    [pendParams.count, pendParams.lengths]
  );

  // ==========================================
  // POINTER INTERACTIONS
  // ==========================================
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { width, height } = getCanvasMetrics();
    const cx = width * 0.5;
    const cy = height * 0.46;

    if (moduleId === "oscillator") {
      const scale = 110;
      const blockX = cx + oscState.x * scale;
      const blockY = cy;
      if (Math.abs(mx - blockX) < 55 && Math.abs(my - blockY) < 45) {
        onDragStart?.();
        canvas.setPointerCapture(e.pointerId);
        setDragTarget("osc-mass");
      }
    } else if (moduleId === "pendulum") {
      const { scale, pivotX, pivotY, n } = getPendulumScaleAndPivot(
        width,
        height
      );
      const { positions } = getNPendulumKinematics(
        pendState.thetas,
        pendState.omegas,
        pendParams.lengths,
        n
      );

      for (let i = n - 1; i >= 0; i--) {
        const bx = pivotX + positions[i].x * scale;
        const by = pivotY + positions[i].y * scale;
        if (Math.hypot(mx - bx, my - by) < 30) {
          onDragStart?.();
          canvas.setPointerCapture(e.pointerId);
          setDragTarget(`pend-bob:${i}`);
          return;
        }
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { width, height } = getCanvasMetrics();
    const cx = width * 0.5;
    const cy = height * 0.46;

    if (!dragTarget) {
      if (moduleId === "oscillator") {
        const scale = 110;
        const blockX = cx + oscState.x * scale;
        const blockY = cy;
        setHoverTarget(
          Math.abs(mx - blockX) < 55 && Math.abs(my - blockY) < 45
            ? "osc-mass"
            : null
        );
      } else if (moduleId === "pendulum") {
        const { scale, pivotX, pivotY, n } = getPendulumScaleAndPivot(
          width,
          height
        );
        const { positions } = getNPendulumKinematics(
          pendState.thetas,
          pendState.omegas,
          pendParams.lengths,
          n
        );
        const hitIdx = positions.findIndex(
          (pos) =>
            Math.hypot(mx - (pivotX + pos.x * scale), my - (pivotY + pos.y * scale)) <
            28
        );
        setHoverTarget(hitIdx >= 0 ? `pend-bob:${hitIdx}` : null);
      }
      return;
    }

    if (dragTarget === "osc-mass") {
      const scale = 110;
      const newX = Math.max(-2.5, Math.min(2.5, (mx - cx) / scale));
      onOscDrag(newX);
    } else if (dragTarget.startsWith("pend-bob:")) {
      const bobIdx = parseInt(dragTarget.replace("pend-bob:", ""), 10);
      const { scale, pivotX, pivotY, n } = getPendulumScaleAndPivot(
        width,
        height
      );
      const { positions } = getNPendulumKinematics(
        pendState.thetas,
        pendState.omegas,
        pendParams.lengths,
        n
      );

      const anchorX =
        bobIdx === 0 ? pivotX : pivotX + positions[bobIdx - 1].x * scale;
      const anchorY =
        bobIdx === 0 ? pivotY : pivotY + positions[bobIdx - 1].y * scale;

      const dx = mx - anchorX;
      const dy = my - anchorY;
      const newTheta = Math.atan2(dx, dy);
      onPendDragBob(bobIdx, newTheta);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    if (dragTarget) {
      onDragEnd?.();
    }
    setDragTarget(null);
  };

  // ==========================================
  // MAIN 3D VOLUMETRIC CANVAS RENDER
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 600;
    if (
      canvas.width !== Math.floor(width * dpr) ||
      canvas.height !== Math.floor(height * dpr)
    ) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // 1. Deep Matte Obsidian Canvas (#0a0b0d)
    ctx.fillStyle = "#0a0b0d";
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.46;

    // 2. Blueprint Architectural Grid
    if (overlays.grid) {
      const minor = 26;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.02)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = cx % minor; x < width; x += minor) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = cy % minor; y < height; y += minor) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Precision Center Cross Ticks
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy);
      ctx.lineTo(cx + 30, cy);
      ctx.moveTo(cx, cy - 30);
      ctx.lineTo(cx, cy + 30);
      ctx.stroke();
    }

    // ==========================================
    // RENDER MODULE 1: 3D VOLUMETRIC OSCILLATOR
    // ==========================================
    if (moduleId === "oscillator") {
      const scale = 110;
      const wallX = Math.max(50, cx - 290);
      const trackY = cy;
      const eqX = cx;
      const massX = eqX + oscState.x * scale;
      const blockW = 76;
      const blockH = 54;

      // Equilibrium guide line
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(eqX, trackY - 50);
      ctx.lineTo(eqX, trackY + 80);
      ctx.stroke();

      ctx.fillStyle = "rgba(56, 189, 248, 0.5)";
      ctx.font = "600 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("x = 0 (Denge)", eqX, trackY - 58);
      ctx.restore();

      // Matte Runner Rail with subtle metallic reflection
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(wallX - 5, trackY + blockH / 2 + 1);
      ctx.lineTo(width - 50, trackY + blockH / 2 + 1);
      ctx.stroke();

      // Fixed Wall Anchor Block
      ctx.fillStyle = "#1e2126";
      ctx.strokeStyle = "#333842";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(wallX - 16, trackY - 45, 16, blockH + 45, 4);
      ctx.fill();
      ctx.stroke();

      // Realistic 3D Volumetric Helical Coil Spring
      const springStartX = wallX;
      const springEndX = massX - blockW / 2;
      const springY = trackY;
      const springLen = Math.max(35, springEndX - springStartX);
      const coils = 13;
      const coilRadius = 16;
      const step = springLen / coils;

      // 1. Back coils (in shadow)
      ctx.save();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 3.0;
      ctx.beginPath();
      for (let i = 0; i < coils; i++) {
        const x0 = springStartX + i * step + step * 0.25;
        const x1 = springStartX + (i + 1) * step;
        ctx.moveTo(x0, springY - coilRadius);
        ctx.bezierCurveTo(
          x0 - step * 0.2, springY - coilRadius * 0.35,
          x1 - step * 0.35, springY + coilRadius * 0.35,
          x1, springY + coilRadius
        );
      }
      ctx.stroke();

      // 2. Front coils (illuminated with specular highlight)
      for (let i = 0; i < coils; i++) {
        const x0 = springStartX + i * step;
        const x1 = springStartX + i * step + step * 0.5;
        const coilGrad = ctx.createLinearGradient(
          x0, springY - coilRadius,
          x1, springY + coilRadius
        );
        coilGrad.addColorStop(0, "#cbd5e1");
        coilGrad.addColorStop(0.25, "#ffffff"); // specular shine
        coilGrad.addColorStop(0.7, "#64748b");
        coilGrad.addColorStop(1, "#334155");

        ctx.strokeStyle = coilGrad;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(x0, springY + coilRadius);
        ctx.bezierCurveTo(
          x0 + step * 0.25, springY + coilRadius * 0.35,
          x1 - step * 0.2, springY - coilRadius * 0.35,
          x1, springY - coilRadius
        );
        ctx.stroke();
      }
      ctx.restore();

      // Engineered Mass Block (Tactile Chamfered Metallic Prism)
      const isHovered = hoverTarget === "osc-mass" || dragTarget === "osc-mass";
      ctx.save();

      // Floor Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
      ctx.beginPath();
      ctx.roundRect(massX - blockW / 2 - 2, trackY + blockH / 2 - 3, blockW + 4, 8, 4);
      ctx.fill();

      // Block Body Gradient
      const blockGrad = ctx.createLinearGradient(
        massX - blockW / 2, trackY - blockH / 2,
        massX + blockW / 2, trackY + blockH / 2
      );
      blockGrad.addColorStop(0, isHovered ? "#2563eb" : "#1e2229");
      blockGrad.addColorStop(0.5, isHovered ? "#3b82f6" : "#2a2f3a");
      blockGrad.addColorStop(1, isHovered ? "#1d4ed8" : "#12151a");

      ctx.fillStyle = blockGrad;
      ctx.strokeStyle = isHovered ? "#93c5fd" : "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = isHovered ? 2.2 : 1.5;
      ctx.beginPath();
      ctx.roundRect(massX - blockW / 2, trackY - blockH / 2, blockW, blockH, 8);
      ctx.fill();
      ctx.stroke();

      // Top Bevel Highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(massX - blockW / 2 + 6, trackY - blockH / 2 + 1);
      ctx.lineTo(massX + blockW / 2 - 6, trackY - blockH / 2 + 1);
      ctx.stroke();

      // Engraved Mass Value
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${oscParams.mass.toFixed(1)} kg`, massX, trackY + 4);

      // Spring Connection Joint
      ctx.fillStyle = "#94a3b8";
      ctx.beginPath();
      ctx.arc(massX - blockW / 2, trackY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Velocity & Force Vectors
      if (overlays.velocityVec && Math.abs(oscState.v) > 0.05) {
        drawPrecisionArrow(
          ctx,
          massX,
          trackY - blockH / 2 - 22,
          massX + oscState.v * 16,
          trackY - blockH / 2 - 22,
          "#10b981",
          `v: ${oscState.v.toFixed(1)}`
        );
      }
      if (overlays.forceVec && Math.abs(oscState.fNet) > 0.2) {
        drawPrecisionArrow(
          ctx,
          massX,
          trackY + blockH / 2 + 22,
          massX + oscState.fNet * 3.2,
          trackY + blockH / 2 + 22,
          "#f59e0b",
          `F: ${oscState.fNet.toFixed(1)}N`
        );
      }
    }

    // ====================================================
    // RENDER MODULE 2: 3D VOLUMETRIC LINKED PENDULUM CHAIN
    // ====================================================
    else if (moduleId === "pendulum") {
      const { scale, pivotX, pivotY, n } = getPendulumScaleAndPivot(
        width,
        height
      );

      const mainKin = getNPendulumKinematics(
        pendState.thetas,
        pendState.omegas,
        pendParams.lengths,
        n
      );
      const ghostKin = getNPendulumKinematics(
        pendState.ghostThetas,
        pendState.ghostOmegas,
        pendParams.lengths,
        n
      );

      // 1. Neon Phosphor Laser Trail for Tip Bob
      if (overlays.trail && pendState.tipTrail.length > 1) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Ghost Twin Tip Trail
        if (n >= 2 && pendParams.ghostEnabled && pendState.ghostTipTrail.length > 1) {
          ctx.beginPath();
          for (let i = 0; i < pendState.ghostTipTrail.length; i++) {
            const pt = pendState.ghostTipTrail[i];
            const gx = pivotX + pt.x * scale;
            const gy = pivotY + pt.y * scale;
            if (i === 0) ctx.moveTo(gx, gy);
            else ctx.lineTo(gx, gy);
          }
          ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
          ctx.lineWidth = 1.8;
          ctx.stroke();
        }

        // Main Tip Bob Laser Trail
        for (let i = 1; i < pendState.tipTrail.length; i++) {
          const pt0 = pendState.tipTrail[i - 1];
          const pt1 = pendState.tipTrail[i];
          const alpha = i / pendState.tipTrail.length;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha * 0.8})`;
          ctx.lineWidth = 1.6 + alpha * 1.4;
          ctx.beginPath();
          ctx.moveTo(pivotX + pt0.x * scale, pivotY + pt0.y * scale);
          ctx.lineTo(pivotX + pt1.x * scale, pivotY + pt1.y * scale);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Holographic Twin Ghost Pendulum
      if (n >= 2 && pendParams.ghostEnabled) {
        ctx.save();
        ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
        ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pivotX, pivotY);
        for (let i = 0; i < n; i++) {
          ctx.lineTo(
            pivotX + ghostKin.positions[i].x * scale,
            pivotY + ghostKin.positions[i].y * scale
          );
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Translucent ghost spheres
        for (let i = 0; i < n; i++) {
          const gx = pivotX + ghostKin.positions[i].x * scale;
          const gy = pivotY + ghostKin.positions[i].y * scale;
          const m = pendParams.masses[i] ?? 1.5;
          const r = Math.max(8, (n > 3 ? 8 : 10) + m * 1.4);
          ctx.fillStyle = "rgba(244, 63, 94, 0.25)";
          ctx.strokeStyle = "rgba(244, 63, 94, 0.55)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Precision Metallic Rods
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const startX =
          i === 0 ? pivotX : pivotX + mainKin.positions[i - 1].x * scale;
        const startY =
          i === 0 ? pivotY : pivotY + mainKin.positions[i - 1].y * scale;
        const endX = pivotX + mainKin.positions[i].x * scale;
        const endY = pivotY + mainKin.positions[i].y * scale;

        // Outer brushed steel rod
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = n > 3 ? 2.8 : 3.4;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Inner specular reflection line
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Fixed Pivot Mount
      ctx.save();
      const pivotGrad = ctx.createRadialGradient(
        pivotX - 2, pivotY - 2, 1,
        pivotX, pivotY, 8
      );
      pivotGrad.addColorStop(0, "#f8fafc");
      pivotGrad.addColorStop(0.5, "#94a3b8");
      pivotGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = pivotGrad;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();

      // 5. 3D Volumetric Spheres for All N Bobs
      for (let i = 0; i < n; i++) {
        const bx = pivotX + mainKin.positions[i].x * scale;
        const by = pivotY + mainKin.positions[i].y * scale;
        const m = pendParams.masses[i] ?? 1.5;
        const r = Math.max(10, (n > 3 ? 9 : 12) + m * 1.8);
        const palette = PENDULUM_BOB_COLORS[i % PENDULUM_BOB_COLORS.length];
        const isHovered =
          hoverTarget === `pend-bob:${i}` || dragTarget === `pend-bob:${i}`;

        ctx.save();
        // Drop Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.beginPath();
        ctx.ellipse(bx + 2, by + r + 4, r * 0.75, r * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3D Sphere Radial Gradient with Specular Light Spot
        const sphereGrad = ctx.createRadialGradient(
          bx - r * 0.35, by - r * 0.35, r * 0.06,
          bx, by, r
        );
        sphereGrad.addColorStop(0, "#ffffff"); // Specular highlight
        sphereGrad.addColorStop(0.25, isHovered ? "#ffffff" : palette.light);
        sphereGrad.addColorStop(0.70, palette.fill);
        sphereGrad.addColorStop(1.0, palette.dark); // Ambient occlusion rim

        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(bx, by, r, 0, Math.PI * 2);
        ctx.fill();

        // Rim Light Ring
        ctx.strokeStyle = isHovered ? "#ffffff" : palette.stroke;
        ctx.lineWidth = isHovered ? 2.5 : 1.2;
        ctx.stroke();

        // Mass Number
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 10px monospace";
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 3;
        ctx.fillText(`m${i + 1}`, bx, by + 3.5);
        ctx.shadowBlur = 0;

        // Small metallic center joint pin
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
        ctx.beginPath();
        ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Velocity Vectors
        if (overlays.velocityVec) {
          const vx = mainKin.velocities[i].x;
          const vy = mainKin.velocities[i].y;
          drawPrecisionArrow(
            ctx,
            bx,
            by,
            bx + vx * 7,
            by + vy * 7,
            "#10b981",
            i === n - 1 ? `v${i + 1}` : undefined
          );
        }

        // Tangential Force on Tip
        if (overlays.forceVec && i === n - 1) {
          const alphaTip = pendState.alphas[i] ?? 0;
          const LTip = pendParams.lengths[i] ?? 1.0;
          const thTip = pendState.thetas[i] ?? 0;
          const aTangX = LTip * alphaTip * Math.cos(thTip);
          const aTangY = -LTip * alphaTip * Math.sin(thTip);
          drawPrecisionArrow(
            ctx,
            bx,
            by,
            bx + aTangX * 2.0,
            by + aTangY * 2.0,
            "#f59e0b",
            "F_net"
          );
        }
      }
    }

    ctx.restore();
  }, [
    moduleId,
    lang,
    overlays,
    oscParams,
    oscState,
    pendParams,
    pendState,
    hoverTarget,
    dragTarget,
    getPendulumScaleAndPivot,
  ]);

  const angleDiffDeg = computePendulumAngularDifferenceDeg(
    pendState,
    pendParams.count
  );

  // Punchy, concise 1-sentence dynamic physical insight
  const getConciseInsight = (): string => {
    if (moduleId === "oscillator") {
      if (dragTarget === "osc-mass") {
        return lang === "tr"
          ? `Kutuyu ${oscState.x.toFixed(2)} m çektiniz (Depolanan Enerji: ${(0.5 * oscParams.stiffness * oscState.x * oscState.x).toFixed(1)} J). Bıraktığınız anda yay merkeze fırlatacak.`
          : `Mass pulled ${oscState.x.toFixed(2)} m from center. Release to launch.`;
      }
      if (
        oscParams.driveAmp > 0.1 &&
        Math.abs(
          oscParams.driveFreq - Math.sqrt(oscParams.stiffness / oscParams.mass)
        ) < 0.2
      ) {
        return lang === "tr"
          ? "💥 REZONANS: Dış motor yayın doğal ritmiyle kilitlendi; salınım hızla devleşiyor!"
          : "💥 RESONANCE: Driving frequency matches spring's natural frequency!";
      }
      if (oscParams.damping === 0) {
        return lang === "tr"
          ? `Sürtünmesiz Sonsuz Salınım: Toplam enerji korunuyor (Doğal Periyot T = ${(2 * Math.PI * Math.sqrt(oscParams.mass / oscParams.stiffness)).toFixed(2)} s).`
          : `Frictionless Perpetual Motion: Period T = ${(2 * Math.PI * Math.sqrt(oscParams.mass / oscParams.stiffness)).toFixed(2)} s.`;
      }
      if (Math.abs(oscState.x) < 0.05 && Math.abs(oscState.v) < 0.05) {
        return lang === "tr"
          ? "Amortisör tüm mekanik enerjiyi ısıya dönüştürdü ve kütle denge noktasında durdu."
          : "Friction converted all energy into heat; mass rested at center.";
      }
      return lang === "tr"
        ? `Harmonik salınım devam ediyor (k = ${oscParams.stiffness} N/m, m = ${oscParams.mass} kg, Hız = ${oscState.v.toFixed(1)} m/s).`
        : `Harmonic oscillation in motion (v = ${oscState.v.toFixed(1)} m/s).`;
    }

    // Pendulum Insights
    const n = Math.max(1, Math.min(6, pendParams.count));
    if (dragTarget?.startsWith("pend-bob:")) {
      const idx = parseInt(dragTarget.replace("pend-bob:", ""), 10) + 1;
      return lang === "tr"
        ? `${idx}. Kütleyi (m${idx}) konumlandırıyorsunuz. Bıraktığınız andan itibaren yeni açıyla devam eder.`
        : `Positioning mass m${idx}. Release to release chain.`;
    }
    if (pendParams.g <= 0.05) {
      return lang === "tr"
        ? "🚀 Sıfır-G (Uzay): Yerçekimi torku sıfır; sarkaçlar sadece açısal momentumla serbestçe döner."
        : "🚀 Zero-G: No restoring gravity torque; bobs rotate freely by inertia.";
    }
    if (Math.abs(pendParams.g - 1.62) < 0.1) {
      return lang === "tr"
        ? "🌙 Ay Ortamı: Yerçekimi 1/6 oranında; sarkaçlar 2.46 kat daha yavaş, ağır çekimde salınır."
        : "🌙 Moon gravity (~1/6th): oscillations swing in 2.46x slow motion.";
    }
    if (n === 1) {
      const L1 = pendParams.lengths[0] ?? 1.0;
      const T0 = 2 * Math.PI * Math.sqrt(L1 / pendParams.g);
      return lang === "tr"
        ? `🕰️ Tek Sarkaç (Galileo): T = ${T0.toFixed(2)} s. Kütle değişse bile periyot sabit kalır!`
        : `🕰️ Single Pendulum (Galileo): Period T = ${T0.toFixed(2)} s is mass-independent!`;
    }
    if (n === 2) {
      if (angleDiffDeg > 8.0) {
        return lang === "tr"
          ? `🦋 Kelebek Etkisi: 0.05° farkla başlayan Pembe İkiz tamamen koptu (Fark: ${angleDiffDeg.toFixed(0)}°)!`
          : `🦋 Butterfly Effect: Started 0.05° apart, twin diverged by ${angleDiffDeg.toFixed(0)}°!`;
      }
      return lang === "tr"
        ? `Çift Sarkaç: İkizler henüz eş evreli salınıyor (Açısal fark: ${angleDiffDeg.toFixed(2)}°).`
        : `Double Pendulum: Bobs still swinging coherently (diff: ${angleDiffDeg.toFixed(2)}°).`;
    }
    if (n === 4) {
      return lang === "tr"
        ? "⚡ Dörtlü Sarkaç: Üstteki 3 kütle yavaşladığında momentumu kamçı gibi en uçtaki 4. Mor topa fırlatır!"
        : "⚡ Quadruple Pendulum: Energy cascades down to whip the 4th tip mass!";
    }
    if (n === 6) {
      return lang === "tr"
        ? "⛓️ Altılı Zincir: 6 eklemli yapı esnek bir ip gibi dalgalanır; RK4 6×6 matrisi canlı çözer."
        : "⛓️ 6-Mass Chain: Approximates a continuous flexible cable!";
    }
    return lang === "tr"
      ? `${n} Kütleli Sarkaç Zinciri: Serbestlik dereceli doğrusal olmayan Euler-Lagrange dinamikleri.`
      : `${n}-Mass Chain in Lagrangian motion.`;
  };

  const insight = getConciseInsight();

  return (
    <div className="relative flex-1 h-full bg-[#0a0b0d] overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`w-full h-full block ${
          dragTarget
            ? "cursor-grabbing"
            : hoverTarget
            ? "cursor-grab"
            : "cursor-default"
        }`}
      />

      {/* TOP FLOATING MINIMALIST INSIGHT RIBBON (Sleek Glass Bar) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10 w-[92%] max-w-2xl">
        <div className="bg-[#121418]/85 border border-white/[0.09] backdrop-blur-md rounded-full px-4 py-2 shadow-2xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="text-zinc-200 font-medium truncate">{insight}</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono shrink-0 hidden sm:inline-flex items-center gap-1">
            <Hand className="w-3 h-3 text-sky-400" />
            {lang === "tr" ? "Cismleri Tutup Çekin" : "Grab & Drag"}
          </span>
        </div>
      </div>

      {/* BOTTOM FLOATING MINIMALIST HARDWARE TOOLBAR */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#121418]/90 border border-white/[0.09] backdrop-blur-md rounded-xl px-3 py-1.5 shadow-2xl flex flex-wrap items-center gap-2 z-10 whitespace-nowrap">
        {/* Quick Chain Count Selector (for Module 2) */}
        {moduleId === "pendulum" && (
          <div className="flex items-center gap-1 pr-2 border-r border-white/[0.08]">
            <span className="text-[11px] font-mono text-zinc-400 mr-1">
              {lang === "tr" ? "Kütle:" : "Bobs:"}
            </span>
            {[1, 2, 3, 4, 5, 6].map((nVal) => (
              <button
                key={nVal}
                onClick={() => onChangePendCount(nVal)}
                className={`w-6 h-6 rounded-md text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center ${
                  pendParams.count === nVal
                    ? "bg-amber-400 text-zinc-950 shadow"
                    : "bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
                }`}
              >
                {nVal}
              </button>
            ))}
          </div>
        )}

        {/* View Overlays */}
        <div className="flex items-center gap-1.5">
          {(
            [
              { key: "velocityVec", label: "v (Hız)", dot: "bg-emerald-400" },
              { key: "forceVec", label: "F (Kuvvet)", dot: "bg-amber-400" },
              { key: "trail", label: "İz", dot: "bg-sky-400" },
              { key: "grid", label: "Izgara", dot: "bg-zinc-400" },
            ] as const
          ).map((item) => {
            const active = overlays[item.key];
            return (
              <button
                key={item.key}
                onClick={() => onToggleOverlay(item.key)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? "bg-zinc-800 text-zinc-100 border border-white/[0.12]"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${item.dot} ${
                    active ? "opacity-100" : "opacity-30"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
