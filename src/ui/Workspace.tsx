"use client";

import dynamic from "next/dynamic";
import { TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sonifier } from "@/audio/sonification";
import { DEFAULT_SOLVER } from "@/physics/constants";
import type { SceneManager } from "@/scene/SceneManager";
import { SimulationProvider, useSim, useSimState } from "@/sim/react";
import { useT } from "@/i18n";
import { useTaskRunner } from "./inspector/taskRunner";
import { Button, TooltipProvider, useMediaQuery } from "./kit/core";
import { Dialog } from "./kit/overlays";
import { setPrefs, toggleOverlay, usePrefs } from "./prefs";
import { AnalysisDock } from "./shell/AnalysisDock";
import { ShortcutsDialog, WelcomeDialog } from "./shell/Dialogs";
import { Inspector } from "./shell/Inspector";
import { StatusBar } from "./shell/StatusBar";
import { TopBar } from "./shell/TopBar";
import { Viewport } from "./shell/Viewport";

// The reader for theory, verification and references is large and rarely needed at start-up.
const TheoryDrawer = dynamic(() => import("./theory/TheoryDrawer"), { ssr: false });

export default function Workspace() {
  return (
    <TooltipProvider delayDuration={350} skipDelayDuration={150}>
      <SimulationProvider>
        <Layout />
      </SimulationProvider>
    </TooltipProvider>
  );
}

function Layout() {
  const t = useT();
  const sim = useSim();
  const language = usePrefs((prefs) => prefs.language);
  const muted = usePrefs((prefs) => prefs.muted);
  const [scene, setScene] = useState<SceneManager | null>(null);
  const [theoryOpen, setTheoryOpen] = useState(false);
  const [theoryLoaded, setTheoryLoaded] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  // Matches the "lg" breakpoint: the inspector is a fixed column from there on, a sheet below it.
  const wide = useMediaQuery("(min-width: 64rem)");
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);

  const openTheory = useCallback(() => {
    setTheoryLoaded(true);
    setTheoryOpen(true);
  }, []);

  const notify = useCallback((text: string) => {
    setToast({ id: Date.now(), text });
  }, []);

  // Task sheets are evaluated here so that they keep running whichever inspector tab is open.
  useTaskRunner(
    useCallback(
      (id) => {
        notify(t.tasks.done.announce(t.tasks.items[id].title));
      },
      [notify, t],
    ),
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Keep the document language in step with the interface language (WCAG 3.1.1).
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `${t.app.name} — ${t.app.tagline}`;
  }, [language, t]);

  // A shared link has been consumed; keep the address bar clean so that later edits are not mistaken for it.
  useEffect(() => {
    if (window.location.hash.startsWith("#x=")) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  /* ---- sonification ---- */
  const sonifier = useRef<Sonifier | null>(null);
  useEffect(() => {
    const instance = new Sonifier();
    sonifier.current = instance;
    const unsubscribe = sim.onFrame(() => instance.update(sim));
    return () => {
      unsubscribe();
      instance.dispose();
      sonifier.current = null;
    };
  }, [sim]);
  useEffect(() => {
    sonifier.current?.setEnabled(!muted);
  }, [muted]);

  /* ---- keyboard shortcuts ---- */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) return;
        // Space and Enter belong to the focused control.
        if ((event.key === " " || event.key === "Enter") && (tag === "BUTTON" || tag === "A" || target.getAttribute("role"))) return;
      }
      if (document.querySelector('[role="dialog"]')) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      switch (key) {
        case " ":
          sim.toggleRunning();
          break;
        case ".":
          if (!sim.getState().running) sim.stepFrame();
          break;
        case "r":
          sim.reset();
          break;
        case "1":
          sim.setModule("oscillator");
          break;
        case "2":
          sim.setModule("pendulum");
          break;
        case "v":
          toggleOverlay("velocity");
          break;
        case "f":
          toggleOverlay("netForce");
          break;
        case "b":
          toggleOverlay("freeBody");
          break;
        case "t":
          toggleOverlay("trail");
          break;
        case "s":
          toggleOverlay("strobe");
          break;
        case "g":
          toggleOverlay("grid");
          break;
        case "d":
          setPrefs((prefs) => ({ dockOpen: !prefs.dockOpen }));
          break;
        case "k":
          openTheory();
          break;
        case "m":
          setPrefs((prefs) => ({ muted: !prefs.muted }));
          break;
        case "?":
          setShortcutsOpen(true);
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sim, openTheory]);

  return (
    // Positioned and clipped: visually hidden labels inside the scrolling panels must not enlarge the document.
    <div className="relative flex h-dvh min-h-0 flex-col overflow-clip bg-bg text-ink">
      <TopBar
        onOpenTheory={openTheory}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenInspector={() => setInspectorOpen(true)}
        onNotify={notify}
      />
      <DivergedBanner />
      <div className="flex min-h-0 flex-1">
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Viewport onScene={setScene} scene={scene} />
          <AnalysisDock />
        </main>
        {wide ? (
          <aside className="w-[376px] shrink-0 border-l border-line">
            <Inspector />
          </aside>
        ) : null}
      </div>
      <StatusBar />

      {/* Below the lg breakpoint the inspector opens as a sheet over the scene; only one instance is ever mounted. */}
      <Dialog
        variant="sheet"
        widthClass="max-w-[400px]"
        open={inspectorOpen && !wide}
        onOpenChange={setInspectorOpen}
        title={t.parameters.tabs.label}
        closeLabel={t.common.close}
      >
        <Inspector />
      </Dialog>

      {theoryLoaded ? <TheoryDrawer open={theoryOpen} onOpenChange={setTheoryOpen} /> : null}
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <WelcomeDialog />

      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-10 z-[90] flex justify-center">
        {toast ? (
          <div key={toast.id} className="rounded-md border border-line-strong bg-active px-3.5 py-2 text-[13px] text-ink shadow-pop animate-pop-in">
            {toast.text}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Shown when the chosen integrator produced non-finite values and the run was halted. */
function DivergedBanner() {
  const t = useT();
  const sim = useSim();
  const status = useSimState((state) => state.status);
  if (status === "ok") return null;
  return (
    <div role="alert" className="flex shrink-0 items-center gap-3 border-b border-danger/40 bg-danger/10 px-4 py-2 text-[13px]">
      <TriangleAlert className="size-4 shrink-0 text-danger" />
      <p className="min-w-0 flex-1 text-ink-2">
        <strong className="font-semibold text-ink">{t.solver.diverged.title}.</strong> {t.solver.diverged.body}
      </p>
      <Button variant="secondary" size="sm" onClick={() => sim.setSolver(DEFAULT_SOLVER)}>
        {t.solver.restoreDefault}
      </Button>
    </div>
  );
}
