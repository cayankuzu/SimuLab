/**
 * Properties of the interface that can be established without a browser:
 * colour contrast of the design tokens (WCAG 2.2 definitions of relative
 * luminance and contrast ratio), the reading of numeric entries, the handling
 * of stored preferences, the record and peak rules of the spectrum read-out
 * and the accessibility of the typeset mathematics. The figures that chapter
 * 11 of the report quotes are computed here and looked up in its text.
 */

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { oscillatorTheory } from "@/physics/oscillator";
import { SeriesBuffer } from "@/sim/SeriesBuffer";
import { MAX_FRAME_SECONDS, OSC_CH, Simulation } from "@/sim/Simulation";
import { parseDecimal } from "@/ui/format";
import { renderTex } from "@/ui/kit/tex";
import { SURFACE } from "@/ui/palette";
import { FFT_SIZE, MIN_SAMPLES, PEAK_MIN_BIN, recordSpectrum } from "@/ui/plots/spectrumRecord";
import { DOCK_HEIGHT, validatePrefs } from "@/ui/prefs";

const SOURCE = fileURLToPath(new URL("../src/", import.meta.url));
const css = readFileSync(`${SOURCE}app/globals.css`, "utf8");
const kitCore = readFileSync(`${SOURCE}ui/kit/core.tsx`, "utf8");
const CHAPTER = {
  en: readFileSync(`${SOURCE}content/theory/design.en.ts`, "utf8"),
  tr: readFileSync(`${SOURCE}content/theory/design.tr.ts`, "utf8"),
};

type Rgb = readonly [number, number, number];
interface Colour {
  rgb: Rgb;
  alpha: number;
}

