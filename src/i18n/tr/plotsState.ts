/** Durum grafikleri: faz portresi (Sinyaller sekmesi) ve enerji defteri (Enerji sekmesi). */
export const plotsState = {
  phase: {
    history: (seconds: number) => `Son ${seconds} saniyenin yörüngesi çizilir; eski kısımlar daha soluk gösterilir.`,
    stop: "durdurucu",
    stopsNote: "Mekanik durdurucular görünen aralığa girdiğinde konumları düşey kesikli çizgilerle belirtilir.",
    twinNote: "Kesikli mor eğri ikiz sarkacın yörüngesidir.",
    separatrix: "separatris",
    separatrixHint:
      "Sönümsüz sarkacın separatrisi: ω = ±2√(g/L) cos(θ/2). İçinde kalan yörüngeler salınım, dışında kalanlar dönme hareketidir.",
    separatrixNote: "Kesikli turuncu eğri separatristir; salınım bölgesini dönme bölgesinden ayırır.",
  },

  energy: {
    description: {
      oscillator:
        "Enerji defterinin zaman grafiği. Yığılmış alanlar alttan üste kinetik enerji, potansiyel enerji, sönümleyicide ısıya dönüşen enerji ve durdurucu çarpışmalarında ısıya dönüşen enerjidir. Kesikli çizgi sisteme sağlanan enerjiyi (E₀ + W), ince çizgi sürücünün yaptığı işi (W) gösterir. Sayısal çözüm doğruysa yığının tepesi kesikli çizgiyle çakışır.",
      pendulum:
        "Enerji defterinin zaman grafiği. Yığılmış alanlar alttan üste kinetik enerji, potansiyel enerji ve mafsallarda ısıya dönüşen enerjidir. Kesikli çizgi referans enerjisi E₀'dır. Sayısal çözüm doğruysa yığının tepesi kesikli çizgiyle çakışır.",
    },
    supplied: "sağlanan enerji",
    reference: "referans enerjisi",
    relativeResidual: "bağıl kalıntı",
    ledger: {
      caption: "Enerji defterinin anlık değerleri",
      sign: "İşaret",
      term: "Terim",
      value: "Değer",
    },
    note: "Kalıntı (ΔE = Σ − E₀) sayısal çözücünün hatasıdır; fiziksel bir enerji kaybı değildir.",
  },
};
