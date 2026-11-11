"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog as RadixDialog, DropdownMenu, Popover as RadixPopover } from "radix-ui";
import { cn } from "./core";

/* ------------------------------------------------------------------ */
/* Modal dialog and side sheet                                          */
/* ------------------------------------------------------------------ */

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Accessible label of the close button. */
  closeLabel: string;
  children: ReactNode;
  /** "modal": centred card; "sheet": full-height panel on the right. */
  variant?: "modal" | "sheet";
  /** Tailwind max-width class of the surface. */
  widthClass?: string;
  footer?: ReactNode;
}

/**
 * Accessible dialog (focus trap, Escape to close, focus restored to the
 * trigger, labelled by its title) built on Radix Dialog.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  variant = "modal",
  widthClass,
  footer,
}: DialogProps) {
  const sheet = variant === "sheet";
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-[60] bg-black/60 animate-fade-in" />
        <RadixDialog.Content
          className={cn(
            "fixed z-[70] flex flex-col bg-panel shadow-pop outline-none",
            sheet
              ? cn("inset-y-0 right-0 w-full animate-sheet-in border-l border-line", widthClass ?? "max-w-[760px]")
              : cn(
                  "left-1/2 top-1/2 max-h-[88vh] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 animate-fade-in rounded-lg border border-line-strong",
                  widthClass ?? "max-w-[560px]",
                ),
          )}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-3.5">
            <div className="min-w-0">
              <RadixDialog.Title className="text-[15px] font-semibold leading-snug text-ink">{title}</RadixDialog.Title>
              {description ? (
                <RadixDialog.Description className="mt-0.5 text-[12.5px] leading-snug text-ink-3">
                  {description}
                </RadixDialog.Description>
              ) : (
                <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close
              aria-label={closeLabel}
              className="-mr-1.5 inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-3 transition-colors hover:bg-hover hover:text-ink"
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </header>
          <div className="relative min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer ? <footer className="shrink-0 border-t border-line px-5 py-3">{footer}</footer> : null}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Popover                                                              */
/* ------------------------------------------------------------------ */

interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  widthClass?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Popover({ trigger, children, align = "end", side = "bottom", widthClass = "w-80", open, onOpenChange }: PopoverProps) {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          side={side}
          sideOffset={8}
          collisionPadding={12}
          className={cn("z-[70] rounded-md border border-line-strong bg-panel p-4 shadow-pop outline-none animate-pop-in", widthClass)}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/* ------------------------------------------------------------------ */
/* Menu                                                                 */
/* ------------------------------------------------------------------ */

interface MenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
}

export function Menu({ trigger, children, align = "end" }: MenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          collisionPadding={12}
          className="z-[70] min-w-60 rounded-md border border-line-strong bg-panel p-1 shadow-pop outline-none animate-pop-in"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  label: ReactNode;
  /** Secondary line explaining the action. */
  hint?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}

export function MenuItem({ icon, label, hint, onSelect, disabled }: MenuItemProps) {
  return (
    <DropdownMenu.Item
      disabled={disabled}
      onSelect={onSelect}
      className="flex cursor-default select-none items-start gap-2.5 rounded-sm px-2.5 py-2 text-[13px] text-ink-2 outline-none data-[disabled]:opacity-40 data-[highlighted]:bg-hover data-[highlighted]:text-ink [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-3"
    >
      {icon}
      <span className="min-w-0">
        <span className="block leading-snug">{label}</span>
        {hint ? <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{hint}</span> : null}
      </span>
    </DropdownMenu.Item>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <DropdownMenu.Label className="label-caps px-2.5 pb-1 pt-2">{children}</DropdownMenu.Label>;
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-line" />;
}
