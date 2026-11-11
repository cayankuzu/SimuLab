"use client";

import { Info, TriangleAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Slider as RadixSlider, Switch as RadixSwitch, Tabs as RadixTabs, ToggleGroup } from "radix-ui";
import { useT } from "@/i18n";
import { parseDecimal } from "../format";
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
            // The fill of the selected item differs from the track by 1.4:1 only; the outline carries
            // the selection at 3:1 or more against both the fill and the track (WCAG 1.4.11).
            "data-[state=on]:shadow-[inset_0_0_0_1px_var(--color-edge)]",
            // Every item is a 24 px target at least (WCAG 2.5.8), also with a one-character label.
            size === "sm" ? "h-6 min-w-6 px-2 text-[12px]" : "h-7 px-3 text-[13px]",
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
        // 40 x 24 px target (WCAG 2.5.8); the outline of the off state reaches 3:1 (WCAG 1.4.11).
        className="relative h-6 w-10 shrink-0 rounded-full border border-edge bg-raised transition-colors duration-100 data-[state=checked]:border-accent data-[state=checked]:bg-accent disabled:opacity-40"
      >
        <RadixSwitch.Thumb className="block size-[18px] translate-x-[2px] rounded-full bg-ink-3 transition-transform duration-100 data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-accent-ink" />
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
  /**
   * Edge of the field that its messages are aligned to: "end" (they extend
   * to the left) for a field at the right of its panel, "start" (they extend
   * to the right) for one near the left edge, where they would be cut off.
   */
  align?: "start" | "end";
}

/** How long the note on a limited entry stays [ms]; the field itself keeps showing the value used. */
const LIMIT_NOTICE_MS = 6000;

/** Floating message under a field; the side it is anchored to comes with the field. */
const MESSAGE =
  "pointer-events-none absolute top-full z-20 mt-1.5 flex w-max max-w-60 items-start gap-1.5 rounded-sm border bg-raised px-2 py-1.5 text-left text-[12px] font-normal leading-snug text-ink shadow-pop";

