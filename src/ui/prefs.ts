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
  /**
   * Single-character keyboard shortcuts (letters, digits, punctuation). They can
   * be switched off for speech input and keyboard-assistance software, where a
   * spoken word or a stray key would otherwise trigger them (WCAG 2.1.4). The
   * space bar is not a character key in this sense and keeps working.
   */
  charShortcuts: boolean;
}

const STORAGE_KEY = "simulab.prefs.v2";

export const DOCK_HEIGHT = { min: 180, max: 520, initial: 288 } as const;
export const TIME_WINDOWS: readonly number[] = [6, 12, 30, 60];
export const STROBE_INTERVALS: readonly number[] = [0.05, 0.1, 0.2, 0.4];

/**
 * Members of a string union as a run-time list. The object literal is checked
 * by the compiler: a missing or an unknown member is a type error, so the list
 * cannot drift away from the type it validates against.
 */
const members = <T extends string>(all: Record<T, true>): readonly T[] => Object.keys(all) as T[];

const LANGUAGES = members<Language>({ tr: true, en: true });
const DOCK_TABS = members<DockTab>({ signals: true, energy: true, frequency: true, chaos: true });
const INSPECTOR_TABS = members<InspectorTab>({ parameters: true, measurements: true, tasks: true });
const TASK_IDS = members<TaskId>({
  periodDesign: true,
  criticalDamping: true,
  resonancePeak: true,
  integratorError: true,
  secondsPendulum: true,
  anharmonic: true,
  butterfly: true,
  regularIsland: true,
  normalMode: true,
});

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
    charShortcuts: true,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

/** The known task sheets among a stored list, in their canonical order and without duplicates. */
function storedTasks(value: unknown): TaskId[] {
  if (!Array.isArray(value)) return [];
  return TASK_IDS.filter((id) => value.includes(id));
}

/**
 * Stored preferences are untrusted input: they may come from an older or a
 * newer build, from a damaged write or from a hand edit. Every field is
 * accepted only if it holds an admissible value; anything else falls back to
 * its default instead of reaching the interface (an unknown language, for
 * example, would leave every component without a dictionary).
 */
export function validatePrefs(saved: unknown): Prefs {
  const base = defaults();
  if (!isRecord(saved)) return base;
  const overlays = { ...base.overlays };
  if (isRecord(saved.overlays)) {
    for (const key of Object.keys(overlays) as Array<keyof Overlays>) {
      overlays[key] = flag(saved.overlays[key], overlays[key]);
    }
  }
  const dockHeight = Number(saved.dockHeight);
  return {
    language: oneOf(saved.language, LANGUAGES, base.language),
    overlays,
    // Sound always starts muted: browsers block audio before a user gesture.
    muted: true,
    dockOpen: flag(saved.dockOpen, base.dockOpen),
    dockHeight: Number.isFinite(dockHeight)
      ? Math.min(DOCK_HEIGHT.max, Math.max(DOCK_HEIGHT.min, dockHeight))
      : base.dockHeight,
    dockTab: oneOf(saved.dockTab, DOCK_TABS, base.dockTab),
    inspectorTab: oneOf(saved.inspectorTab, INSPECTOR_TABS, base.inspectorTab),
    showExact: flag(saved.showExact, base.showExact),
    timeWindow: oneOf(saved.timeWindow, TIME_WINDOWS, base.timeWindow),
    strobeInterval: oneOf(saved.strobeInterval, STROBE_INTERVALS, base.strobeInterval),
    completedTasks: storedTasks(saved.completedTasks),
    welcomeSeen: flag(saved.welcomeSeen, base.welcomeSeen),
    dragHintSeen: flag(saved.dragHintSeen, base.dragHintSeen),
    charShortcuts: flag(saved.charShortcuts, base.charShortcuts),
  };
}

function readStored(): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    // Unavailable storage or damaged JSON: behave as if nothing had been stored.
    return null;
  }
}

let current: Prefs = validatePrefs(readStored());
const listeners = new Set<() => void>();

/**
 * Takes over task sheets that another tab has completed since this one read
 * the storage. Completion is the only preference that accumulates, and the
 * list only grows, so the union of both lists is always the right result;
 * writing this tab's snapshot alone would silently revert the other tab's
 * progress. Returns true if the list grew.
 */
function adoptStoredTasks(): boolean {
  const stored = readStored();
  const elsewhere = storedTasks(isRecord(stored) ? stored.completedTasks : null);
  const missing = elsewhere.filter((id) => !current.completedTasks.includes(id));
  if (missing.length === 0) return false;
  current = { ...current, completedTasks: storedTasks([...current.completedTasks, ...missing]) };
  return true;
}

function persist(): void {
  if (typeof window === "undefined") return;
  adoptStoredTasks();
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage may be unavailable (private mode, quota); preferences then live for the session only.
  }
}

if (typeof window !== "undefined") {
  // Fired in this tab when another tab of the same origin writes the preferences.
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    if (adoptStoredTasks()) for (const listener of listeners) listener();
  });
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
