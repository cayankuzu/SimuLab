"use client";

import { useMemo, useRef, type ReactNode } from "react";
import { MAX_LINKS, OSC_GEOMETRY } from "@/physics/constants";
import { INTEGRATORS } from "@/physics/integrators";
import { predictionHorizon } from "@/physics/lyapunov";
import { dampingRatioFromDecrement, STEADY_TOLERANCE, steadyState } from "@/physics/measure";
import { oscillatorTheory, settlingTimeFromRest } from "@/physics/oscillator";
import { linearModes } from "@/physics/pendulum";
import { exactPendulumPeriod } from "@/physics/special";
import { useLiveTick, useSim, useSimState } from "@/sim/react";
import { DIVERGENCE_THRESHOLD, RESPONSE_CH } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { DASH, deviation, fixed, scientific } from "../format";
import { Chip, Section, Tex } from "../kit/core";
import { LINK_COLORS } from "../palette";

const DEG = 180 / Math.PI;

export function MeasurementsPanel() {
  const moduleId = useSimState((state) => state.module);
  return moduleId === "oscillator" ? <OscillatorMeasurements /> : <PendulumMeasurements />;
}

/* ------------------------------------------------------------------ */
/* Table building blocks                                                */
/* ------------------------------------------------------------------ */

interface ValueRow {
  symbol?: string;
  name: ReactNode;
  value: ReactNode;
  unit?: string;
}

