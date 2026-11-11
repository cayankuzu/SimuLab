"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useSimState } from "@/sim/react";
import { useT } from "@/i18n";
import { cn, IconButton } from "../kit/core";
import { Segmented, Switch, Tab, TabList, TabPanel, Tabs } from "../kit/controls";
import { DivergencePlot } from "../plots/DivergencePlot";
import { EnergyPlot } from "../plots/EnergyPlot";
import { PhasePlot } from "../plots/PhasePlot";
import { PoincarePlot } from "../plots/PoincarePlot";
import { ResponsePlot } from "../plots/ResponsePlot";
import { SpectrumPlot } from "../plots/SpectrumPlot";
import { TimeSeriesPlot } from "../plots/TimeSeriesPlot";
import { DOCK_HEIGHT, setPrefs, TIME_WINDOWS, usePrefs, type DockTab } from "../prefs";

/**
 * Plot panel under the scene. Always visible together with the parameter
 * panel; its height is adjustable with the pointer or the keyboard.
 */
export function AnalysisDock() {
  const t = useT();
  const moduleId = useSimState((state) => state.module);
  const open = usePrefs((prefs) => prefs.dockOpen);
  const height = usePrefs((prefs) => prefs.dockHeight);
  const storedTab = usePrefs((prefs) => prefs.dockTab);
  const timeWindow = usePrefs((prefs) => prefs.timeWindow);
  const showExact = usePrefs((prefs) => prefs.showExact);
  // The chaos group exists for the pendulum only.
  const tab: DockTab = moduleId === "oscillator" && storedTab === "chaos" ? "signals" : storedTab;
  const dragStart = useRef<{ y: number; height: number } | null>(null);

  const clamp = (value: number) => Math.min(DOCK_HEIGHT.max, Math.max(DOCK_HEIGHT.min, value));

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      dragStart.current = { y: event.clientY, height };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [height],
  );
  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const start = dragStart.current;
    if (!start) return;
    setPrefs({ dockHeight: clamp(start.height + (start.y - event.clientY)), dockOpen: true });
  }, []);
  const onPointerUp = useCallback(() => {
    dragStart.current = null;
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp") setPrefs({ dockHeight: clamp(height + 24), dockOpen: true });
    else if (event.key === "ArrowDown") setPrefs({ dockHeight: clamp(height - 24) });
    else return;
    event.preventDefault();
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setPrefs({ dockTab: value as DockTab, dockOpen: true })}
      className="flex shrink-0 flex-col border-t border-line bg-panel"
      style={{ height: open ? height : 37 }}
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label={t.plots.resize}
        aria-valuemin={DOCK_HEIGHT.min}
        aria-valuemax={DOCK_HEIGHT.max}
        aria-valuenow={height}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        className="group -mt-[3px] flex h-[6px] shrink-0 cursor-row-resize items-center justify-center"
      >
        <span className="h-px w-full bg-transparent transition-colors group-hover:bg-accent group-focus-visible:bg-accent" />
      </div>

      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-line px-3">
        <TabList ariaLabel={t.plots.tabs.label}>
          <Tab value="signals">{t.plots.tabs.signals}</Tab>
          <Tab value="energy">{t.plots.tabs.energy}</Tab>
          <Tab value="frequency">{t.plots.tabs.frequency}</Tab>
          {moduleId === "pendulum" ? <Tab value="chaos">{t.plots.tabs.chaos}</Tab> : null}
        </TabList>
        <div className="min-w-0 flex-1" />
        {open && tab === "signals" && moduleId === "oscillator" ? (
          <div className="hidden md:block">
            <Switch checked={showExact} onChange={(value) => setPrefs({ showExact: value })} label={t.plots.timeSeries.showExact} />
          </div>
        ) : null}
        {open && (tab === "signals" || tab === "energy") ? (
          <Segmented
            size="sm"
            ariaLabel={t.plots.window}
            value={String(timeWindow)}
            onChange={(value) => setPrefs({ timeWindow: Number(value) })}
            options={TIME_WINDOWS.map((seconds) => ({ value: String(seconds), label: t.plots.seconds(seconds) }))}
          />
        ) : null}
        <IconButton
          size="sm"
          label={open ? t.plots.collapse : t.plots.expand}
          shortcut="D"
          aria-expanded={open}
          onClick={() => setPrefs({ dockOpen: !open })}
        >
          {open ? <ChevronDown /> : <ChevronUp />}
        </IconButton>
      </div>

      {open ? (
        <>
          <DockPanel value="signals">
            <TimeSeriesPlot />
            <PhasePlot />
          </DockPanel>
          <DockPanel value="energy" single>
            <EnergyPlot />
          </DockPanel>
          <DockPanel value="frequency">
            {moduleId === "oscillator" ? <ResponsePlot /> : null}
            <SpectrumPlot />
          </DockPanel>
          {moduleId === "pendulum" ? (
            <DockPanel value="chaos">
              <DivergencePlot />
              <PoincarePlot />
            </DockPanel>
          ) : null}
        </>
      ) : null}
    </Tabs>
  );
}

function DockPanel({ value, single = false, children }: { value: DockTab; single?: boolean; children: React.ReactNode }) {
  return (
    <TabPanel
      value={value}
      className={cn(
        "min-h-0 flex-1 gap-4 px-3 pb-2 pt-2.5 outline-none data-[state=active]:grid",
        single ? "grid-cols-1" : "grid-cols-1 md:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]",
      )}
    >
      {children}
    </TabPanel>
  );
}
