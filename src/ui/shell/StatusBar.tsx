"use client";

import { useState } from "react";
import { INTEGRATORS } from "@/physics/integrators";
import { DEFAULT_SOLVER } from "@/physics/constants";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { LAG_FRAMES, LAG_WINDOW_SECONDS, MAX_FRAME_SECONDS } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { fixed, scientific } from "../format";
import { cn, Tooltip } from "../kit/core";

/** Relative ledger residual above which a more accurate solver is suggested. */
const ADVISORY_RESIDUAL = 1e-5;

/**
 * Instrument status line. Its centrepiece is the energy-ledger residual: a
 * live, quantitative statement of how well the numerical solution satisfies
 * the energy balance, replacing any blanket claim of "exact conservation".
 *
 * The line has one row at every width and never drops a notice. Two notices
 * can appear: the offer of the adaptive solver and the count of late frames.
 * Where the row is too short for everything, the read-outs give way to them
 * (see the conditions below; the widths were added up for both languages).
 */
export function StatusBar() {
  const t = useT();
  const sim = useSim();
  const moduleId = useSimState((state) => state.module);
  const solver = useSimState((state) => state.solver);
  const running = useSimState((state) => state.running);
  const status = useSimState((state) => state.status);
  useLiveTick(4);

  const oscillator = moduleId === "oscillator";
  const relative = oscillator
    ? Math.abs(sim.osc.energy().residual) / sim.osc.energyScale()
    : Math.abs(sim.pend.energy().residual) / sim.pend.energyScale();
  const tone = relative < 1e-6 ? "text-ok" : relative < 1e-3 ? "text-warn" : "text-danger";
  const series = oscillator ? sim.oscSeries : sim.pendSeries;
  const stepMs = 1000 / solver.rateHz;
  // A fixed step loses accuracy when the motion becomes fast; offer the error-controlled method then.
  // The offer stays for the rest of the run once the residual has reached the threshold: a bounded
  // error swings about such a value, and the line would otherwise change its contents with every swing.
  const run = `${moduleId}:${sim.getState().epoch}`;
  const [advisedRun, setAdvisedRun] = useState<string | null>(null);
  const reached = relative >= ADVISORY_RESIDUAL;
  if (reached && advisedRun !== run) setAdvisedRun(run);
  const advise = (reached || advisedRun === run) && !INTEGRATORS[solver.method].adaptive && status === "ok";
  // Frames of this run that were cut to the frame cap, so that simulated time fell behind (Simulation.advance).
  // Shown once they recur: a single long frame, such as the one in which a scene is built, is no lasting lag.
  const late = sim.perf.lagging ? sim.perf.droppedFrames : 0;
  const notice = advise || late > 0;

  return (
    <footer className="num flex h-7 shrink-0 items-center gap-4 overflow-hidden whitespace-nowrap border-t border-line bg-panel px-3 text-[11px] text-ink-3 [&>*]:shrink-0">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            status !== "ok" ? "bg-danger" : sim.isDragging ? "bg-warn" : running ? "bg-ok" : "bg-ink-4",
          )}
        />
        {/* On a phone a notice takes the place of this word; the run button and the banner still state it. */}
        <span className={cn("font-sans", notice && "sr-only sm:not-sr-only")}>
          {status !== "ok"
            ? t.solver.diverged.title
            : sim.isDragging
              ? t.status.held
              : running
                ? t.modules[moduleId].name
                : t.status.paused}
        </span>
      </span>

      {/* The widest read-out; the solver button shows method and rate as well. It gives way to a notice and to a halted run. */}
      {notice || status !== "ok" ? null : (
        <span className="hidden xl:inline">
          <span className="font-sans text-ink-4">{t.status.integrator} </span>
          {t.solver.methods[solver.method].name} · h = {fixed(stepMs, stepMs < 1 ? 2 : 1)} ms · p = {INTEGRATORS[solver.method].order}
        </span>
      )}

      {/* Below sm the advisory stands in for the value that causes it; there is no room for both. */}
      <Tooltip label={t.status.ledgerHint} side="top">
        <span tabIndex={0} className={cn("cursor-help rounded-xs", advise && "hidden sm:inline")}>
          <span className={cn("font-sans text-ink-4", advise ? "sr-only lg:not-sr-only" : "sr-only sm:not-sr-only")}>
            {t.status.ledger}{" "}
          </span>
          <span className={tone}>|ΔE|/E = {scientific(relative, 1)}</span>
        </span>
      </Tooltip>

      {advise ? (
        // The button is 24 px high (WCAG 2.5.8) in a 27 px row, so its focus ring is drawn inside it. It is
        // the one item that may shrink: with both notices on the narrowest screens its text ends in an ellipsis.
        <Tooltip label={t.status.switchToAdaptiveHint(scientific(ADVISORY_RESIDUAL, 0))} side="top">
          <button
            type="button"
            onClick={() => sim.setSolver({ method: "dopri5", rateHz: Math.max(solver.rateHz, DEFAULT_SOLVER.rateHz) })}
            className="h-6 min-w-0 !shrink truncate rounded-xs border border-warn/50 px-1.5 font-sans text-[11px] text-warn transition-colors hover:bg-warn/10 focus-visible:-outline-offset-2!"
          >
            {t.status.switchToAdaptive}
          </button>
        </Tooltip>
      ) : null}

      {oscillator ? (
        <Tooltip label={t.status.exactErrorHint} side="top">
          <span tabIndex={0} className={cn("hidden cursor-help rounded-xs", advise ? "xl:inline" : "lg:inline")}>
            <span className="font-sans text-ink-4">{t.status.exactError} </span>
            <span className={sim.maxExactError < 1e-6 ? "text-ok" : sim.maxExactError < 1e-2 ? "text-warn" : "text-danger"}>
              {scientific(sim.maxExactError, 1)} m
            </span>
          </span>
        </Tooltip>
      ) : null}

      <span className="min-w-0 !shrink flex-1" />

      {/* Shown at every width: it is the only sign that simulated time is no longer keeping up. */}
      {late > 0 ? (
        <Tooltip label={t.status.droppedHint(MAX_FRAME_SECONDS, LAG_FRAMES, LAG_WINDOW_SECONDS)} side="top">
          <span tabIndex={0} className="cursor-help rounded-xs text-warn">
            <span className="font-sans">{t.status.dropped} </span>
            {late}
          </span>
        </Tooltip>
      ) : null}
      <span className="hidden 2xl:inline">
        <span className="font-sans text-ink-4">{t.status.samples} </span>
        {t.exchange.samples(series.length)}
      </span>
      <span className="hidden xl:inline">
        <span className="font-sans text-ink-4">{t.status.physics} </span>
        {fixed(sim.perf.physicsMs, 2)} ms
      </span>
      {/* The least of the read-outs: from sm, and from md while late frames are reported. */}
      <span className={cn("hidden", late > 0 ? "md:inline" : "sm:inline")}>
        <span className="font-sans text-ink-4">{t.status.fps} </span>
        {fixed(sim.perf.fps, 0)}
      </span>
    </footer>
  );
}
