/** Grafik paneli (analiz rıhtımı). */
export const plots = {
  title: "Grafikler",
  tabs: {
    label: "Grafik grupları",
    signals: "Sinyaller",
    energy: "Enerji",
    frequency: "Frekans",
    chaos: "Kaos",
  },
  collapse: "Grafik panelini daralt",
  expand: "Grafik panelini aç",
  resize: "Grafik panelinin yüksekliğini değiştir",
  window: "Zaman penceresi",
  seconds: (value: number) => `${value} s`,
  waiting: "Veri bekleniyor",
  axes: {
    time: "t [s]",
    position: "x [m]",
    velocity: "v [m/s]",
    angle: "θ [rad]",
    angularVelocity: "ω [rad/s]",
    energy: "E [J]",
    frequency: "f [Hz]",
    driveFrequency: "ω [rad/s]",
    amplitude: "A [m]",
    phaseLag: "δ [rad]",
  },

  timeSeries: {
    title: "Zaman serisi",
    description: "Konum ve hızın (ya da bağlantı açılarının) zamana göre değişimi; son saniyeler kayan pencerede gösterilir.",
    position: "x",
    velocity: "v",
    exact: "x analitik",
    showExact: "Analitik çözümü göster",
    link: (index: number) => `θ${index}`,
  },

  phase: {
    title: "Faz portresi",
    description: "Durumun faz düzlemindeki yörüngesi: yatay eksende konum (açı), düşey eksende hız (açısal hız).",
    trajectory: "yörünge",
    twin: "ikiz",
    link: "Bağlantı",
  },

  energy: {
    title: "Enerji defteri",
    description: "Kinetik ve potansiyel enerji, ısıya dönüşen enerji ve sürücünün yaptığı iş; kesikli çizgi toplam dengedir.",
    kinetic: "kinetik",
    potential: "potansiyel",
    heat: "sönüm ısısı",
    impact: "çarpışma ısısı",
    work: "sürücü işi",
    total: "denge toplamı",
    residual: "kalıntı",
  },

  response: {
    title: "Frekans yanıtı",
    description: "Kararlı durum genliğinin ve faz gecikmesinin sürücü frekansına bağlılığı: kuramsal eğri ve ölçülen noktalar.",
  },

  spectrum: {
    title: "Genlik spektrumu",
    description: "Kaydedilen sinyalin Hann pencereli ayrık Fourier dönüşümü.",
  },

  divergence: {
    title: "İkiz ayrılması ve Lyapunov üsteli",
    description: "İkiz sarkaçla açısal ayrılmanın logaritmik grafiği ve en büyük Lyapunov üstelinin sonlu zaman kestirimi.",
  },

  poincare: {
    title: "Poincaré kesiti",
    description: "θ₂ = 0 düzleminin artan yönde her geçişinde (θ₁, p₁) noktası.",
  },
};
