"use client";

import {
  BookOpen,
  Cpu,
  Download,
  FileJson,
  FolderOpen,
  Keyboard,
  Link2,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
  StepForward,
  Table2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useRef } from "react";
import { DEFAULT_SOLVER, SOLVER_RATES } from "@/physics/constants";
import { INTEGRATOR_IDS, INTEGRATORS, type IntegratorId } from "@/physics/integrators";
import {
  buildCsv,
  CSV_INTERNATIONAL,
  CSV_SPREADSHEET,
  downloadText,
  encodeShareHash,
  fileStamp,
  fromExperimentFile,
  toExperimentFile,
  type CsvDialect,
} from "@/sim/exchange";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { TIME_SCALES, type ModuleId } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { fixed } from "../format";
import { Button, cn, IconButton } from "../kit/core";
import { Segmented } from "../kit/controls";
import { Menu, MenuItem, MenuLabel, MenuSeparator, Popover } from "../kit/overlays";
import { setPrefs, usePrefs, type Language } from "../prefs";

interface TopBarProps {
  onOpenTheory: () => void;
  onOpenShortcuts: () => void;
  onOpenInspector: () => void;
  onNotify: (message: string) => void;
}

export function TopBar({ onOpenTheory, onOpenShortcuts, onOpenInspector, onNotify }: TopBarProps) {
  const t = useT();
  const sim = useSim();
  const moduleId = useSimState((state) => state.module);
  const running = useSimState((state) => state.running);
  const status = useSimState((state) => state.status);
  const timeScale = useSimState((state) => state.timeScale);
  const language = usePrefs((prefs) => prefs.language);
  const muted = usePrefs((prefs) => prefs.muted);

  // One row from the md breakpoint up; on narrow screens the tools wrap onto a second row instead of being cut off.
  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-panel px-3 py-1.5 md:h-12 md:flex-nowrap md:overflow-hidden md:py-0">
      {/* Identity */}
      <div className="flex shrink-0 items-center gap-2 pr-1">
        <Logo />
        <div className="hidden leading-none xl:block">
          <div className="text-[14px] font-semibold tracking-tight text-ink">{t.app.name}</div>
          <div className="mt-0.5 text-[10.5px] text-ink-3">{t.app.tagline}</div>
        </div>
      </div>

      <Segmented<ModuleId>
        ariaLabel={t.modules.switcher}
        value={moduleId}
        onChange={(next) => sim.setModule(next)}
        options={[
          { value: "oscillator", label: t.modules.oscillator.name },
          { value: "pendulum", label: t.modules.pendulum.name },
        ]}
      />

      {/* Transport */}
      <div className="ml-1 flex items-center gap-1" role="group" aria-label={t.transport.time}>
        <Button
          variant="primary"
          size="md"
          onClick={() => sim.toggleRunning()}
          disabled={status !== "ok"}
          className="sm:w-[104px]"
          title={`${running ? t.transport.pause : t.transport.run} (Space)`}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
          <span className="sr-only sm:not-sr-only">{running ? t.transport.pause : t.transport.run}</span>
        </Button>
        <IconButton label={t.transport.step} shortcut="." disabled={running || status !== "ok"} onClick={() => sim.stepFrame()}>
          <StepForward />
        </IconButton>
        <IconButton label={t.transport.reset} shortcut="R" onClick={() => sim.reset()}>
          <RotateCcw />
        </IconButton>
        <Clock />
        <div className="hidden 2xl:block">
          <Segmented
            size="sm"
            ariaLabel={t.transport.speed}
            value={String(timeScale)}
            onChange={(value) => sim.setTimeScale(Number(value))}
            options={TIME_SCALES.map((scale) => ({ value: String(scale), label: `${scale}×` }))}
          />
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 md:block" />

      {/* Tools */}
      <SolverControl />
      <Button variant="ghost" onClick={onOpenTheory} title={`${t.topbar.theory} (K)`}>
        <BookOpen className="size-4" />
        <span className="hidden xl:inline">{t.topbar.theory}</span>
        <span className="sr-only xl:hidden">{t.topbar.theory}</span>
      </Button>
      <ExchangeMenu onNotify={onNotify} />
      <IconButton
        label={muted ? t.topbar.soundOff : t.topbar.soundOn}
        shortcut="M"
        pressed={!muted}
        onClick={() => setPrefs({ muted: !muted })}
      >
        {muted ? <VolumeX /> : <Volume2 />}
      </IconButton>
      <IconButton label={t.topbar.shortcuts} shortcut="?" onClick={onOpenShortcuts} className="hidden md:inline-flex">
        <Keyboard />
      </IconButton>
      <Segmented<Language>
        size="sm"
        ariaLabel={t.topbar.language}
        value={language}
        onChange={(next) => setPrefs({ language: next })}
        options={[
          { value: "tr", label: "TR", ariaLabel: "Türkçe" },
          { value: "en", label: "EN", ariaLabel: "English" },
        ]}
      />
      <IconButton label={t.topbar.panel} onClick={onOpenInspector} className="lg:hidden">
        <SlidersHorizontal />
      </IconButton>
    </header>
  );
}

