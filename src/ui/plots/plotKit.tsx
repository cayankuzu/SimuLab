"use client";

/**
 * Plot toolkit: a thin, allocation-light layer over the 2-D canvas for
 * instrument-style charts. Every plot has numbered axes with units, nice
 * (1-2-5) tick spacing and stable auto-ranging; plots draw imperatively from
 * the telemetry buffers once per animation frame, outside React rendering.
 *
 * Design follows the usual guidance for quantitative graphics [tufte2001,
 * cleveland1984]: position along a common scale as the primary encoding,
 * unobtrusive grid, direct labelling, no decoration.
 */

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { useSim } from "@/sim/react";
import type { Simulation } from "@/sim/Simulation";
import { niceTicks, tickLabel } from "../format";
import { cn, Swatch } from "../kit/core";
import { SURFACE } from "../palette";

const FONT = '11px "IBM Plex Mono", ui-monospace, Consolas, monospace';
const FONT_TITLE = '11px "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Margins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export const DEFAULT_MARGINS: Margins = { left: 46, right: 12, top: 10, bottom: 30 };

/** Canvas wrapper that keeps the backing store in sync with CSS size and device pixel ratio. */
export class PlotSurface {
  readonly ctx: CanvasRenderingContext2D;
  /** Size in CSS pixels. */
  width = 0;
  height = 0;
  private dpr = 1;

  constructor(readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2-D canvas is not available");
    this.ctx = ctx;
  }

  /** Call at the start of every draw; resets the transform to CSS pixels and clears the plot. */
  begin(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    const pixelWidth = Math.max(1, Math.round(width * dpr));
    const pixelHeight = Math.max(1, Math.round(height * dpr));
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.width = width;
    this.height = height;
    this.dpr = dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.lineJoin = "round";
    this.ctx.lineCap = "round";
  }

  /** Inner plotting rectangle for the given margins. */
  area(margins: Margins = DEFAULT_MARGINS): Rect {
    return {
      x: margins.left,
      y: margins.top,
      w: Math.max(10, this.width - margins.left - margins.right),
      h: Math.max(10, this.height - margins.top - margins.bottom),
    };
  }

  /** Snaps a coordinate to the device-pixel grid so that 1 px lines stay crisp. */
  crisp(value: number): number {
    return (Math.round(value * this.dpr) + 0.5) / this.dpr;
  }
}

/* ------------------------------------------------------------------ */
/* Scales                                                               */
/* ------------------------------------------------------------------ */

export interface Scale {
  min: number;
  max: number;
  /** Maps a data value to a pixel coordinate. */
  (value: number): number;
}

export function linearScale(min: number, max: number, pixelStart: number, pixelEnd: number): Scale {
  const span = max - min || 1;
  const factor = (pixelEnd - pixelStart) / span;
  const scale = ((value: number) => pixelStart + (value - min) * factor) as Scale;
  scale.min = min;
  scale.max = max;
  return scale;
}

/** log10 scale; values <= 0 are clamped to the lower bound. */
export function logScale(min: number, max: number, pixelStart: number, pixelEnd: number): Scale {
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  const factor = (pixelEnd - pixelStart) / (hi - lo || 1);
  const scale = ((value: number) => pixelStart + (Math.log10(Math.max(value, min)) - lo) * factor) as Scale;
  scale.min = min;
  scale.max = max;
  return scale;
}

/**
 * Axis limits that follow the data without jitter: they expand at once when
 * the data leave the range and contract slowly when the data shrink.
 */
export class SmoothRange {
  private lo = Number.NaN;
  private hi = Number.NaN;

  constructor(
    /** Smallest allowed span (prevents division by ~0 and over-magnified noise). */
    private readonly minSpan: number,
    /** Fraction of the span added as head-room on both sides. */
    private readonly padding = 0.08,
    /** Keep the range symmetric about zero. */
    private readonly symmetric = false,
  ) {}

  reset(): void {
    this.lo = Number.NaN;
    this.hi = Number.NaN;
  }

