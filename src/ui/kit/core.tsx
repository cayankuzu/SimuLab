"use client";

import katex from "katex";
import { forwardRef, useCallback, useMemo, useSyncExternalStore, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Tooltip as RadixTooltip } from "radix-ui";

/** Joins class names, skipping falsy entries. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Tracks a CSS media query (client-side only; false during server rendering). */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Scrolls `container`, and only it, so that `target` sits at its top or in
 * its middle. Element.scrollIntoView would also scroll every ancestor,
 * including the page behind a dialog.
 */
export function scrollWithin(container: HTMLElement, target: Element, align: "start" | "center" = "start", margin = 12): void {
  const box = container.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const offset = align === "start" ? rect.top - box.top - margin : rect.top - box.top - (box.height - rect.height) / 2;
  container.scrollTop += offset;
}

/* ------------------------------------------------------------------ */
/* Mathematics                                                          */
/* ------------------------------------------------------------------ */

interface TexProps {
  children: string;
  /** Display (block) mode instead of inline. */
  block?: boolean;
  className?: string;
}

/** Typesets a LaTeX expression with KaTeX. Input always comes from the application's own source. */
export function Tex({ children, block = false, className }: TexProps) {
  const html = useMemo(
    () => katex.renderToString(children, { displayMode: block, throwOnError: false, strict: "ignore", output: "html" }),
    [children, block],
  );
  const Tag = block ? "div" : "span";
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ------------------------------------------------------------------ */
/* Tooltip                                                              */
/* ------------------------------------------------------------------ */

export const TooltipProvider = RadixTooltip.Provider;

interface TooltipProps {
  label: ReactNode;
  /** Optional keyboard shortcut shown after the label. */
  shortcut?: string;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
}

export function Tooltip({ label, shortcut, side = "bottom", children }: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-[80] flex max-w-64 items-center gap-2 rounded-sm bg-active px-2 py-1 text-[12px] leading-snug text-ink shadow-pop animate-fade-in"
        >
          <span>{label}</span>
          {shortcut ? <Kbd>{shortcut}</Kbd> : null}
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="num rounded-xs border border-line-strong bg-panel px-1 py-px text-[11px] leading-none text-ink-2">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                              */
/* ------------------------------------------------------------------ */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Marks a toggle button as pressed (sets aria-pressed and the selected style). */
  pressed?: boolean;
}

const BUTTON_BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-sm font-medium select-none transition-colors duration-100 disabled:pointer-events-none disabled:opacity-40";

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-[12px]",
  md: "h-8 px-3 text-[13px]",
};

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-strong",
  secondary: "border border-line-strong bg-raised text-ink-2 hover:bg-hover hover:text-ink",
  ghost: "text-ink-3 hover:bg-hover hover:text-ink",
};

const PRESSED = "bg-accent-soft text-accent-strong hover:bg-accent-soft hover:text-accent-strong";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", pressed, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-pressed={pressed}
      className={cn(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_VARIANT[variant], pressed && PRESSED, className)}
      {...rest}
    />
  );
});

interface IconButtonProps extends Omit<ButtonProps, "children" | "aria-label"> {
  /** Accessible name; also shown as the tooltip. */
  label: string;
  shortcut?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
}

/** Square icon-only button with an accessible name and tooltip. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, shortcut, tooltipSide, variant = "ghost", size = "md", pressed, className, type = "button", children, ...rest },
  ref,
) {
  return (
    <Tooltip label={label} shortcut={shortcut} side={tooltipSide}>
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-pressed={pressed}
        className={cn(
          BUTTON_BASE,
          size === "sm" ? "size-7" : "size-8",
          BUTTON_VARIANT[variant],
          pressed && PRESSED,
          "[&_svg]:size-4",
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    </Tooltip>
  );
});

/* ------------------------------------------------------------------ */
/* Layout primitives                                                    */
/* ------------------------------------------------------------------ */

interface SectionProps {
  title: ReactNode;
  /** Optional element rendered at the right end of the header (action, read-out). */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Titled group inside a panel. */
export function Section({ title, aside, children, className }: SectionProps) {
  return (
    <section className={cn("border-b border-line px-4 py-3.5 last:border-b-0", className)}>
      <header className="mb-2.5 flex min-h-5 items-center justify-between gap-2">
        <h3 className="label-caps">{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

/** Small coloured line used as a legend key for a physical quantity. */
export function Swatch({ color, dashed = false }: { color: string; dashed?: boolean }) {
  return (
    <span
      aria-hidden
      className="inline-block h-0 w-3.5 shrink-0 border-t-2"
      style={{ borderColor: color, borderTopStyle: dashed ? "dashed" : "solid" }}
    />
  );
}

/** Inline status tag. */
export function Chip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "accent" | "ok" | "warn" | "danger";
  children: ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "border-line-strong text-ink-2",
    accent: "border-accent/40 text-accent-strong",
    ok: "border-ok/40 text-ok",
    warn: "border-warn/50 text-warn",
    danger: "border-danger/50 text-danger",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-xs border px-1.5 text-[11px] font-medium leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
