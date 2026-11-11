/** Ölçümler paneli: kuramsal değerler, sanal cihazların ölçtükleri ve aralarındaki sapma. */
export const measurements = {
  columns: {
    quantity: "Büyüklük",
    value: "Değer",
    unit: "Birim",
    theory: "Kuram",
    measured: "Ölçülen",
    deviation: "Sapma",
  },
  notYet: "henüz yok",

  oscillator: {
    characteristic: {
      title: "Karakteristik büyüklükler (kuram)",
      regimes: {
        undamped: "sönümsüz",
        underdamped: "zayıf sönümlü",
        critical: "kritik sönümlü",
        overdamped: "aşırı sönümlü",
      },
      rows: {
        omega0: "Doğal açısal frekans",
        frequency0: "Doğal frekans",
        period0: "Doğal periyot",
        criticalDamping: "Kritik sönüm katsayısı",
        zeta: "Sönüm oranı",
        gamma: "Üstel azalma hızı, c/(2m)",
        omegaD: "Sönümlü açısal frekans",
        periodD: "Sönümlü periyot",
        logDecrement: "Logaritmik azalma",
        qualityFactor: "Kalite faktörü",
        decayTime: "Sönüm zaman sabiti",
      },
      missing: "Çizgi (—): bu sönüm değerinde (c = 0 ya da ζ ≥ 1) tanımsız ya da sonsuz olan büyüklük.",
    },

    comparison: {
      title: "Ölçüm ve kuram",
      rows: {
        periodNatural: "Doğal periyot",
        periodDamped: "Sönümlü periyot",
        periodDriven: "Sürücü periyodu",
        logDecrement: "Logaritmik azalma",
        zeta: "Sönüm oranı, Λ'dan",
        amplitude: "Genlik",
        phaseLag: "Faz gecikmesi",
        overshoot: "Aşım",
        settling: (percent: string) => `Yerleşme süresi, %${percent}`,
      },
      steady: {
        measuring: "ölçülüyor",
        reached: "kararlı durum",
        transient: "geçici rejim",
      },
      empty:
        "Bu durumda kuramla karşılaştırılacak bir ölçüm yok: sürücü kapalı, hareket salınımlı değil ve araba durgun hâlden bırakılmadı.",
      impactNote:
        "Araba bu koşuda durdurucuya çarptı. Doğrusal kuram durdurucuları içermez; aşağıdaki sapmalar bu nedenle geçerli bir karşılaştırma değildir.",
      periodNote: (count: number) =>
        `Periyot, x'in aynı yöndeki ardışık sıfır geçişleri arasındaki süredir. Son aralıkların ortalaması ve ± işaretiyle örneklem standart sapması verilir; şimdiye dek ${count} aralık ölçüldü.`,
      decrementNote: "Λ, ardışık pozitif tepe değerlerinden ölçülür; sönüm oranı ondan türetilir:",
      steadyNote: (limit: string, drift: string | null, wait: string | null) =>
        `Kararlı durum için iki koşul aranır: ardışık iki salınımın tepeden tepeye genlikleri arasındaki bağıl fark < %${limit} olmalı ve son değişiklikten (yeniden başlatma, parametre değişikliği, çarpma) bu yana geçici rejimin %${limit} düzeyine inmesine yetecek süre, ln(100/${limit})/γ, geçmiş olmalıdır. ${
          drift === null ? "Fark henüz ölçülemedi." : `Şu anki fark: %${drift}.`
        }${wait === null ? "" : wait === "0" ? " Bekleme süresi doldu." : ` Kalan bekleme süresi: ${wait} s.`}`,
      responseNote:
        "Ölçülen genlik, son tepe ile son çukur arasındaki farkın yarısıdır; ölçülen faz gecikmesi, x'in son tepesi anındaki sürücü fazıdır.",
      undampedNote:
        "c = 0 iken geçici çözüm sönmez: ölçüt anlık olarak sağlansa bile kalıcı bir kararlı durum oluşmaz.",
      stepNote: (x0: string, percent: string) =>
        `Aşım ve yerleşme süresi son bırakıştan (x₀ = ${x0} m) beri ölçülür. Aşım, |x₀| değerinin yüzdesidir; yerleşme süresi, |x| ≤ %${percent}·|x₀| bandına kalıcı olarak girilen andır. Bırakıştan sonra bir parametre değiştirildiyse kuramla karşılaştırma geçerli değildir.`,
      stepTheoryNote:
        "Kuramsal aşım ζ ≥ 1 için sıfırdır. Kuramsal yerleşme süresi yalnızca kritik sönüm (ζ = 1) için verilir:",
    },

    driven: {
      title: "Sürülen yanıt (kuram)",
      rows: {
        staticDeflection: "Statik yer değiştirme, F₀/k",
        amplitude: "Kararlı durum genliği",
        phaseLag: "Faz gecikmesi",
        omegaPeak: "Genlik tepesinin frekansı",
        peakAmplitude: "Tepe genliği",
        bandwidth: "Yarı güç bant genişliği, c/m",
        meanPower: "Ortalama soğurulan güç, ½cω²A²",
      },
      note: "Genlik, faz gecikmesi ve güç şu anki sürücü frekansı ω içindir. Genlik tepesi yalnızca ζ < 1/√2 iken vardır.",
      resonanceNote: "c = 0 iken rezonansta (ω = ω₀) kararlı durum oluşmaz; genlik zamanla doğrusal olarak büyür.",
    },

    stops: {
      title: "Durdurucular",
      resting: "durdurucuya dayalı",
      rows: {
        impacts: "Durdurucuya çarpma sayısı",
        lastSpeed: "Son çarpmadan önceki hız",
        heat: "Çarpışma ısısı",
        restitution: "Geri sıçrama katsayısı",
      },
      note: (xMin: string, xMax: string) =>
        `Durdurucular x = ${xMin} m ve x = ${xMax} m konumlarındadır. e bir model parametresidir, ölçülmüş bir malzeme sabiti değildir; her çarpmada şu kural uygulanır ve yitirilen kinetik enerji çarpışma ısısına yazılır:`,
    },

    numerics: {
      title: "Sayısal doğruluk",
      rows: {
        residual: "Enerji defteri kalıntısı",
        relative: "Bağıl kalıntı",
        exactError: "Analitik çözümden en büyük sapma",
        solver: "Çözücü",
        step: "Adım",
        order: "Yöntemin mertebesi",
      },
      ledgerNote:
        "Tam bir çözümde ΔE sıfırdır; görülen değer sayısal hatadır. Bağıl kalıntının paydası |E₀|, mekanik enerji ve Q + |W| büyüklüklerinin en büyüğüdür.",
      exactNote:
        "Analitik başvuru çözümü son başlatmadan beri izlenir; her çarpmada ve parametre değişikliğinde o anki durumdan yeniden kurulur.",
      adaptiveNote: "Uyarlamalı yöntem: her h adımı, hata denetimli iç adımlara bölünür.",
    },
  },

  pendulum: {
    period: {
      title: "Tek sarkacın periyodu",
      motions: {
        rest: "durgun",
        libration: "salınım",
        separatrix: "ayırıcı yörünge",
        rotation: "dönme",
      },
      rows: {
        smallAngle: "Küçük açı periyodu",
        exact: "Tam periyot",
        ratio: "Periyot oranı",
        amplitude: "Genlik",
      },
      theoryNote:
        "Tam periyot ve genlik, sönümsüz sarkacın anlık enerjisinden hesaplanır (K: birinci tür tam eliptik integral). Periyot, salınımda bir tam gidiş-gelişin, dönmede bir tam turun süresidir.",
      isochronism:
        "Eşzamanlılık, yani periyodun genlikten bağımsız olması, yalnızca küçük açılarda geçerlidir: genlik büyüdükçe T/T₀ oranı 1'den uzaklaşır.",
      measureNote: (count: number) =>
        `Ölçülen periyot, sin θ'nın alt konumdaki aynı yönlü ardışık sıfır geçişleri arasındaki süredir. Son aralıkların ortalaması ve ± işaretiyle örneklem standart sapması verilir; şimdiye dek ${count} aralık ölçüldü. Ölçülen genlik, θ'nın son iki dönüm noktası arasındaki farkın yarısıdır.`,
      dampingNote:
        "Mafsal sönümü açıkken enerji azalır: kuramsal değerler anlık enerjiye, ölçülenler geçmiş salınımlara aittir; aradaki fark sönümden kaynaklanır.",
      zeroGravity:
        "g = 0 iken geri çağırıcı tork yoktur; küçük açı periyodu ve eliptik integralli tam periyot tanımsızdır.",
    },

    modes: {
      title: "Küçük salınım normal modları",
      frequenciesCaption: "Normal modların frekansları ve periyotları",
      shapesCaption: "Mod biçimleri: en büyüğü 1 olacak biçimde ölçeklenmiş açı genlikleri",
      columns: {
        mode: "Mod",
        omega: "Açısal frekans (rad/s)",
        frequency: "Frekans (Hz)",
        period: "Periyot (s)",
        link: (index: number) => `${index}. bağlantının açı genliği`,
      },
      note: "Asılı denge konumu çevresinde doğrusallaştırılmış, sönümsüz zincirin özfrekanslarıdır; yalnızca küçük açılarda geçerlidir.",
      presets: (first: string, second: string) =>
        `Bunlar, «${first}» ve «${second}» hazır deneylerinin uyardığı iki frekanstır.`,
      measured: "Ölçülen θ₁ periyodu",
      measuredNote: (count: number) =>
        `sin θ₁'in alt konumdaki aynı yönlü ardışık sıfır geçişlerinden, ${count} aralık üzerinden ölçülür. Yalnızca tek bir mod uyarıldığında T_k ile karşılaştırılabilir; büyük bir ± değeri hareketin tek frekanslı olmadığını gösterir.`,
      zeroGravity: "g = 0 iken geri çağırıcı kuvvet yoktur; küçük salınım modları tanımlı değildir.",
    },

    energy: {
      title: "Enerji",
      rows: {
        kinetic: "Kinetik enerji",
        potential: "Potansiyel enerji",
        heat: "Mafsal sönüm ısısı",
        mechanical: "Mekanik enerji",
        maxPotential: "En büyük potansiyel enerji",
        flip: (link: number) => `Tepeden aşma eşiği (${link}. bağlantı)`,
        residual: "Enerji defteri kalıntısı",
        relative: "Bağıl kalıntı",
      },
      verdict: {
        impossible: "tepeden aşma olanaksız",
        possible: "tepeden aşma olanaklı",
      },
      thresholdNote:
        "Potansiyel enerji asılı denge konumundan ölçülür; en büyük değeri zincirin tümüyle dik yukarı durduğu konuma aittir. Tepeden aşma eşiği, bir bağlantının dik yukarı konumdan geçebilmesi için gereken en küçük mekanik enerjidir: mekanik enerji bunun altındayken hiçbir bağlantı tepeden aşamaz, üstünde olması ise gerekli ama yeterli olmayan koşuldur.",
      ledgerNote:
        "Tam bir çözümde ΔE sıfırdır; görülen değer sayısal hatadır. Bağıl kalıntının paydası |E₀| ile mekanik enerjinin büyüğüdür.",
      zeroGravity: "g = 0 iken potansiyel enerji ve tepeden aşma için bir enerji eşiği yoktur.",
    },

    chaos: {
      title: "Kaos göstergeleri",
      rows: {
        lyapunov: "En büyük Lyapunov üsteli (kestirim)",
        averaging: "Kestirimin ortalama süresi",
        lyapunovTime: "Lyapunov süresi (kestirim)",
        twinOffset: "İkizin başlangıç farkı",
        separation: "İkizle açısal ayrılma",
        divergence: (threshold: string) => `Ayrılmanın ${threshold} rad'a ulaştığı an (gözlenen)`,
        horizon: "Öngörü ufku (kestirim)",
      },
      note: (threshold: string) =>
        `λ, Benettin yöntemiyle hesaplanan sonlu zaman kestirimidir: ortalama süresi uzadıkça yakınsar, düzenli harekette sıfıra doğru azalır. Öngörü ufku, δ₀ büyüklüğündeki bir başlangıç farkının a = ${threshold} rad'a büyümesi için geçecek sürenin kaba bir kestirimidir:`,
      twinOff: "İkiz yörünge kapalı; ayrılma ölçülmüyor.",
    },

    rods: {
      title: "Çubuk kuvvetleri",
      caption: "Her çubuktaki eksenel kuvvet",
      columns: {
        rod: "Çubuk",
        force: "Eksenel kuvvet (N)",
        state: "Durum",
      },
      tension: "çekme",
      compression: "basma",
      note: "Pozitif değer çekme, negatif değer basmadır. Değerin negatif olduğu anda çubuk yerine ip olsaydı gevşerdi; model rijit çubuk varsayar.",
    },
  },
};
