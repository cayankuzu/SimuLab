"use client";

import { FlaskConical, Gauge, SlidersHorizontal } from "lucide-react";
import { TASKS } from "@/sim/tasks";
import { useT } from "@/i18n";
import { MeasurementsPanel } from "../inspector/MeasurementsPanel";
import { ParametersPanel } from "../inspector/ParametersPanel";
import { TasksPanel } from "../inspector/TasksPanel";
import { Tab, TabList, TabPanel, Tabs } from "../kit/controls";
import { useTaskSession } from "../inspector/taskRunner";
import { setPrefs, usePrefs, type InspectorTab } from "../prefs";

/**
 * Right-hand panel. It stays visible next to the scene and the plots, so a
 * parameter can be changed while its effect is being watched.
 */
export function Inspector() {
  const t = useT();
  const tab = usePrefs((prefs) => prefs.inspectorTab);
  const completed = usePrefs((prefs) => prefs.completedTasks.length);
  const taskActive = useTaskSession((session) => session.active !== null);

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setPrefs({ inspectorTab: value as InspectorTab })}
      className="flex h-full min-h-0 flex-col bg-panel"
    >
      <div className="shrink-0 border-b border-line px-4">
        <TabList ariaLabel={t.parameters.tabs.label}>
          <Tab value="parameters">
            <SlidersHorizontal className="size-3.5" />
            {t.parameters.tabs.parameters}
          </Tab>
          <Tab value="measurements">
            <Gauge className="size-3.5" />
            {t.parameters.tabs.measurements}
          </Tab>
          <Tab value="tasks">
            <FlaskConical className="size-3.5" />
            {t.parameters.tabs.tasks}
            {/* The bare count and the dot are abbreviations for the eye; the name of the tab spells them out. */}
            {completed > 0 ? (
              <>
                <span aria-hidden className="num text-[11px] text-ink-3">
                  {completed}
                </span>
                <span className="sr-only">{t.tasks.progress(completed, TASKS.length)}</span>
              </>
            ) : null}
            {taskActive ? (
              <>
                <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                <span className="sr-only"> — {t.tasks.status.active}</span>
              </>
            ) : null}
          </Tab>
        </TabList>
      </div>
      <TabPanel value="parameters" className="relative min-h-0 flex-1 overflow-y-auto outline-none">
        <ParametersPanel />
      </TabPanel>
      <TabPanel value="measurements" className="relative min-h-0 flex-1 overflow-y-auto outline-none">
        <MeasurementsPanel />
      </TabPanel>
      {/*
        An open task sheet has a bar that sticks to the top of this scroller: 41 px (6 + 28 + 6 px and
        a 1 px border). The scroll padding keeps an element that receives the keyboard focus, and its
        focus ring, clear of that bar (WCAG 2.4.11).
      */}
      <TabPanel value="tasks" className="relative min-h-0 flex-1 scroll-pt-12 overflow-y-auto outline-none">
        <TasksPanel />
      </TabPanel>
    </Tabs>
  );
}
