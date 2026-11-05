"use client";

import React from "react";
import { ModuleId } from "@/engine/physicsModules";
import { Language, translations } from "@/i18n/translations";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Atom,
  HelpCircle,
  Waves,
  GitBranch,
} from "lucide-react";

interface TopToolbarProps {
  moduleId: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  isRunning: boolean;
  onToggleRun: () => void;
  onStepFrame: () => void;
  onReset: () => void;
  timeScale: number;
  onChangeTimeScale: (scale: number) => void;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onOpenGuide: () => void;
}

const TIME_SCALES = [0.25, 0.5, 1.0, 2.0];

export const TopToolbar: React.FC<TopToolbarProps> = ({
  moduleId,
  onSelectModule,
  isRunning,
  onToggleRun,
  onStepFrame,
  onReset,
  timeScale,
  onChangeTimeScale,
  lang,
  onChangeLang,
  onOpenGuide,
}) => {
  const t = translations[lang];

  return (
    <header className="h-14 shrink-0 bg-[#0d0e12] border-b border-white/[0.08] px-4 flex items-center justify-between gap-4 select-none z-20">
      {/* Left: Brand + 2 Clear Module Buttons */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pr-3 border-r border-white/[0.08]">
          <div className="w-7 h-7 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Atom className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white font-mono">
              SimuLab
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
              RK4 300Hz
            </span>
          </div>
        </div>

        {/* 2 Clean Module Pills */}
        <nav className="flex items-center bg-[#15171d] p-1 rounded-lg border border-white/[0.06] gap-1">
          <button
            onClick={() => onSelectModule("oscillator")}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              moduleId === "oscillator"
                ? "bg-amber-400 text-zinc-950 font-bold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{t.modules.oscillator.short}</span>
          </button>

          <button
            onClick={() => onSelectModule("pendulum")}
            className={`px-3 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
              moduleId === "pendulum"
                ? "bg-amber-400 text-zinc-950 font-bold shadow"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>{t.modules.pendulum.short}</span>
          </button>
        </nav>
      </div>

      {/* Center: Playback Controls */}
      <div className="flex items-center gap-1.5 bg-[#15171d] px-2 py-1 rounded-lg border border-white/[0.06]">
        <button
          onClick={onToggleRun}
          className={`px-3 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
            isRunning
              ? "bg-zinc-800 text-amber-300 hover:bg-zinc-700"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>{t.toolbar.pause}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>{t.toolbar.play}</span>
            </>
          )}
        </button>

        <button
          onClick={onStepFrame}
          disabled={isRunning}
          title={t.toolbar.stepHint}
          className="px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1 transition cursor-pointer"
        >
          <StepForward className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.toolbar.step}</span>
        </button>

        <button
          onClick={onReset}
          className="px-2 py-1 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center gap-1 transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.toolbar.reset}</span>
        </button>

        {/* Speed Selector */}
        <div className="hidden sm:flex items-center gap-0.5 pl-1.5 border-l border-white/[0.08]">
          {TIME_SCALES.map((s) => (
            <button
              key={s}
              onClick={() => onChangeTimeScale(s)}
              className={`px-1.5 py-0.5 rounded text-[11px] font-mono tabular-nums transition cursor-pointer ${
                Math.abs(timeScale - s) < 0.01
                  ? "bg-zinc-800 text-amber-300 font-bold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Right: Guide & Language */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenGuide}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 flex items-center gap-1.5 transition cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>{t.guideBtn}</span>
        </button>

        <div className="flex items-center bg-[#15171d] p-0.5 rounded-lg border border-white/[0.06] font-mono text-xs">
          <button
            onClick={() => onChangeLang("tr")}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              lang === "tr"
                ? "bg-zinc-800 text-amber-300 font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            TR
          </button>
          <button
            onClick={() => onChangeLang("en")}
            className={`px-2 py-0.5 rounded transition cursor-pointer ${
              lang === "en"
                ? "bg-zinc-800 text-amber-300 font-bold"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </header>
  );
};
