"use client";

import { useMemo } from "react";
import {
  GRAVITY_PRESETS,
  MAX_LINKS,
  OSC_GEOMETRY,
  OSC_RANGES,
  PEND_RANGES,
  TWIN_OFFSETS,
} from "@/physics/constants";
import { oscillatorTheory } from "@/physics/oscillator";
import {
  OSCILLATOR_PRESETS,
  PENDULUM_PRESETS,
  type OscillatorPresetId,
  type PendulumPresetId,
} from "@/sim/presets";
import { useSim, useSimState } from "@/sim/react";
import { TIME_SCALES } from "@/sim/Simulation";
import { useT } from "@/i18n";
import { scientific } from "../format";
import { cn, Section, Tex, Tooltip } from "../kit/core";
import { NumberField, ParamSlider, Segmented, Switch, type SliderMark } from "../kit/controls";
import { LINK_COLORS, QUANTITY } from "../palette";

const DEG = 180 / Math.PI;

export function ParametersPanel() {
  const moduleId = useSimState((state) => state.module);
  return (
    <>
      <TimeScaleSection />
      {moduleId === "oscillator" ? <OscillatorParameters /> : <PendulumParameters />}
    </>
  );
}

/**
 * The time scale, in windows whose top bar has no room for its own selector
 * (below 1536 px). Without it the scale could not be changed at all there.
 */
function TimeScaleSection() {
  const t = useT();
  const sim = useSim();
  const timeScale = useSimState((state) => state.timeScale);
  return (
    <Section title={t.transport.speed} className="2xl:hidden">
      <Segmented
        size="sm"
        fill
        ariaLabel={t.transport.speed}
        value={String(timeScale)}
        onChange={(value) => sim.setTimeScale(Number(value))}
        options={TIME_SCALES.map((scale) => ({ value: String(scale), label: `${scale}×` }))}
      />
      <p className="mt-2 text-[12px] leading-snug text-ink-3">{t.parameters.timeScaleNote}</p>
    </Section>
  );
}

/* ------------------------------------------------------------------ */
/* Presets                                                              */
/* ------------------------------------------------------------------ */

interface PresetButtonProps {
  name: string;
  note: string;
  active: boolean;
  onClick: () => void;
}

function PresetButton({ name, note, active, onClick }: PresetButtonProps) {
  return (
    <Tooltip label={note} side="left">
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "h-8 truncate rounded-sm border px-2.5 text-left text-[12.5px] font-medium transition-colors duration-100",
          active
            ? "border-accent/70 bg-accent-soft text-accent-strong"
            : "border-line bg-raised text-ink-2 hover:border-line-strong hover:bg-hover hover:text-ink",
        )}
      >
        {name}
      </button>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------ */
/* Oscillator                                                           */
/* ------------------------------------------------------------------ */