/** Value of a `--color-*` design token as written in globals.css. */
function token(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*([^;]+);`).exec(css);
  if (!match?.[1]) throw new Error(`design token --color-${name} not found`);
  return match[1].trim();
}

function parseColour(value: string): Colour {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex?.[1]) {
    const n = Number.parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const fn = /^rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)$/.exec(value);
  if (fn) return { rgb: [Number(fn[1]), Number(fn[2]), Number(fn[3])], alpha: fn[4] === undefined ? 1 : Number(fn[4]) };
  throw new Error(`unsupported colour notation: ${value}`);
}

/** sRGB channel (0..255) to linear light. */
function linear(channel: number): number {
  const s = channel / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance([r, g, b]: Rgb): number {
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** A colour as it appears on an opaque surface: a translucent colour is composited over it. */
function seenOn({ rgb, alpha }: Colour, surface: Rgb): Rgb {
  return [
    rgb[0] * alpha + surface[0] * (1 - alpha),
    rgb[1] * alpha + surface[1] * (1 - alpha),
    rgb[2] * alpha + surface[2] * (1 - alpha),
  ];
}

function ratio(a: Rgb, b: Rgb): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Contrast ratio of a colour as it appears on a surface; a translucent colour is composited over it first. */
function contrast(colour: string, surface: string): number {
  const bg = parseColour(surface).rgb;
  return ratio(seenOn(parseColour(colour), bg), bg);
}

/** Every surface a colour can lie on: the five steps of the neutral ramp and the plot background. */
const SURFACES: Record<string, string> = {
  bg: token("bg"),
  plot: SURFACE.plot,
  panel: token("panel"),
  raised: token("raised"),
  hover: token("hover"),
  active: token("active"),
};

const lowest = (colour: string, surfaces: readonly string[]): number =>
  Math.min(...surfaces.map((name) => contrast(colour, SURFACES[name] as string)));

/** Thumb colour of the scroll bars as written in globals.css. */
const scrollThumb = (): string => {
  const thumb = /scrollbar-color:\s*(rgb\([^)]+\))/.exec(css)?.[1];
  if (!thumb) throw new Error("scrollbar-color not found");
  return thumb;
};

/**
 * Opacities [%] of every accent outline drawn on the accent-tinted fill of a
 * pressed or selected item: the kit's toggle buttons (an inset ring) and the
 * presets, gravity buttons, solver methods and task options (a border).
 */
function selectedOutlineOpacities(): number[] {
  const found = sourceFiles(`${SOURCE}ui/`).flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => /\bbg-accent-soft\b/.test(line))
      .flatMap((line) => [...line.matchAll(/(?:border|inset-ring)-accent\/(\d+)/g)].map((match) => Number(match[1]))),
  );
  if (found.length === 0 || !kitCore.includes("inset-ring-accent/")) throw new Error("no selected-state outline found");
  return found;
}

/**
 * Outline of a pressed toggle or a selected item against its tinted fill and
 * against the surface around it; the lower of the two, lowest over the
 * surfaces such an item can lie on and over every outline in the source.
 */
function pressedOutline(): number {
  const accent = parseColour(token("accent"));
  const tint = parseColour(token("accent-soft"));
  return Math.min(
    ...selectedOutlineOpacities().flatMap((percent) =>
      ["bg", "panel", "raised", "hover"].map((name) => {
        const surface = parseColour(SURFACES[name] as string).rgb;
        const fill = seenOn(tint, surface);
        const outline = seenOn({ rgb: accent.rgb, alpha: percent / 100 }, fill);
        return Math.min(ratio(outline, fill), ratio(outline, surface));
      }),
    ),
  );
}

/**
 * A ratio as the report quotes it, to two decimals: a lowest value ("at
 * least") rounded down, so that it is a true lower bound; the value on one
 * named surface rounded to the nearest.
 */
function quoted(value: number, kind: "least" | "point", language: "en" | "tr"): string {
  const text = (kind === "least" ? Math.floor(value * 100) / 100 : value).toFixed(2);
  return `${language === "tr" ? text.replace(".", ",") : text}:1`;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(`${directory}${entry.name}/`)
      : /\.tsx?$/.test(entry.name)
        ? [`${directory}${entry.name}`]
        : [],
  );
}

describe("colour contrast of the design tokens", () => {
  const all = Object.keys(SURFACES);

  it("keeps the canvas palette identical to the CSS tokens", () => {
    expect(SURFACE.bg).toBe(token("bg"));
    expect(SURFACE.panel).toBe(token("panel"));
    expect(SURFACE.raised).toBe(token("raised"));
    expect(SURFACE.ink).toBe(token("ink"));
    expect(SURFACE.ink2).toBe(token("ink-2"));
    expect(SURFACE.ink3).toBe(token("ink-3"));
    expect(SURFACE.ink4).toBe(token("ink-4"));
    expect(SURFACE.edge).toBe(token("edge"));
  });

  it("gives the three main text colours at least 4.5:1 on every surface (WCAG 1.4.3)", () => {
    for (const name of ["ink", "ink-2", "ink-3"]) expect(lowest(token(name), all), name).toBeGreaterThanOrEqual(4.5);
  });

  it("gives the dimmest text colour at least 4.5:1 on every surface it is used on", () => {
    expect(lowest(token("ink-4"), ["bg", "plot", "panel", "raised", "hover"])).toBeGreaterThanOrEqual(4.5);
    // The pressed surface is the exception, so no element may combine the two.
    const offenders = sourceFiles(`${SOURCE}ui/`).flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => /\bbg-active\b/.test(line) && /\btext-ink-4\b/.test(line))
        .map((line) => `${file}: ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });

  it("draws control boundaries, state marks and the focus ring at 3:1 or more on every surface (WCAG 1.4.11)", () => {
    expect(lowest(token("edge"), all)).toBeGreaterThanOrEqual(3);
    expect(lowest(token("accent"), all)).toBeGreaterThanOrEqual(3);
    expect(lowest(token("danger"), all)).toBeGreaterThanOrEqual(3);
  });

  it("keeps the scrollbar thumb at 3:1 against every surface", () => {
    expect(lowest(scrollThumb(), all)).toBeGreaterThanOrEqual(3);
  });

  it("marks a pressed toggle by an outline of 3:1 or more against its fill and its surroundings (WCAG 1.4.1, 1.4.11)", () => {
    expect(pressedOutline()).toBeGreaterThanOrEqual(3);
  });

  it("does not rely on the separator lines for any of this: they are decoration below 3:1", () => {
    // Recorded so that nobody mistakes a separator for a control boundary.
    expect(lowest(token("line-strong"), all)).toBeLessThan(3);
  });
});

