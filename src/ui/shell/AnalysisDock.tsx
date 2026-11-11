"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { useSimState } from "@/sim/react";
import { useT } from "@/i18n";
import { cn, IconButton, Tooltip } from "../kit/core";
import { Segmented, Switch, Tab, TabList, TabPanel, Tabs } from "../kit/controls";
import { DivergencePlot } from "../plots/DivergencePlot";
import { EnergyPlot } from "../plots/EnergyPlot";
import { PhasePlot } from "../plots/PhasePlot";
import { PoincarePlot } from "../plots/PoincarePlot";
import { ResponsePlot } from "../plots/ResponsePlot";
import { SpectrumPlot } from "../plots/SpectrumPlot";
import { TimeSeriesPlot } from "../plots/TimeSeriesPlot";
import { DOCK_HEIGHT, setPrefs, TIME_WINDOWS, usePrefs, type DockTab } from "../prefs";

/** Heights the dock steps through when its handle is clicked instead of dragged. */
const HEIGHT_STOPS: readonly number[] = [
  DOCK_HEIGHT.min,
  DOCK_HEIGHT.initial,
  Math.round((DOCK_HEIGHT.initial + DOCK_HEIGHT.max) / 2),
  DOCK_HEIGHT.max,
];
/** Change of height per arrow-key press [px]. */
const KEY_STEP = 24;
/** Pointer travel up to which a press on the handle counts as a click [px]. */
const CLICK_SLOP = 3;

/** A height within the limits of the dock, in whole pixels (a pointer position can be fractional). */
const clamp = (value: number) => Math.round(Math.min(DOCK_HEIGHT.max, Math.max(DOCK_HEIGHT.min, value)));

/**
 * Plot panel under the scene. Always visible together with the parameter
 * panel; its height is set by dragging the handle on its upper edge, by
 * clicking that handle or from the keyboard.
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
  const press = useRef<{ y: number; height: number; dragged: boolean } | null>(null);

  /**
   * The way to change the height without a dragging movement (WCAG 2.5.7):
   * the next stop above the present height, and from the tallest back to the
   * lowest. A collapsed dock is opened instead.
   */
  const stepHeight = () => {
    if (!open) setPrefs({ dockOpen: true });
    else setPrefs({ dockHeight: HEIGHT_STOPS.find((stop) => stop > height) ?? DOCK_HEIGHT.min });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    press.current = { y: event.clientY, height, dragged: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = press.current;
    if (!start) return;
    const travel = start.y - event.clientY;
    if (!start.dragged && Math.abs(travel) <= CLICK_SLOP) return;
    start.dragged = true;
    setPrefs({ dockHeight: clamp(start.height + travel), dockOpen: true });
  };
  const onPointerUp = () => {
    const start = press.current;
    press.current = null;
    if (start && !start.dragged) stepHeight();
  };
  const onPointerCancel = () => {
    press.current = null;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp") setPrefs({ dockHeight: clamp(height + KEY_STEP), dockOpen: true });
    else if (event.key === "ArrowDown") setPrefs({ dockHeight: clamp(height - KEY_STEP) });
    else if (event.key === "Home") setPrefs({ dockHeight: DOCK_HEIGHT.min });
    else if (event.key === "End") setPrefs({ dockHeight: DOCK_HEIGHT.max, dockOpen: true });
    else if (event.key === "Enter" || event.key === " ") stepHeight();
    else return;
    event.preventDefault();
  };

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setPrefs({ dockTab: value as DockTab, dockOpen: true })}
      className="flex shrink-0 flex-col border-t border-line bg-panel"
      // Collapsed, the dock is as high as its handle strip and its header.
      style={open ? { height } : undefined}
    >
      {/*
        The handle is 24 px high (WCAG 2.5.8) and lies across the upper edge of the dock: 11 px over the
        bottom margin of the scene, which holds no control, the edge itself, and a 12 px strip of the dock
        that shows the grip. The line and the grip light up under the pointer and with the focus.
      */}
      <Tooltip label={t.dock.resizeHint} side="top">
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
          onPointerCancel={onPointerCancel}
          onKeyDown={onKeyDown}
          className="group relative -mt-3 flex h-6 shrink-0 cursor-row-resize touch-none flex-col items-center justify-end pb-1 focus-visible:-outline-offset-2!"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-[11px] h-px bg-transparent transition-colors group-hover:bg-accent group-focus-visible:bg-accent"
          />
          <span
            aria-hidden
            className="h-[3px] w-8 rounded-full bg-edge transition-colors group-hover:bg-accent group-focus-visible:bg-accent"
          />
        </div>
      </Tooltip>

      {/*
        Below md the dock can be narrower than tabs and controls together (about 460 px for the pendulum);
        the controls then move below the tabs instead of being cut off.
      */}
      <div className="flex min-h-9 shrink-0 flex-wrap items-center gap-x-3 border-b border-line px-3 md:flex-nowrap">
        <TabList ariaLabel={t.plots.tabs.label}>
          <Tab value="signals">{t.plots.tabs.signals}</Tab>
          <Tab value="energy">{t.plots.tabs.energy}</Tab>
          <Tab value="frequency">{t.plots.tabs.frequency}</Tab>
          {moduleId === "pendulum" ? <Tab value="chaos">{t.plots.tabs.chaos}</Tab> : null}
        </TabList>
        <div className="ml-auto flex h-9 items-center gap-3">
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
          {/* One name for both states; whether the panel is open is the expanded attribute (WCAG 4.1.2). */}
          <IconButton
            size="sm"
            label={t.plots.toggle}
            shortcut="D"
            aria-expanded={open}
            onClick={() => setPrefs({ dockOpen: !open })}
          >
            {open ? <ChevronDown /> : <ChevronUp />}
          </IconButton>
        </div>
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
