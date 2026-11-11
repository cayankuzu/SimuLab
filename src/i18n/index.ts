/**
 * Interface dictionaries. Turkish is the source language; the English
 * dictionary is typed against it, so a missing or extra key is a compile error.
 * Each area of the interface owns one module in ./tr and ./en.
 */

import { usePrefs, type Language } from "@/ui/prefs";
import { measurements as enMeasurements } from "./en/measurements";
import { parameters as enParameters } from "./en/parameters";
import { plots as enPlots } from "./en/plots";
import { plotsChaos as enPlotsChaos } from "./en/plotsChaos";
import { plotsFrequency as enPlotsFrequency } from "./en/plotsFrequency";
import { plotsState as enPlotsState } from "./en/plotsState";
import { shell as enShell } from "./en/shell";
import { tasks as enTasks } from "./en/tasks";
import { theory as enTheory } from "./en/theory";
import { verification as enVerification } from "./en/verification";
import { measurements as trMeasurements } from "./tr/measurements";
import { parameters as trParameters } from "./tr/parameters";
import { plots as trPlots } from "./tr/plots";
import { plotsChaos as trPlotsChaos } from "./tr/plotsChaos";
import { plotsFrequency as trPlotsFrequency } from "./tr/plotsFrequency";
import { plotsState as trPlotsState } from "./tr/plotsState";
import { shell as trShell } from "./tr/shell";
import { tasks as trTasks } from "./tr/tasks";
import { theory as trTheory } from "./tr/theory";
import { verification as trVerification } from "./tr/verification";

const tr = {
  ...trShell,
  parameters: trParameters,
  measurements: trMeasurements,
  plots: trPlots,
  plotsState: trPlotsState,
  plotsFrequency: trPlotsFrequency,
  plotsChaos: trPlotsChaos,
  tasks: trTasks,
  theory: trTheory,
  verification: trVerification,
};

export type Dictionary = typeof tr;

const en: Dictionary = {
  ...enShell,
  parameters: enParameters,
  measurements: enMeasurements,
  plots: enPlots,
  plotsState: enPlotsState,
  plotsFrequency: enPlotsFrequency,
  plotsChaos: enPlotsChaos,
  tasks: enTasks,
  theory: enTheory,
  verification: enVerification,
};

export const DICTIONARIES: Readonly<Record<Language, Dictionary>> = { tr, en };

/** Dictionary of the current interface language. */
export function useT(): Dictionary {
  return DICTIONARIES[usePrefs((prefs) => prefs.language)];
}

export type { Language };
