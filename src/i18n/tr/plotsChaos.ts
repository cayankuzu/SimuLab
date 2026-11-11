/** Kaos grafikleri: ikiz ayrılması, Lyapunov kestirimi ve Poincaré kesiti. */
export const plotsChaos = {
  divergence: {
    separation: "ikiz ayrılması δ",
    exponential: "δ₀·e^(λt)",
    lyapunov: "λ kestirimi",
    separationAxis: "δ [rad]",
    lyapunovAxis: "λ [1/s]",
    threshold: "1 rad",
    twinOff: "İkiz yörünge kapalı; yalnızca Lyapunov kestirimi gösteriliyor.",
    footer: {
      lyapunov: (value: string, seconds: string) => `λ ≈ ${value} s⁻¹ (sonlu zaman kestirimi, ${seconds} s ortalama)`,
      lyapunovTime: (value: string) => `Lyapunov süresi 1/λ ≈ ${value} s`,
      horizon: (estimate: string, observed: string) =>
        `öngörü ufku kestirimi ${estimate} s, ikizin bırakılmasından sonra gözlenen ayrılma süresi: ${observed}`,
      notYet: "henüz yok",
      seconds: (value: string) => `${value} s`,
      caution:
        "Ufuk formülü t ≈ ln(a/δ₀)/λ bir mertebe kestirimidir: yerel gerilme hızı yörünge boyunca değişir, bu yüzden gözlenen ayrılma süresi kestirimden birkaç kat sapabilir.",
      integrable:
        "Tek sarkaç integre edilebilir bir sistemdir: λ sıfıra gider ve sonlu zaman kestirimi yaklaşık ln t / t gibi azalır.",
    },
  },
  poincare: {
    points: (count: number) => `${count} kesit noktası`,
    momentumAxis: "p₁ [kg·m²/s]",
    onlyDouble:
      "İki boyutlu Poincaré kesiti yalnızca çift sarkaç için tanımlıdır: faz uzayı dört boyutlu, enerji yüzeyi üç boyutludur.",
    waiting: "Kesit noktaları birikiyor",
    footer:
      "Kesit: θ₂ = 0 (mod 2π), θ₂ artarken. Kapalı eğriler üzerinde dizilen noktalar değişmez bir tor üzerindeki düzenli (yarı periyodik) hareketi, bir alanı dolduran noktalar kaotik hareketi gösterir. Kesit her yeni yörüngeyle yeniden başlar.",
  },
};
