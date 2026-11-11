/** Frekans grafikleri: frekans yanıtı (osilatör) ve genlik spektrumu. */
export const plotsFrequency = {
  response: {
    off: "Sürücü kapalı. Frekans yanıtını görmek için sürücü kuvvet genliğini artırın.",
    theory: "kuram",
    live: "ölçülen (canlı)",
    sweep: "tarama",
    sweepImpacts: "tarama, durdurucuya çarpmalı",
    stopLimit: "durdurucu sınırı",
    drive: "sürücü",
    runSweep: "Frekans taraması",
    cancelSweep: "İptal",
    progress: (done: number, total: number) => `${done}/${total}`,
    sweepHint:
      "Çözücü her frekansta kararlı duruma kadar ayrıca çalıştırılır ve genlik ile faz sanal cihazlarla ölçülür. ζ < 0,01 iken kararlı duruma ulaşmak uygulanamayacak kadar uzun sürdüğünden tarama yapılmaz.",
    sweepBlocked: {
      drive: "Tarama için sürücü açık olmalıdır (F₀ > 0).",
      damping: "Tarama için ζ ≥ 0,01 olmalıdır.",
    },
    footer: {
      amplitude: "Genlik",
      phaseLag: "Faz gecikmesi",
      steady: "Kararlı durum",
      transient: "Geçici rejim: ölçülen değerler henüz kuramsal eğriye oturmadı",
      wait: (seconds: string) => `yaklaşık ${seconds} s daha`,
      impactNote:
        "Çarpışmalı noktalar doğrusal kuramdan sapar: durdurucular genliği sınırlar ve yanıtı doğrusal olmaktan çıkarır.",
    },
  },
  spectrum: {
    signalOscillator: "x(t) sinyali",
    signalPendulum: (index: number) => `ω${index}(t) sinyali`,
    peak: "baskın tepe",
    natural: "f₀",
    damped: "f_d",
    drive: "f_s",
    mode: (index: number) => `f${index}`,
    amplitudeAxis: (unit: string) => `Genlik [${unit}]`,
    need: (count: number) => `Spektrum için en az ${count} örnek gerekir`,
    footer: (resolution: string, samples: number, seconds: string, minBin: number) =>
      `Çözünürlük Δf = ${resolution} Hz (son ${samples} örnek, ${seconds} s). Baskın tepe yalnızca ${minBin}·Δf ve üzerindeki frekanslarda verilir; frekansı, sabit genlikli bir çizgi varsayılarak komşu iki kutu arasında ara değerlemeyle okunur. Keskin çizgiler düzenli (periyodik ya da yarı periyodik) hareketi, geniş bantlı sürekli spektrum kaotik hareketi gösterir.`,
  },
};
