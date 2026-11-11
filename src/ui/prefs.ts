/**
 * User-interface preferences (language, overlays, panel layout, task progress).
 * A tiny external store persisted to localStorage; the physical experiment
 * definition lives in the Simulation, not here.
 */

import { useSyncExternalStore } from "react";
import type { TaskId } from "@/sim/tasks";

export type Language = "tr" | "en";

export interface Overlays {
  velocity: boolean;
  netForce: boolean;
  /** Free-body diagram: every individual force on the selected body. */
  freeBody: boolean;
  trail: boolean;
  strobe: boolean;
  grid: boolean;
  axes: boolean;
  labels: boolean;
}

export type DockTab = "signals" | "energy" | "frequency" | "chaos";
export type InspectorTab = "parameters" | "measurements" | "tasks";

export interface Prefs {
  language: Language;
  overlays: Overlays;
  muted: boolean;
  dockOpen: boolean;
  dockHeight: number;
  dockTab: DockTab;
  inspectorTab: InspectorTab;
  /** Show the closed-form solution next to the numerical one (oscillator). */
  showExact: boolean;
  /** Visible time span of the strip charts [s]. */
  timeWindow: number;
  /** Flash period of the stroboscope [s of simulated time]. */
  strobeInterval: number;
  completedTasks: TaskId[];
  welcomeSeen: boolean;
  /** Set once the user has dragged a body; the on-canvas hint is then no longer shown. */
  dragHintSeen: boolean;
}

const STORAGE_KEY = "simulab.prefs.v2";

export const DOCK_HEIGHT = { min: 180, max: 520, initial: 288 } as const;
export const TIME_WINDOWS: readonly number[] = [6, 12, 30, 60];
export const STROBE_INTERVALS: readonly number[] = [0.05, 0.1, 0.2, 0.4];

function detectLanguage(): Language {
  if (typeof navigator === "undefined") return "tr";
  return navigator.language.toLowerCase().startsWith("tr") ? "tr" : "en";
}

function defaults(): Prefs {
  return {
    language: detectLanguage(),
    overlays: {
      velocity: true,
      netForce: true,
      freeBody: false,
      trail: true,
      strobe: false,
      grid: true,
      axes: false,
      labels: true,
    },
    muted: true,
    dockOpen: true,
    dockHeight: DOCK_HEIGHT.initial,
    dockTab: "signals",
    inspectorTab: "parameters",
    showExact: true,
    timeWindow: 12,
    strobeInterval: 0.1,
    completedTasks: [],
    welcomeSeen: false,
    dragHintSeen: false,
  };
}

function load(): Prefs {
  const base = defaults();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<Prefs>;
    return {
      ...base,
      ...saved,
      overlays: { ...base.overlays, ...(saved.overlays ?? {}) },
      // Sound always starts muted: browsers block audio before a user gesture.
      muted: true,
      dockHeight: Math.min(DOCK_HEIGHT.max, Math.max(DOCK_HEIGHT.min, Number(saved.dockHeight) || base.dockHeight)),
      completedTasks: Array.isArray(saved.completedTasks) ? saved.completedTasks : [],
    };
  } catch {
    return base;
  }
}

let current: Prefs = load();
const listeners = new Set<() => void>();

function persist(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage may be unavailable (private mode, quota); preferences then live for the session only.
  }
}

export function getPrefs(): Prefs {
  return current;
}

export function setPrefs(patch: Partial<Prefs> | ((previous: Prefs) => Partial<Prefs>)): void {
  const next = typeof patch === "function" ? patch(current) : patch;
  current = { ...current, ...next };
  persist();
  for (const listener of listeners) listener();
}

export function toggleOverlay(key: keyof Overlays): void {
  setPrefs((previous) => ({ overlays: { ...previous.overlays, [key]: !previous.overlays[key] } }));
}

export function markTaskCompleted(id: TaskId): void {
  if (current.completedTasks.includes(id)) return;
  setPrefs((previous) => ({ completedTasks: [...previous.completedTasks, id] }));
}

export function subscribePrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Subscribes a component to a slice of the preferences; the selector must return a stable value. */
export function usePrefs<T>(selector: (prefs: Prefs) => T): T {
  return useSyncExternalStore(
    subscribePrefs,
    () => selector(current),
    () => selector(current),
  );
}
