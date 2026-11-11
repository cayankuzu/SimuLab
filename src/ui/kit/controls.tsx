"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Slider as RadixSlider, Switch as RadixSwitch, Tabs as RadixTabs, ToggleGroup } from "radix-ui";
import { cn } from "./core";

/* ------------------------------------------------------------------ */
/* Segmented control (single choice)                                    */
/* ------------------------------------------------------------------ */

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is not plain text. */
  ariaLabel?: string;
  disabled?: boolean;
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
  size?: "sm" | "md";
  /** Stretch the items to fill the available width. */
  fill?: boolean;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "md",
  fill = false,
  className,
}: SegmentedProps<T>) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Radix emits "" when the active item is clicked again; a segmented control always keeps one selection.
      onValueChange={(next) => next && onChange(next as T)}
      aria-label={ariaLabel}
      className={cn("inline-flex rounded-sm border border-line bg-bg p-0.5", fill && "flex w-full", className)}
    >
      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          disabled={option.disabled}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xs font-medium text-ink-3 transition-colors duration-100",
            "hover:text-ink data-[state=on]:bg-active data-[state=on]:text-ink disabled:pointer-events-none disabled:opacity-40",
            size === "sm" ? "h-6 px-2 text-[12px]" : "h-7 px-3 text-[13px]",
            fill && "flex-1",
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                 */
/* ------------------------------------------------------------------ */

export const Tabs = RadixTabs.Root;
export const TabPanel = RadixTabs.Content;

export function TabList({ children, ariaLabel, className }: { children: ReactNode; ariaLabel: string; className?: string }) {
  return (
    <RadixTabs.List aria-label={ariaLabel} className={cn("flex items-stretch gap-4", className)}>
      {children}
    </RadixTabs.List>
  );
}

export function Tab({ value, children, disabled }: { value: string; children: ReactNode; disabled?: boolean }) {
  return (
    <RadixTabs.Trigger
      value={value}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-9 items-center gap-1.5 whitespace-nowrap text-[13px] font-medium text-ink-3 transition-colors duration-100",
        "hover:text-ink data-[state=active]:text-ink disabled:pointer-events-none disabled:opacity-40",
        "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-accent after:opacity-0 data-[state=active]:after:opacity-100",
      )}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

/* ------------------------------------------------------------------ */
/* Switch                                                               */
/* ------------------------------------------------------------------ */

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, description, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="min-w-0 cursor-pointer text-[13px] text-ink-2">
        {label}
        {description ? <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{description}</span> : null}
      </label>
      <RadixSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled}
        className="relative mt-0.5 h-[18px] w-8 shrink-0 rounded-full border border-line-strong bg-raised transition-colors duration-100 data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-40"
      >
        <RadixSwitch.Thumb className="block size-3 translate-x-[2px] rounded-full bg-ink-3 transition-transform duration-100 data-[state=checked]:translate-x-[16px] data-[state=checked]:bg-accent-ink" />
      </RadixSwitch.Root>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Numeric entry                                                        */
/* ------------------------------------------------------------------ */

interface NumberFieldProps {
  value: number;
  onCommit: (value: number) => void;
  min: number;
  max: number;
  /** Increment for the arrow keys (Shift = x10, Alt = /10). */
  step: number;
  /** Decimals shown when the field is not being edited. */
  decimals: number;
  ariaLabel: string;
  unit?: ReactNode;
  disabled?: boolean;
  className?: string;
  /** Fixed width in ch of the input (defaults to fit the range). */
  width?: number;
}

const parseDecimal = (text: string): number => Number(text.trim().replace(",", ".").replace("−", "-"));

/**
 * Text field for an exact numerical value. Accepts a decimal point or comma,
 * validates against [min, max] and commits on Enter or blur; Escape reverts.
 */
