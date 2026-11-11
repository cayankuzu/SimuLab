"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useRef } from "react";
import { referenceParts } from "@/content/citations";
import { ACCESS_DATE, REFERENCES } from "@/content/references";
import { useT } from "@/i18n";
import { Button, cn, scrollWithin } from "../kit/core";

interface ReferencesViewProps {
  /** Cited keys in order of first appearance. */
  keys: readonly string[];
  /** Entry to scroll to and highlight (the citation that was followed). */
  focusKey: string | null;
  onBack: () => void;
}

/** Numbered bibliography of the sources cited in the text. */
export function ReferencesView({ keys, focusKey, onBack }: ReferencesViewProps) {
  const t = useT();
  const text = t.theory.references;
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusKey) return;
    const container = root.current?.parentElement;
    const target = root.current?.querySelector(`[data-reference="${CSS.escape(focusKey)}"]`);
    if (container && target) scrollWithin(container, target, "center");
  }, [focusKey]);

  return (
    <div ref={root} className="mx-auto max-w-[860px] px-5 pb-16 pt-6 sm:px-8">
      <p className="text-[13.5px] leading-[1.6] text-ink-3">{text.intro(keys.length, Object.keys(REFERENCES).length, ACCESS_DATE)}</p>
      <ol className="mt-5 space-y-1">
        {keys.map((key, index) => {
          const reference = REFERENCES[key];
          if (!reference) return null;
          const parts = referenceParts(reference);
          const focused = key === focusKey;
          return (
            <li
              key={key}
              data-reference={key}
              className={cn(
                "flex gap-3 rounded-sm px-2 py-2 text-[13px] leading-[1.55] text-ink-2",
                focused && "bg-accent-soft outline outline-1 outline-accent/40",
              )}
            >
              <span className="num w-8 shrink-0 text-right text-ink-3">[{index + 1}]</span>
              <div className="min-w-0 flex-1">
                <p>
                  <span className="text-ink">{parts.lead}</span>{" "}
                  {parts.italicTitle ? (
                    <>
                      <em>{parts.title}</em>
                      {parts.edition ? ` (${parts.edition})` : ""}.
                    </>
                  ) : (
                    <>{parts.title}.</>
                  )}{" "}
                  {parts.container ? (
                    <>
                      <em>{parts.container}</em>
                      {parts.locator ?? ""}.{" "}
                    </>
                  ) : parts.locator ? (
                    <>{parts.locator}. </>
                  ) : null}
                  {parts.publisher ? <>{parts.publisher}.</> : null}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {parts.link ? (
                    <a
                      href={parts.link.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`${text.openSource}: ${parts.link.label}`}
                      className="num inline-flex min-w-0 items-center gap-1 break-all text-[12px] text-oi-sky hover:underline"
                    >
                      {parts.link.label}
                      <ExternalLink aria-hidden className="size-3 shrink-0" />
                    </a>
                  ) : null}
                  {focused ? (
                    <Button variant="ghost" size="sm" className="-my-1" onClick={onBack}>
                      <ArrowLeft className="size-3.5" />
                      {text.backToText}
                    </Button>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
