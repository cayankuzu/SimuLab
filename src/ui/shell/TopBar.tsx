"use client";

import {
  BookOpen,
  Check,
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
  TriangleAlert,
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
import { DICTIONARIES, useT } from "@/i18n";
import { fixed } from "../format";
import { Button, cn, IconButton } from "../kit/core";
import { Segmented } from "../kit/controls";
import { Menu, MenuItem, MenuLabel, MenuSeparator, Popover } from "../kit/overlays";
import { setPrefs, usePrefs, type Language } from "../prefs";

/** Interface languages in the order of the switch. */
const LANGUAGES = Object.keys(DICTIONARIES) as Language[];

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

  // One row of fixed height from the lg breakpoint, where everything fits in both languages. Below it the
  // bar wraps instead of cutting controls off: the tools take a row of their own, and on a phone (below
  // sm) they wrap one by one, which needs a row less than keeping them together.
  return (
    <header className="flex min-h-12 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-panel px-3 py-1.5 lg:h-12 lg:flex-nowrap lg:overflow-hidden lg:py-0">
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

      {/* Tools: pushed to the right end of the single row; one group from sm, loose items below it. */}
      <div className="contents items-center gap-2 sm:flex sm:w-full lg:ml-auto lg:w-auto">
        <SolverControl />
        <Button variant="ghost" onClick={onOpenTheory} aria-label={t.topbar.theory} title={`${t.topbar.theory} (K)`}>
          <BookOpen aria-hidden className="size-4" />
          {/* The full label needs the room of the 2xl row; from xl its first word is shown. */}
          <span className="hidden xl:inline 2xl:hidden">{t.common.theory}</span>
          <span className="hidden 2xl:inline">{t.topbar.theory}</span>
        </Button>
        <ExchangeMenu onNotify={onNotify} />
        {/* Interface settings stay together and keep to the right edge of whichever row they land on. */}
        <div className="ml-auto flex items-center gap-2">
          {/* One name for both states; the state itself is the pressed attribute (WCAG 4.1.2). */}
          <IconButton label={t.topbar.sound} shortcut="M" pressed={!muted} onClick={() => setPrefs({ muted: !muted })}>
            {muted ? <VolumeX /> : <Volume2 />}
          </IconButton>
          {/* Shown at every width: its dialog holds the switch for the single-key shortcuts. */}
          <IconButton label={t.topbar.shortcuts} shortcut="?" onClick={onOpenShortcuts}>
            <Keyboard />
          </IconButton>
          <Segmented<Language>
            size="sm"
            ariaLabel={t.topbar.language}
            value={language}
            onChange={(next) => setPrefs({ language: next })}
            options={LANGUAGES.map((code) => ({
              value: code,
              label: code.toUpperCase(),
              // Starts with the visible code and names the language in that language (WCAG 2.5.3).
              ariaLabel: `${code.toUpperCase()} – ${DICTIONARIES[code].meta.languageName}`,
            }))}
          />
          <IconButton label={t.topbar.panel} onClick={onOpenInspector} className="lg:hidden">
            <SlidersHorizontal />
          </IconButton>
        </div>
      </div>
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
  // A timer with announcements switched off. An <output> element is a live region, and one whose text
  // changes twelve times per second would keep a screen reader from saying anything else.
  return (
    <div
      role="timer"
      aria-live="off"
      aria-label={t.transport.time}
      className="num ml-1 hidden min-w-[104px] whitespace-nowrap rounded-sm border border-line bg-bg px-2 py-1 text-right text-[12.5px] text-ink-2 md:block"
    >
      <span className="text-ink-4">t = </span>
      {fixed(sim.time, 2)}
      <span className="text-ink-4"> s</span>
    </div>
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
  const shown = `${METHOD_SHORT[solver.method]} · ${formatRate(solver.rateHz)}`;

  return (
    <Popover
      ariaLabel={t.solver.title}
      // Never wider than a narrow screen.
      widthClass="w-[380px] max-w-[calc(100vw-24px)]"
      trigger={
        <Button
          variant="secondary"
          // The name starts with the text on the button (WCAG 2.5.3) and states a changed solver in words.
          aria-label={`${shown} – ${isDefault ? t.solver.button : t.solver.nonDefault}: ${t.solver.methods[solver.method].name}`}
          title={isDefault ? undefined : t.solver.nonDefault}
          className={cn("num", !isDefault && "border-warn/60 text-warn hover:text-warn")}
        >
          {/* A changed solver is marked by the shape of the icon as well, not by the amber tint alone (WCAG 1.4.1). */}
          {isDefault ? <Cpu aria-hidden className="size-3.5" /> : <TriangleAlert aria-hidden className="size-3.5" />}
          <span>{METHOD_SHORT[solver.method]}</span>
          <span className="hidden text-ink-4 sm:inline">·</span>
          <span className="hidden sm:inline">{formatRate(solver.rateHz)}</span>
        </Button>
      }
    >
      {/*
        On a low screen the content scrolls within the height that is available to the popover, less its
        padding and border. The 4 px that reach into that padding leave room for the focus rings.
      */}
      <div className="-m-1 max-h-[calc(var(--radix-popover-content-available-height)-28px)] overflow-y-auto p-1">
        <h2 className="text-[14px] font-semibold text-ink">{t.solver.title}</h2>
        <p className="mt-1 text-[12.5px] leading-snug text-ink-3">{t.solver.intro}</p>
        {/* Said here, where the choice is made: a change of solver starts a new run (Simulation.setSolver). */}
        <p className="mt-2 flex gap-2 text-[12.5px] leading-snug text-ink-2">
          <RotateCcw aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-3" />
          <span>{t.solver.restartNote}</span>
        </p>

        {/* Buttons, not radio buttons: a choice is applied when it is activated, never by moving through the list. */}
        <div role="group" aria-label={t.solver.method} className="mt-3 grid gap-1">
          {INTEGRATOR_IDS.map((id) => {
            const selected = id === solver.method;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => sim.setSolver({ ...solver, method: id })}
                className={cn(
                  "rounded-sm border px-2.5 py-2 text-left transition-colors duration-100",
                  selected ? "border-accent/70 bg-accent-soft" : "border-line hover:border-line-strong hover:bg-hover",
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn("text-[13px] font-medium", selected ? "text-accent-strong" : "text-ink")}>
                    {selected ? <Check aria-hidden className="-mt-0.5 mr-1.5 inline size-3.5" /> : null}
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

        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
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
            {t.solver.restoreDefault} ({METHOD_SHORT[DEFAULT_SOLVER.method]} · {formatRate(DEFAULT_SOLVER.rateHz)})
          </Button>
        ) : null}
      </div>
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
          <Button variant="ghost" aria-label={t.topbar.exportMenu} title={t.topbar.exportMenu}>
            <Download className="size-4" />
            {/* Shown from 1680 px (105rem): the 2xl row, which also gains the time scale, has no room for it. */}
            <span className="hidden min-[105rem]:inline">{t.topbar.exportMenu}</span>
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