function OscillatorParameters() {
  const t = useT();
  const sim = useSim();
  const params = useSimState((state) => state.oscillator);
  const initial = useSimState((state) => state.oscInitial);
  const scenario = useSimState((state) => state.scenario.oscillator);
  const text = t.parameters.oscillator;
  const theory = useMemo(() => oscillatorTheory(params), [params]);

  const dampingMarks: SliderMark[] = [{ value: theory.criticalDamping, label: text.marks.critical }];
  const frequencyMarks: SliderMark[] = [{ value: theory.omega0, label: text.marks.natural }];
  // Label the amplitude peak only where it is visibly separate from omega0.
  if (theory.omegaPeak !== null && theory.omega0 - theory.omegaPeak > 0.12 * (OSC_RANGES.driveFrequency.max - OSC_RANGES.driveFrequency.min)) {
    frequencyMarks.push({ value: theory.omegaPeak, label: text.marks.peak });
  }
  const physical = OSCILLATOR_PRESETS.filter((preset) => !preset.solver);
  const numerical = OSCILLATOR_PRESETS.filter((preset) => preset.solver);
  const apply = (id: OscillatorPresetId) => sim.applyOscillatorPreset(id);
  const driven = params.driveAmplitude > 0;

  return (
    <div>
      <Section title={t.parameters.scenarios}>
        <div className="grid grid-cols-2 gap-1.5">
          {physical.map((preset) => (
            <PresetButton
              key={preset.id}
              name={text.presets[preset.id].name}
              note={text.presets[preset.id].note}
              active={scenario === preset.id}
              onClick={() => apply(preset.id)}
            />
          ))}
        </div>
        <p className="label-caps mb-1.5 mt-3">{t.parameters.numerical}</p>
        <div className="grid grid-cols-2 gap-1.5">
          {numerical.map((preset) => (
            <PresetButton
              key={preset.id}
              name={text.presets[preset.id].name}
              note={text.presets[preset.id].note}
              active={scenario === preset.id}
              onClick={() => apply(preset.id)}
            />
          ))}
        </div>
      </Section>

      <Section title={text.equation}>
        <div className="rounded-sm bg-raised px-3 py-2.5 text-[13px] text-ink">
          <Tex block>{String.raw`m\ddot{x} + c\dot{x} + kx = F_0\cos\varphi,\qquad \dot{\varphi} = \omega`}</Tex>
        </div>
      </Section>

      <Section title={t.parameters.physical}>
        <div className="grid gap-4">
          <ParamSlider
            symbol={<Tex>m</Tex>}
            name={text.mass}
            unit="kg"
            value={params.mass}
            {...OSC_RANGES.mass}
            decimals={1}
            onChange={(mass) => sim.setOscillatorParams({ mass })}
          />
          <ParamSlider
            symbol={<Tex>k</Tex>}
            name={text.stiffness}
            unit="N/m"
            color={QUANTITY.spring}
            value={params.stiffness}
            {...OSC_RANGES.stiffness}
            decimals={1}
            onChange={(stiffness) => sim.setOscillatorParams({ stiffness })}
          />
          <ParamSlider
            symbol={<Tex>c</Tex>}
            name={text.damping}
            unit="N·s/m"
            color={QUANTITY.damper}
            value={params.damping}
            {...OSC_RANGES.damping}
            decimals={2}
            marks={dampingMarks}
            onChange={(damping) => sim.setOscillatorParams({ damping })}
          />
          <ParamSlider
            symbol={<Tex>F_0</Tex>}
            name={text.driveAmplitude}
            unit="N"
            color={QUANTITY.drive}
            value={params.driveAmplitude}
            {...OSC_RANGES.driveAmplitude}
            decimals={1}
            onChange={(driveAmplitude) => sim.setOscillatorParams({ driveAmplitude })}
          />
          <ParamSlider
            symbol={<Tex>\omega</Tex>}
            name={text.driveFrequency}
            unit="rad/s"
            color={QUANTITY.drive}
            value={params.driveFrequency}
            {...OSC_RANGES.driveFrequency}
            decimals={2}
            marks={frequencyMarks}
            disabled={!driven}
            onChange={(driveFrequency) => sim.setOscillatorParams({ driveFrequency })}
          />
          {!driven ? <p className="-mt-2 text-[12px] leading-snug text-ink-3">{text.driveOff}</p> : null}
        </div>
      </Section>

      <Section title={t.parameters.initial}>
        <div className="grid grid-cols-2 gap-3">
          <InitialField
            symbol="x_0"
            name={text.x0}
            unit="m"
            value={initial.x}
            min={OSC_GEOMETRY.xMin}
            max={OSC_GEOMETRY.xMax}
            step={0.1}
            decimals={2}
            onCommit={(x) => sim.setOscillatorInitial({ x })}
            align="start"
          />
          <InitialField
            symbol="v_0"
            name={text.v0}
            unit="m/s"
            value={initial.v}
            min={-30}
            max={30}
            step={0.5}
            decimals={2}
            onCommit={(v) => sim.setOscillatorInitial({ v })}
          />
        </div>
        <p className="mt-2 text-[12px] leading-snug text-ink-3">{t.parameters.initialHint}</p>
      </Section>
    </div>
  );
}

