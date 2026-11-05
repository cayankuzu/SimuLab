"use client";

import React from "react";
import { CheckCircle2, Circle, Trophy, X, Target, Sparkles, ArrowRight } from "lucide-react";

export interface ChallengeStatus {
  id: string;
  title: string;
  desc: string;
  category: "oscillator" | "pendulum";
  completed: boolean;
  hint: string;
}

interface LabChallengesModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: ChallengeStatus[];
  onSelectChallenge: (id: string) => void;
}

export const LabChallengesModal: React.FC<LabChallengesModalProps> = ({
  isOpen,
  onClose,
  challenges,
  onSelectChallenge,
}) => {
  if (!isOpen) return null;

  const completedCount = challenges.filter((c) => c.completed).length;
  const progressPercent = Math.round((completedCount / challenges.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#101319] border border-white/[0.12] shadow-2xl p-6 space-y-5 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                Laboratuvar Görevleri
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  {completedCount}/{challenges.length} Başarıldı
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Fiziksel fenomenleri bizzat parametreleri ayarlayarak ortaya çıkarın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono text-zinc-400">
            <span>Genel Başarı İlerlemesi</span>
            <span className="text-amber-400 font-bold">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Challenges List */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {challenges.map((c, i) => (
            <div
              key={c.id}
              className={`p-3.5 rounded-xl border transition-all ${
                c.completed
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-[#141822] border-white/[0.06] hover:border-amber-400/30"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {c.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-zinc-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-100">
                        {i + 1}. {c.title}
                      </span>
                      {c.completed && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                          TAMAMLANDI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {c.desc}
                    </p>
                    <div className="text-[11px] font-mono text-amber-400/90 flex items-center gap-1 pt-0.5">
                      <Sparkles className="w-3 h-3" />
                      <span>İpucu: {c.hint}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectChallenge(c.id);
                    onClose();
                  }}
                  className="shrink-0 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-amber-400 hover:text-zinc-950 text-zinc-300 transition text-xs font-mono flex items-center gap-1 cursor-pointer"
                  title="Bu göreve git"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition cursor-pointer"
          >
            Kapat ve Deneye Dön
          </button>
        </div>
      </div>
    </div>
  );
};