export function NumberField({
  value,
  onCommit,
  min,
  max,
  step,
  decimals,
  ariaLabel,
  unit,
  disabled,
  className,
  width,
}: NumberFieldProps) {
  const display = value.toFixed(decimals);
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cancelled = useRef(false);

  // An external change (slider, preset) supersedes an abandoned draft.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setDraft(null);
  }, [display]);

  const commit = (text: string) => {
    const parsed = parseDecimal(text);
    if (text.trim() === "" || !Number.isFinite(parsed)) {
      setInvalid(true);
      return false;
    }
    setInvalid(false);
    onCommit(Math.min(max, Math.max(min, parsed)));
    setDraft(null);
    return true;
  };

  const nudge = (direction: 1 | -1, event: KeyboardEvent<HTMLInputElement>) => {
    const scale = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
    const base = draft !== null && Number.isFinite(parseDecimal(draft)) ? parseDecimal(draft) : value;
    const next = Math.min(max, Math.max(min, base + direction * step * scale));
    // Remove floating-point dust such as 0.30000000000000004.
    onCommit(Number(next.toFixed(Math.max(decimals + 1, 6))));
    setDraft(null);
    setInvalid(false);
  };

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-sm border bg-bg pl-2 pr-1.5 transition-colors duration-100",
        invalid ? "border-danger" : "border-line hover:border-line-strong focus-within:border-accent",
        disabled && "opacity-40",
        className,
      )}
    >
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        value={draft ?? display}
        style={{ width: `${width ?? Math.max(4, max.toFixed(decimals).length + 0.5)}ch` }}
        className="num min-w-0 bg-transparent text-right text-[12.5px] text-ink outline-none"
        onChange={(event) => {
          setDraft(event.target.value);
          setInvalid(false);
        }}
        onFocus={(event) => event.target.select()}
        onBlur={() => {
          if (cancelled.current) {
            cancelled.current = false;
            return;
          }
          if (draft !== null && !commit(draft)) {
            setDraft(null);
            setInvalid(false);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (commit(draft ?? display)) inputRef.current?.select();
          } else if (event.key === "Escape") {
            cancelled.current = true;
            setDraft(null);
            setInvalid(false);
            inputRef.current?.blur();
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            nudge(1, event);
          } else if (event.key === "ArrowDown") {
            event.preventDefault();
            nudge(-1, event);
          }
        }}
      />
      {unit ? <span className="select-none text-[11.5px] text-ink-3">{unit}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Parameter slider with exact entry                                    */
/* ------------------------------------------------------------------ */

export interface SliderMark {
  value: number;
  label: ReactNode;
}

interface ParamSliderProps {
  /** Symbol or short name, e.g. a <Tex> element. */
  symbol: ReactNode;
  /** Plain-language name of the quantity; also the accessible name. */
  name: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals: number;
  unit?: ReactNode;
  /** Reference positions drawn under the track (e.g. critical damping). */
  marks?: SliderMark[];
  /** Colour key linking the control to its vector/trace. */
  color?: string;
  disabled?: boolean;
}

export function ParamSlider({
  symbol,
  name,
  value,
  onChange,
  min,
  max,
  step,
  decimals,
  unit,
  marks,
  color,
  disabled,
}: ParamSliderProps) {
  const visibleMarks = (marks ?? []).filter((mark) => mark.value >= min && mark.value <= max);
  return (
    <div className={cn("grid gap-1.5", disabled && "opacity-50")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          {color ? <span aria-hidden className="size-1.5 shrink-0 self-center rounded-full" style={{ background: color }} /> : null}
          <span className="shrink-0 text-[13px] text-ink">{symbol}</span>
          <span className="truncate text-[12px] text-ink-3">{name}</span>
        </div>
        <NumberField
          value={value}
          onCommit={onChange}
          min={min}
          max={max}
          step={step}
          decimals={decimals}
          unit={unit}
          ariaLabel={name}
          disabled={disabled}
        />
      </div>
      <RadixSlider.Root
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([next]) => onChange(next)}
        // 24 px tall hit area (WCAG 2.5.8) around a 3 px track.
        className="relative -my-1 flex h-6 touch-none select-none items-center"
      >
        <RadixSlider.Track className="relative h-[3px] grow rounded-full bg-active">
          <RadixSlider.Range className="absolute h-full rounded-full bg-ink-3" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-label={name}
          className="block size-3.5 rounded-full border-2 border-bg bg-ink shadow-[0_0_0_1px_var(--color-line-strong)] transition-transform duration-100 hover:scale-110 focus-visible:outline-offset-1"
        />
      </RadixSlider.Root>
      {visibleMarks.length > 0 ? (
        <div className="relative -mt-1 h-4" aria-hidden>
          {visibleMarks.map((mark, index) => (
            <span
              key={index}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              // The thumb travels between 7 px insets, so marks use the same mapping.
              style={{ left: `calc(7px + (100% - 14px) * ${(mark.value - min) / (max - min)})` }}
            >
              <span className="h-1 w-px bg-accent" />
              <span className="mt-px whitespace-nowrap text-[10.5px] leading-none text-accent-strong">{mark.label}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
