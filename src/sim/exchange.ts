/**
 * Data exchange: telemetry export (CSV), reproducible experiment files (JSON)
 * and shareable links. Everything needed to reproduce a run - parameters,
 * initial conditions, integrator and step size - travels with the data.
 */

import { MAX_LINKS, SOLVER_RATES, TWIN_OFFSETS } from "@/physics/constants";
import { INTEGRATORS, type IntegratorId } from "@/physics/integrators";
import { OSC_CH, PEND_CH, type SimState, type Simulation } from "./Simulation";

export const EXPERIMENT_SCHEMA = "simulab.experiment";
export const EXPERIMENT_VERSION = 1;

export interface ExperimentFile {
  schema: typeof EXPERIMENT_SCHEMA;
  version: number;
  module: SimState["module"];
  solver: { method: IntegratorId; rateHz: number };
  oscillator: {
    mass: number;
    stiffness: number;
    damping: number;
    driveAmplitude: number;
    driveFrequency: number;
    x0: number;
    v0: number;
  };
  pendulum: {
    count: number;
    masses: number[];
    lengths: number[];
    gravity: number;
    jointDamping: number;
    thetas: number[];
    omegas: number[];
    twinEnabled: boolean;
    twinOffset: number;
  };
}

export function toExperimentFile(state: SimState): ExperimentFile {
  return {
    schema: EXPERIMENT_SCHEMA,
    version: EXPERIMENT_VERSION,
    module: state.module,
    solver: { method: state.solver.method, rateHz: state.solver.rateHz },
    oscillator: { ...state.oscillator, x0: state.oscInitial.x, v0: state.oscInitial.v },
    pendulum: {
      count: state.pendulum.count,
      masses: [...state.pendulum.masses],
      lengths: [...state.pendulum.lengths],
      gravity: state.pendulum.gravity,
      jointDamping: state.pendulum.jointDamping,
      thetas: [...state.pendInitial.thetas],
      omegas: [...state.pendInitial.omegas],
      twinEnabled: state.twin.enabled,
      twinOffset: state.twin.offset,
    },
  };
}

const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

function numberArray(value: unknown, length: number): number[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > length) return null;
  const out: number[] = [];
  for (const item of value) {
    if (!isNumber(item)) return null;
    out.push(item);
  }
  return out;
}

/**
 * Validates untrusted input (a file chosen by the user or a link) and turns it
 * into a state patch. Returns null if the data is not a valid experiment.
 * Numerical ranges are enforced afterwards by Simulation.load().
 */
export function fromExperimentFile(data: unknown): Partial<SimState> | null {
  if (!isRecord(data) || data.schema !== EXPERIMENT_SCHEMA || data.version !== EXPERIMENT_VERSION) return null;
  const { module, solver, oscillator, pendulum } = data;
  if (module !== "oscillator" && module !== "pendulum") return null;
  if (!isRecord(solver) || !isRecord(oscillator) || !isRecord(pendulum)) return null;
  // Own-property check: `"constructor" in INTEGRATORS` would be true through the prototype chain.
  if (typeof solver.method !== "string" || !Object.hasOwn(INTEGRATORS, solver.method)) return null;
  if (!isNumber(solver.rateHz) || !SOLVER_RATES.includes(solver.rateHz)) return null;

  const o = oscillator;
  if (![o.mass, o.stiffness, o.damping, o.driveAmplitude, o.driveFrequency, o.x0, o.v0].every(isNumber)) return null;

  const p = pendulum;
  const masses = numberArray(p.masses, MAX_LINKS);
  const lengths = numberArray(p.lengths, MAX_LINKS);
  const thetas = numberArray(p.thetas, MAX_LINKS);
  const omegas = numberArray(p.omegas, MAX_LINKS);
  if (!masses || !lengths || !thetas || !omegas) return null;
  if (!isNumber(p.count) || !isNumber(p.gravity) || !isNumber(p.jointDamping)) return null;
  if (typeof p.twinEnabled !== "boolean" || !isNumber(p.twinOffset)) return null;
  const twinOffset = TWIN_OFFSETS.includes(p.twinOffset) ? p.twinOffset : TWIN_OFFSETS[1];

  return {
    module,
    solver: { method: solver.method as IntegratorId, rateHz: solver.rateHz },
    oscillator: {
      mass: o.mass as number,
      stiffness: o.stiffness as number,
      damping: o.damping as number,
      driveAmplitude: o.driveAmplitude as number,
      driveFrequency: o.driveFrequency as number,
    },
    oscInitial: { x: o.x0 as number, v: o.v0 as number },
    pendulum: { count: p.count, masses, lengths, gravity: p.gravity, jointDamping: p.jointDamping },
    pendInitial: { thetas, omegas },
    twin: { enabled: p.twinEnabled, offset: twinOffset },
    scenario: { oscillator: null, pendulum: null },
  };
}