/** Mark: a phase-space spiral converging on its fixed point. */
function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="7" className="fill-raised" />
      <path
        d="M16 16c0-2.2 1.8-4 4-4s4 1.8 4 4-3.6 8-8 8-8-3.6-8-8S11.600 5 18 5"
        fill="none"
        className="stroke-accent"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="1.9" className="fill-ink" />
    </svg>
  );
}

function Clock() {
  const t = useT();
  const sim = useSim();
  useLiveTick(12);
  return (
    <output
      aria-label={t.transport.time}
      className="num ml-1 hidden min-w-[104px] whitespace-nowrap rounded-sm border border-line bg-bg px-2 py-1 text-right text-[12.5px] text-ink-2 md:block"
    >
      <span className="text-ink-4">t = </span>
      {fixed(sim.time, 2)}
      <span className="text-ink-4"> s</span>
    </output>
  );
}

function formatRate(rate: number): string {
  return rate >= 1000 ? `${rate / 1000} kHz` : `${rate} Hz`;
}

const METHOD_SHORT: Record<IntegratorId, string> = {
  euler: "Euler",
  symplecticEuler: "SE",
  midpoint: "RK2",
  rk4: "RK4",
  dopri5: "DP5",
};

function SolverControl() {
  const t = useT();
  const sim = useSim();
  const solver = useSimState((state) => state.solver);
  const isDefault = solver.method === DEFAULT_SOLVER.method && solver.rateHz === DEFAULT_SOLVER.rateHz;
  const info = INTEGRATORS[solver.method];

  return (
    <Popover
      widthClass="w-[380px]"
      trigger={
        <Button
          variant="secondary"
          aria-label={`${t.solver.button}: ${t.solver.methods[solver.method].name}, ${formatRate(solver.rateHz)}`}
          className={cn("num gap-1.5 text-[12px]", !isDefault && "border-warn/60 text-warn hover:text-warn")}
        >
          <Cpu className="size-3.5" />
          <span>{METHOD_SHORT[solver.method]}</span>
          <span className="hidden text-ink-4 sm:inline">·</span>
          <span className="hidden sm:inline">{formatRate(solver.rateHz)}</span>
        </Button>
      }
    >
      <h2 className="text-[14px] font-semibold text-ink">{t.solver.title}</h2>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{t.solver.intro}</p>

      <div role="radiogroup" aria-label={t.solver.method} className="mt-3 grid gap-1">
        {INTEGRATOR_IDS.map((id) => {
          const selected = id === solver.method;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => sim.setSolver({ ...solver, method: id })}
              className={cn(
                "rounded-sm border px-2.5 py-2 text-left transition-colors duration-100",
                selected ? "border-accent/60 bg-accent-soft" : "border-line hover:border-line-strong hover:bg-hover",
              )}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className={cn("text-[13px] font-medium", selected ? "text-accent-strong" : "text-ink")}>
                  {t.solver.methods[id].name}
                </span>
                <span className="num shrink-0 text-[11px] text-ink-3">
                  {t.solver.order} {INTEGRATORS[id].order}
                </span>
              </span>
              <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{t.solver.methods[id].note}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="label-caps">{t.solver.rate}</span>
        <Segmented
          size="sm"
          ariaLabel={t.solver.rate}
          value={String(solver.rateHz)}
          onChange={(value) => sim.setSolver({ ...solver, rateHz: Number(value) })}
          options={SOLVER_RATES.map((rate) => ({ value: String(rate), label: rate >= 1000 ? `${rate / 1000}k` : String(rate) }))}
        />
      </div>

      <dl className="num mt-3 grid grid-cols-3 gap-2 text-[12px]">
        <div className="rounded-sm bg-raised px-2 py-1.5">
          <dt className="font-sans text-[11px] text-ink-3">{t.solver.stepSize}</dt>
          <dd className="text-ink">{fixed(1000 / solver.rateHz, 3)} ms</dd>
        </div>
        <div className="rounded-sm bg-raised px-2 py-1.5">
          <dt className="font-sans text-[11px] text-ink-3">{t.solver.order}</dt>
          <dd className="text-ink">{info.order}</dd>
        </div>
        <div className="rounded-sm bg-raised px-2 py-1.5">
          <dt className="font-sans text-[11px] text-ink-3">{t.solver.evaluations}</dt>
          <dd className="text-ink">{info.stages}</dd>
        </div>
      </dl>

      {!isDefault ? (
        <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => sim.setSolver(DEFAULT_SOLVER)}>
          {t.solver.restoreDefault} (RK4 · 1 kHz)
        </Button>
      ) : null}
    </Popover>
  );
}

function ExchangeMenu({ onNotify }: { onNotify: (message: string) => void }) {
  const t = useT();
  const sim = useSim();
  const fileInput = useRef<HTMLInputElement | null>(null);

  const saveCsv = (dialect: CsvDialect) => {
    const state = sim.getState();
    downloadText(`simulab-${state.module}-${fileStamp()}.csv`, buildCsv(sim, dialect), "text/csv;charset=utf-8");
  };

  const saveJson = () => {
    const state = sim.getState();
    downloadText(
      `simulab-${state.module}-${fileStamp()}.json`,
      `${JSON.stringify(toExperimentFile(state), null, 2)}\n`,
      "application/json",
    );
  };

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}${encodeShareHash(sim.getState())}`;
    try {
      await navigator.clipboard.writeText(url);
      onNotify(t.exchange.copied);
    } catch {
      window.history.replaceState(null, "", url);
      onNotify(t.exchange.copyFailed);
    }
  };

  const openFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const patch = fromExperimentFile(JSON.parse(await file.text()));
      if (!patch) throw new Error("invalid");
      sim.load(patch);
      onNotify(t.exchange.imported);
    } catch {
      onNotify(t.exchange.importFailed);
    }
  };

  return (
    <>
      <Menu
        trigger={
          <Button variant="ghost" aria-label={t.topbar.exportMenu} title={t.topbar.exportMenu} className="px-2">
            <Download className="size-4" />
            <span className="hidden 2xl:inline">{t.topbar.exportMenu}</span>
          </Button>
        }
      >
        <MenuLabel>{t.exchange.data}</MenuLabel>
        <MenuItem
          icon={<Table2 />}
          label={t.exchange.csvInternational.label}
          hint={t.exchange.csvInternational.hint}
          onSelect={() => saveCsv(CSV_INTERNATIONAL)}
        />
        <MenuItem
          icon={<Table2 />}
          label={t.exchange.csvSpreadsheet.label}
          hint={t.exchange.csvSpreadsheet.hint}
          onSelect={() => saveCsv(CSV_SPREADSHEET)}
        />
        <MenuSeparator />
        <MenuLabel>{t.exchange.experiment}</MenuLabel>
        <MenuItem icon={<FileJson />} label={t.exchange.json.label} hint={t.exchange.json.hint} onSelect={saveJson} />
        <MenuItem
          icon={<FolderOpen />}
          label={t.exchange.open.label}
          hint={t.exchange.open.hint}
          onSelect={() => fileInput.current?.click()}
        />
        <MenuItem icon={<Link2 />} label={t.exchange.link.label} hint={t.exchange.link.hint} onSelect={() => void copyLink()} />
      </Menu>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          void openFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </>
  );
}
