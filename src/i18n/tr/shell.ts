/** Uygulama kabuğu: üst çubuk, 3B görünüm, durum çubuğu ve genel iletişim kutuları. */
export const shell = {
  meta: { languageName: "Türkçe", locale: "tr" },

  common: {
    close: "Kapat",
    cancel: "Vazgeç",
    apply: "Uygula",
    theory: "Kuram",
    measured: "Ölçülen",
    deviation: "Sapma",
    notAvailable: "yok",
  },

  app: {
    name: "SimuLab",
    tagline: "Salınım ve Kaos Laboratuvarı",
    loading: "Laboratuvar hazırlanıyor",
    noWebgl: "Tarayıcınız WebGL desteklemiyor; 3B sahne gösterilemiyor.",
  },

  modules: {
    switcher: "Deney seçimi",
    oscillator: { name: "Osilatör", full: "Sönümlü ve sürülen yay–kütle osilatörü" },
    pendulum: { name: "Sarkaç", full: "N bağlantılı düzlemsel sarkaç" },
  },

  transport: {
    run: "Çalıştır",
    pause: "Duraklat",
    step: "Bir kare ilerlet",
    reset: "Başlangıç koşullarına dön",
    time: "Benzetim zamanı",
    speed: "Zaman ölçeği",
  },

  solver: {
    button: "Sayısal çözücü",
    title: "Sayısal çözücü",
    intro:
      "Hareket denklemleri sabit adımla çözülür; aynı başlangıç koşulları, ekran yenileme hızından bağımsız olarak aynı yörüngeyi verir.",
    method: "Yöntem",
    rate: "Adım frekansı",
    stepSize: "Adım",
    order: "Mertebe",
    evaluations: "Adım başına türev",
    restoreDefault: "Varsayılana dön",
    nonDefault: "Varsayılan dışı çözücü",
    methods: {
      euler: {
        name: "Açık Euler",
        note: "1. mertebe. Sürtünmesiz osilatörün enerjisini her adımda (1 + h²ω₀²) katına çıkarır; hatayı göstermek için buradadır.",
      },
      symplecticEuler: {
        name: "Yarı örtük Euler",
        note: "1. mertebe, simplektik. Enerji hatası sınırlı kalır ama faz hatası birikir.",
      },
      midpoint: {
        name: "Orta nokta (RK2)",
        note: "2. mertebe açık Runge–Kutta.",
      },
      rk4: {
        name: "Klasik Runge–Kutta (RK4)",
        note: "4. mertebe. Varsayılan yöntem; 1000 Hz'te çift sarkaçta 60 s boyunca bağıl enerji sapması 10⁻⁹ mertebesindedir.",
      },
      dopri5: {
        name: "Dormand–Prince 5(4)",
        note: "5. mertebe, gömülü hata kestirimiyle uyarlamalı adım (bağıl tolerans 10⁻¹⁰).",
      },
    },
    diverged: {
      title: "Çözüm ıraksadı",
      body: "Seçilen yöntem ve adımla durum değişkenleri sonlu kalmadı; deney durduruldu. Daha küçük adım ya da daha yüksek mertebeli bir yöntem seçin.",
    },
  },

  topbar: {
    theory: "Kuram ve kaynakça",
    verification: "Doğrulama",
    exportMenu: "Veri ve paylaşım",
    soundOn: "Sesi kapat",
    soundOff: "Sesi aç (sonifikasyon)",
    shortcuts: "Klavye kısayolları",
    language: "Arayüz dili",
    panel: "Parametre panelini aç",
    dock: "Grafik panelini göster/gizle",
  },

  exchange: {
    data: "Telemetri",
    experiment: "Deney tanımı",
    csvInternational: {
      label: "CSV indir",
      hint: "Virgülle ayrılmış, ondalık nokta: Python, MATLAB, R",
    },
    csvSpreadsheet: {
      label: "CSV indir (hesap tablosu)",
      hint: "Noktalı virgülle ayrılmış, ondalık virgül: Türkçe Excel",
    },
    json: {
      label: "Deney dosyası indir (JSON)",
      hint: "Parametreler, başlangıç koşulları ve çözücü ayarı",
    },
    open: {
      label: "Deney dosyası aç",
      hint: "Kaydedilmiş bir deneyi aynen yeniden kurar",
    },
    link: {
      label: "Bağlantıyı kopyala",
      hint: "Bu deneyi yeniden kuran adres; veriler sunucuya gönderilmez",
    },
    copied: "Bağlantı panoya kopyalandı",
    copyFailed: "Pano kullanılamadı; adres çubuğundaki bağlantıyı kopyalayın",
    imported: "Deney dosyası yüklendi",
    importFailed: "Dosya geçerli bir SimuLab deney dosyası değil",
    samples: (count: number) => `${count.toLocaleString("tr-TR")} örnek kayıtlı`,
  },

  viewport: {
    ariaLabel:
      "Üç boyutlu deney sahnesi. Cisimler işaretçiyle tutulup sürüklenebilir; aynı işlem Parametreler panelindeki başlangıç koşulu alanlarından klavyeyle yapılabilir.",
    hint: "Cismi tutup sürükleyin; bırakırken hız verebilirsiniz",
    views: { title: "Bakış", iso: "İzometrik", front: "Önden", top: "Üstten", side: "Yandan" },
    zoomIn: "Yakınlaş",
    zoomOut: "Uzaklaş",
    overlaysLabel: "Sahne katmanları",
    overlays: {
      velocity: "Hız",
      netForce: "Net kuvvet",
      freeBody: "Serbest cisim",
      trail: "İz",
      strobe: "Stroboskop",
      grid: "Izgara",
      axes: "Eksenler",
      labels: "Etiketler",
    },
    overlayHints: {
      velocity: "Hız vektörü",
      netForce: "Cisme etkiyen net kuvvet",
      freeBody: "Serbest cisim diyagramı: her kuvvet ayrı ayrı",
      trail: "Uç kütlenin son saniyelerdeki yörüngesi",
      strobe: "Eşit zaman aralıklarıyla çakan flaş görüntüleri",
      grid: "Tezgâh üzerindeki 1 m'lik ızgara",
      axes: "Koordinat eksenleri",
      labels: "Sahne içi sayısal etiketler",
    },
    scale: {
      title: "Vektör ölçeği",
      force: (newtons: string) => `1 m ≙ ${newtons} N`,
      velocity: (speed: string) => `1 m ≙ ${speed} m/s`,
    },
    strobeInterval: "Flaş aralığı",
    selectedLink: (index: number) => `Vektörler ${index}. kütlede. Değiştirmek için bir kütleye tıklayın.`,
    regimes: {
      undamped: "Sönümsüz",
      underdamped: "Zayıf sönümlü",
      critical: "Kritik sönümlü",
      overdamped: "Aşırı sönümlü",
      driven: "Sürülen",
      resonance: "Rezonansa yakın",
      atStop: "Durdurucuya dayalı",
      libration: "Salınım",
      rotation: "Dönme",
      regular: "Düzenli",
      chaotic: "Kaotik",
      undetermined: "Ölçülüyor",
    },
  },

  status: {
    integrator: "Çözücü",
    ledger: "Enerji defteri kalıntısı",
    ledgerHint:
      "E_k + E_p + Q − W − E₀ ifadesinin sistem enerjisine oranı. Tam bir çözücüde sıfırdır; görülen değer sayısal hatadır.",
    switchToAdaptive: "Hata büyüyor: uyarlamalı çözücüye geç",
    exactError: "Analitik çözümden sapma",
    exactErrorHint: "Sayısal x(t) ile kapalı biçimli çözüm arasındaki en büyük fark (son başlatmadan beri).",
    fps: "Kare hızı",
    steps: "Kare başına adım",
    physics: "Fizik süresi",
    samples: "Kayıt",
    paused: "Duraklatıldı",
    held: "Cisim tutuluyor",
    dropped: (count: number) => `${count} karede süre bütçesi aşıldı`,
  },

  shortcuts: {
    title: "Klavye kısayolları",
    groups: { transport: "Deney akışı", view: "Görünüm", panels: "Paneller" },
    items: {
      toggleRun: "Çalıştır / duraklat",
      step: "Duraklatılmışken bir kare ilerlet",
      reset: "Başlangıç koşullarına dön",
      moduleOscillator: "Osilatör deneyi",
      modulePendulum: "Sarkaç deneyi",
      velocity: "Hız vektörü",
      netForce: "Net kuvvet vektörü",
      freeBody: "Serbest cisim diyagramı",
      trail: "İz",
      strobe: "Stroboskop",
      grid: "Izgara",
      dock: "Grafik paneli",
      theory: "Kuram ve kaynakça",
      sound: "Ses",
      help: "Bu pencere",
    },
  },

  welcome: {
    title: "SimuLab'a hoş geldiniz",
    lead: "Bu bir canlandırma değil, bir ölçüm tezgâhıdır: gördüğünüz her hareket, hareket denklemlerinin doğrulanmış sayısal çözümüdür ve her büyüklük ölçülüp kuramla karşılaştırılabilir.",
    steps: [
      {
        title: "Tutun ve bırakın",
        body: "Arabayı ya da sarkaç kütlelerinden birini tutup sürükleyin. Bırakırken işaretçinin hızı cisme aktarılır.",
      },
      {
        title: "Parametreyi değiştirin, grafiği izleyin",
        body: "Sağdaki panel her zaman açıktır; alttaki grafikler aynı anda güncellenir. Kesin değer için sayı alanına yazın.",
      },
      {
        title: "Ölçün ve karşılaştırın",
        body: "Ölçümler sekmesi, sanal cihazların okuduğu periyot, genlik ve sönüm değerlerini kuramsal değerlerle yan yana verir.",
      },
      {
        title: "Kaynağına bakın",
        body: "Kuram ve kaynakça bölümünde denklemlerin türetimi, sayısal yöntem ve doğrulama sonuçları yer alır.",
      },
    ],
    start: "Deneye başla",
  },
};