  update(dataMin: number, dataMax: number): [number, number] {
    if (!Number.isFinite(dataMin) || !Number.isFinite(dataMax)) {
      return Number.isNaN(this.lo) ? [-this.minSpan / 2, this.minSpan / 2] : [this.lo, this.hi];
    }
    let lo = dataMin;
    let hi = dataMax;
    if (this.symmetric) {
      const extent = Math.max(Math.abs(lo), Math.abs(hi));
      lo = -extent;
      hi = extent;
    }
    if (hi - lo < this.minSpan) {
      const centre = this.symmetric ? 0 : (hi + lo) / 2;
      lo = centre - this.minSpan / 2;
      hi = centre + this.minSpan / 2;
    }
    const pad = (hi - lo) * this.padding;
    lo -= pad;
    hi += pad;
    if (Number.isNaN(this.lo)) {
      this.lo = lo;
      this.hi = hi;
    } else {
      // Expand immediately, contract by 4 % of the difference per call.
      this.lo = lo < this.lo ? lo : this.lo + (lo - this.lo) * 0.04;
      this.hi = hi > this.hi ? hi : this.hi + (hi - this.hi) * 0.04;
    }
    return [this.lo, this.hi];
  }
}

/* ------------------------------------------------------------------ */
/* Frame: grid, ticks, axis titles                                      */
/* ------------------------------------------------------------------ */

export interface AxisOptions {
  /** Axis title including the unit, e.g. "t [s]". */
  title?: string;
  /** Custom tick positions (otherwise nice 1-2-5 ticks). */
  ticks?: number[];
  /** Custom tick formatter. */
  format?: (value: number) => string;
  /** Approximate number of tick intervals. */
  target?: number;
  /** Colour of tick labels and title (defaults to secondary ink). */
  color?: string;
  /** Draw grid lines for this axis. */
  grid?: boolean;
}

export interface FrameOptions {
  x: AxisOptions;
  y: AxisOptions;
  /** Optional secondary value axis drawn on the right-hand side. */
  yRight?: AxisOptions & { scale: Scale };
  /** Emphasise the y = 0 line. */
  zeroLine?: boolean;
}

/** Ticks at multiples of pi/2 for angle axes, labelled with the pi symbol. */
export function piTicks(min: number, max: number): { ticks: number[]; format: (value: number) => string } {
  const span = max - min;
  const unit = span > 5 * Math.PI ? Math.PI * Math.ceil(span / (5 * Math.PI)) : span > 2.2 * Math.PI ? Math.PI : Math.PI / 2;
  const ticks: number[] = [];
  for (let k = Math.ceil(min / unit - 1e-9); k * unit <= max + 1e-9; k++) ticks.push(k * unit);
  const format = (value: number) => {
    const halves = Math.round(value / (Math.PI / 2));
    if (halves === 0) return "0";
    const sign = halves < 0 ? "−" : "";
    const magnitude = Math.abs(halves);
    if (magnitude % 2 === 0) return `${sign}${magnitude / 2 === 1 ? "" : magnitude / 2}π`;
    return `${sign}${magnitude === 1 ? "" : magnitude}π/2`;
  };
  return { ticks, format };
}

