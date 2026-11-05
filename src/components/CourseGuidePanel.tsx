"use client";

import React, { useState } from "react";
import { ModuleId } from "@/engine/physicsModules";
import { Language } from "@/i18n/translations";
import { curriculumData, LessonLevel } from "@/i18n/curriculum";
import {
  GraduationCap,
  Lightbulb,
  HelpCircle,
  Play,
  Globe2,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface CourseGuidePanelProps {
  moduleId: ModuleId;
  lang: Language;
  onApplyPreset: (presetKey: string) => void;
  activeSceneLevelIdx?: number;
}

export const CourseGuidePanel: React.FC<CourseGuidePanelProps> = ({
  moduleId,
  lang,
  onApplyPreset,
  activeSceneLevelIdx = 0,
}) => {
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(activeSceneLevelIdx);
  const [showFaqTab, setShowFaqTab] = useState<boolean>(false);

  // Automatically sync course view to current scene situation when it changes
  React.useEffect(() => {
    setSelectedLevelIdx(activeSceneLevelIdx);
  }, [activeSceneLevelIdx, moduleId]);

  const course = curriculumData[lang][moduleId];
  const currentLevel: LessonLevel =
    course.levels[selectedLevelIdx] ?? course.levels[0];

  const handleSelectLevel = (idx: number) => {
    setShowFaqTab(false);
    setSelectedLevelIdx(idx);
    const lvl = course.levels[idx];
    if (lvl) {
      onApplyPreset(lvl.presetKey);
    }
  };

  return (
    <aside className="w-[390px] xl:w-[425px] shrink-0 h-full bg-[#131312] border-r border-white/[0.08] overflow-y-auto select-none flex flex-col">
      {/* Sticky Header: Interactive Course & Level Selector */}
      <div className="sticky top-0 z-10 bg-[#131312]/95 backdrop-blur-md p-3.5 border-b border-white/[0.08] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-sky-300 uppercase">
            <GraduationCap className="w-4 h-4 text-sky-400" />
            <span>
              {lang === "tr"
                ? "ADIM ADIM ETKİLEŞİMLİ DERS REHBERİ"
                : "STEP-BY-STEP INTERACTIVE COURSE"}
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            {lang === "tr" ? "Sıfırdan İleriye" : "Zero to Hero"}
          </span>
        </div>

        {/* Level Stepper Buttons (Seviye 1 - 4 + S.S.S) */}
        <div className="grid grid-cols-5 gap-1 bg-[#0b0b0a] p-1 rounded-xl border border-white/[0.08]">
          {course.levels.map((lvl, idx) => {
            const active = !showFaqTab && selectedLevelIdx === idx;
            const isSceneCurrent = activeSceneLevelIdx === idx;
            return (
              <button
                key={lvl.level}
                onClick={() => handleSelectLevel(idx)}
                className={`relative py-1.5 px-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex flex-col items-center justify-center ${
                  active
                    ? "bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                {/* Scene Active Indicator Dot */}
                {isSceneCurrent && !active && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
                <span>
                  {lang === "tr" ? `Seviye ${lvl.level}` : `Level ${lvl.level}`}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setShowFaqTab(true)}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex flex-col items-center justify-center ${
              showFaqTab
                ? "bg-amber-400 text-zinc-950 shadow-md shadow-amber-400/20"
                : "text-amber-300/80 hover:text-amber-200 hover:bg-white/[0.04]"
            }`}
          >
            <span>{lang === "tr" ? "❓ S.S.S." : "❓ FAQ"}</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Lesson Body */}
      <div className="p-4 space-y-4">
        {/* General Overview Card */}
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/[0.08] space-y-2">
          <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{course.overviewTitle}</span>
          </div>
          <p className="text-[11.5px] text-zinc-300 leading-relaxed">
            {course.overviewIntro}
          </p>
          <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-[11.5px] text-sky-200 leading-snug font-medium">
            💡 {course.coreIdea}
          </div>
        </div>

        {!showFaqTab ? (
          /* ACTIVE LEVEL CONTENT */
          <div className="space-y-4">
            {/* Level Header & "Apply to Scene" Action Button */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/50 via-zinc-900 to-zinc-900 border border-sky-500/35 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/20 border border-sky-400/40 text-[10px] font-mono font-bold text-sky-300">
                    {currentLevel.badge}
                  </span>
                  {selectedLevelIdx === activeSceneLevelIdx && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {lang === "tr" ? "Sahnede Aktif" : "Active on Scene"}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {currentLevel.level} / 4
                </span>
              </div>

              <h2 className="text-base font-bold text-white leading-snug">
                {currentLevel.title}
              </h2>
              <p className="text-xs text-zinc-300">{currentLevel.subtitle}</p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onApplyPreset(currentLevel.presetKey)}
                  className="w-full py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-500/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {lang === "tr"
                      ? "Bu Seviyeyi Sahneye Uygula ve Canlı İzle!"
                      : "Apply This Level to Scene & Watch Live!"}
                  </span>
                </button>

                {selectedLevelIdx !== activeSceneLevelIdx && (
                  <button
                    onClick={() => handleSelectLevel(activeSceneLevelIdx)}
                    className="w-full py-1.5 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <span>
                      {lang === "tr"
                        ? `⚡ Sahnede Olan Seviyeye Git (Seviye ${activeSceneLevelIdx + 1})`
                        : `⚡ View Currently Active Scene (Level ${activeSceneLevelIdx + 1})`}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Thought Experiment Box (Düşünce Deneyi) */}
            <div className="p-3.5 rounded-xl bg-purple-950/25 border border-purple-500/30 space-y-1.5">
              <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  {lang === "tr"
                    ? "🧠 Düşünce Deneyi (Önce Hayal Edin)"
                    : "🧠 Thought Experiment (Imagine First)"}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {currentLevel.thoughtExperiment}
              </p>
            </div>

            {/* Explain Like I'm 5 (Çocuğa Anlatır Gibi) */}
            <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/30 space-y-1.5">
              <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span>🧒</span>
                <span>
                  {lang === "tr"
                    ? "Çocuğa Anlatır Gibi Basit Mantığı"
                    : "Plain & Simple Explanation"}
                </span>
              </div>
              <p className="text-xs text-zinc-200 leading-relaxed">
                {currentLevel.childExplanation}
              </p>
            </div>

            {/* NE? NEDEN? NASIL? (What, Why, How Cards) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {lang === "tr"
                  ? "🔍 ADIM ADIM: NE? NEDEN? NASIL?"
                  : "🔍 STEP BY STEP: WHAT? WHY? HOW?"}
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/[0.08] space-y-1">
                <p className="text-xs text-zinc-200 leading-relaxed">
                  <strong className="text-sky-400">1. </strong>
                  {currentLevel.whatWhyHow.what}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/[0.08] space-y-1">
                <p className="text-xs text-zinc-200 leading-relaxed">
                  <strong className="text-amber-400">2. </strong>
                  {currentLevel.whatWhyHow.why}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/[0.08] space-y-1">
                <p className="text-xs text-zinc-200 leading-relaxed">
                  <strong className="text-emerald-400">3. </strong>
                  {currentLevel.whatWhyHow.how}
                </p>
              </div>
            </div>

            {/* Interactive Task Prompt */}
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/35 text-xs text-amber-200 leading-relaxed font-medium">
              {currentLevel.tryItTask}
            </div>

            {/* Real-Life Examples */}
            <div className="p-3.5 rounded-xl bg-zinc-900/75 border border-white/[0.08] space-y-2">
              <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-sky-400" />
                <span>
                  {lang === "tr"
                    ? "Günlük Hayatta Nerede Karşımıza Çıkar?"
                    : "Where Do We See This in Real Life?"}
                </span>
              </div>
              <ul className="space-y-1.5">
                {currentLevel.realLifeExamples.map((ex, i) => (
                  <li
                    key={i}
                    className="text-xs text-zinc-300 flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ex}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next Level Button */}
            <div className="pt-1 flex items-center justify-between gap-2">
              {selectedLevelIdx < course.levels.length - 1 ? (
                <button
                  onClick={() => handleSelectLevel(selectedLevelIdx + 1)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.12] text-xs font-bold text-sky-300 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>
                    {lang === "tr"
                      ? `Sonraki Derse Geç: Seviye ${selectedLevelIdx + 2}`
                      : `Next Lesson: Level ${selectedLevelIdx + 2}`}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowFaqTab(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold text-amber-200 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    {lang === "tr"
                      ? "Kafadaki Soru İşaretleri (Soru & Cevap Bölümü)"
                      : "Frequently Asked 'Why?' Questions"}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* FAQ / QUESTION MARKS SECTION */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>
                {lang === "tr"
                  ? "AKLINIZA TAKILABİLECEK TÜM SORULAR & CEVAPLARI"
                  : "FREQUENTLY ASKED QUESTIONS & ANSWERS"}
              </span>
            </div>

            {course.faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/[0.08] space-y-2"
              >
                <div className="text-xs font-bold text-amber-200 leading-snug">
                  ❓ {faq.question}
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  ✅ {faq.answer}
                </p>
              </div>
            ))}

            <button
              onClick={() => handleSelectLevel(0)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition cursor-pointer"
            >
              {lang === "tr"
                ? "← Seviye 1'e Geri Dön"
                : "← Back to Level 1"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
