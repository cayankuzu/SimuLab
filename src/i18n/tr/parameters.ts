/** Parametreler paneli. */
export const parameters = {
  tabs: { parameters: "Parametreler", measurements: "Ölçümler", tasks: "Föyler", label: "Denetçi bölümleri" },
  scenarios: "Hazır deneyler",
  physical: "Fiziksel parametreler",
  initial: "Başlangıç koşulları",
  initialHint: "Değer girildiğinde deney bu koşullardan yeniden başlar.",
  numerical: "Sayısal yöntem gösterimi",
  timeScaleNote:
    "Benzetim zamanının duvar saatine oranı. Adım boyu ve hesaplanan durumlar değişmez; yalnızca hareketin gösterilme hızı değişir.",

  oscillator: {
    equation: "Hareket denklemi",
    mass: "Kütle",
    stiffness: "Yay sabiti",
    damping: "Sönüm katsayısı",
    driveAmplitude: "Sürücü kuvvet genliği",
    driveFrequency: "Sürücü açısal frekansı",
    x0: "Başlangıç konumu",
    v0: "Başlangıç hızı",
    marks: { critical: "kritik", natural: "ω₀", peak: "tepe" },
    driveOff: "Sürücü kapalı; genliği artırınca frekans denetimi etkinleşir.",
    presets: {
      undamped: { name: "Sönümsüz", note: "c = 0. Faz portresi kapalı bir elipstir." },
      underdamped: { name: "Zayıf sönüm", note: "ζ ≈ 0,05. Genlik üstel zarfla azalır." },
      critical: { name: "Kritik sönüm", note: "ζ = 1. Aşımsız en hızlı dönüş." },
      overdamped: { name: "Aşırı sönüm", note: "ζ ≈ 1,7. Salınım yok, dönüş yavaş." },
      resonance: { name: "Rezonans", note: "ω = ω₀, Q ≈ 13. Kararlı genlik F₀/(cω₀) ≈ 4,2 m." },
      beats: { name: "Vuru", note: "Sönümsüz, ω₀'ın %10 altında sürülür; zarf 18 s'de bir atar." },
      eulerDrift: {
        name: "Euler kayması",
        note: "Aynı sönümsüz sistem, 60 Hz açık Euler ile: enerji yapay olarak artar. Başka bir hazır deneye geçildiğinde önceki çözücü geri gelir.",
      },
    },
  },

  pendulum: {
    links: "Bağlantı sayısı",
    gravity: "Yerçekimi ivmesi",
    jointDamping: "Mafsal sönüm katsayısı",
    chain: "Kütleler ve çubuk boyları",
    massOf: (index: number) => `${index}. kütle`,
    lengthOf: (index: number) => `${index}. çubuk boyu`,
    angleOf: (index: number) => `${index}. açı`,
    omegaOf: (index: number) => `${index}. açısal hız`,
    angleUnitNote: "Açılar aşağı düşeyden ölçülür.",
    bodies: {
      earth: "Dünya",
      mars: "Mars",
      moon: "Ay",
      jupiter: "Jüpiter",
      microgravity: "Serbest düşüş",
    },
    twin: {
      title: "İkiz yörünge",
      enable: "İkiz sarkacı göster",
      description:
        "Birinci açısı δ₀ kadar farklı, bunun dışında özdeş ikinci bir sarkaç aynı anda çözülür. Ayrılma hızı başlangıç koşullarına duyarlılığı gösterir.",
      offset: "Başlangıç farkı δ₀",
    },
    presets: {
      single: { name: "Küçük açı", note: "N = 1, θ₀ = 10°. Periyot 2π√(L/g) değerine çok yakındır." },
      singleLarge: { name: "Büyük açı", note: "N = 1, θ₀ = 150°. Eşzamanlılık bozulur; periyot eliptik integralle verilir." },
      double: { name: "Çift sarkaç", note: "θ = (2,15; 1,65) rad. Kaotik bölge." },
      doubleRegular: { name: "Düzenli çift", note: "Küçük açılar; hareket iki normal modun toplamıdır." },
      mode1: { name: "1. normal mod", note: "İki bağlantı aynı yönde, tek frekansla salınır." },
      mode2: { name: "2. normal mod", note: "İki bağlantı zıt yönde, daha yüksek frekansla salınır." },
      triple: { name: "Üçlü", note: "N = 3." },
      quad: { name: "Dörtlü", note: "N = 4." },
      six: { name: "Altılı zincir", note: "N = 6. Küçük salınım spektrumu asılı ipinkine yaklaşır." },
      moon: {
        name: "Ay'da",
        note: "g = 1,62 m/s². Çift sarkaçla aynı açılardan bırakılır: aynı hareket, √(9,81/1,62) ≈ 2,5 kat yavaş.",
      },
      mars: { name: "Mars'ta", note: "g = 3,73 m/s²." },
      microgravity: { name: "Serbest düşüş", note: "g = 0. Geri çağırıcı tork yok; açısal momentum korunur." },
    },
  },
};