/* ------------------------------------------------------------------ */
/* Shareable links                                                      */
/* ------------------------------------------------------------------ */

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const HASH_KEY = "x=";

/** Encodes the experiment definition into a URL fragment (never sent to a server). */
export function encodeShareHash(state: SimState): string {
  return `#${HASH_KEY}${toBase64Url(JSON.stringify(toExperimentFile(state)))}`;
}

export function decodeShareHash(hash: string): Partial<SimState> | null {
  const index = hash.indexOf(HASH_KEY);
  if (index < 0) return null;
  try {
    return fromExperimentFile(JSON.parse(fromBase64Url(hash.slice(index + HASH_KEY.length))));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* CSV                                                                  */
/* ------------------------------------------------------------------ */

export interface CsvDialect {
  delimiter: "," | ";";
  decimal: "." | ",";
  /** Prepend a UTF-8 byte-order mark (spreadsheet applications need it). */
  bom: boolean;
}

/** Comma + point: Python, MATLAB, R, gnuplot. */
export const CSV_INTERNATIONAL: CsvDialect = { delimiter: ",", decimal: ".", bom: false };
/** Semicolon + decimal comma: spreadsheet applications running in a Turkish/European locale. */
export const CSV_SPREADSHEET: CsvDialect = { delimiter: ";", decimal: ",", bom: true };

function formatNumber(value: number, dialect: CsvDialect): string {
  if (!Number.isFinite(value)) return "";
  const text = String(Number(value.toPrecision(10)));
  return dialect.decimal === "." ? text : text.replace(".", ",");
}

interface Column {
  name: string;
  channel: number;
}

function oscillatorColumns(): Column[] {
  return [
    { name: "t_s", channel: OSC_CH.t },
    { name: "x_m", channel: OSC_CH.x },
    { name: "v_m_per_s", channel: OSC_CH.v },
    { name: "a_m_per_s2", channel: OSC_CH.a },
    { name: "drive_phase_rad", channel: OSC_CH.phi },
    { name: "F_spring_N", channel: OSC_CH.fSpring },
    { name: "F_damper_N", channel: OSC_CH.fDamper },
    { name: "F_drive_N", channel: OSC_CH.fDrive },
    { name: "E_kinetic_J", channel: OSC_CH.kinetic },
    { name: "E_potential_J", channel: OSC_CH.potential },
    { name: "Q_damper_J", channel: OSC_CH.damperHeat },
    { name: "Q_impact_J", channel: OSC_CH.impactHeat },
    { name: "W_drive_J", channel: OSC_CH.driveWork },
    { name: "ledger_residual_J", channel: OSC_CH.residual },
    { name: "x_exact_m", channel: OSC_CH.xExact },
  ];
}

function pendulumColumns(n: number, twin: boolean): Column[] {
  const columns: Column[] = [{ name: "t_s", channel: PEND_CH.t }];
  for (let i = 0; i < n; i++) columns.push({ name: `theta${i + 1}_rad`, channel: PEND_CH.theta + i });
  for (let i = 0; i < n; i++) columns.push({ name: `omega${i + 1}_rad_per_s`, channel: PEND_CH.omega + i });
  columns.push(
    { name: "E_kinetic_J", channel: PEND_CH.kinetic },
    { name: "E_potential_J", channel: PEND_CH.potential },
    { name: "Q_joints_J", channel: PEND_CH.heat },
    { name: "ledger_residual_J", channel: PEND_CH.residual },
    { name: "lyapunov_estimate_per_s", channel: PEND_CH.lyapunov },
  );
  if (twin) {
    columns.push(
      { name: "twin_separation_rad", channel: PEND_CH.separation },
      { name: `twin_theta${n}_rad`, channel: PEND_CH.twinTheta },
      { name: `twin_omega${n}_rad_per_s`, channel: PEND_CH.twinOmega },
    );
  }
  return columns;
}

/**
 * Serialises the recorded telemetry of the active experiment. The header
 * comment block ("# ...") carries the complete metadata; numerical values use
 * 10 significant digits.
 */
export function buildCsv(sim: Simulation, dialect: CsvDialect = CSV_INTERNATIONAL, exportedAt = new Date()): string {
  const state = sim.getState();
  const isOscillator = state.module === "oscillator";
  const series = isOscillator ? sim.oscSeries : sim.pendSeries;
  const columns = isOscillator
    ? oscillatorColumns()
    : pendulumColumns(state.pendulum.count, state.twin.enabled);
  const h = 1 / state.solver.rateHz;
  const lines: string[] = [];
  const meta = (text: string) => lines.push(`# ${text}`);

  meta("SimuLab telemetry export (schema simulab.telemetry/1)");
  meta(`exported: ${exportedAt.toISOString()}`);
  meta(`experiment: ${state.module}`);
  meta(
    `integrator: ${state.solver.method} (order ${INTEGRATORS[state.solver.method].order}), fixed step h = ${h} s (${state.solver.rateHz} Hz)`,
  );
  meta(`sample interval: ${sim.sampleInterval} s; samples: ${series.length}`);
  if (isOscillator) {
    const p = state.oscillator;
    meta(`model: m x'' + c x' + k x = F0 cos(phi), phi' = omega; stops at x = ${sim.osc.xMin} m and ${sim.osc.xMax} m, restitution e = ${sim.osc.restitution}`);
    meta(`m = ${p.mass} kg; k = ${p.stiffness} N/m; c = ${p.damping} N s/m; F0 = ${p.driveAmplitude} N; omega = ${p.driveFrequency} rad/s`);
    meta(`initial conditions: x0 = ${state.oscInitial.x} m; v0 = ${state.oscInitial.v} m/s; phi0 = 0 rad`);
    meta("ledger: E_kinetic + E_potential + Q_damper + Q_impact - W_drive - E0 = ledger_residual (numerical error)");
    meta("x_exact: closed-form solution of the linear model, restarted at every impact or parameter change");
  } else {
    const p = state.pendulum;
    const n = p.count;
    meta(`model: planar ${n}-link pendulum, point masses on massless rigid rods, absolute angles from the downward vertical`);
    meta(`m [kg] = ${p.masses.slice(0, n).join(" ")}; L [m] = ${p.lengths.slice(0, n).join(" ")}`);
    meta(`g = ${p.gravity} m/s^2; viscous joint coefficient b = ${p.jointDamping} N m s/rad`);
    meta(`initial angles [rad] = ${state.pendInitial.thetas.slice(0, n).join(" ")}`);
    meta(`initial angular velocities [rad/s] = ${state.pendInitial.omegas.slice(0, n).join(" ")}`);
    if (state.twin.enabled) meta(`twin trajectory: theta1 offset ${state.twin.offset} rad at launch`);
    meta("lyapunov_estimate: finite-time largest Lyapunov exponent (Benettin two-trajectory method, d0 = 1e-8)");
  }
  meta(`decimal separator "${dialect.decimal}", field delimiter "${dialect.delimiter}"`);

  lines.push(columns.map((column) => column.name).join(dialect.delimiter));
  const row: string[] = new Array<string>(columns.length);
  for (let i = 0; i < series.length; i++) {
    for (let c = 0; c < columns.length; c++) row[c] = formatNumber(series.get(columns[c].channel, i), dialect);
    lines.push(row.join(dialect.delimiter));
  }
  return (dialect.bom ? "﻿" : "") + lines.join("\n") + "\n";
}

/** Timestamp suitable for file names: 20261110-2145. */
export function fileStamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}

/** Triggers a client-side download through a temporary object URL. */
export function downloadText(filename: string, text: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
