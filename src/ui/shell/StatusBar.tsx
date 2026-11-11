"use client";

import { INTEGRATORS } from "@/physics/integrators";
import { DEFAULT_SOLVER } from "@/physics/constants";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { useT } from "@/i18n";
import { fixed, scientific } from "../format";
import { cn, Tooltip } from "../kit/core";

/** Relative ledger residual above which a more accurate solver is suggested. */
const ADVISORY_RESIDUAL = 1e-5;

/**
 * Instrument status line. Its centrepiece is the energy-ledger residual: a
 * live, quantitative statement of how well the numerical solution satisfies
 * the energy balance, replacing any blanket claim of "exact conservation".
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
  const advise = relative >= ADVISORY_RESIDUAL && !INTEGRATORS[solver.method].adaptive && status === "ok";

  return (
    <footer className="num flex h-6 shrink-0 items-center gap-4 overflow-hidden whitespace-nowrap border-t border-line bg-panel px-3 text-[11px] text-ink-3 [&>*]:shrink-0">
      <span className="flex items-center gap-1.5">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            status !== "ok" ? "bg-danger" : sim.isDragging ? "bg-warn" : running ? "bg-ok" : "bg-ink-4",
          )}
        />
        <span className="font-sans">
          {status !== "ok"
            ? t.solver.diverged.title
            : sim.isDragging
              ? t.status.held
              : running
                ? t.modules[moduleId].name
                : t.status.paused}
        </span>
      </span>

      <span className="hidden xl:inline">
        <span className="font-sans text-ink-4">{t.status.integrator} </span>
        {t.solver.methods[solver.method].name} · h = {fixed(stepMs, stepMs < 1 ? 2 : 1)} ms · p = {INTEGRATORS[solver.method].order}
      </span>

      <Tooltip label={t.status.ledgerHint} side="top">
        <span tabIndex={0} className="cursor-help rounded-xs">
          <span className="font-sans text-ink-4">{t.status.ledger} </span>
          <span className={tone}>|ΔE|/E = {scientific(relative, 1)}</span>
        </span>
      </Tooltip>

      {advise ? (
        <button
          type="button"
          onClick={() => sim.setSolver({ method: "dopri5", rateHz: Math.max(solver.rateHz, DEFAULT_SOLVER.rateHz) })}
          className="rounded-xs border border-warn/50 px-1.5 font-sans text-[11px] leading-[16px] text-warn transition-colors hover:bg-warn/10"
        >
          {t.status.switchToAdaptive}
        </button>
      ) : null}

      {oscillator ? (
        <Tooltip label={t.status.exactErrorHint} side="top">
          <span tabIndex={0} className="hidden cursor-help rounded-xs lg:inline">
            <span className="font-sans text-ink-4">{t.status.exactError} </span>
            <span className={sim.maxExactError < 1e-6 ? "text-ok" : sim.maxExactError < 1e-2 ? "text-warn" : "text-danger"}>
              {scientific(sim.maxExactError, 1)} m
            </span>
          </span>
        </Tooltip>
      ) : null}

      <span className="min-w-0 !shrink flex-1" />

      {sim.perf.droppedFrames > 0 ? (
        <span className="hidden text-warn 2xl:inline">{t.status.dropped(sim.perf.droppedFrames)}</span>
      ) : null}
      <span className="hidden 2xl:inline">
        <span className="font-sans text-ink-4">{t.status.samples} </span>
        {t.exchange.samples(series.length)}
      </span>
      <span className="hidden xl:inline">
        <span className="font-sans text-ink-4">{t.status.physics} </span>
        {fixed(sim.perf.physicsMs, 2)} ms
      </span>
      <span>
        <span className="font-sans text-ink-4">{t.status.fps} </span>
        {fixed(sim.perf.fps, 0)}
      </span>
    </footer>
  );
}