interface InitialFieldProps {
  symbol: string;
  name: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  onCommit: (value: number) => void;
  /** The left-hand field of the pair: its messages extend to the right, into the panel. */
  align?: "start" | "end";
}

function InitialField({ symbol, name, unit, value, min, max, step, decimals, onCommit, align }: InitialFieldProps) {
  return (
    <label className="grid gap-1">
      <span className="flex items-baseline gap-1.5 text-[12px] text-ink-3">
        <Tex className="text-[13px] text-ink">{symbol}</Tex>
        <span className="truncate">{name}</span>
      </span>
      <NumberField
        className="w-full justify-between"
        value={value}
        onCommit={onCommit}
        min={min}
        max={max}
        step={step}
        decimals={decimals}
        unit={unit}
        ariaLabel={name}
        width={7}
        align={align}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Pendulum                                                             */
/* ------------------------------------------------------------------ */

function PendulumParameters() {
  const t = useT();
  const sim = useSim();
  const params = useSimState((state) => state.pendulum);
  const initial = useSimState((state) => state.pendInitial);
  const twin = useSimState((state) => state.twin);
  const scenario = useSimState((state) => state.scenario.pendulum);
  const text = t.parameters.pendulum;
  const apply = (id: PendulumPresetId) => sim.applyPendulumPreset(id);
  const n = params.count;

  const setMass = (index: number, value: number) => {
    const masses = [...params.masses];
    masses[index] = value;
    sim.setPendulumParams({ masses });
  };
  const setLength = (index: number, value: number) => {
    const lengths = [...params.lengths];
    lengths[index] = value;
    sim.setPendulumParams({ lengths });
  };

  return (
    <div>
      <Section title={t.parameters.scenarios}>
        <div className="grid grid-cols-2 gap-1.5">
          {PENDULUM_PRESETS.map((preset) => (
            <PresetButton
              key={preset.id}
              name={text.presets[preset.id].name}
              note={text.presets[preset.id].note}
              active={scenario === preset.id}
              onClick={() => apply(preset.id)}
            />
          ))}
        </div>
      </Section>

      <Section title={text.links} aside={<Tex className="text-[13px] text-ink-2">{`N = ${n}`}</Tex>}>
        <Segmented
          fill
          ariaLabel={text.links}
          value={String(n)}
          onChange={(value) => sim.setLinkCount(Number(value))}
          options={Array.from({ length: MAX_LINKS }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))}
        />
      </Section>

      <Section title={t.parameters.physical}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <ParamSlider
              symbol={<Tex>g</Tex>}
              name={text.gravity}
              unit="m/s²"
              color={QUANTITY.gravity}
              value={params.gravity}
              {...PEND_RANGES.gravity}
              decimals={3}
              onChange={(gravity) => sim.setPendulumParams({ gravity })}
            />
            <div className="flex flex-wrap gap-1">
              {GRAVITY_PRESETS.map((body) => {
                const active = Math.abs(params.gravity - body.g) < 5e-4;
                return (
                  <button
                    key={body.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => sim.setPendulumParams({ gravity: body.g })}
                    className={cn(
                      "h-6 rounded-xs border px-2 text-[11.5px] font-medium transition-colors duration-100",
                      active
                        ? "border-accent/70 bg-accent-soft text-accent-strong"
                        : "border-line text-ink-3 hover:border-line-strong hover:text-ink",
                    )}
                  >
                    {text.bodies[body.id]}
                  </button>
                );
              })}
            </div>
          </div>
          <ParamSlider
            symbol={<Tex>b</Tex>}
            name={text.jointDamping}
            unit="N·m·s"
            color={QUANTITY.heat}
            value={params.jointDamping}
            {...PEND_RANGES.jointDamping}
            decimals={2}
            onChange={(jointDamping) => sim.setPendulumParams({ jointDamping })}
          />
        </div>
      </Section>

      <Section title={text.chain}>
        <table className="w-full border-separate border-spacing-y-1 text-[12px]">
          <thead>
            <tr className="text-left text-ink-3">
              <th scope="col" className="w-5 font-normal">
                <span className="sr-only">#</span>
              </th>
              <th scope="col" className="pb-0.5 font-normal">
                <Tex>{String.raw`m_i\,[\mathrm{kg}]`}</Tex>
              </th>
              <th scope="col" className="pb-0.5 font-normal">
                <Tex>{String.raw`L_i\,[\mathrm{m}]`}</Tex>
              </th>
              <th scope="col" className="pb-0.5 font-normal">
                <Tex>{String.raw`\theta_{i}(0)\,[^\circ]`}</Tex>
              </th>
              <th scope="col" className="pb-0.5 font-normal">
                <Tex>{String.raw`\omega_{i}(0)\,[\mathrm{s^{-1}}]`}</Tex>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: n }, (_, index) => (
              <tr key={index}>
                <th scope="row" className="align-middle">
                  <span className="num flex items-center gap-1 text-[11px] font-normal text-ink-3">
                    <span aria-hidden className="size-2 rounded-full" style={{ background: LINK_COLORS[index] }} />
                    <span className="sr-only">{index + 1}</span>
                  </span>
                </th>
                <td className="pr-1">
                  <NumberField
                    className="w-full"
                    width={4.5}
                    value={params.masses[index]}
                    onCommit={(value) => setMass(index, value)}
                    {...PEND_RANGES.mass}
                    decimals={2}
                    ariaLabel={text.massOf(index + 1)}
                    align="start"
                  />
                </td>
                <td className="pr-1">
                  <NumberField
                    className="w-full"
                    width={4.5}
                    value={params.lengths[index]}
                    onCommit={(value) => setLength(index, value)}
                    {...PEND_RANGES.length}
                    decimals={3}
                    ariaLabel={text.lengthOf(index + 1)}
                    align="start"
                  />
                </td>
                <td className="pr-1">
                  <NumberField
                    className="w-full"
                    width={5.5}
                    value={initial.thetas[index] * DEG}
                    onCommit={(value) => sim.setPendulumInitial(index, { theta: value / DEG })}
                    min={-1800}
                    max={1800}
                    step={1}
                    decimals={2}
                    ariaLabel={text.angleOf(index + 1)}
                  />
                </td>
                <td>
                  <NumberField
                    className="w-full"
                    width={5}
                    value={initial.omegas[index]}
                    onCommit={(value) => sim.setPendulumInitial(index, { omega: value })}
                    min={-40}
                    max={40}
                    step={0.1}
                    decimals={2}
                    ariaLabel={text.omegaOf(index + 1)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1.5 text-[12px] leading-snug text-ink-3">
          {text.angleUnitNote} {t.parameters.initialHint}
        </p>
      </Section>

      <Section title={text.twin.title}>
        <div className="grid gap-3">
          <Switch
            checked={twin.enabled}
            onChange={(enabled) => sim.setTwin({ enabled })}
            label={
              <span className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full" style={{ background: QUANTITY.twin }} />
                {text.twin.enable}
              </span>
            }
            description={text.twin.description}
          />
          <div className={cn("flex items-center justify-between gap-3", !twin.enabled && "opacity-50")}>
            <span className="text-[12px] text-ink-3">{text.twin.offset}</span>
            <Segmented
              size="sm"
              ariaLabel={text.twin.offset}
              value={String(twin.offset)}
              onChange={(value) => {
                sim.setTwin({ offset: Number(value) });
                sim.reset();
              }}
              options={TWIN_OFFSETS.map((offset) => ({
                value: String(offset),
                label: <span className="num">{scientific(offset, 0).replace("1×", "")}</span>,
                ariaLabel: `${offset} rad`,
                disabled: !twin.enabled,
              }))}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
