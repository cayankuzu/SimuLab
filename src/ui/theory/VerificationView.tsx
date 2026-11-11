"use client";

import { Check, LoaderCircle, Play, X } from "lucide-react";
import type { ReactNode } from "react";
import { VALIDATION_SUITE, type ValidationCaseId, type ValidationRow } from "@/physics/validation";
import { useT } from "@/i18n";
import { auto, DASH, fixed, scientific } from "../format";
import { Button, Chip, cn } from "../kit/core";
import { RichText } from "../kit/RichText";

export interface VerificationState {
  status: "idle" | "running" | "done";
  /** Rows per finished case; "error" if the case threw. */
  results: Partial<Record<ValidationCaseId, ValidationRow[] | "error">>;
  /** Case being computed. */
  current: ValidationCaseId | null;
  /** Wall-clock duration of the run so far [s]. */
  seconds: number;
}

export const INITIAL_VERIFICATION: VerificationState = { status: "idle", results: {}, current: null, seconds: 0 };

const number = (value: number) => (Number.isFinite(value) ? auto(value, 7) : DASH);

interface VerificationViewProps {
  state: VerificationState;
  onRun: () => void;
  cite: (keys: string[]) => ReactNode;
}

/**
 * Runs the verification suite of src/physics/validation.ts in the browser and
 * tabulates measured value, reference, error and tolerance of every criterion.
 */
export function VerificationView({ state, onRun, cite }: VerificationViewProps) {
  const t = useT();
  const text = t.verification;
  const finished = VALIDATION_SUITE.filter((item) => state.results[item.id] !== undefined).length;

  let total = 0;
  let passed = 0;
  let broken = 0;
  for (const item of VALIDATION_SUITE) {
    const rows = state.results[item.id];
    if (rows === "error") broken++;
    else if (rows) {
      total += rows.length;
      passed += rows.filter((row) => row.pass).length;
    }
  }
  const failures = total - passed + broken;

  return (
    <div className="mx-auto max-w-[860px] px-5 pb-16 pt-6 sm:px-8">
      <p className="text-[14px] leading-[1.65] text-ink-2">{text.intro}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-md border border-line bg-raised px-4 py-3">
        <Button variant="primary" onClick={onRun} disabled={state.status === "running"}>
          {state.status === "running" ? <LoaderCircle className="size-4 animate-spin" /> : <Play className="size-4" />}
          {state.status === "done" ? text.rerun : text.run}
        </Button>
        <div className="min-w-0 flex-1 text-[13px]" role="status" aria-live="polite">
          {state.status === "idle" ? <span className="text-ink-3">{text.idle}</span> : null}
          {state.status === "running" ? <span className="num text-ink-2">{text.progress(finished, VALIDATION_SUITE.length)}</span> : null}
          {state.status === "done" ? (
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Chip tone={failures === 0 ? "ok" : "danger"}>{failures === 0 ? text.allPassed : text.someFailed(failures)}</Chip>
              <span className="num text-ink-2">{text.summary(passed, total, fixed(state.seconds, 1))}</span>
            </span>
          ) : null}
        </div>
        {state.status !== "idle" ? (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={VALIDATION_SUITE.length}
            aria-valuenow={finished}
            aria-label={text.progress(finished, VALIDATION_SUITE.length)}
            className="h-1 w-full overflow-hidden rounded-full bg-active"
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-200", failures === 0 ? "bg-ok" : "bg-danger")}
              style={{ width: `${(100 * finished) / VALIDATION_SUITE.length}%` }}
            />
          </div>
        ) : null}
      </div>
      <p className="mt-3 text-[12.5px] leading-snug text-ink-3">{text.metricNote}</p>

      <ol className="mt-6 space-y-8">
        {VALIDATION_SUITE.map((item, index) => {
          const info = text.cases[item.id];
          const rows = state.results[item.id];
          const running = state.status === "running" && state.current === item.id;
          const ok = Array.isArray(rows) && rows.every((row) => row.pass);
          return (
            <li key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="flex items-baseline gap-3 text-[15px] font-semibold leading-snug text-ink">
                  <span className="num text-[12.5px] font-medium text-accent">{String(index + 1).padStart(2, "0")}</span>
                  {info.title}
                </h3>
                {rows === undefined ? (
                  <Chip tone={running ? "accent" : "neutral"}>{running ? text.running : text.pending}</Chip>
                ) : rows === "error" ? (
                  <Chip tone="danger">{text.failed}</Chip>
                ) : (
                  <Chip tone={ok ? "ok" : "danger"}>{ok ? text.pass : text.fail}</Chip>
                )}
              </div>
              <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-2">
                <RichText cite={cite}>{info.description}</RichText>
              </p>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-[12.5px] leading-snug">
                  <thead>
                    <tr className="border-b border-line-strong text-ink-3">
                      <th scope="col" className="py-1.5 pr-3 text-left font-medium">
                        {text.columns.quantity}
                      </th>
                      <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                        {text.columns.measured}
                      </th>
                      <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                        {text.columns.reference}
                      </th>
                      <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                        {text.columns.error}
                      </th>
                      <th scope="col" className="py-1.5 pl-3 text-right font-medium">
                        {text.columns.tolerance}
                      </th>
                      <th scope="col" className="w-10 py-1.5 pl-3 text-right font-medium">
                        <span className="sr-only">{text.columns.result}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.rows.map((label, rowIndex) => {
                      const row = Array.isArray(rows) ? rows[rowIndex] : undefined;
                      const bound = row ? row.metric === "atMost" || row.metric === "atLeast" : false;
                      const unit = row?.unit ? ` ${row.unit}` : "";
                      return (
                        <tr key={rowIndex} className="border-b border-line last:border-b-0">
                          <th scope="row" className="py-1.5 pr-3 text-left font-normal text-ink-2">
                            <RichText>{label}</RichText>
                          </th>
                          <td className="num whitespace-nowrap py-1.5 pl-3 text-right text-ink">
                            {row ? `${number(row.measured)}${unit}` : DASH}
                          </td>
                          <td className="num whitespace-nowrap py-1.5 pl-3 text-right text-ink-2">
                            {row && row.reference !== null ? `${number(row.reference)}${unit}` : DASH}
                          </td>
                          <td className="num whitespace-nowrap py-1.5 pl-3 text-right text-ink-2" title={row ? text.metrics[row.metric] : undefined}>
                            {row && !bound ? scientific(row.error, 1) : DASH}
                          </td>
                          <td className="num whitespace-nowrap py-1.5 pl-3 text-right text-ink-3" title={row ? text.metrics[row.metric] : undefined}>
                            {row ? `${row.metric === "atLeast" ? "≥" : "≤"} ${auto(row.tolerance, 2)}` : DASH}
                          </td>
                          <td className="py-1.5 pl-3 text-right">
                            {row ? (
                              row.pass ? (
                                <>
                                  <Check aria-hidden className="ml-auto size-4 text-ok" strokeWidth={2.5} />
                                  <span className="sr-only">{text.pass}</span>
                                </>
                              ) : (
                                <>
                                  <X aria-hidden className="ml-auto size-4 text-danger" strokeWidth={2.5} />
                                  <span className="sr-only">{text.fail}</span>
                                </>
                              )
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