/** Draws background, grid, tick labels and axis titles; returns nothing (scales are owned by the caller). */
export function drawFrame(surface: PlotSurface, area: Rect, xScale: Scale, yScale: Scale, options: FrameOptions): void {
  const { ctx } = surface;
  ctx.fillStyle = SURFACE.plot;
  ctx.fillRect(area.x, area.y, area.w, area.h);

  const xTicks = options.x.ticks ?? niceTicks(xScale.min, xScale.max, options.x.target ?? Math.max(2, Math.floor(area.w / 90)));
  const yTicks = options.y.ticks ?? niceTicks(yScale.min, yScale.max, options.y.target ?? Math.max(2, Math.floor(area.h / 38)));
  const xStep = xTicks.length > 1 ? Math.abs(xTicks[1] - xTicks[0]) : 1;
  const yStep = yTicks.length > 1 ? Math.abs(yTicks[1] - yTicks[0]) : 1;
  const xFormat = options.x.format ?? ((value: number) => tickLabel(value, xStep));
  const yFormat = options.y.format ?? ((value: number) => tickLabel(value, yStep));

  ctx.lineWidth = 1;
  ctx.font = FONT;

  // Grid
  ctx.strokeStyle = SURFACE.grid;
  ctx.beginPath();
  if (options.x.grid !== false) {
    for (const tick of xTicks) {
      const px = surface.crisp(xScale(tick));
      if (px < area.x - 0.5 || px > area.x + area.w + 0.5) continue;
      ctx.moveTo(px, area.y);
      ctx.lineTo(px, area.y + area.h);
    }
  }
  if (options.y.grid !== false) {
    for (const tick of yTicks) {
      const py = surface.crisp(yScale(tick));
      if (py < area.y - 0.5 || py > area.y + area.h + 0.5) continue;
      ctx.moveTo(area.x, py);
      ctx.lineTo(area.x + area.w, py);
    }
  }
  ctx.stroke();

  if (options.zeroLine && yScale.min < 0 && yScale.max > 0) {
    ctx.strokeStyle = SURFACE.gridStrong;
    ctx.beginPath();
    const py = surface.crisp(yScale(0));
    ctx.moveTo(area.x, py);
    ctx.lineTo(area.x + area.w, py);
    ctx.stroke();
  }

  // Border
  ctx.strokeStyle = SURFACE.axis;
  ctx.strokeRect(surface.crisp(area.x) , surface.crisp(area.y), Math.round(area.w), Math.round(area.h));

  // Tick labels
  ctx.fillStyle = options.x.color ?? SURFACE.ink3;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const tick of xTicks) {
    const px = xScale(tick);
    if (px < area.x - 1 || px > area.x + area.w + 1) continue;
    ctx.fillText(xFormat(tick), px, area.y + area.h + 5);
  }
  ctx.fillStyle = options.y.color ?? SURFACE.ink3;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  for (const tick of yTicks) {
    const py = yScale(tick);
    if (py < area.y - 1 || py > area.y + area.h + 1) continue;
    ctx.fillText(yFormat(tick), area.x - 6, py);
  }
  if (options.yRight) {
    const right = options.yRight;
    const ticks = right.ticks ?? niceTicks(right.scale.min, right.scale.max, right.target ?? Math.max(2, Math.floor(area.h / 38)));
    const step = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : 1;
    const format = right.format ?? ((value: number) => tickLabel(value, step));
    ctx.fillStyle = right.color ?? SURFACE.ink3;
    ctx.textAlign = "left";
    for (const tick of ticks) {
      const py = right.scale(tick);
      if (py < area.y - 1 || py > area.y + area.h + 1) continue;
      ctx.fillText(format(tick), area.x + area.w + 6, py);
    }
  }

  // Axis titles
  ctx.font = FONT_TITLE;
  if (options.x.title) {
    ctx.fillStyle = options.x.color ?? SURFACE.ink3;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(options.x.title, area.x + area.w, surface.height - 2);
  }
  if (options.y.title) {
    ctx.save();
    ctx.fillStyle = options.y.color ?? SURFACE.ink3;
    ctx.translate(11, area.y + area.h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.y.title, 0, 0);
    ctx.restore();
  }
  if (options.yRight?.title) {
    ctx.save();
    ctx.fillStyle = options.yRight.color ?? SURFACE.ink3;
    ctx.translate(surface.width - 9, area.y + area.h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(options.yRight.title, 0, 0);
    ctx.restore();
  }
}

/** Restricts subsequent drawing to the plotting rectangle; pair with ctx.restore(). */
export function clipTo(surface: PlotSurface, area: Rect): void {
  surface.ctx.save();
  surface.ctx.beginPath();
  surface.ctx.rect(area.x, area.y, area.w, area.h);
  surface.ctx.clip();
}

export interface LineStyle {
  color: string;
  width?: number;
  dash?: number[];
  alpha?: number;
}

/**
 * Strokes a polyline through `count` points supplied by index. A point with a
 * non-finite coordinate, or `breakAt(i) === true`, starts a new sub-path
 * (used for angle wrap-around and gaps).
 */
export function drawLine(
  surface: PlotSurface,
  count: number,
  px: (index: number) => number,
  py: (index: number) => number,
  style: LineStyle,
  breakAt?: (index: number) => boolean,
): void {
  const { ctx } = surface;
  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width ?? 1.6;
  ctx.globalAlpha = style.alpha ?? 1;
  ctx.setLineDash(style.dash ?? []);
  ctx.beginPath();
  let pen = false;
  for (let i = 0; i < count; i++) {
    const x = px(i);
    const y = py(i);
    if (!Number.isFinite(x) || !Number.isFinite(y) || (breakAt && breakAt(i))) {
      pen = false;
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    }
    if (pen) ctx.lineTo(x, y);
    else {
      ctx.moveTo(x, y);
      pen = true;
    }
  }
  ctx.stroke();
  ctx.restore();
}

