"use client";

import { BookOpen, FlaskConical, Library } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { shortCitation } from "@/content/citations";
import { REFERENCES } from "@/content/references";
import { citationIndexOf, FRONT_MATTER, THEORY } from "@/content/theory";
import { VALIDATION_SUITE, type ValidationRow } from "@/physics/validation";
import { useT } from "@/i18n";
import { Tab, TabList, TabPanel, Tabs } from "../kit/controls";
import { Dialog } from "../kit/overlays";
import { usePrefs } from "../prefs";
import { ReferencesView } from "./ReferencesView";
import { TheoryView } from "./TheoryView";
import { INITIAL_VERIFICATION, VerificationView, type VerificationState } from "./VerificationView";

type ReaderTab = "theory" | "verification" | "references";

interface TheoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Reader for the written part of the laboratory: the theory text with
 * numbered citations, the verification experiments (run in the browser) and
 * the bibliography.
 */
export default function TheoryDrawer({ open, onOpenChange }: TheoryDrawerProps) {
  const t = useT();
  const language = usePrefs((prefs) => prefs.language);
  const [tab, setTab] = useState<ReaderTab>("theory");
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [verification, setVerification] = useState<VerificationState>(INITIAL_VERIFICATION);
  const timer = useRef(0);

  const document = THEORY[language];
  const cases = t.verification.cases;

  // One numbering for the whole reader: the theory text first, then the verification descriptions.
  const citations = useMemo(() => {
    const index = citationIndexOf(document);
    for (const item of VALIDATION_SUITE) index.scan(cases[item.id].description);
    return index;
  }, [document, cases]);

  const cite = useCallback(
    (keys: string[]): ReactNode => (
      <span className="whitespace-nowrap">
        [
        {keys.map((key, index) => {
          const reference = REFERENCES[key];
          const number = citations.number(key);
          return (
            <span key={key}>
              {index > 0 ? ", " : null}
              <button
                type="button"
                title={reference ? shortCitation(reference, language) : key}
                aria-label={t.theory.citation(String(number))}
                onClick={() => {
                  setFocusKey(key);
                  setTab("references");
                }}
                className="num rounded-xs text-[0.92em] text-accent-strong hover:underline"
              >
                {number}
              </button>
            </span>
          );
        })}
        ]
      </span>
    ),
    [citations, language, t],
  );

  const runVerification = useCallback(() => {
    window.clearTimeout(timer.current);
    const started = performance.now();
    let index = 0;
    setVerification({ status: "running", results: {}, current: VALIDATION_SUITE[0].id, seconds: 0 });
    const next = () => {
      const item = VALIDATION_SUITE[index];
      let rows: ValidationRow[] | "error";
      try {
        rows = item.run();
      } catch {
        rows = "error";
      }
      index++;
      const more = index < VALIDATION_SUITE.length;
      setVerification((previous) => ({
        status: more ? "running" : "done",
        results: { ...previous.results, [item.id]: rows },
        current: more ? VALIDATION_SUITE[index].id : null,
        seconds: (performance.now() - started) / 1000,
      }));
      // Yield between cases so that the progress is painted.
      if (more) timer.current = window.setTimeout(next, 40);
    };
    timer.current = window.setTimeout(next, 40);
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      variant="sheet"
      widthClass="max-w-[1120px]"
      title={t.theory.title}
      description={t.theory.description}
      closeLabel={t.theory.close}
    >
      <Tabs value={tab} onValueChange={(value) => setTab(value as ReaderTab)} className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-line px-5">
          <TabList ariaLabel={t.theory.tabs.label}>
            <Tab value="theory">
              <BookOpen className="size-3.5" />
              {t.theory.tabs.theory}
            </Tab>
            <Tab value="verification">
              <FlaskConical className="size-3.5" />
              {t.theory.tabs.verification}
            </Tab>
            <Tab value="references">
              <Library className="size-3.5" />
              {t.theory.tabs.references}
              <span className="num text-[11px] text-ink-3">{citations.keys.length}</span>
            </Tab>
          </TabList>
        </div>
        {/* The text stays mounted so that its scroll position survives a visit to the references. */}
        <TabPanel value="theory" forceMount className="min-h-0 flex-1 outline-none data-[state=inactive]:hidden">
          <TheoryView document={document} front={FRONT_MATTER[language]} cite={cite} />
        </TabPanel>
        <TabPanel value="verification" className="relative min-h-0 flex-1 overflow-y-auto outline-none">
          <VerificationView state={verification} onRun={runVerification} cite={cite} />
        </TabPanel>
        <TabPanel value="references" className="relative min-h-0 flex-1 overflow-y-auto outline-none">
          <ReferencesView keys={citations.keys} focusKey={focusKey} onBack={() => setTab("theory")} />
        </TabPanel>
      </Tabs>
    </Dialog>
  );
}