describe("figures quoted in chapter 11", () => {
  const all = Object.keys(SURFACES);
  const ink4 = token("ink-4");
  const edge = token("edge");

  it("states the contrast ratios that the design tokens give", () => {
    const figures: Record<string, [number, "least" | "point"]> = {
      "main text, lowest": [Math.min(...["ink", "ink-2", "ink-3"].map((name) => lowest(token(name), all))), "least"],
      "dimmest text on the panel": [contrast(ink4, SURFACES.panel as string), "point"],
      "dimmest text, lowest where used": [lowest(ink4, ["bg", "plot", "panel", "raised", "hover"]), "least"],
      "dimmest text on the active surface": [contrast(ink4, SURFACES.active as string), "point"],
      "control outline, lowest": [lowest(edge, all), "least"],
      "control outline on the panel": [contrast(edge, SURFACES.panel as string), "point"],
      "focus ring, lowest": [lowest(token("accent"), all), "least"],
      "scroll-bar thumb, lowest": [lowest(scrollThumb(), all), "least"],
      "pressed toggle outline, lowest": [pressedOutline(), "least"],
    };
    for (const [name, [value, kind]] of Object.entries(figures)) {
      for (const language of ["en", "tr"] as const) {
        const text = quoted(value, kind, language);
        expect(CHAPTER[language], `${name} (${language}): ${text}`).toContain(text);
      }
    }
  });

  it("states the frame cap of the runtime", () => {
    expect(CHAPTER.en).toContain(`at most ${MAX_FRAME_SECONDS} s`);
    expect(CHAPTER.tr).toContain(`en çok ${String(MAX_FRAME_SECONDS).replace(".", ",")} s`);
  });
});

describe("spectrum read-out", () => {
  /** Runs the simulation for `seconds` of simulated time in 60 Hz frames. */
  const run = (sim: Simulation, seconds: number) => {
    for (let i = Math.round(seconds * 60); i > 0; i--) sim.advance(1 / 60);
  };

  it("analyses only the newest samples recorded at one rate, with that rate", () => {
    // 2000 samples at 60 Hz (a solver at 60 Hz records every step), then 1300 at 100 Hz.
    const buffer = new SeriesBuffer(2, 10_000);
    const f = 1.3;
    let t = 0;
    for (let i = 0; i < 2000; i++, t += 1 / 60) buffer.push([t, Math.sin(2 * Math.PI * f * t)]);
    for (let i = 0; i < 1300; i++) {
      t += 1 / 100;
      buffer.push([t, Math.sin(2 * Math.PI * f * t)]);
    }
    const result = recordSpectrum(buffer, 0, 1);
    expect(result).not.toBeNull();
    expect(result?.sampleRate).toBeCloseTo(100, 6);
    // The largest power of two within the 1300 uniform samples; never zero-padded.
    expect(result?.spectrum.samples).toBe(1024);
    expect(Math.abs((result?.peak?.frequency ?? 0) - f) / f).toBeLessThan(1e-5);
  });

  it("shows no spectrum below the shortest record", () => {
    const buffer = new SeriesBuffer(2, FFT_SIZE);
    for (let i = 0; i < MIN_SAMPLES - 1; i++) buffer.push([i / 100, Math.sin(i / 10)]);
    expect(recordSpectrum(buffer, 0, 1)).toBeNull();
    buffer.push([(MIN_SAMPLES - 1) / 100, Math.sin((MIN_SAMPLES - 1) / 10)]);
    expect(recordSpectrum(buffer, 0, 1)?.spectrum.samples).toBe(MIN_SAMPLES);
  });

  it("reports the line of the default oscillator only once it lies at bin 4 or above", () => {
    const sim = new Simulation();
    sim.setRunning(true);
    const f0 = oscillatorTheory(sim.getState().oscillator).omega0 / (2 * Math.PI);
    // 10.0 s: 1001 samples, so a 512-point record with f0 in bin 2.8; no read-out.
    run(sim, 10);
    const early = recordSpectrum(sim.oscSeries, OSC_CH.t, OSC_CH.x);
    expect(early?.spectrum.samples).toBe(512);
    expect(f0 / (early?.spectrum.resolution ?? 1)).toBeLessThan(PEAK_MIN_BIN);
    expect(early?.peak).toBeNull();
    // 10.3 s: a 1024-point record, f0 in bin 5.6; frequency and amplitude (x0 = 2 m) are read off.
    run(sim, 0.3);
    const later = recordSpectrum(sim.oscSeries, OSC_CH.t, OSC_CH.x);
    expect(later?.spectrum.samples).toBe(1024);
    expect(Math.abs((later?.peak?.frequency ?? 0) - f0) / f0).toBeLessThan(1e-4);
    expect(Math.abs((later?.peak?.amplitude ?? 0) - sim.getState().oscInitial.x)).toBeLessThan(1e-3);
  });

  it("reports no line for a decay without oscillation", () => {
    for (const id of ["critical", "overdamped"] as const) {
      const sim = new Simulation();
      sim.applyOscillatorPreset(id);
      sim.setRunning(true);
      run(sim, 30);
      const result = recordSpectrum(sim.oscSeries, OSC_CH.t, OSC_CH.x);
      expect(result, id).not.toBeNull();
      expect(result?.peak, id).toBeNull();
    }
  });
});