/** Filled dot marking the current state. */
export function drawMarker(surface: PlotSurface, x: number, y: number, color: string, radius = 3.5): void {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return;
  const { ctx } = surface;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = SURFACE.plot;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** Vertical or horizontal reference line with an optional label. */
export function drawReference(
  surface: PlotSurface,
  area: Rect,
  orientation: "vertical" | "horizontal",
  pixel: number,
  color: string,
  label?: string,
): void {
  const { ctx } = surface;
  if (!Number.isFinite(pixel)) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  if (orientation === "vertical") {
    if (pixel < area.x || pixel > area.x + area.w) {
      ctx.restore();
      return;
    }
    const x = surface.crisp(pixel);
    ctx.moveTo(x, area.y);
    ctx.lineTo(x, area.y + area.h);
  } else {
    if (pixel < area.y || pixel > area.y + area.h) {
      ctx.restore();
      return;
    }
    const y = surface.crisp(pixel);
    ctx.moveTo(area.x, y);
    ctx.lineTo(area.x + area.w, y);
  }
  ctx.stroke();
  if (label) {
    ctx.setLineDash([]);
    ctx.font = FONT;
    if (orientation === "vertical") {
      ctx.textAlign = pixel > area.x + area.w - 60 ? "right" : "left";
      ctx.textBaseline = "top";
      ctx.fillText(label, pixel + (ctx.textAlign === "right" ? -4 : 4), area.y + 4);
    } else {
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, area.x + area.w - 4, pixel - 3);
    }
  }
  ctx.restore();
}

/** Centred message for an empty plot. */
export function drawMessage(surface: PlotSurface, area: Rect, text: string): void {
  const { ctx } = surface;
  ctx.save();
  ctx.fillStyle = SURFACE.ink4;
  ctx.font = FONT_TITLE;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, area.x + area.w / 2, area.y + area.h / 2);
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* React binding                                                        */
/* ------------------------------------------------------------------ */

export type DrawFunction = (surface: PlotSurface, sim: Simulation) => void;

/**
 * Connects a canvas to the simulation frame loop. `draw` is called at most
 * once per animation frame and only when the state, the canvas size or one of
 * `deps` changed. The latest `draw` closure is always used.
 */
export function usePlot(draw: DrawFunction, deps: ReadonlyArray<unknown>): RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  const dirtyRef = useRef(true);

  useEffect(() => {
    drawRef.current = draw;
    dirtyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps is the caller-supplied redraw key
  }, deps);

  const sim = useSim();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const surface = new PlotSurface(canvas);
    let seenFrame = -1;
    const observer = new ResizeObserver(() => {
      dirtyRef.current = true;
    });
    observer.observe(canvas);
    const unsubscribe = sim.onFrame(() => {
      if (sim.frame === seenFrame && !dirtyRef.current) return;
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) return;
      seenFrame = sim.frame;
      dirtyRef.current = false;
      surface.begin();
      drawRef.current(surface, sim);
    });
    return () => {
      unsubscribe();
      observer.disconnect();
    };
  }, [sim]);

  return canvasRef;
}

/* ------------------------------------------------------------------ */
/* Chrome shared by all plots                                           */
/* ------------------------------------------------------------------ */

export interface LegendItem {
  color: string;
  label: ReactNode;
  dashed?: boolean;
  /** Current value, already formatted. */
  value?: ReactNode;
}

interface PlotPanelProps {
  title: ReactNode;
  /** Accessible description of what the chart shows. */
  description: string;
  legend?: LegendItem[];
  /** Controls shown at the right of the header. */
  actions?: ReactNode;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** Content rendered under the canvas (notes, tables). */
  footer?: ReactNode;
  className?: string;
}

/** Card with title, legend and a canvas that fills the remaining space. */
export function PlotPanel({ title, description, legend, actions, canvasRef, footer, className }: PlotPanelProps) {
  return (
    <figure className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <figcaption className="flex min-h-7 flex-wrap items-center gap-x-3.5 gap-y-1 px-1 pb-1.5">
        <span className="text-[12px] font-medium text-ink-2">{title}</span>
        {legend?.map((item, index) => (
          <span key={index} className="inline-flex items-center gap-1.5 text-[12px] text-ink-3">
            <Swatch color={item.color} dashed={item.dashed} />
            <span>{item.label}</span>
            {item.value !== undefined ? <span className="num text-ink-2">{item.value}</span> : null}
          </span>
        ))}
        {actions ? <span className="ml-auto inline-flex items-center gap-1.5">{actions}</span> : null}
      </figcaption>
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvasRef} role="img" aria-label={description} className="absolute inset-0 block size-full" />
      </div>
      {footer}
    </figure>
  );
}
