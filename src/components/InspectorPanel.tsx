"use client";

import React, { useState } from "react";
import {
  ModuleId,
  OscillatorParams,
  OscillatorState,
  computeOscillatorDerived,
  computeOscillatorEnergy,
  PendulumParams,
  PendulumState,
  computePendulumEnergy,
  computePendulumAngularDifferenceDeg,
  getNPendulumKinematics,
  PENDULUM_BOB_COLORS,
  PhasePoint,
  EnergySnapshot,
} from "@/engine/physicsModules";
import { Language, translations } from "@/i18n/translations";
import { MathFormula } from "./MathFormula";
import { PhaseSpacePlot } from "./PhaseSpacePlot";
import { EnergyWidget } from "./EnergyWidget";
import { Sliders, Activity, BookOpen, Sparkles, CheckCircle2 } from "lucide-react";

interface InspectorPanelProps {
  moduleId: ModuleId;
  lang: Language;
  oscParams: OscillatorParams;
  oscState: OscillatorState;
  onChangeOscParams: (next: OscillatorParams) => void;
  onSelectOscPreset: (
    preset: "undamped" | "underdamped" | "critical" | "overdamped" | "resonance"
  ) => void;
  pendParams: PendulumParams;
  pendState: PendulumState;
  onChangePendParams: (next: PendulumParams) => void;
  onChangePendCount: (newCount: number) => void;
  onSelectPendPreset: (
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
  ) => void;
  phaseHistory: PhasePoint[];
  ghostPhaseHistory: PhasePoint[];
  energyHistory: EnergySnapshot[];
}

interface TactileSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  colorDot?: string;
  onChange: (val: number) => void;
}

