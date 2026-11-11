"use client";

/**
 * Session state of the task sheets.
 *
 * The active task is evaluated at 5 Hz from a hook mounted at the top of the
 * workspace, not from the task panel: the criteria must keep being checked
 * while the user is on the Parameters tab changing the very quantities the
 * task is about.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { DEFAULT_SOLVER } from "@/physics/constants";
import { useSim } from "@/sim/react";
import type { Simulation } from "@/sim/Simulation";
import { clearRunMemory, findTask, type TaskId, type TaskMemory, type TaskStatus } from "@/sim/tasks";
import { markTaskCompleted } from "../prefs";

export interface TaskSession {
  /** Task whose sheet is open in the panel (null: the list). */
  viewing: TaskId | null;
  /** Task that has been set up and is being evaluated. */
  active: TaskId | null;
  /** Latest evaluation of the active task. */
  status: TaskStatus | null;
  /** The active task has met all its criteria at some point since it was set up. */
  finished: boolean;
  /** Chosen prediction option per task (this session only). */
  predictions: Readonly<Partial<Record<TaskId, number>>>;
  /** Tasks whose explanation was opened before completion. */
  revealed: Readonly<Partial<Record<TaskId, boolean>>>;
}

const EVALUATION_INTERVAL_MS = 200;

let session: TaskSession = { viewing: null, active: null, status: null, finished: false, predictions: {}, revealed: {} };
let memory: TaskMemory = {};
let epoch = -1;
let lastFrame = -1;
const listeners = new Set<() => void>();

function set(patch: Partial<TaskSession>): void {
  session = { ...session, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Subscribes to a slice of the task session; the selector must return a primitive or a stored reference. */
export function useTaskSession<T>(selector: (state: TaskSession) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(session),
    () => selector(session),
  );
}

export function viewTask(id: TaskId | null): void {
  if (id !== session.viewing) set({ viewing: id });
}

export function choosePrediction(id: TaskId, option: number): void {
  set({ predictions: { ...session.predictions, [id]: option } });
}

export function revealExplanation(id: TaskId): void {
  set({ revealed: { ...session.revealed, [id]: true } });
}

/** Puts the apparatus into the starting configuration of the task and begins evaluating it. */
export function startTask(sim: Simulation, id: TaskId): void {
  const task = findTask(id);
  memory = {};
  // A demonstration solver left over from another task must not distort this one.
  sim.setSolver(DEFAULT_SOLVER);
  task.setup(sim);
  epoch = sim.getState().epoch;
  lastFrame = sim.frame;
  set({ active: id, viewing: id, status: task.evaluate(sim, memory), finished: false });
}

/**
 * Stops evaluating. The apparatus keeps its state, with one exception: a
 * deliberately poor solver (explicit Euler) is replaced by the default one,
 * and because a change of solver is a new run (Simulation.setSolver), both
 * experiments then start again from their initial conditions.
 */
export function stopTask(sim: Simulation): void {
  if (session.active === null) return;
  if (sim.getState().solver.method === "euler") sim.setSolver(DEFAULT_SOLVER);
  memory = {};
  set({ active: null, status: null, finished: false });
}

/** Re-evaluates the active task; returns its id if this evaluation completed it. */
function evaluate(sim: Simulation): TaskId | null {
  const id = session.active;
  if (id === null || sim.frame === lastFrame) return null;
  lastFrame = sim.frame;
  const current = sim.getState().epoch;
  if (current !== epoch) {
    epoch = current;
    clearRunMemory(memory);
  }
  const status = findTask(id).evaluate(sim, memory);
  const completedNow = status.done && !session.finished;
  if (completedNow) markTaskCompleted(id);
  set({ status, finished: session.finished || status.done });
  return completedNow ? id : null;
}

/** Drives the evaluation of the active task; mount once, above the panels. */
export function useTaskRunner(onComplete: (id: TaskId) => void): void {
  const sim = useSim();
  const callback = useRef(onComplete);
  useEffect(() => {
    callback.current = onComplete;
  }, [onComplete]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const completed = evaluate(sim);
      if (completed !== null) callback.current(completed);
    }, EVALUATION_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [sim]);
}