function ValueTable({ rows, caption }: { rows: ValueRow[]; caption?: string }) {
  return (
    <table className="w-full text-[12px]">
      {caption ? <caption className="sr-only">{caption}</caption> : null}
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-line/60 last:border-b-0">
            <th scope="row" className="py-1 pr-2 text-left font-normal">
              <span className="flex items-baseline gap-2">
                {row.symbol ? <Tex className="w-9 shrink-0 text-[12.5px] text-ink">{row.symbol}</Tex> : null}
                <span className="text-ink-3">{row.name}</span>
              </span>
            </th>
            <td className="num whitespace-nowrap py-1 text-right text-ink">{row.value}</td>
            <td className="w-12 whitespace-nowrap py-1 pl-1.5 text-[11.5px] text-ink-3">{row.unit ?? ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface CompareRow {
  symbol: string;
  name: string;
  theory: string;
  measured: string;
  unit: string;
  deviation: string;
}

function CompareTable({ rows }: { rows: CompareRow[] }) {
  const t = useT();
  const c = t.measurements.columns;
  return (
    <table className="w-full text-[12px]">
      <thead>
        <tr className="border-b border-line text-ink-3">
          <th scope="col" className="py-1 text-left font-normal">
            {c.quantity}
          </th>
          <th scope="col" className="py-1 text-right font-normal">
            {c.theory}
          </th>
          <th scope="col" className="py-1 text-right font-normal">
            {c.measured}
          </th>
          <th scope="col" className="py-1 text-right font-normal">
            {c.deviation}
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-line/60 align-top last:border-b-0">
            <th scope="row" className="py-1 pr-1 text-left font-normal">
              <Tex className="text-[12.5px] text-ink">{row.symbol}</Tex>
              <span className="block text-[11.5px] leading-tight text-ink-3">
                {row.name}
                {row.unit ? ` [${row.unit}]` : ""}
              </span>
            </th>
            <td className="num whitespace-nowrap py-1 pl-1 text-right text-ink-2">{row.theory}</td>
            <td className="num whitespace-nowrap py-1 pl-1 text-right text-ink">{row.measured}</td>
            <td className="num whitespace-nowrap py-1 pl-1 text-right text-ink-2">{row.deviation}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[12px] leading-snug text-ink-3">{children}</p>;
}

function Formula({ children }: { children: string }) {
  return (
    <div className="mt-1.5 rounded-sm bg-raised px-3 py-2 text-[12.5px] text-ink">
      <Tex block>{children}</Tex>
    </div>
  );
}

const value = (x: number | null | undefined, decimals: number) => fixed(x, decimals);
const withSpread = (mean: number | null, spread: number | null, decimals: number) =>
  mean === null ? DASH : spread === null ? fixed(mean, decimals) : `${fixed(mean, decimals)} ± ${scientific(spread, 0)}`;

/* ------------------------------------------------------------------ */
/* Oscillator                                                           */
/* ------------------------------------------------------------------ */

function OscillatorMeasurements() {
  const t = useT();
  const sim = useSim();
  const params = useSimState((state) => state.oscillator);
  const initial = useSimState((state) => state.oscInitial);
  const solver = useSimState((state) => state.solver);
  const theory = useMemo(() => oscillatorTheory(params), [params]);
  const step = sim.stepMeter;
  const band = step.band;
  // Reference for the step-response instrument, from the closed-form solution at the actual damping
  // ratio and for the band of the instrument. The value 5.834 / omega0 holds at zeta = 1 only and
  // is already 4 % off at zeta = 0.98.
  const expectedSettling = useMemo(() => settlingTimeFromRest(params, band), [params, band]);
  useLiveTick(5);

  const text = t.measurements.oscillator;
  const meter = sim.oscMeter;
  const bandPercent = fixed(100 * band, 0);
  const driven = params.driveAmplitude > 0;
  const oscillatory = theory.zeta < 1;
  const free = !driven && oscillatory;
  const released = !driven && initial.v === 0 && Math.abs(step.initialDisplacement) > 0;

  const characteristic: ValueRow[] = [
    { symbol: String.raw`\omega_0`, name: text.characteristic.rows.omega0, value: value(theory.omega0, 4), unit: "rad/s" },
    { symbol: "f_0", name: text.characteristic.rows.frequency0, value: value(theory.omega0 / (2 * Math.PI), 4), unit: "Hz" },
    { symbol: "T_0", name: text.characteristic.rows.period0, value: value(theory.period0, 4), unit: "s" },
    { symbol: String.raw`c_\mathrm{kr}`, name: text.characteristic.rows.criticalDamping, value: value(theory.criticalDamping, 3), unit: "N·s/m" },
    {
      symbol: String.raw`\zeta`,
      name: (
        <>
          {text.characteristic.rows.zeta} <span className="text-ink-2">({text.characteristic.regimes[theory.regime]})</span>
        </>
      ),
      value: value(theory.zeta, 4),
    },
    { symbol: String.raw`\gamma`, name: text.characteristic.rows.gamma, value: value(theory.gamma, 4), unit: "1/s" },
    { symbol: String.raw`\omega_d`, name: text.characteristic.rows.omegaD, value: value(theory.omegaD, 4), unit: "rad/s" },
    { symbol: "T_d", name: text.characteristic.rows.periodD, value: value(theory.periodD, 4), unit: "s" },
    { symbol: String.raw`\Lambda`, name: text.characteristic.rows.logDecrement, value: value(theory.logDecrement, 4) },
    { symbol: "Q", name: text.characteristic.rows.qualityFactor, value: value(theory.qualityFactor, 3) },
    { symbol: String.raw`\tau`, name: text.characteristic.rows.decayTime, value: value(theory.decayTime, 3), unit: "s" },
  ];

  /* ---- measurement against theory ---- */
  const rows: CompareRow[] = [];
  const notes: ReactNode[] = [];
  const rowsText = text.comparison.rows;
  const period = meter.period;
  if (driven || free) {
    const expected = driven ? (2 * Math.PI) / params.driveFrequency : (theory.periodD ?? theory.period0);
    rows.push({
      symbol: driven ? String.raw`2\pi/\omega` : theory.zeta > 0 ? "T_d" : "T_0",
      name: driven ? rowsText.periodDriven : theory.zeta > 0 ? rowsText.periodDamped : rowsText.periodNatural,
      unit: "s",
      theory: value(expected, 5),
      measured: withSpread(period, meter.periodSpread, 5),
      deviation: deviation(period, expected),
    });
    notes.push(text.comparison.periodNote(meter.cycles));
  }
  if (free && theory.logDecrement !== null) {
    const decrement = meter.logDecrement;
    rows.push({
      symbol: String.raw`\Lambda`,
      name: rowsText.logDecrement,
      unit: "",
      theory: value(theory.logDecrement, 5),
      measured: value(decrement, 5),
      deviation: deviation(decrement, theory.logDecrement),
    });
    const measuredZeta = decrement === null ? null : dampingRatioFromDecrement(decrement);
    rows.push({
      symbol: String.raw`\zeta`,
      name: rowsText.zeta,
      unit: "",
      theory: value(theory.zeta, 5),
      measured: value(measuredZeta, 5),
      deviation: deviation(measuredZeta, theory.zeta),
    });
  }
  const drift = meter.amplitudeDrift;
  const centreDrift = meter.centreDrift;
  const settled = steadyState(drift, centreDrift, sim.oscUndisturbedFor, theory.transientRate);
  const steady = settled.steady;
  if (driven) {
    const trail = sim.responseTrail;
    const phase = trail.length > 0 ? trail.latest(RESPONSE_CH.phaseLag) : null;
    rows.push({
      symbol: "A",
      name: rowsText.amplitude,
      unit: "m",
      theory: value(theory.steadyAmplitude, 5),
      measured: value(meter.amplitude, 5),
      deviation: deviation(meter.amplitude, theory.steadyAmplitude),
    });
    rows.push({
      symbol: String.raw`\delta`,
      name: rowsText.phaseLag,
      unit: "rad",
      theory: value(theory.phaseLag, 5),
      measured: value(phase, 5),
      deviation: deviation(phase, theory.phaseLag),
    });
  }
  if (released) {
    const expectedOvershoot = theory.zeta < 1 ? Math.exp((-Math.PI * theory.zeta) / Math.sqrt(1 - theory.zeta * theory.zeta)) : 0;
    const settling = step.settlingTime;
    rows.push({
      symbol: "M_p",
      name: rowsText.overshoot,
      unit: "%",
      theory: value(100 * expectedOvershoot, 3),
      measured: value(100 * step.overshoot, 3),
      deviation: expectedOvershoot > 0 ? deviation(step.overshoot, expectedOvershoot) : DASH,
    });
    rows.push({
      symbol: "t_s",
      name: rowsText.settling(bandPercent),
      unit: "s",
      theory: value(expectedSettling, 4),
      measured: value(settling, 4),
      deviation: deviation(settling, expectedSettling),
    });
  }

  const energy = sim.osc.energy();
  const relative = Math.abs(energy.residual) / sim.osc.energyScale();
  const stepMs = 1000 / solver.rateHz;

  return (
    <div>
      <Section title={text.characteristic.title}>
        <ValueTable rows={characteristic} caption={text.characteristic.title} />
        <Note>{text.characteristic.decayNote}</Note>
        <Note>{text.characteristic.missing}</Note>
      </Section>

      <Section
        title={text.comparison.title}
        aside={
          driven ? (
            <Chip tone={drift === null ? "neutral" : steady ? "ok" : "warn"}>
              {drift === null ? text.comparison.steady.measuring : steady ? text.comparison.steady.reached : text.comparison.steady.transient}
            </Chip>
          ) : undefined
        }
      >
        {rows.length > 0 ? <CompareTable rows={rows} /> : <Note>{text.comparison.empty}</Note>}
        {sim.osc.impactCount > 0 && rows.length > 0 ? <Note>{text.comparison.impactNote}</Note> : null}
        {notes.map((note, index) => (
          <Note key={index}>{note}</Note>
        ))}
        {free && theory.logDecrement !== null ? (
          <>
            <Note>{text.comparison.decrementNote}</Note>
            <Formula>{String.raw`\Lambda = \frac{1}{n}\ln\frac{x_k}{x_{k+n}},\qquad \zeta = \frac{\Lambda}{\sqrt{4\pi^2 + \Lambda^2}}`}</Formula>
          </>
        ) : null}
        {driven ? (
          <>
            <Note>
              {text.comparison.steadyNote(
                fixed(100 * STEADY_TOLERANCE, 0),
                drift === null ? null : fixed(100 * drift, 2),
                centreDrift === null ? null : fixed(100 * centreDrift, 2),
                // Rounded up, so that "0" appears only once the waiting time has really passed.
                Number.isFinite(settled.remaining) ? fixed(Math.ceil(settled.remaining), 0) : null,
              )}
            </Note>
            <Note>{text.comparison.responseNote}</Note>
            {params.damping === 0 ? <Note>{text.comparison.undampedNote}</Note> : null}
          </>
        ) : null}
        {released ? (
          <>
            <Note>{text.comparison.stepNote(fixed(step.initialDisplacement, 2), bandPercent)}</Note>
            <Note>{text.comparison.stepTheoryNote}</Note>
            <Formula>{String.raw`M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}},\qquad t_s\big|_{\zeta=1} = \frac{5.834}{\omega_0}`}</Formula>
          </>
        ) : null}
      </Section>

      {driven ? (
        <Section title={text.driven.title}>
          <ValueTable
            caption={text.driven.title}
            rows={[
              { symbol: "x_s", name: text.driven.rows.staticDeflection, value: value(theory.staticDeflection, 4), unit: "m" },
              { symbol: "A", name: text.driven.rows.amplitude, value: value(theory.steadyAmplitude, 4), unit: "m" },
              { symbol: String.raw`\delta`, name: text.driven.rows.phaseLag, value: value(theory.phaseLag, 4), unit: "rad" },
              { symbol: String.raw`\omega_r`, name: text.driven.rows.omegaPeak, value: value(theory.omegaPeak, 4), unit: "rad/s" },
              { symbol: String.raw`A_r`, name: text.driven.rows.peakAmplitude, value: value(theory.peakAmplitude, 4), unit: "m" },
              { symbol: String.raw`\Delta\omega`, name: text.driven.rows.bandwidth, value: value(theory.bandwidth, 4), unit: "rad/s" },
              { symbol: String.raw`\langle P\rangle`, name: text.driven.rows.meanPower, value: value(theory.meanPower, 3), unit: "W" },
            ]}
          />
          <Note>{text.driven.note}</Note>
          {params.damping === 0 ? <Note>{text.driven.resonanceNote}</Note> : null}
        </Section>
      ) : null}

      <Section title={text.stops.title} aside={sim.osc.contact !== 0 ? <Chip tone="warn">{text.stops.resting}</Chip> : undefined}>
        <ValueTable
          caption={text.stops.title}
          rows={[
            { name: text.stops.rows.impacts, value: String(sim.osc.impactCount) },
            { symbol: "v^-", name: text.stops.rows.lastSpeed, value: sim.osc.impactCount > 0 ? value(sim.osc.lastImpactSpeed, 3) : DASH, unit: "m/s" },
            { symbol: "Q_e", name: text.stops.rows.heat, value: value(energy.impactHeat, 3), unit: "J" },
            { symbol: "e", name: text.stops.rows.restitution, value: value(sim.osc.restitution, 2) },
          ]}
        />
        <Note>{text.stops.note(fixed(OSC_GEOMETRY.xMin, 2), fixed(OSC_GEOMETRY.xMax, 2))}</Note>
        <Formula>{String.raw`v^+ = -e\,v^-,\qquad \Delta Q_e = \tfrac12 m\,(v^-)^2\,(1 - e^2)`}</Formula>
      </Section>

      <Section title={text.numerics.title}>
        <ValueTable
          caption={text.numerics.title}
          rows={[
            { symbol: String.raw`\Delta E`, name: text.numerics.rows.residual, value: scientific(energy.residual, 2), unit: "J" },
            { symbol: String.raw`|\Delta E|/E`, name: text.numerics.rows.relative, value: scientific(relative, 1) },
            { name: text.numerics.rows.exactError, value: scientific(sim.maxExactError, 1), unit: "m" },
            { name: text.numerics.rows.solver, value: <span className="font-sans">{t.solver.methods[solver.method].name}</span> },
            { symbol: "h", name: text.numerics.rows.step, value: value(stepMs, stepMs < 1 ? 3 : 2), unit: "ms" },
            { symbol: "p", name: text.numerics.rows.order, value: String(INTEGRATORS[solver.method].order) },
          ]}
        />
        <Note>{text.numerics.ledgerNote}</Note>
        <Note>{text.numerics.exactNote}</Note>
        {INTEGRATORS[solver.method].adaptive ? <Note>{text.numerics.adaptiveNote}</Note> : null}
      </Section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pendulum                                                             */
/* ------------------------------------------------------------------ */

function PendulumMeasurements() {
  const t = useT();
  const sim = useSim();
  const params = useSimState((state) => state.pendulum);
  const twin = useSimState((state) => state.twin);
  const modes = useMemo(() => (params.gravity > 0 ? linearModes(params) : null), [params]);
  const tension = useRef(new Float64Array(MAX_LINKS));
  useLiveTick(5);

  const text = t.measurements.pendulum;
  const n = params.count;
  const y = sim.pend.y;
  const gravity = params.gravity > 0;
  const periodMeter = sim.periodMeter;
  const energy = sim.pend.energy();
  const relative = Math.abs(energy.residual) / sim.pend.energyScale();

  // Smallest mechanical energy with which some link can pass through the upright position.
  let flipEnergy = Infinity;
  let flipLink = 0;
  for (let k = 0; k < n; k++) {
    const threshold = 2 * params.gravity * sim.model.mu[k] * params.lengths[k];
    if (threshold < flipEnergy) {
      flipEnergy = threshold;
      flipLink = k;
    }
  }

  const lambda = sim.lyapunov.exponent;
  const averaged = sim.lyapunov.time;
  const ready = averaged > 5;
  const horizon = predictionHorizon(lambda, Math.abs(twin.offset), DIVERGENCE_THRESHOLD);

  sim.model.rodForces(y, tension.current);

  const exact = n === 1 ? exactPendulumPeriod(params.lengths[0], params.gravity, y[0], y[1]) : null;
  const measuredAmplitude = sim.swingMeter.amplitude;

  return (
    <div>
      {exact ? (
        <Section title={text.period.title} aside={gravity ? <Chip>{text.period.motions[exact.motion]}</Chip> : undefined}>
          {gravity ? (
            <>
              <CompareTable
                rows={[
                  {
                    symbol: "T",
                    name: text.period.rows.exact,
                    unit: "s",
                    theory: Number.isFinite(exact.period) ? fixed(exact.period, 5) : "∞",
                    measured: withSpread(periodMeter.period, periodMeter.periodSpread, 5),
                    deviation: Number.isFinite(exact.period) ? deviation(periodMeter.period, exact.period) : DASH,
                  },
                  {
                    symbol: String.raw`\theta_0`,
                    name: text.period.rows.amplitude,
                    unit: "°",
                    theory: exact.motion === "libration" ? fixed(exact.amplitude * DEG, 3) : DASH,
                    measured: measuredAmplitude === null ? DASH : fixed(measuredAmplitude * DEG, 3),
                    deviation: exact.motion === "libration" ? deviation(measuredAmplitude, exact.amplitude) : DASH,
                  },
                ]}
              />
              <div className="mt-2">
                <ValueTable
                  rows={[
                    { symbol: "T_0", name: text.period.rows.smallAngle, value: fixed(exact.smallAngle, 5), unit: "s" },
                    {
                      symbol: "T/T_0",
                      name: text.period.rows.ratio,
                      value: Number.isFinite(exact.period) ? fixed(exact.period / exact.smallAngle, 5) : "∞",
                    },
                  ]}
                />
              </div>
              <Formula>
                {exact.motion === "rotation"
                  ? String.raw`\begin{gathered} T = \frac{2}{\kappa}\sqrt{\frac{L}{g}}\,K\!\left(\frac{1}{\kappa}\right) \\[6pt]\kappa^2 = \sin^2\frac{\theta}{2} + \frac{L\,\omega^2}{4g} \end{gathered}`
                  : String.raw`\begin{gathered} T = 4\sqrt{\frac{L}{g}}\,K\!\left(\sin\frac{\theta_0}{2}\right) \\[6pt]T_0 = 2\pi\sqrt{\frac{L}{g}} \end{gathered}`}
              </Formula>
              <Note>{text.period.theoryNote}</Note>
              <Note>{text.period.isochronism}</Note>
              <Note>{text.period.measureNote(periodMeter.cycles)}</Note>
              {params.jointDamping > 0 ? <Note>{text.period.dampingNote}</Note> : null}
            </>
          ) : (
            <Note>{text.period.zeroGravity}</Note>
          )}
        </Section>
      ) : null}

      <Section title={text.modes.title}>
        {modes ? (
          <>
            <table className="w-full text-[12px]">
              <caption className="sr-only">{text.modes.frequenciesCaption}</caption>
              <thead>
                <tr className="border-b border-line text-ink-3">
                  <th scope="col" className="py-1 text-left font-normal">
                    <Tex>k</Tex>
                  </th>
                  <th scope="col" className="py-1 text-right font-normal" title={text.modes.columns.omega}>
                    <Tex>{String.raw`\omega_k\,[\mathrm{rad/s}]`}</Tex>
                  </th>
                  <th scope="col" className="py-1 text-right font-normal" title={text.modes.columns.frequency}>
                    <Tex>{String.raw`f_k\,[\mathrm{Hz}]`}</Tex>
                  </th>
                  <th scope="col" className="py-1 text-right font-normal" title={text.modes.columns.period}>
                    <Tex>{String.raw`T_k\,[\mathrm{s}]`}</Tex>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from(modes.omega, (omega, k) => (
                  <tr key={k} className="border-b border-line/60 last:border-b-0">
                    <th scope="row" className="num py-1 text-left font-normal text-ink-2">
                      {k + 1}
                    </th>
                    <td className="num py-1 text-right text-ink">{fixed(omega, 4)}</td>
                    <td className="num py-1 text-right text-ink">{fixed(omega / (2 * Math.PI), 4)}</td>
                    <td className="num py-1 text-right text-ink">{fixed((2 * Math.PI) / omega, 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {n > 1 ? (
              <table className="mt-3 w-full text-[12px]">
                <caption className="pb-1 text-left text-[11.5px] text-ink-3">{text.modes.shapesCaption}</caption>
                <thead>
                  <tr className="border-b border-line text-ink-3">
                    <th scope="col" className="py-1 text-left font-normal">
                      <Tex>k</Tex>
                    </th>
                    {Array.from({ length: n }, (_, i) => (
                      <th key={i} scope="col" className="py-1 text-right font-normal" title={text.modes.columns.link(i + 1)}>
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden className="size-1.5 rounded-full" style={{ background: LINK_COLORS[i] }} />
                          <Tex>{String.raw`\theta_{${i + 1}}`}</Tex>
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: n }, (_, k) => {
                    let largest = 0;
                    for (let i = 0; i < n; i++) largest = Math.max(largest, Math.abs(modes.shapes[i * n + k]));
                    // Fix the sign so that the first link is positive.
                    const scale = (modes.shapes[k] < 0 ? -1 : 1) / (largest || 1);
                    return (
                      <tr key={k} className="border-b border-line/60 last:border-b-0">
                        <th scope="row" className="num py-1 text-left font-normal text-ink-2">
                          {k + 1}
                        </th>
                        {Array.from({ length: n }, (_, i) => (
                          <td key={i} className="num py-1 text-right text-ink">
                            {fixed(modes.shapes[i * n + k] * scale, 2)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : null}
            <Note>{text.modes.note}</Note>
            {n === 2 ? (
              <Note>{text.modes.presets(t.parameters.pendulum.presets.mode1.name, t.parameters.pendulum.presets.mode2.name)}</Note>
            ) : null}
            {n > 1 ? (
              <>
                <div className="mt-2">
                  <ValueTable
                    rows={[
                      {
                        symbol: "T",
                        name: text.modes.measured,
                        value: withSpread(periodMeter.period, periodMeter.periodSpread, 4),
                        unit: "s",
                      },
                    ]}
                  />
                </div>
                <Note>{text.modes.measuredNote(periodMeter.cycles)}</Note>
              </>
            ) : null}
          </>
        ) : (
          <Note>{text.modes.zeroGravity}</Note>
        )}
      </Section>

      <Section
        title={text.energy.title}
        aside={
          gravity ? (
            <Chip tone={energy.mechanical < flipEnergy ? "neutral" : "accent"}>
              {energy.mechanical < flipEnergy ? text.energy.verdict.impossible : text.energy.verdict.possible}
            </Chip>
          ) : undefined
        }
      >
        <ValueTable
          caption={text.energy.title}
          rows={[
            { symbol: "E_k", name: text.energy.rows.kinetic, value: fixed(energy.kinetic, 3), unit: "J" },
            { symbol: "E_p", name: text.energy.rows.potential, value: fixed(energy.potential, 3), unit: "J" },
            { symbol: "Q_b", name: text.energy.rows.heat, value: fixed(energy.heat, 3), unit: "J" },
            { symbol: "E", name: text.energy.rows.mechanical, value: fixed(energy.mechanical, 3), unit: "J" },
            ...(gravity
              ? [
                  { symbol: String.raw`E_p^\mathrm{max}`, name: text.energy.rows.maxPotential, value: fixed(sim.model.maxPotentialEnergy(), 3), unit: "J" },
                  { symbol: String.raw`E^\ast`, name: text.energy.rows.flip(flipLink + 1), value: fixed(flipEnergy, 3), unit: "J" },
                ]
              : []),
            { symbol: String.raw`\Delta E`, name: text.energy.rows.residual, value: scientific(energy.residual, 2), unit: "J" },
            { symbol: String.raw`|\Delta E|/E`, name: text.energy.rows.relative, value: scientific(relative, 1) },
          ]}
        />
        <Note>{gravity ? text.energy.thresholdNote : text.energy.zeroGravity}</Note>
        {gravity ? <Formula>{String.raw`E^\ast = \min_k\; 2\,g\,\mu_k L_k,\qquad \mu_k = \sum_{j \ge k} m_j`}</Formula> : null}
        <Note>{text.energy.ledgerNote}</Note>
      </Section>

      <Section title={text.chaos.title}>
        <ValueTable
          caption={text.chaos.title}
          rows={[
            { symbol: String.raw`\lambda`, name: text.chaos.rows.lyapunov, value: ready ? fixed(lambda, 3) : DASH, unit: "1/s" },
            { name: text.chaos.rows.averaging, value: fixed(averaged, 0), unit: "s" },
            { symbol: String.raw`1/\lambda`, name: text.chaos.rows.lyapunovTime, value: ready && lambda > 0.02 ? fixed(1 / lambda, 2) : DASH, unit: "s" },
            ...(twin.enabled
              ? [
                  { symbol: String.raw`\delta_0`, name: text.chaos.rows.twinOffset, value: scientific(twin.offset, 0), unit: "rad" },
                  { symbol: String.raw`\delta`, name: text.chaos.rows.separation, value: scientific(sim.separation, 2), unit: "rad" },
                  {
                    // Counted from the launch of the twin, like the horizon it is compared with.
                    name: text.chaos.rows.divergence(fixed(DIVERGENCE_THRESHOLD, 0)),
                    value: sim.divergenceTime === null ? t.measurements.notYet : fixed(sim.divergenceTime - sim.twinSince, 2),
                    unit: sim.divergenceTime === null ? undefined : "s",
                  },
                  {
                    symbol: String.raw`t_\mathrm{u}`,
                    name: text.chaos.rows.horizon,
                    value: ready && Number.isFinite(horizon) ? fixed(horizon, 1) : DASH,
                    unit: "s",
                  },
                ]
              : []),
          ]}
        />
        {twin.enabled ? null : <Note>{text.chaos.twinOff}</Note>}
        <Note>{text.chaos.note(fixed(DIVERGENCE_THRESHOLD, 0))}</Note>
        <Formula>{String.raw`t_\mathrm{u} \approx \frac{1}{\lambda}\,\ln\frac{a}{\delta_0}`}</Formula>
      </Section>

      <Section title={text.rods.title}>
        <table className="w-full text-[12px]">
          <caption className="sr-only">{text.rods.caption}</caption>
          <thead>
            <tr className="border-b border-line text-ink-3">
              <th scope="col" className="py-1 text-left font-normal">
                {text.rods.columns.rod}
              </th>
              <th scope="col" className="py-1 text-right font-normal">
                {text.rods.columns.force}
              </th>
              <th scope="col" className="py-1 pl-3 text-left font-normal">
                {text.rods.columns.state}
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, i) => {
              const force = tension.current[i];
              return (
                <tr key={i} className="border-b border-line/60 last:border-b-0">
                  <th scope="row" className="py-1 text-left font-normal text-ink-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden className="size-1.5 rounded-full" style={{ background: LINK_COLORS[i] }} />
                      <Tex>{`T_{${i + 1}}`}</Tex>
                    </span>
                  </th>
                  <td className="num py-1 text-right text-ink">{fixed(force, 2)}</td>
                  <td className={`py-1 pl-3 ${force < 0 ? "text-warn" : "text-ink-3"}`}>
                    {force < 0 ? text.rods.compression : text.rods.tension}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Note>{text.rods.note}</Note>
      </Section>
    </div>
  );
}