const TactileSlider: React.FC<TactileSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  colorDot,
  onChange,
}) => (
  <div className="p-2.5 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-1.5 hover:border-white/[0.12] transition">
    <div className="flex justify-between items-center text-xs">
      <span className="font-medium text-zinc-300 flex items-center gap-1.5">
        {colorDot && (
          <span
            className="w-2 h-2 rounded-full inline-block shrink-0"
            style={{ backgroundColor: colorDot }}
          />
        )}
        {label}
      </span>
      <span className="font-mono tabular-nums text-amber-300 font-semibold text-[11px]">
        {value.toFixed(step < 0.01 ? 3 : step < 0.1 ? 2 : 1)}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
    />
  </div>
);

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  moduleId,
  lang,
  oscParams,
  oscState,
  onChangeOscParams,
  onSelectOscPreset,
  pendParams,
  pendState,
  onChangePendParams,
  onChangePendCount,
  onSelectPendPreset,
  phaseHistory,
  ghostPhaseHistory,
  energyHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"controls" | "telemetry" | "theory">("controls");
  const t = translations[lang];
  const oscDerived = computeOscillatorDerived(oscParams);

  const currentEnergy: EnergySnapshot =
    moduleId === "oscillator"
      ? computeOscillatorEnergy(oscState, oscParams)
      : computePendulumEnergy(pendState, pendParams);

  const n = Math.max(1, Math.min(6, Math.floor(Number(pendParams.count) || 2)));
  const angDiffDeg = computePendulumAngularDifferenceDeg(pendState, n);
  const mainKin = getNPendulumKinematics(
    pendState.thetas,
    pendState.omegas,
    pendParams.lengths,
    n
  );

  // Dynamic Graph Interpretation Pill
  const getPhaseSpaceInterpretation = (): { badge: string; text: string; color: string } => {
    if (moduleId === "oscillator") {
      if (oscDerived.isResonant) {
        return {
          badge: "Rezonans Sarmalı",
          text: "Dış motor sürekli enerji pompalıyor; faz uzayında yörünge dışarı doğru genişleyen spiral çizer.",
          color: "border-amber-500/40 text-amber-300 bg-amber-950/40",
        };
      }
      if (oscParams.damping === 0) {
        return {
          badge: "Kapalı Elips (Korunum)",
          text: "Sürtünme sıfır; yörünge her turda aynı kapalı halkayı çizer, enerji asla kaybolmaz.",
          color: "border-sky-500/40 text-sky-300 bg-sky-950/40",
        };
      }
      if (oscDerived.regime === "critical") {
        return {
          badge: "Doğrudan Merkeze Dönüş",
          text: "Kritik sönüm: Hiç salınım yapmadan mümkün olan en kısa sürede (0, 0) merkezine döner.",
          color: "border-purple-500/40 text-purple-300 bg-purple-950/40",
        };
      }
      return {
        badge: "İçe Çöken Spiral",
        text: "Sönümleme: Amortisör her turda mekanik enerjiyi ısıya çevirir; yörünge merkeze kıvrılır.",
        color: "border-emerald-500/40 text-emerald-300 bg-emerald-950/40",
      };
    }

    // Pendulum phase interpretation
    if (n === 1) {
      return {
        badge: "Periyodik Kapalı Halka",
        text: "Tek kütlede kaos oluşmaz. Saat gibi düzenlidir; faz uzayında kusursuz simetrik döngü çizer.",
        color: "border-sky-500/40 text-sky-300 bg-sky-950/40",
      };
    }
    if (n === 2 && angDiffDeg > 8.0) {
      return {
        badge: "Kaotik Attraktör",
        text: "Kelebek Etkisi: Yörünge asla kendi üstüne basmaz; sonsuz karmaşık fraktal bir yumak örer.",
        color: "border-rose-500/40 text-rose-300 bg-rose-950/40",
      };
    }
    return {
      badge: `${n} Serbestlik Derecesi`,
      text: `${n} bağlı kütle arasında açısal momentum sürekli transfer edilir; çok boyutlu faz uzayı.`,
      color: "border-amber-500/40 text-amber-300 bg-amber-950/40",
    };
  };

  const phaseInterpretation = getPhaseSpaceInterpretation();

  return (
    <aside className="w-[370px] xl:w-[395px] shrink-0 h-full bg-[#0d0e12] border-l border-white/[0.08] overflow-y-auto select-none flex flex-col text-zinc-200">
      {/* Precision Segmented Tab Header */}
      <div className="sticky top-0 z-20 bg-[#0d0e12]/95 backdrop-blur-md px-3.5 py-2.5 border-b border-white/[0.08]">
        <div className="grid grid-cols-3 gap-1 bg-[#15171d] p-1 rounded-lg border border-white/[0.06]">
          {[
            { id: "controls", label: "⚙️ Ayarlar" },
            { id: "telemetry", label: "📊 Telemetri" },
            { id: "theory", label: "💡 Öz Bilgi" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 px-2 rounded-md text-xs font-medium transition cursor-pointer text-center ${
                activeTab === tab.id
                  ? "bg-amber-400/20 text-amber-200 border border-amber-400/40 font-bold shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ======================================================== */}
        {/* TAB 1: KONTROL (CONTROLS & PRESETS)                      */}
        {/* ======================================================== */}
        {activeTab === "controls" && (
          <div className="space-y-4">
            {/* Quick 1-Click Scenario Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Hazır Senaryolar
              </span>
              <div className="flex flex-wrap gap-1.5">
                {moduleId === "oscillator" ? (
                  <>
                    {[
                      { key: "undamped", label: "♾️ Sürtünmesiz" },
                      { key: "underdamped", label: "🌊 Normal Yay" },
                      { key: "critical", label: "🛑 Amortisör" },
                      { key: "overdamped", label: "🍯 Bal İçi" },
                      { key: "resonance", label: "💥 Rezonans" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => onSelectOscPreset(p.key as any)}
                        className="px-2.5 py-1 rounded-md text-xs bg-[#16181f] hover:bg-[#20232c] border border-white/[0.08] hover:border-amber-400/30 text-zinc-300 transition cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { key: "single", label: "🕰️ 1'li Galileo" },
                      { key: "double", label: "🦋 2'li Kaos" },
                      { key: "triple", label: "🌀 3'lü Eklem" },
                      { key: "quad", label: "⚡ 4'lü Kamçı" },
                      { key: "six", label: "⛓️ 6'lı Halat" },
                      { key: "moon", label: "🌙 Ay" },
                      { key: "zeroG", label: "🚀 0-G" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => onSelectPendPreset(p.key as any)}
                        className="px-2.5 py-1 rounded-md text-xs bg-[#16181f] hover:bg-[#20232c] border border-white/[0.08] hover:border-amber-400/30 text-zinc-300 transition cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Tactile Sliders */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                Fiziksel Parametreler
              </span>

              {moduleId === "oscillator" ? (
                <div className="space-y-2">
                  <TactileSlider
                    label="Kütle (m)"
                    value={oscParams.mass}
                    min={0.5}
                    max={10}
                    step={0.1}
                    unit="kg"
                    onChange={(mass) => onChangeOscParams({ ...oscParams, mass })}
                  />
                  <TactileSlider
                    label="Yay Sertliği (k)"
                    value={oscParams.stiffness}
                    min={4}
                    max={80}
                    step={0.5}
                    unit="N/m"
                    onChange={(stiffness) =>
                      onChangeOscParams({ ...oscParams, stiffness })
                    }
                  />
                  <TactileSlider
                    label="Sönüm / Sürtünme (c)"
                    value={oscParams.damping}
                    min={0}
                    max={25}
                    step={0.1}
                    unit="N·s/m"
                    onChange={(damping) =>
                      onChangeOscParams({ ...oscParams, damping })
                    }
                  />
                  <TactileSlider
                    label="Dış Motor Kuvveti (F₀)"
                    value={oscParams.driveAmp}
                    min={0}
                    max={25}
                    step={0.5}
                    unit="N"
                    onChange={(driveAmp) =>
                      onChangeOscParams({ ...oscParams, driveAmp })
                    }
                  />
                  {oscParams.driveAmp > 0 && (
                    <TactileSlider
                      label="Motor Frekansı (ω)"
                      value={oscParams.driveFreq}
                      min={0.5}
                      max={10}
                      step={0.05}
                      unit="rad/s"
                      onChange={(driveFreq) =>
                        onChangeOscParams({ ...oscParams, driveFreq })
                      }
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Gravity Preset Selector */}
                  <div className="p-2.5 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-300 font-medium">Yerçekimi Alanı (g)</span>
                      <span className="font-mono text-amber-300 font-bold text-[11px]">
                        {pendParams.g.toFixed(2)} m/s²
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { label: "🌍 Dünya", g: 9.81 },
                        { label: "🔴 Mars", g: 3.72 },
                        { label: "🌙 Ay", g: 1.62 },
                        { label: "🚀 Uzay", g: 0.0 },
                      ].map((gp) => (
                        <button
                          key={gp.label}
                          onClick={() => onChangePendParams({ ...pendParams, g: gp.g })}
                          className={`py-1 rounded text-[10px] font-medium transition cursor-pointer ${
                            Math.abs(pendParams.g - gp.g) < 0.05
                              ? "bg-amber-400 text-zinc-950 font-bold shadow"
                              : "bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
                          }`}
                        >
                          {gp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Joint Damping */}
                  <TactileSlider
                    label="Menteşe Sürtünmesi (c)"
                    value={pendParams.damping}
                    min={0}
                    max={0.4}
                    step={0.01}
                    unit="1/s"
                    onChange={(damping) =>
                      onChangePendParams({ ...pendParams, damping })
                    }
                  />

                  {/* Individual Mass & Rod Lengths */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">
                      Halka Kütleleri ve Kol Boyları
                    </span>
                    {Array.from({ length: n }).map((_, idx) => {
                      const col = PENDULUM_BOB_COLORS[idx % PENDULUM_BOB_COLORS.length];
                      return (
                        <div
                          key={idx}
                          className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-[#14161a] border border-white/[0.05]"
                        >
                          <TactileSlider
                            colorDot={col.fill}
                            label={`m${idx + 1}`}
                            value={pendParams.masses[idx] ?? 1.5}
                            min={0.3}
                            max={6.0}
                            step={0.1}
                            unit="kg"
                            onChange={(val) => {
                              const nextM = [...pendParams.masses];
                              nextM[idx] = val;
                              onChangePendParams({ ...pendParams, masses: nextM });
                            }}
                          />
                          <TactileSlider
                            label={`L${idx + 1}`}
                            value={pendParams.lengths[idx] ?? 1.0}
                            min={0.4}
                            max={1.8}
                            step={0.05}
                            unit="m"
                            onChange={(val) => {
                              const nextL = [...pendParams.lengths];
                              nextL[idx] = val;
                              onChangePendParams({ ...pendParams, lengths: nextL });
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TELEMETRİ & GRAFİKLER (OSCILLOSCOPE + INTERPRET)  */}
        {/* ======================================================== */}
        {activeTab === "telemetry" && (
          <div className="space-y-4">
            {/* Live Graph Interpretation Pill */}
            <div className={`p-2.5 rounded-lg border space-y-1 ${phaseInterpretation.color}`}>
              <div className="text-[11px] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Canlı Grafik Yorumu: {phaseInterpretation.badge}</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                {phaseInterpretation.text}
              </p>
            </div>

            {/* Phase Space Plot */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono text-zinc-300">
                  {moduleId === "oscillator" ? "Faz Uzayı (x vs v)" : `Faz Uzayı (θ_${n} vs ω_${n})`}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Osilatör İzi</span>
              </div>
              <PhaseSpacePlot
                points={phaseHistory}
                ghostPoints={
                  moduleId === "pendulum" && n >= 2 && pendParams.ghostEnabled
                    ? ghostPhaseHistory
                    : undefined
                }
                xLabel={moduleId === "oscillator" ? "x (m)" : `θ_${n}`}
                yLabel={moduleId === "oscillator" ? "v (m/s)" : `ω_${n}`}
              />
            </div>

            {/* Energy Conservation Breakdown */}
            <div className="space-y-1.5 pt-1">
              <span className="font-mono text-xs text-zinc-300">
                Mekanik Enerji Dağılımı
              </span>
              <EnergyWidget
                current={currentEnergy}
                history={energyHistory}
                labels={{
                  kinetic: "Kinetik (Hareket)",
                  kineticDesc: "Hız arttıkça yükselir",
                  potential: "Potansiyel (Depolanan)",
                  potentialDesc: "Uç noktalarda maksimum",
                  thermal: "Isı (Sürtünme Kaybı)",
                  thermalDesc: "Amortisörle ortama yayılan",
                  totalMech: "Toplam Mekanik Enerji",
                }}
              />
            </div>

            {/* Differential Equation */}
            <div className="p-2.5 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-1 text-center">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                RK4 Diferansiyel Denklemi
              </span>
              <div className="overflow-x-auto py-1">
                {moduleId === "oscillator" ? (
                  <MathFormula
                    tex={
                      oscParams.driveAmp > 0
                        ? "m\\ddot{x} + c\\dot{x} + kx = F_0\\cos(\\omega t)"
                        : oscParams.damping > 0
                        ? "m\\ddot{x} + c\\dot{x} + kx = 0"
                        : "m\\ddot{x} + kx = 0"
                    }
                    className="text-xs text-zinc-100"
                  />
                ) : n === 1 ? (
                  <MathFormula
                    tex="L_1\\ddot{\\theta}_1 + g\\sin\\theta_1 = 0"
                    className="text-xs text-zinc-100"
                  />
                ) : (
                  <MathFormula
                    tex={`\\sum_{j=1}^{${n}} M_{ij} L_j \\cos(\\theta_i - \\theta_j)\\ddot{\\theta}_j = -M_{ii}g\\sin\\theta_i`}
                    className="text-xs text-zinc-100"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ÖZ BİLGİ & DERS (CONCISE, NO ESSAY POLLUTION)     */}
        {/* ======================================================== */}
        {activeTab === "theory" && (
          <div className="space-y-3 text-xs leading-relaxed">
            {moduleId === "oscillator" ? (
              <>
                <div className="p-3 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-2">
                  <div className="font-bold text-amber-300 text-sm">
                    Yay Neden Sallanır?
                  </div>
                  <p className="text-zinc-300">
                    Yay her zaman rahat olduğu <strong>Denge Noktasına (x = 0)</strong> dönmek ister. Çektiğinizde potansiyel enerji depolanır; bıraktığınızda kinetik enerjiye dönüşür.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-1.5">
                  <div className="font-semibold text-zinc-200">📌 3 Temel Kural:</div>
                  <ul className="space-y-1 text-zinc-400">
                    <li>• <strong>Merkezde:</strong> Yay kuvveti sıfırdır ama hız maksimumdur; bu yüzden kütle duramaz (eylemsizlik).</li>
                    <li>• <strong>Uçlarda:</strong> Hız sıfırdır, kuvvet ve depolanan enerji maksimumdur.</li>
                    <li>• <strong>Rezonans:</strong> Dış itme frekansı doğal frekansla eşleşirse salınım sonsuza doğru büyür.</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-2">
                  <div className="font-bold text-amber-300 text-sm">
                    {n === 1
                      ? "Tek Sarkaç ve Galileo Yasası"
                      : "Çoklu Sarkaç ve Kaos Teorisi"}
                  </div>
                  <p className="text-zinc-300">
                    {n === 1
                      ? "Tek kütle bağlıyken kaos matematiksel olarak imkânsızdır. Kütle ne olursa olsun periyot sadece kol boyuna (L) ve yerçekimine (g) bağlıdır."
                      : "İkinci ve sonraki kütleler eklendiğinde sistem doğrusal olmayan kuplaja girer. Başlangıçtaki 0.05° fark saniyeler içinde kaosa dönüşür."}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#14161a] border border-white/[0.06] space-y-1.5">
                  <div className="font-semibold text-zinc-200">📌 3 Temel Püf Noktası:</div>
                  <ul className="space-y-1 text-zinc-400">
                    <li>• <strong>Kelebek Etkisi:</strong> Pembe ikiz sarkaç, minik farkların geleceği nasıl değiştirdiğini kanıtlar.</li>
                    <li>• <strong>Kamçı Dalgası:</strong> Üstteki kütleler yavaşlayınca açısal momentum en uçtaki hafif kütleye devredilir.</li>
                    <li>• <strong>Esnek Halat:</strong> 6 halka bağlandığında katı çubuklar esnek bir kablo/ip gibi dalgalanır.</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