/**
 * Text field for an exact numerical value. Accepts a decimal point or comma,
 * limits the entry to [min, max] and commits on Enter or blur; Escape reverts.
 * Text that is not a number is never committed: it stays in the field, marked
 * and explained, until it is corrected or abandoned. A number outside the
 * range is replaced by the nearest limit, and a short note says so.
 *
 * Messages float over the panel only while the field has the focus. Once the
 * focus has moved on they would cover the control it moved to (WCAG 2.4.11);
 * a rejected entry then keeps its mark in the field, and its message stays in
 * the document for screen readers and returns when the field is focused again.
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
  align = "end",
}: NumberFieldProps) {
  const t = useT();
  const display = value.toFixed(decimals);
  const [draft, setDraftState] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // The draft as it stands inside the running event. Escape discards the draft and blurs the
  // field in one handler; the blur must already find the field unedited, which the state of
  // the last render cannot tell it.
  const pending = useRef<string | null>(null);
  const messageId = useId();
  // Limit that replaced an entry outside [min, max]; said for a few seconds, the field shows it anyway.
  const [limitedTo, setLimitedTo] = useState<number | null>(null);
  const limitTimer = useRef<number | undefined>(undefined);

  const setDraft = (next: string | null) => {
    pending.current = next;
    setDraftState(next);
  };

  const showLimit = (limit: number | null) => {
    window.clearTimeout(limitTimer.current);
    setLimitedTo(limit);
    if (limit !== null) limitTimer.current = window.setTimeout(() => setLimitedTo(null), LIMIT_NOTICE_MS);
  };
  useEffect(() => () => window.clearTimeout(limitTimer.current), []);

  const discard = () => {
    setDraft(null);
    setInvalid(false);
  };

  // An external change (slider, preset) supersedes an abandoned or a rejected draft.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      pending.current = null;
      setDraftState(null);
      setInvalid(false);
    }
  }, [display]);

  /** Takes the text over as the new value; returns false, and marks the entry, if it is not a number. */
  const commit = (text: string): boolean => {
    const entered = text.trim();
    // Unchanged text is not an entry. Committing the rounded display string would replace a
    // stored value that carries more digits than the field shows (g = 9.80665 shown as 9.807).
    if (entered === display) {
      discard();
      return true;
    }
    const parsed = parseDecimal(entered);
    if (!Number.isFinite(parsed)) {
      setInvalid(true);
      showLimit(null);
      return false;
    }
    const limited = Math.min(max, Math.max(min, parsed));
    onCommit(limited);
    discard();
    // An entry outside the range is not rejected but replaced by the nearest limit, and that is said.
    showLimit(limited === parsed ? null : limited);
    return true;
  };

  const nudge = (direction: 1 | -1, event: KeyboardEvent<HTMLInputElement>) => {
    const scale = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
    // An emptied or unreadable draft is not a starting point: count from the current value.
    const entered = draft === null ? Number.NaN : parseDecimal(draft);
    const base = Number.isFinite(entered) ? entered : value;
    const next = Math.min(max, Math.max(min, base + direction * step * scale));
    // Remove floating-point dust such as 0.30000000000000004.
    onCommit(Number(next.toFixed(Math.max(decimals + 1, 6))));
    discard();
    showLimit(null);
  };

  /** A limit of the admissible range as it is quoted in the message (no trailing zeros). */
  const bound = (limit: number): string => String(Number(limit.toFixed(decimals)));
  const side = align === "start" ? "left-0" : "right-0";

  return (
    <span
      className={cn(
        "relative inline-flex h-7 items-center gap-1 rounded-sm border bg-bg pl-2 pr-1.5 transition-colors duration-100",
        // The outline is the only boundary of the field: 3:1 against the panel (WCAG 1.4.11).
        invalid ? "border-danger" : "border-edge hover:border-ink-3 focus-within:border-accent",
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
        aria-describedby={invalid ? messageId : undefined}
        disabled={disabled}
        value={draft ?? display}
        style={{ width: `${width ?? Math.max(4, max.toFixed(decimals).length + 0.5)}ch` }}
        className="num min-w-0 bg-transparent text-right text-[12.5px] text-ink outline-none"
        onChange={(event) => {
          setDraft(event.target.value);
          setInvalid(false);
          showLimit(null);
        }}
        onFocus={(event) => {
          setFocused(true);
          event.target.select();
        }}
        onBlur={() => {
          setFocused(false);
          const text = pending.current;
          if (text === null) return;
          // An emptied field is not an entry: leaving it restores the current value. A rejected
          // entry stays in the field with its message, so the loss of the input does not go unnoticed.
          if (text.trim() === "") discard();
          else commit(text);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            if (commit(draft ?? display)) inputRef.current?.select();
          } else if (event.key === "Escape") {
            discard();
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
      {invalid && !focused ? (
        // The mark a rejected entry keeps after the focus has moved on: a shape as well as the border colour (WCAG 1.4.1).
        <span title={t.common.invalidNumber(bound(min), bound(max))} className="flex shrink-0">
          <TriangleAlert aria-hidden className="size-3.5 text-danger" />
        </span>
      ) : null}
      {invalid ? (
        // Text and icon, announced as soon as it appears (WCAG 3.3.1). It stays in the document while the entry
        // is rejected (aria-describedby), floating under the field only while the field has the focus.
        <span id={messageId} role="alert" className={focused ? cn(MESSAGE, side, "border-danger") : "sr-only"}>
          <TriangleAlert aria-hidden className="mt-px size-3.5 shrink-0 text-danger" />
          <span>{t.common.invalidNumber(bound(min), bound(max))}</span>
        </span>
      ) : null}
      {/* Present at all times, so that a change of its text is announced (a polite live region). */}
      <span role="status" className="sr-only">
        {limitedTo !== null ? t.common.limitedNumber(bound(min), bound(max), bound(limitedTo)) : ""}
      </span>
      {limitedTo !== null && !invalid && focused ? (
        <span aria-hidden className={cn(MESSAGE, side, "border-edge")}>
          <Info aria-hidden className="mt-px size-3.5 shrink-0 text-ink-3" />
          <span>{t.common.limitedNumber(bound(min), bound(max), bound(limitedTo))}</span>
        </span>
      ) : null}
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
        {/* The unfilled track reaches 3:1 against the panel (WCAG 1.4.11); the filled part is brighter still. */}
        <RadixSlider.Track className="relative h-[3px] grow rounded-full bg-edge">
          <RadixSlider.Range className="absolute h-full rounded-full bg-ink-2" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          aria-label={name}
          className="block size-3.5 rounded-full border-2 border-bg bg-ink shadow-[0_0_0_1px_var(--color-line-strong)] transition-transform duration-100 hover:scale-110"
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
