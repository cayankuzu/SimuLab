"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ModuleId,
  OscillatorParams,
  OscillatorState,
  createInitialOscillatorState,
  stepOscillatorRK4,
  computeOscillatorEnergy,
  PendulumParams,
  PendulumState,
  createInitialPendulumState,
  stepPendulumRK4,
  computePendulumEnergy,
  PhasePoint,
  EnergySnapshot,
} from "@/engine/physicsModules";
import { Language, translations } from "@/i18n/translations";
import { TopToolbar } from "./TopToolbar";
import { CourseGuidePanel } from "./CourseGuidePanel";
import { PhysicsViewport, ViewOverlays } from "./PhysicsViewport";
import { InspectorPanel } from "./InspectorPanel";
import { Sparkles, X, CheckCircle2 } from "lucide-react";

export const SimuLabWorkspace: React.FC = () => {
  const [moduleId, setModuleId] = useState<ModuleId>("oscillator");
  const [lang, setLang] = useState<Language>("tr");
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [timeScale, setTimeScale] = useState<number>(1.0);
  const [fps, setFps] = useState<number>(60);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const [overlays, setOverlays] = useState<ViewOverlays>({
    velocityVec: true,
    forceVec: true,
    trail: true,
    grid: true,
  });

  // ==========================================
  // MODULE 1 STATE: HARMONIC OSCILLATOR
  // ==========================================
  const [oscParams, setOscParams] = useState<OscillatorParams>({
    mass: 2.0,
    stiffness: 24.0,
    damping: 0.0, // Frictionless start for Level 1
    driveAmp: 0.0,
    driveFreq: 3.46,
  });
  const [oscState, setOscState] = useState<OscillatorState>(() =>
    createInitialOscillatorState(
      {
        mass: 2.0,
        stiffness: 24.0,
        damping: 0.0,
        driveAmp: 0.0,
        driveFreq: 3.46,
      },
      2.0,
      0
    )
  );

  // ============================================================
  // MODULE 2 STATE: MULTI-PENDULUM CHAIN (1 TO 6 LINKED BOBS)
  // ============================================================
  const [pendParams, setPendParams] = useState<PendulumParams>({
    count: 2, // Starts as double pendulum
    masses: [2.0, 1.8, 1.5, 1.2, 1.0, 0.8],
    lengths: [1.2, 1.0, 0.9, 0.8, 0.7, 0.6],
    g: 9.81,
    damping: 0.0,
    ghostEnabled: true,
    ghostDelta: 0.001,
  });
  const [pendState, setPendState] = useState<PendulumState>(() =>
    createInitialPendulumState(
      {
        count: 2,
        masses: [2.0, 1.8, 1.5, 1.2, 1.0, 0.8],
        lengths: [1.2, 1.0, 0.9, 0.8, 0.7, 0.6],
        g: 9.81,
        damping: 0.0,
        ghostEnabled: true,
        ghostDelta: 0.001,
      },
      [2.15, 1.65]
    )
  );

  // ==========================================
  // TELEMETRY HISTORIES (PHASE SPACE & ENERGY)
  // ==========================================
  const [phaseHistory, setPhaseHistory] = useState<PhasePoint[]>([]);
  const [ghostPhaseHistory, setGhostPhaseHistory] = useState<PhasePoint[]>([]);
  const [energyHistory, setEnergyHistory] = useState<EnergySnapshot[]>([]);

  const moduleIdRef = useRef(moduleId);
  moduleIdRef.current = moduleId;
  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;
  const oscParamsRef = useRef(oscParams);
  oscParamsRef.current = oscParams;
  const oscStateRef = useRef(oscState);
  oscStateRef.current = oscState;
  const pendParamsRef = useRef(pendParams);
  pendParamsRef.current = pendParams;
  const pendStateRef = useRef(pendState);
  pendStateRef.current = pendState;
  const isDraggingRef = useRef(false);

  const advanceSimulation = useCallback((dtReal: number) => {
    // If user is directly dragging a mass/bob with the mouse, pause physics solver
    if (isDraggingRef.current) return;

    const dt = Math.min(0.05, dtReal) * timeScaleRef.current;
    if (dt <= 0) return;

    const activeMod = moduleIdRef.current;

    if (activeMod === "oscillator") {
      const next = stepOscillatorRK4(
        oscStateRef.current,
        oscParamsRef.current,
        dt
      );
      oscStateRef.current = next;
      setOscState(next);

      const e = computeOscillatorEnergy(next, oscParamsRef.current);
      setPhaseHistory((prev) => {
        const arr = [...prev, { q: next.x, p: next.v, t: next.t }];
        if (arr.length > 260) arr.shift();
        return arr;
      });
      setEnergyHistory((prev) => {
        const arr = [...prev, e];
        if (arr.length > 180) arr.shift();
        return arr;
      });
    } else if (activeMod === "pendulum") {
      const next = stepPendulumRK4(
        pendStateRef.current,
        pendParamsRef.current,
        dt
      );
      pendStateRef.current = next;
      setPendState(next);

      const e = computePendulumEnergy(next, pendParamsRef.current);
      const wrapAngle = (a: number) =>
        (((a + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) -
        Math.PI;

      // Plot the tip bob (m_N) in the phase space
      const n = pendParamsRef.current.count;
      const tipTh = next.thetas[n - 1] ?? next.thetas[0] ?? 0;
      const tipOm = next.omegas[n - 1] ?? next.omegas[0] ?? 0;
      const gTipTh = next.ghostThetas[n - 1] ?? next.ghostThetas[0] ?? 0;
      const gTipOm = next.ghostOmegas[n - 1] ?? next.ghostOmegas[0] ?? 0;

      setPhaseHistory((prev) => {
        const arr = [
          ...prev,
          { q: wrapAngle(tipTh), p: tipOm, t: next.t },
        ];
        if (arr.length > 260) arr.shift();
        return arr;
      });
      setGhostPhaseHistory((prev) => {
        const arr = [
          ...prev,
          { q: wrapAngle(gTipTh), p: gTipOm, t: next.t },
        ];
        if (arr.length > 260) arr.shift();
        return arr;
      });
      setEnergyHistory((prev) => {
        const arr = [...prev, e];
        if (arr.length > 180) arr.shift();
        return arr;
      });
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    let rafId = 0;
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = lastTime;

    const loop = (now: number) => {
      const dtReal = (now - lastTime) / 1000;
      lastTime = now;
      frameCount++;

      if (now - fpsTimer >= 500) {
        setFps(
          Math.min(144, Math.round((frameCount * 1000) / (now - fpsTimer)))
        );
        frameCount = 0;
        fpsTimer = now;
      }

      advanceSimulation(dtReal);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, advanceSimulation]);

  const handleSelectModule = (nextMod: ModuleId) => {
    setModuleId(nextMod);
    setPhaseHistory([]);
    setGhostPhaseHistory([]);
    setEnergyHistory([]);
  };

  const handleStepFrame = () => {
    advanceSimulation(1 / 60);
  };

  const handleReset = () => {
    setPhaseHistory([]);
    setGhostPhaseHistory([]);
    setEnergyHistory([]);
    if (moduleId === "oscillator") {
      const s = createInitialOscillatorState(oscParamsRef.current, 2.0, 0);
      oscStateRef.current = s;
      setOscState(s);
    } else if (moduleId === "pendulum") {
      const s = createInitialPendulumState(pendParamsRef.current);
      pendStateRef.current = s;
      setPendState(s);
    }
  };

  const handleOscDrag = (x0: number) => {
    const next = createInitialOscillatorState(oscParamsRef.current, x0, 0);
    oscStateRef.current = next;
    setOscState(next);
    setPhaseHistory([{ q: x0, p: 0, t: 0 }]);
    setEnergyHistory([computeOscillatorEnergy(next, oscParamsRef.current)]);
  };

  const handlePendDragBob = (bobIndex: number, newTheta: number) => {
    const nextThetas = [...pendStateRef.current.thetas];
    nextThetas[bobIndex] = newTheta;
    const nextOmegas = new Array<number>(pendParamsRef.current.count).fill(0);
    const next = createInitialPendulumState(
      pendParamsRef.current,
      nextThetas,
      nextOmegas
    );
    pendStateRef.current = next;
    setPendState(next);
    setPhaseHistory([]);
    setGhostPhaseHistory([]);
    setEnergyHistory([computePendulumEnergy(next, pendParamsRef.current)]);
  };

  const handleChangePendCount = (newCount: number) => {
    const clamped = Math.max(1, Math.min(6, newCount));
    const nextP = { ...pendParamsRef.current, count: clamped };
    pendParamsRef.current = nextP;
    setPendParams(nextP);
    const nextS = createInitialPendulumState(nextP);
    pendStateRef.current = nextS;
    setPendState(nextS);
    setPhaseHistory([]);
    setGhostPhaseHistory([]);
    setEnergyHistory([]);
  };

  const handleSetOscParams = (next: OscillatorParams) => {
    oscParamsRef.current = next;
    setOscParams(next);
  };

  const handleSetPendParams = (next: PendulumParams) => {
    pendParamsRef.current = next;
    setPendParams(next);
  };

  const handleSelectOscPreset = (
    preset: "undamped" | "underdamped" | "critical" | "overdamped" | "resonance"
  ) => {
    let nextP: OscillatorParams = { ...oscParamsRef.current };
    if (preset === "undamped") {
      nextP = {
        mass: 2.0,
        stiffness: 24.0,
        damping: 0.0,
        driveAmp: 0,
        driveFreq: 3.46,
      };
    } else if (preset === "underdamped") {
      nextP = {
        mass: 2.0,
        stiffness: 28.0,
        damping: 0.8,
        driveAmp: 0,
        driveFreq: 3.74,
      };
    } else if (preset === "critical") {
      nextP = {
        mass: 2.0,
        stiffness: 24.5,
        damping: 14.0,
        driveAmp: 0,
        driveFreq: 3.5,
      };
    } else if (preset === "overdamped") {
      nextP = {
        mass: 2.0,
        stiffness: 20.0,
        damping: 22.0,
        driveAmp: 0,
        driveFreq: 3.16,
      };
    } else if (preset === "resonance") {
      const m = 2.0;
      const k = 24.5;
      const w0 = Number(Math.sqrt(k / m).toFixed(2));
      nextP = {
        mass: m,
        stiffness: k,
        damping: 0.55,
        driveAmp: 12.0,
        driveFreq: w0,
      };
    }
    oscParamsRef.current = nextP;
    setOscParams(nextP);
    const s = createInitialOscillatorState(
      nextP,
      preset === "resonance" ? 0.2 : 2.0,
      0
    );
    oscStateRef.current = s;
    setOscState(s);
    setPhaseHistory([]);
    setEnergyHistory([]);
    setIsRunning(true);
  };

  const handleSelectPendPreset = (
    preset:
      | "single"
      | "double"
      | "triple"
      | "quad"
      | "five"
      | "six"
      | "quasi"
      | "moon"
      | "mars"
      | "zeroG"
  ) => {
    setPhaseHistory([]);
    setGhostPhaseHistory([]);
    setEnergyHistory([]);
    setIsRunning(true);

    if (preset === "single") {
      const p = {
        ...pendParamsRef.current,
        count: 1,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [1.35]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "double") {
      const p = {
        ...pendParamsRef.current,
        count: 2,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [2.15, 1.65]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "triple") {
      const p = {
        ...pendParamsRef.current,
        count: 3,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [2.2, 1.7, 1.2]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "quad") {
      const p = {
        ...pendParamsRef.current,
        count: 4,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [2.3, 1.8, 1.4, 1.1]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "five") {
      const p = {
        ...pendParamsRef.current,
        count: 5,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [2.35, 1.9, 1.5, 1.2, 0.9]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "six") {
      const p = {
        ...pendParamsRef.current,
        count: 6,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [
        2.4, 2.0, 1.6, 1.3, 1.0, 0.8,
      ]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "quasi") {
      const p = {
        ...pendParamsRef.current,
        count: 2,
        g: 9.81,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [0.35, 0.25]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "moon") {
      const p = {
        ...pendParamsRef.current,
        count: 2,
        g: 1.62,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [2.2, 1.6]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "mars") {
      const p = {
        ...pendParamsRef.current,
        count: 2,
        g: 3.72,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [2.2, 1.6]);
      pendStateRef.current = s;
      setPendState(s);
    } else if (preset === "zeroG") {
      const p = {
        ...pendParamsRef.current,
        count: 2,
        g: 0.0,
        damping: 0,
        ghostEnabled: true,
      };
      pendParamsRef.current = p;
      setPendParams(p);
      const s = createInitialPendulumState(p, [1.8, 1.2], [1.5, -2.0]);
      pendStateRef.current = s;
      setPendState(s);
    }
  };

  const handleApplyCoursePreset = (presetKey: string) => {
    if (moduleId === "oscillator") {
      if (
        presetKey === "undamped" ||
        presetKey === "underdamped" ||
        presetKey === "critical" ||
        presetKey === "overdamped" ||
        presetKey === "resonance"
      ) {
        handleSelectOscPreset(presetKey);
      }
    } else {
      if (
        presetKey === "single" ||
        presetKey === "double" ||
        presetKey === "triple" ||
        presetKey === "quad" ||
        presetKey === "five" ||
        presetKey === "six" ||
        presetKey === "quasi" ||
        presetKey === "moon" ||
        presetKey === "mars" ||
        presetKey === "zeroG"
      ) {
        handleSelectPendPreset(presetKey);
      }
    }
  };

  // Dynamically determine which course lesson level corresponds to current scene configuration
  const currentSceneLevelIdx = React.useMemo(() => {
    if (moduleId === "oscillator") {
      if (
        oscParams.driveAmp > 0.1 &&
        Math.abs(
          oscParams.driveFreq -
            Math.sqrt(oscParams.stiffness / oscParams.mass)
        ) < 0.25
      ) {
        return 2; // Level 3: Rezonans
      }
      if (oscParams.damping === 0) {
        return 0; // Level 1: Temel Mantık (Sürtünmesiz)
      }
      return 1; // Level 2: Sürtünme ve Amortisör
    } else {
      const n = pendParams.count;
      if (n === 1) return 0; // Level 1: Tek Sarkaç & Galileo
      if (n === 2) return 1; // Level 2: Çift Sarkaç & Kaos
      if (n <= 4) return 2; // Level 3: Dörtlü Sarkaç & Kamçı
      return 3; // Level 4: Altılı Zincir & Esnek Halat
    }
  }, [
    moduleId,
    oscParams.damping,
    oscParams.driveAmp,
    oscParams.driveFreq,
    oscParams.stiffness,
    oscParams.mass,
    pendParams.count,
  ]);

  const t = translations[lang];

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#0f0f0e] text-zinc-100 flex flex-col">
      {/* Top Toolbar */}
      <TopToolbar
        moduleId={moduleId}
        onSelectModule={handleSelectModule}
        isRunning={isRunning}
        onToggleRun={() => setIsRunning((r) => !r)}
        onStepFrame={handleStepFrame}
        onReset={handleReset}
        timeScale={timeScale}
        onChangeTimeScale={setTimeScale}
        lang={lang}
        onChangeLang={setLang}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* 2-Column High-Craft Studio Layout: Hero Canvas + Precision Inspector */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <PhysicsViewport
          moduleId={moduleId}
          lang={lang}
          overlays={overlays}
          onToggleOverlay={(key) =>
            setOverlays((prev) => ({ ...prev, [key]: !prev[key] }))
          }
          isRunning={isRunning}
          fps={fps}
          oscParams={oscParams}
          oscState={oscState}
          onOscDrag={handleOscDrag}
          pendParams={pendParams}
          pendState={pendState}
          onPendDragBob={handlePendDragBob}
          onChangePendCount={handleChangePendCount}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={() => {
            isDraggingRef.current = false;
          }}
        />

        <InspectorPanel
          moduleId={moduleId}
          lang={lang}
          oscParams={oscParams}
          oscState={oscState}
          onChangeOscParams={handleSetOscParams}
          onSelectOscPreset={handleSelectOscPreset}
          pendParams={pendParams}
          pendState={pendState}
          onChangePendParams={handleSetPendParams}
          onChangePendCount={handleChangePendCount}
          onSelectPendPreset={handleSelectPendPreset}
          phaseHistory={phaseHistory}
          ghostPhaseHistory={ghostPhaseHistory}
          energyHistory={energyHistory}
        />
      </div>

      {/* Interactive Beginner Guide Modal ("Nasıl Kullanılır?") */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-[#161615] border border-white/[0.12] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SimuLab Hızlı Rehber</span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  {t.guideModal.title}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t.guideModal.subtitle}
                </p>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {t.guideModal.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] space-y-1.5"
                >
                  <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{step.title}</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs transition cursor-pointer shadow-lg shadow-sky-500/20"
            >
              {t.guideModal.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
