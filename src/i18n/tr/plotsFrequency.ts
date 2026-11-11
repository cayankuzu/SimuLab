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
      "Çözücü her frekansta kararlı duruma kadar ayrıca çalıştırılır ve genlik ile faz sanal cihazlarla ölçülür.",
    sweepDisabled:
      "Tarama için sürücü açık ve ζ ≥ 0,01 olmalıdır; sönüm çok küçükken kararlı duruma ulaşmak uygulanamayacak kadar uzun sürer.",
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
    footer: (resolution: string, seconds: string) =>
      `Çözünürlük Δf = ${resolution} Hz; çözümlenen kayıt ${seconds} s. Keskin çizgiler düzenli (periyodik ya da yarı periyodik) hareketi, geniş bantlı sürekli spektrum kaotik hareketi gösterir.`,
  },
};
