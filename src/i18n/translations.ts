export type Language = "tr" | "en";

export const translations = {
  tr: {
    appSub: "İNTERAKTİF FİZİK ÖĞRENME LABORATUVARI",
    guideBtn: "Nasıl Kullanılır?",
    guideModal: {
      title: "SimuLab'a Hoş Geldiniz — Sıfırdan Fizik Rehberi",
      subtitle:
        "Hiç fizik bilginiz olmasa bile bu laboratuvarda her şeyi dokunarak, deneyerek ve görerek öğrenebilirsiniz.",
      steps: [
        {
          title: "1. Cisimleri Fareyle Tutup Çekin!",
          desc: "Sol taraftaki sahnede bulunan kütle bloğunu veya sarkaç toplarını farenizle doğrudan yakalayıp istediğiniz yere çekin ve bırakın. Bıraktığınız anda gerçek fizik motoru (RK4) hareketi başlatır.",
        },
        {
          title: "2. Hazır Deney Senaryolarına Tıklayın",
          desc: "Sağ panelin en üstündeki 'Hazır Deney Senaryoları' kartlarından birine tıklayarak (örneğin 'Amortisör Etkisi', 'Rezonans' veya 'Kelebek Etkisi') ilginç fizik olaylarını tek tıkla izleyin.",
        },
        {
          title: "3. Okları ve Renkleri Takip Edin",
          desc: "Yeşil ok (v) cismin o an nereye ve ne hızla gittiğini; Turuncu ok (F) ise yay veya yerçekiminin cismi hangi yöne çektiğini gösterir.",
        },
        {
          title: "4. Enerjinin Dönüşümünü İzleyin",
          desc: "Sağdaki renkli çubuklarda enerjinin asla yok olmadığını; hareket hızlandıkça Kinetik Enerjiye (Yeşil), yay gerildikçe Potansiyel Enerjiye (Mavi) ve sürtünme varsa Isıya (Turuncu) dönüştüğünü canlı görün.",
        },
      ],
      close: "Anladım, Deneye Başla!",
    },
    modules: {
      oscillator: {
        short: "1. Yay ve Salınım Deneyi",
        title: "Yay-Kütle Sistemi, Sürtünme ve Rezonans",
        subtitle:
          "Bir yayın ucundaki kütle nasıl sallanır, amortisör (sürtünme) onu nasıl durdurur ve 'Rezonans' salınımı nasıl devleştirir?",
        badge: "DENEY 01 · HARMONİK SALINIM & REZONANS",
        hint: "Kütle kutusunu fareyle sağa veya sola çekip bırakın! Yay onu denge noktasına (x = 0) geri çekecektir.",
      },
      pendulum: {
        short: "2. Çoklu Sarkaç & Kaos (1-6 Kütle)",
        title: "1'den 6'ya Çoklu Sarkaç & Kaos Teorisi",
        subtitle:
          "1 (Tek) kütleden 6 (Maks Zincir) kütleye kadar sarkaç bağlayın; Galileo periyodundan Kelebek Etkisine ve kamçı dalgasına kadar tüm dinamikleri keşfedin!",
        badge: "DENEY 02 · ÇOKLU SARKAÇ & KAOS TEORİSİ",
        hint: "Sahnedeki sarkaç toplarından (m₁..m₆) istediğinizi fareyle tutup istediğiniz açıya çekip bırakın!",
      },
    },
    toolbar: {
      play: "Başlat",
      pause: "Duraklat",
      step: "+1 Adım",
      stepHint: "Simülasyonu duraklatılmışken 1 kare ileri sarar",
      reset: "Sıfırla",
      speed: "Hız",
      overlaysTitle: "Sahne Üzerindeki Görsel Yardımcılar:",
      velVec: "Hız Oku (Yeşil)",
      velVecDesc: "Cismin o an hangi yöne ve ne hızla gittiğini gösterir",
      forceVec: "Kuvvet Oku (Turuncu)",
      forceVecDesc: "Cismi çeken veya iten net kuvveti gösterir",
      trail: "Hareket İzi",
      trailDesc: "Cismin izlediği yolu çizgi olarak gösterir",
      grid: "Ölçek Izgarası",
      gridDesc: "Mesafeleri ölçmek için arka plan ızgarasını açar",
    },
    inspector: {
      tabs: {
        all: "Tümü",
        controls: "Ayarlar & Senaryolar",
        graphs: "Grafikler & Enerji",
        science: "Formül & Açıklama",
      },
      scenariosTitle: "1 TIKLA HAZIR DENEY SENARYOLARI",
      scenariosSub: "Farklı fiziksel olayları anında görmek için bir senaryo seçin:",
      parametersTitle: "DENEY AYARLARI (KENDİNİZ DEĞİŞTİRİN)",
      parametersSub: "Kaydırıcıları hareket ettirerek fizik kurallarını canlı değiştirin:",
      gravityTitle: "Ortam Yerçekimi Seçimi (g)",
      gravitySub: "Deneyi farklı gezegenlerde veya uzayda test edin:",
      earth: "🌍 Dünya (9.81)",
      mars: "🔴 Mars (3.72)",
      moon: "🌙 Ay (1.62)",
      zeroG: "🚀 Uzay (0.0)",
      energyTitle: "ENERJİ KORUNUMU (ENERJİ NEREYE GİDİYOR?)",
      energySub:
        "Fizikte toplam enerji asla kaybolmaz; sadece Hareket (Kinetik), Depolanan (Potansiyel) ve Isı enerjisi arasında dönüşür:",
      kinetic: "Hareket Enerjisi (Kinetik - Eₖ)",
      kineticDesc: "Cisim hızlandıkça artar, durduğunda sıfır olur.",
      potential: "Depolanan Enerji (Potansiyel - Eₚ)",
      potentialDesc: "Yay gerildiğinde/sıkıştığında veya sarkaç yükseldiğinde depolanır.",
      thermal: "Sürtünmeyle Isıya Dönüşen (E_ısı)",
      thermalDesc: "Sürtünme (amortisör) varsa hareket enerjisini ısıya çevirerek sistemi durdurur.",
      totalMech: "Toplam Enerji (Kinetik + Potansiyel + Isı)",
      phaseTitle: "FAZ UZAYI GRAFİĞİ (KONUM - HIZ HARİTASI)",
      phaseSub:
        "Yatay eksen cismin Konumunu, dikey eksen ise Hızını gösterir. Cisim hep aynı hareketi yapıyorsa kapalı bir 'Halka', sürtünmeyle duruyorsa merkeze kıvrılan bir 'Salyangoz Sarmalı' çizer.",
      odeTitle: "MATEMATİKSEL MODEL & CANLI ÖLÇÜMLER",
      odeSub:
        "Arka planda saniyede 240 kez çözülen 4. Dereceden Runge-Kutta (RK4) diferansiyel denklemi ve terimlerin anlamları:",
      analysisTitle: "CANLI EĞİTMEN YORUMU (ŞU AN NE OLUYOR?)",
    },
  },
  en: {
    appSub: "INTERACTIVE PHYSICS LEARNING STUDIO",
    guideBtn: "How It Works?",
    guideModal: {
      title: "Welcome to SimuLab — Beginner's Physics Guide",
      subtitle:
        "Even with zero physics background, you can learn every concept here by touching, experimenting, and observing.",
      steps: [
        {
          title: "1. Grab & Drag Objects with Your Mouse!",
          desc: "Directly grab the mass block on the spring or the pendulum bobs on the canvas, drag them anywhere you like, and release. The RK4 physics solver takes over immediately.",
        },
        {
          title: "2. Click Ready-Made Experiment Scenarios",
          desc: "Click any of the '1-Click Experiment Scenarios' at the top of the right panel (like 'Shock Absorber', 'Resonance', or 'Butterfly Effect') to witness key physical phenomena instantly.",
        },
        {
          title: "3. Follow the Colored Arrows",
          desc: "The Green arrow (v) shows which way and how fast the object is moving; the Orange arrow (F) shows the net force pulling or pushing it.",
        },
        {
          title: "4. Watch Energy Transform Live",
          desc: "Watch the energy bars on the right: energy is never destroyed—it transforms between Motion/Kinetic (Green), Stored/Potential (Blue), and Heat/Thermal (Orange).",
        },
      ],
      close: "Got It, Start Exploring!",
    },
    modules: {
      oscillator: {
        short: "1. Spring & Oscillation Lab",
        title: "Spring-Mass System, Friction & Resonance",
        subtitle:
          "How does a mass on a spring oscillate, how does a shock absorber stop it, and how does 'Resonance' amplify motion?",
        badge: "EXPERIMENT 01 · HARMONIC MOTION & RESONANCE",
        hint: "Grab the mass box with your mouse, pull it left or right, and release! The spring pulls it back toward equilibrium (x = 0).",
      },
      pendulum: {
        short: "2. Multi-Pendulum & Chaos (1-6 Masses)",
        title: "Multi-Mass Pendulum Chain (1-6) & Chaos Theory",
        subtitle:
          "Connect from 1 (single) to 6 (max chain) bobs; observe Galileo's clockwork order, the Butterfly Effect, and whip wave propagation!",
        badge: "EXPERIMENT 02 · MULTI-PENDULUM & CHAOS THEORY",
        hint: "Grab any bob (m₁..m₆) with your mouse, drag to any angle, and release!",
      },
    },
    toolbar: {
      play: "Play",
      pause: "Pause",
      step: "+1 Step",
      stepHint: "Advances the simulation by 1 frame while paused",
      reset: "Reset",
      speed: "Speed",
      overlaysTitle: "Visual Helpers on Canvas:",
      velVec: "Velocity Arrow (Green)",
      velVecDesc: "Shows the direction and speed of motion",
      forceVec: "Force Arrow (Orange)",
      forceVecDesc: "Shows the net force pulling or pushing the object",
      trail: "Motion Trail",
      trailDesc: "Draws the path traced by the object",
      grid: "Scale Grid",
      gridDesc: "Shows background ruler grid for measuring distance",
    },
    inspector: {
      tabs: {
        all: "All",
        controls: "Controls & Scenarios",
        graphs: "Graphs & Energy",
        science: "Formula & Guide",
      },
      scenariosTitle: "1-CLICK EXPERIMENT SCENARIOS",
      scenariosSub: "Pick a scenario to immediately observe a physical phenomenon:",
      parametersTitle: "EXPERIMENT CONTROLS (CUSTOMIZE LIVE)",
      parametersSub: "Move the sliders to change physical properties in real time:",
      gravityTitle: "Environment Gravity (g)",
      gravitySub: "Test the pendulum on different planets or in outer space:",
      earth: "🌍 Earth (9.81)",
      mars: "🔴 Mars (3.72)",
      moon: "🌙 Moon (1.62)",
      zeroG: "🚀 Zero-G (0.0)",
      energyTitle: "ENERGY CONSERVATION (WHERE DOES ENERGY GO?)",
      energySub:
        "Total energy is never lost; it continuously converts between Motion (Kinetic), Stored (Potential), and Heat (Thermal) energy:",
      kinetic: "Motion Energy (Kinetic - Eₖ)",
      kineticDesc: "Increases as the object speeds up; zero when momentarily stopped.",
      potential: "Stored Energy (Potential - Eₚ)",
      potentialDesc: "Stored when the spring is stretched/compressed or the pendulum is lifted.",
      thermal: "Converted to Heat by Friction (E_heat)",
      thermalDesc: "Damping/friction converts mechanical motion into heat, slowing the system down.",
      totalMech: "Total Energy (Kinetic + Potential + Heat)",
      phaseTitle: "PHASE SPACE MAP (POSITION vs VELOCITY)",
      phaseSub:
        "Horizontal axis shows Position, vertical axis shows Velocity. Repeating motion forms a closed 'Loop', while friction causes an inward 'Snail Spiral' toward rest.",
      odeTitle: "MATHEMATICAL MODEL & LIVE READOUTS",
      odeSub:
        "The 4th-Order Runge-Kutta (RK4) differential equation solved 240 times per second, broken down in plain language:",
      analysisTitle: "LIVE INSTRUCTOR EXPLANATION (WHAT IS HAPPENING NOW?)",
    },
  },
};
