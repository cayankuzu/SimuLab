"use client";

import { ArrowLeft, ArrowRight, Check, ChevronRight, Circle, RotateCcw } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { shortCitation } from "@/content/citations";
import { REFERENCES } from "@/content/references";
import { TASK_CONTENT } from "@/content/tasks";
import { useSim, useSimState } from "@/sim/react";
import { TASKS, type TaskId } from "@/sim/tasks";
import { useT } from "@/i18n";
import { byDigits } from "../format";
import { Button, Chip, cn, Section, Tex } from "../kit/core";
import { RichText } from "../kit/RichText";
import { usePrefs } from "../prefs";
import { choosePrediction, revealExplanation, startTask, stopTask, useTaskSession, viewTask, type TaskSession } from "./taskRunner";

const UNIT_LABEL: Record<string, string> = { deg: "°" };

/**
 * Task sheets in the predict-observe-explain pattern [white1992]: a
 * prediction is asked for first, the criteria are then decided by the virtual
 * instruments, and the explanation opens once the measurement has been made.
 */
export function TasksPanel() {
  const session = useTaskSession((state) => state);
  const root = useRef<HTMLDivElement>(null);
  const viewing = session.viewing;

  // Switching between the list and a sheet starts at the top of the panel.
  useEffect(() => {
    root.current?.parentElement?.scrollTo({ top: 0 });
  }, [viewing]);

  return <div ref={root}>{viewing ? <TaskSheet id={viewing} session={session} /> : <TaskList session={session} />}</div>;
}

/* ------------------------------------------------------------------ */
/* List                                                                 */
/* ------------------------------------------------------------------ */