describe("stored preferences", () => {
  it("replaces values the interface cannot use by their defaults", () => {
    const prefs = validatePrefs({
      language: "de",
      dockTab: "spectrum",
      inspectorTab: 7,
      timeWindow: 13,
      strobeInterval: "0.1",
      dockHeight: "tall",
      overlays: { grid: "yes", axes: true },
      completedTasks: ["normalMode", "unknown", "normalMode", 3, "periodDesign"],
      charShortcuts: false,
      welcomeSeen: "true",
    });
    expect(["tr", "en"]).toContain(prefs.language);
    expect(prefs.dockTab).toBe("signals");
    expect(prefs.inspectorTab).toBe("parameters");
    expect(prefs.timeWindow).toBe(12);
    expect(prefs.strobeInterval).toBe(0.1);
    expect(prefs.dockHeight).toBe(DOCK_HEIGHT.initial);
    expect(prefs.overlays.grid).toBe(true);
    expect(prefs.overlays.axes).toBe(true);
    expect(prefs.completedTasks).toEqual(["periodDesign", "normalMode"]);
    expect(prefs.charShortcuts).toBe(false);
    expect(prefs.welcomeSeen).toBe(false);
  });

  it("keeps admissible values and limits the dock height to its range", () => {
    const prefs = validatePrefs({ language: "en", dockTab: "chaos", inspectorTab: "tasks", timeWindow: 60, dockHeight: 9999 });
    expect(prefs.language).toBe("en");
    expect(prefs.dockTab).toBe("chaos");
    expect(prefs.inspectorTab).toBe("tasks");
    expect(prefs.timeWindow).toBe(60);
    expect(prefs.dockHeight).toBe(DOCK_HEIGHT.max);
    expect(prefs.muted).toBe(true);
  });

  it("survives storage that does not hold an object", () => {
    for (const stored of [null, undefined, 42, "tr", [], true]) {
      const prefs = validatePrefs(stored);
      expect(prefs.dockTab).toBe("signals");
      expect(prefs.completedTasks).toEqual([]);
      expect(prefs.charShortcuts).toBe(true);
    }
  });
});

describe("numeric entry", () => {
  it("reads decimal notation with a point, a comma, a sign and an exponent", () => {
    expect(parseDecimal("2.5")).toBe(2.5);
    expect(parseDecimal(" 2,5 ")).toBe(2.5);
    expect(parseDecimal("-0.75")).toBe(-0.75);
    expect(parseDecimal("−0,75")).toBe(-0.75);
    expect(parseDecimal("+3")).toBe(3);
    expect(parseDecimal(".5")).toBe(0.5);
    expect(parseDecimal("5.")).toBe(5);
    expect(parseDecimal("1e-3")).toBe(0.001);
    expect(parseDecimal("9.80665")).toBe(9.80665);
  });

  it("rejects everything else instead of guessing a value", () => {
    // The empty text matters most: Number('') is 0, which an arrow key would then count from.
    for (const text of ["", "   ", "2,5,0", "1.234,5", "abc", "0x10", "Infinity", "NaN", "1e", "--1", "2 5", ".", "1/2"]) {
      expect(parseDecimal(text), JSON.stringify(text)).toBeNaN();
    }
  });
});

describe("typeset mathematics", () => {
  it("carries MathML next to the visual rendering, so formulas reach assistive technology (WCAG 1.1.1)", () => {
    for (const block of [false, true]) {
      const html = renderTex("\\omega_0 = \\sqrt{k/m}", block);
      expect(html).toContain("<math");
      expect(html).toContain('<annotation encoding="application/x-tex">');
      // The visual layer is the part KaTeX hides from the accessibility tree.
      expect(html).toContain('aria-hidden="true"');
    }
  });
});
