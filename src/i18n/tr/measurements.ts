/** Ölçümler paneli: kuramsal değerler, sanal cihazların ölçtükleri ve aralarındaki sapma. */
export const measurements = {
  columns: {
    quantity: "Büyüklük",
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
        decayTime: "En yavaş geçici terimin zaman sabiti",
      },
      decayNote:
        "τ, en yavaş sönen geçici terimin zaman sabitidir: ζ ≤ 1 için 1/γ, ζ > 1 için 1/(γ − √(γ² − ω₀²)).",
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
        "Bu durumda kuramla karşılaştırılacak bir ölçüm yok: sürücü kapalı, hareket salınımlı değil ve bir bırakış ölçümü sürmüyor (araba durgun hâlden bırakılmadı ya da bırakıştan sonra bir parametre değişti).",
      impactNote:
        "Araba bu koşuda durdurucuya çarptı. Doğrusal kuram durdurucuları içermez; aşağıdaki sapmalar bu nedenle geçerli bir karşılaştırma değildir.",
      periodNote: (count: number) =>
        `Periyot, x'in aynı yöndeki ardışık sıfır geçişleri arasındaki süredir; yukarı ve aşağı yönlü geçişler ayrı ayrı izlendiğinden her periyot iki aralık verir. Verilen değer en son aralıkların (en çok 12) ortalamasıdır; ± işaretinden sonra örneklem standart sapması gelir. Şimdiye dek ${count} aralık ölçüldü.`,
      decrementNote: "Λ, ardışık pozitif tepe değerlerinden ölçülür; sönüm oranı ondan türetilir:",
      steadyNote: (limit: string, drift: string | null, centre: string | null, wait: string | null) =>
        `Kararlı durum için üç koşul aranır: ardışık iki salınımın tepeden tepeye genlikleri arasındaki bağıl fark < %${limit}; salınım merkezinin (son tepe ile son çukurun ortası) bir salınımdan ötekine kaymasının genliğe oranı < %${limit}; son değişiklikten (yeniden başlatma, parametre değişikliği, çarpma) bu yana geçen süre ≥ ln(100/${limit})·τ. Bu süre, en yavaş geçici terimin %${limit} düzeyine inmesine yeter; τ yukarıdaki çizelgedeki zaman sabitidir. ${
          drift === null || centre === null
            ? "Genlik farkı ve merkez kayması henüz ölçülemedi."
            : `Şu anki genlik farkı: %${drift}; merkez kayması: %${centre}.`
        }${wait === null ? "" : wait === "0" ? " Bekleme süresi doldu." : ` Kalan bekleme süresi: ${wait} s.`}`,
      responseNote:
        "Ölçülen genlik, son tepe ile son çukur arasındaki farkın yarısıdır; ölçülen faz gecikmesi, x'in son tepesi anındaki sürücü fazıdır.",
      undampedNote:
        "c = 0 iken geçici çözüm sönmez ve bekleme süresi sonsuzdur: ilk iki koşul anlık olarak sağlansa bile kararlı durum oluşmaz, gösterge “geçici rejim”de kalır.",
      stepNote: (x0: string, percent: string) =>
        `Aşım ve yerleşme süresi son bırakıştan (x₀ = ${x0} m) başlayarak ölçülür. Aşım, dengenin öbür yanında ulaşılan en uç örneğin |x₀| değerine oranıdır. Yerleşme süresi, |x| ≤ %${percent}·|x₀| bandına kalıcı olarak girilen andır; bu an, bandın dışındaki son örnek ile içindeki ilk örnek arasında doğrusal ara değerlemeyle bulunur ve yanıt bantta bu sürenin dörtte biri kadar (en az 0,25 s) kaldıktan sonra gösterilir. Bir parametre değiştiğinde ölçüm sona erer; bir sonraki bırakışta yeniden başlar.`,
      stepTheoryNote:
        "Kuramsal aşım ζ < 1 için aşağıdaki bağıntıyla verilir, ζ ≥ 1 için sıfırdır. Kuramsal yerleşme süresi, geçerli sönüm oranında kapalı çözümün aynı banda kalıcı olarak girdiği andır ve bu çözüm üzerinde ikiye bölme yöntemiyle bulunur; ζ = 1 için aşağıdaki değere eşittir, c = 0 iken tanımsızdır.",
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
        `Ölçülen periyot, sin θ'nın alt konumdaki aynı yönlü ardışık sıfır geçişleri arasındaki süredir; salınımda her periyot iki aralık, dönmede her tur bir aralık verir. Verilen değer en son aralıkların (en çok 12) ortalamasıdır; ± işaretinden sonra örneklem standart sapması gelir. Şimdiye dek ${count} aralık ölçüldü. Ölçülen genlik, θ'nın son iki dönüm noktası arasındaki farkın yarısıdır.`,
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
        `sin θ₁'in alt konumdaki aynı yönlü ardışık sıfır geçişlerinden ölçülür: en son aralıkların (en çok 12) ortalamasıdır ve her periyot iki aralık verir; şimdiye dek ${count} aralık ölçüldü. Yalnızca tek bir mod uyarıldığında T_k ile karşılaştırılabilir; büyük bir ± değeri hareketin tek frekanslı olmadığını gösterir.`,
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
        divergence: (threshold: string) => `Ayrılmanın ${threshold} rad'a ulaşma süresi (gözlenen)`,
        horizon: "Öngörü ufku (kestirim)",
      },
      note: (threshold: string) =>
        `λ, Benettin yöntemiyle hesaplanan sonlu zaman kestirimidir: ortalama süresi uzadıkça yakınsar, düzenli harekette sıfıra doğru azalır. Gözlenen süre, ikizin son bırakıldığı andan (yeniden başlatma ya da ikizin açılması) sayılır. Öngörü ufku, δ₀ büyüklüğündeki bir başlangıç farkının a = ${threshold} rad'a büyümesi için geçecek sürenin kaba bir kestirimidir:`,
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