function TaskList({ session }: { session: TaskSession }) {
  const t = useT();
  const completed = usePrefs((prefs) => prefs.completedTasks);
  const text = t.tasks;
  const done = TASKS.filter((task) => completed.includes(task.id)).length;

  return (
    <div>
      <div className="border-b border-line px-4 py-3.5">
        <p className="text-[12.5px] leading-snug text-ink-3">{text.intro}</p>
        <div className="mt-3 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TASKS.length}
            aria-valuenow={done}
            aria-label={text.progress(done, TASKS.length)}
            className="h-1 flex-1 overflow-hidden rounded-full bg-raised"
          >
            <div className="h-full rounded-full bg-ok transition-[width] duration-300" style={{ width: `${(100 * done) / TASKS.length}%` }} />
          </div>
          <span className="num shrink-0 text-[12px] text-ink-2">{text.progress(done, TASKS.length)}</span>
        </div>
      </div>

      {(["oscillator", "pendulum"] as const).map((moduleId) => (
        <Section key={moduleId} title={text.groups[moduleId]}>
          {/* The numbering runs on across both groups, as the badges show it. */}
          <ol start={TASKS.findIndex((task) => task.module === moduleId) + 1} className="-mx-2 -my-1">
            {TASKS.map((task, index) => {
              if (task.module !== moduleId) return null;
              const item = text.items[task.id];
              const isDone = completed.includes(task.id);
              return (
                <li key={task.id}>
                  {/* The row is named by its content (title, state, summary); an aria-label would replace it and hide the state. */}
                  <button
                    type="button"
                    onClick={() => viewTask(task.id)}
                    className="group flex w-full items-start gap-2.5 rounded-sm px-2 py-2 text-left transition-colors duration-100 hover:bg-hover"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "num mt-px flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
                        isDone ? "border-ok/50 text-ok" : "border-line-strong text-ink-3",
                      )}
                    >
                      {isDone ? <Check className="size-3" strokeWidth={2.5} /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[13px] font-medium text-ink">{item.title}</span>
                        {session.active === task.id ? <Chip tone="accent">{text.status.active}</Chip> : null}
                        {/* The check mark in the badge is the visible form of this state. */}
                        {isDone ? <span className="sr-only"> — {text.status.completed}</span> : null}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-ink-3">{item.summary}</span>
                    </span>
                    <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-4 transition-colors group-hover:text-ink-2" />
                  </button>
                </li>
              );
            })}
          </ol>
        </Section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet                                                                */
/* ------------------------------------------------------------------ */

function StepTitle({ step, children }: { step: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className="num flex size-4 items-center justify-center rounded-full bg-active text-[10px] text-ink-2">
        {step}
      </span>
      {children}
    </span>
  );
}

function TaskSheet({ id, session }: { id: TaskId; session: TaskSession }) {
  const t = useT();
  const sim = useSim();
  const language = usePrefs((prefs) => prefs.language);
  const completed = usePrefs((prefs) => prefs.completedTasks);
  const moduleId = useSimState((state) => state.module);
  const text = t.tasks;

  const index = TASKS.findIndex((task) => task.id === id);
  const task = TASKS[index];
  const next = TASKS[index + 1];
  const item = text.items[id];
  const content = TASK_CONTENT[id];

  const isActive = session.active === id;
  const status = isActive ? session.status : null;
  const isDone = completed.includes(id);
  const unlocked = isDone || session.revealed[id] === true;
  const prediction = session.predictions[id];
  const met = status ? status.checks.filter(Boolean).length : 0;
  const otherActive = session.active !== null && !isActive ? text.items[session.active].title : null;

  const cite = (keys: string[]) => {
    const names = keys.map((key) => (REFERENCES[key] ? shortCitation(REFERENCES[key], language) : key));
    return <span className="text-ink-3">[{names.join("; ")}]</span>;
  };

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-panel px-2 py-1.5">
        <Button variant="ghost" size="sm" onClick={() => viewTask(null)}>
          <ArrowLeft className="size-3.5" />
          {text.actions.back}
        </Button>
        <span className="ml-auto flex items-center gap-1.5 pr-2">
          {isActive ? <Chip tone="accent">{text.status.active}</Chip> : null}
          {isDone ? (
            <Chip tone="ok">
              <Check className="size-3" strokeWidth={2.5} />
              {text.status.completed}
            </Chip>
          ) : null}
        </span>
      </div>

      <div className="border-b border-line px-4 py-3.5">
        <p className="label-caps">
          <span className="num">{String(index + 1).padStart(2, "0")}</span> · {text.groups[task.module]}
        </p>
        <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">{item.title}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
          <RichText>{item.goal}</RichText>
        </p>
      </div>

      {/* 1 — predict */}
      <Section title={<StepTitle step={text.steps.predict}>{text.headings.predict}</StepTitle>}>
        <fieldset disabled={unlocked} className="min-w-0">
          <legend className="text-[13px] leading-snug text-ink">{item.question}</legend>
          <div className="mt-2 space-y-1.5">
            {item.options.map((option, optionIndex) => {
              const checked = prediction === optionIndex;
              const right = unlocked && optionIndex === content.answer;
              return (
                <label
                  key={optionIndex}
                  className={cn(
                    "flex items-start gap-2.5 rounded-sm border px-2.5 py-2 text-[12.5px] leading-snug transition-colors duration-100",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                    checked ? "border-accent/70 bg-accent-soft text-ink" : "border-line text-ink-2",
                    !unlocked && "cursor-pointer",
                    !unlocked && !checked && "hover:bg-hover",
                  )}
                >
                  <input
                    type="radio"
                    name={`prediction-${id}`}
                    className="sr-only"
                    checked={checked}
                    onChange={() => choosePrediction(id, optionIndex)}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "mt-[3px] flex size-3 shrink-0 items-center justify-center rounded-full border",
                      // The ring marks an option that can be chosen: at least 3:1 on the panel and on hover (WCAG 1.4.11).
                      checked ? "border-accent" : "border-edge",
                    )}
                  >
                    {checked ? <span className="size-1.5 rounded-full bg-accent" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    {option}
                    {/* Text for the check mark: if the explanation was opened before completion, the mark is the only sign of the answer. */}
                    {right ? <span className="sr-only"> — {text.predict.agrees}</span> : null}
                  </span>
                  {right ? <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ok" strokeWidth={2.5} /> : null}
                </label>
              );
            })}
          </div>
        </fieldset>
        {prediction === undefined && !unlocked ? <p className="mt-2 text-[12px] leading-snug text-ink-3">{text.predict.hint}</p> : null}
      </Section>

      {/* 2 — observe */}
      <Section
        title={<StepTitle step={text.steps.observe}>{text.headings.observe}</StepTitle>}
        aside={status ? <span className="num text-[11.5px] text-ink-3">{text.observe.summary(met, task.criteria)}</span> : undefined}
      >
        {isActive ? null : (
          <p className={cn("mb-2.5 text-[12px] leading-snug", otherActive ? "text-warn" : "text-ink-3")}>
            {otherActive ? text.observe.otherActive(otherActive) : text.observe.idle}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant={isActive ? "secondary" : "primary"} className="flex-1" onClick={() => startTask(sim, id)}>
            {isActive ? <RotateCcw className="size-3.5" /> : null}
            {isActive ? text.actions.restart : text.actions.start}
          </Button>
          {isActive ? (
            <Button variant="ghost" onClick={() => stopTask(sim)}>
              {text.actions.stop}
            </Button>
          ) : null}
        </div>
        {isActive && moduleId !== task.module ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-[12px] leading-snug text-warn">{text.observe.wrongModule(text.groups[task.module])}</p>
            <Button variant="secondary" size="sm" onClick={() => sim.setModule(task.module)}>
              {text.actions.goToExperiment}
            </Button>
          </div>
        ) : null}

        <h4 className="label-caps mt-4">{text.headings.criteria}</h4>
        <ul className="mt-1.5 space-y-1.5">
          {item.criteria.map((criterion, criterionIndex) => {
            const ok = status?.checks[criterionIndex] === true;
            return (
              <li key={criterionIndex} className="flex items-start gap-2 text-[12.5px] leading-snug">
                {ok ? (
                  <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ok" strokeWidth={2.5} />
                ) : (
                  <Circle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-ink-4" />
                )}
                <span className={ok ? "text-ink" : "text-ink-2"}>
                  {criterion}
                  <span className="sr-only"> — {ok ? text.observe.met : text.observe.unmet}</span>
                </span>
              </li>
            );
          })}
        </ul>

        {status ? (
          <>
            <h4 className="label-caps mt-4">{text.headings.readouts}</h4>
            <table className="mt-1 w-full text-[12px]">
              <tbody>
                {status.readouts.map((readout) => (
                  <tr key={readout.key} className="border-b border-line/60 last:border-b-0">
                    <th scope="row" className="py-1 pr-2 text-left font-normal text-ink-3">
                      {text.readouts[readout.key] ?? readout.key}
                    </th>
                    <td className="num whitespace-nowrap py-1 text-right text-ink">{byDigits(readout.value, readout.digits)}</td>
                    <td className="w-10 whitespace-nowrap py-1 pl-1.5 text-[11.5px] text-ink-3">
                      {UNIT_LABEL[readout.unit] ?? readout.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}

        <h4 className="label-caps mt-4">{text.headings.theory}</h4>
        <div className="mt-1.5 rounded-sm bg-raised px-3 py-2.5 text-[12.5px] text-ink">
          <Tex block>{content.formula}</Tex>
        </div>
        <p className="mt-2 text-[12px] leading-snug text-ink-3">
          <RichText>{item.note}</RichText>
        </p>
      </Section>

      {/* 3 — explain */}
      <Section title={<StepTitle step={text.steps.explain}>{text.headings.explain}</StepTitle>}>
        {unlocked ? (
          <>
            {isDone ? (
              <p
                className={cn(
                  "mb-2.5 rounded-sm border px-2.5 py-2 text-[12.5px] leading-snug",
                  prediction === undefined
                    ? "border-line text-ink-3"
                    : prediction === content.answer
                      ? "border-ok/40 text-ok"
                      : "border-warn/50 text-warn",
                )}
              >
                {prediction === undefined
                  ? text.predict.skipped
                  : prediction === content.answer
                    ? text.predict.correct
                    : text.predict.wrong}
                <span className="mt-1 block text-ink-2">{text.predict.answer(item.options[content.answer])}</span>
              </p>
            ) : null}
            <p className="text-[13px] leading-relaxed text-ink-2">
              <RichText cite={cite}>{item.explain}</RichText>
            </p>
            <h4 className="label-caps mt-4">{text.headings.references}</h4>
            <ul className="mt-1.5 space-y-1 text-[12px] leading-snug text-ink-3">
              {content.references.map((key) => {
                const reference = REFERENCES[key];
                if (!reference) return null;
                return (
                  <li key={key}>
                    <span className="text-ink-2">{shortCitation(reference, language)}</span>. {reference.title}.
                  </li>
                );
              })}
            </ul>
            {next ? (
              <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => viewTask(next.id)}>
                {text.actions.next}: {text.items[next.id].title}
                <ArrowRight className="size-3.5" />
              </Button>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-[12.5px] leading-snug text-ink-3">{text.explain.locked}</p>
            <Button variant="ghost" size="sm" className="-ml-2 mt-1.5" onClick={() => revealExplanation(id)}>
              {text.actions.reveal}
            </Button>
          </>
        )}
      </Section>
    </div>
  );
}
