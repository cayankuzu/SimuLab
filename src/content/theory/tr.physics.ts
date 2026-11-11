import type { TheoryDocument } from "./types";

const r = String.raw;

/**
 * Bölüm 1-3: kapsam ve ilgili çalışmalar, yay-kütle osilatörü, N bağlantılı sarkaç.
 * Sayısal değerler ya kapalı biçimli bağıntılardan ya da src/physics/validation.ts
 * deneylerinden gelir; kaynak anahtarları src/content/references.ts içinde çözülür.
 */
export const physicsTr: TheoryDocument = [
  {
    id: "kapsam",
    number: "1",
    title: "Kapsam, ilgili çalışmalar ve gösterim",
    summary:
      "Laboratuvarın neyi modellediği, benzer araçlardan nerede ayrıldığı ve metin boyunca kullanılan simgeler.",
    sections: [
      {
        id: "kapsam-amac",
        title: "Amaç ve kapsam",
        blocks: [
          {
            kind: "p",
            text: r`SimuLab iki klasik mekanik düzeneğini tarayıcıda, üç boyutlu bir sahnede ve gerçek zamanlı olarak çözer: rijit durdurucuları olan, sönümlü ve harmonik olarak sürülen bir **yay–kütle osilatörü** ile $N = 1,\dots,6$ bağlantılı düzlemsel bir **sarkaç zinciri**. Birincisi doğrusal titreşim kuramının bütün temel kavramlarını (doğal frekans, sönüm oranı, rezonans, faz gecikmesi, geçici ve kararlı rejim) tek bir denklemde toplar; ikincisi aynı mekaniğin doğrusal olmayan ucudur ve $N \ge 2$ için deterministik kaos gösterir.`,
          },
          {
            kind: "p",
            text: r`Çalışmanın iddiası görsellik değil **doğrulanabilirliktir**. Her sayısal sonuç, yanıtı bağımsız olarak bilinen bir problemle karşılaştırılmıştır (Bölüm 7); çalışma sırasında bir enerji defteri sayısal hatayı sürekli gösterir; ekranda görülen yörünge ekran yenileme hızına değil yalnızca başlangıç koşullarına, parametrelere ve seçilen yönteme bağlıdır (Bölüm 4). Metindeki her olgusal ifade ya bir türetime ya ölçülmüş bir doğrulama sonucuna ya da künyesi birincil kaynağından denetlenmiş bir yayına dayanır.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "Üç boyut görselleştirmeye aittir",
            text: r`Her iki düzeneğin dinamiği düzlemseldir: osilatör tek serbestlik derecelidir, sarkaç zinciri düşey bir düzlemde hareket eder. Üç boyutlu sahne düzeneği bir laboratuvar tezgâhı gibi incelemeyi sağlar; küresel sarkaç ya da düzlem dışı hareket modellenmemiştir.`,
          },
        ],
      },
      {
        id: "kapsam-ilgili",
        title: "İlgili çalışmalar",
        blocks: [
          {
            kind: "p",
            text: r`Salınım ve sarkaç konularında yaygın kullanılan ücretsiz araçların modelleri ve zaman adımlama yöntemleri Çizelge 1.1'de özetlenmiştir. Bilgiler araçların kendi sayfalarından, belgelerinden ve erişilebildiği ölçüde kaynak kodlarından derlenmiştir.`,
          },
          {
            kind: "table",
            caption: "Çizelge 1.1. Benzer araçlar: model ve zaman adımlama yöntemi.",
            head: ["Araç", "Model", "Zaman adımlama", "Kaynak"],
            rows: [
              [
                "PhET Pendulum Lab",
                "Bir ya da iki bağımsız basit sarkaç, iki boyutlu",
                "Klasik RK4, kare başına en az 7 alt adım",
                "[@phet_pendulumlab]",
              ],
              [
                "PhET Masses and Springs",
                "Düşey yay–kütle, iki boyutlu",
                "Zaman adımlama yok: sönümlü osilatörün kapalı biçimli çözümü her karede değerlendirilir",
                "[@phet_massessprings]",
              ],
              [
                "myPhysicsLab",
                "Çift sarkaç dâhil yaklaşık 50 benzetim, hepsi iki boyutlu",
                "Varsayılan RK4, adım 0,025 s; Euler yalnızca seçenek",
                "[@neumann_myphysicslab]",
              ],
              [
                "Easy Java/JavaScript Simulations, Open Source Physics",
                "Yazarlık aracı ve model koleksiyonu; Poincaré kesitli bir çift sarkaç modeli içerir",
                "Yeni bir ODE sayfasında varsayılan: uyarlamalı Cash–Karp 5(4)",
                "[@ejswiki_ode; @christian2007; @christian2009dp]",
              ],
              [
                "GeoGebra, oPhysics",
                "Kullanıcıların yazdığı uygulamalar",
                "SolveODE komutu Runge–Kutta yöntemlerine dayanır",
                "[@geogebra_manual; @walsh2017]",
              ],
              ["Algodoo", "İki boyutlu serbest kurgu ortamı", "Üreticiye göre varyasyonel integratörler", "[@algodoo; @gregorcic2017]"],
              ["Falstad, W. Fendt", "İki boyutlu uygulamalar", "Normal mod ya da kapalı biçimli formüller", "[@falstad; @fendt]"],
              [
                "Web VPython",
                "Üç boyutlu programlama ortamı",
                "Giriş derslerinde bilinçli olarak Euler–Cromer",
                "[@chabay2008]",
              ],
            ],
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Eğitim amaçlı benzetimler Euler yöntemi kullanır”",
            text: r`Bu genelleme adı geçen araçlar için doğru değildir: PhET Pendulum Lab ve myPhysicsLab dördüncü mertebe Runge–Kutta yöntemi kullanır, PhET Masses and Springs hiç zaman adımlamaz, Easy Java/JavaScript Simulations uyarlamalı bir yöntemle başlar. Euler türü adımlama, öğrencinin kodu kendisinin yazdığı giriş derslerinde bilinçli bir tercihtir [@chabay2008]. Bu çalışmanın katkısı dolayısıyla “daha iyi bir integratör” değil; hatanın ölçülmesi, gösterilmesi ve belgelenmesidir.`,
          },
          {
            kind: "p",
            text: r`Bildiğimiz kadarıyla, incelenen yaygın ücretsiz araçların hiçbiri (PhET, myPhysicsLab, Open Source Physics ve EJS, GeoGebra ve oPhysics, Algodoo, Falstad, W. Fendt) şu özellikleri bir arada sunmaz: altı bağlantıya kadar sarkaç zinciri, çalışma sırasında en büyük Lyapunov üsteli kestirimi, sürekli açık enerji defteri ve dışa aktarılabilir telemetri. Bu olumsuz bir tarama sonucudur, kanıt değildir. Kısmen örtüşen ve yaygınlaşmamış açık kaynaklı kişisel projeler vardır; örneğin GitHub'daki “Chaotic-n-Pendulums-Visualizer” deposu düzlemsel N bağlantılı sarkaç için istek üzerine Benettin kestirimi sunar. Çift sarkaçta kaosun öğretimine yönelik güncel bir derleme için bkz. [@oliveira2024]; tarayıcı tabanlı laboratuvar örnekleri için bkz. [@chopyk2024; @halder2026].`,
          },
          {
            kind: "p",
            text: r`Sanal laboratuvarların öğrenmeye etkisi konusundaki kanıt karışıktır. Bir çalışmada benzetimle çalışan öğrenciler hem kavramsal sorularda hem de gerçek devre kurmada gerçek donanımla çalışanlardan daha başarılı olmuştur [@finkelstein2005]; deney tasarımı öğretiminde fiziksel ve sanal malzeme eşit etkili bulunmuştur [@triona2003]; sarkaç problemlerinde yedinci sınıf öğrencileriyle yapılan bir çalışmada benzetim ile elle yapılan deney arasında fark bulunmamış, öğrencilerin benzetimde değişkenleri daha seyrek denetlediği görülmüştür [@renken2013]. 2001–2010 yıllarını kapsayan bir derleme, benzetimlerin özellikle laboratuvar etkinliklerini destekleyebildiğini, ancak çalışmaların çoğunun öğretmen desteğini ve dersin kurgusunu göz ardı ettiğini bildirir [@rutten2012]; fiziksel ve sanal laboratuvarların karşılaştırmalı bir değerlendirmesi için bkz. [@dejong2013]. Bu rapor kendi aracı için bir öğrenme kazanımı iddia etmez (Bölüm 9).`,
          },
        ],
      },
      {
        id: "kapsam-gosterim",
        title: "Gösterim ve birimler",
        blocks: [
          {
            kind: "p",
            text: r`Bütün büyüklükler SI birimleriyle verilir; simgeler ISO 80000 ile uyumludur [@iso80000-3; @iso80000-4; @bipm2019si]. Zamana göre türev nokta ile gösterilir. Açılar aşağı düşeyden, saat yönünün tersine ölçülür ve radyan cinsindendir; arayüz kolaylık için derece de gösterir. Arayüzde sayılar ondalık nokta ile yazılır; böylece ekranda okunan bir değer sayı alanına aynen yazılabilir ve dışa aktarılan veriyle birebir aynıdır. Bu metinde ise Türkçe yazım gereği ondalık virgül kullanılır.`,
          },
          {
            kind: "table",
            caption: "Çizelge 1.2. Başlıca simgeler.",
            head: ["Simge", "Anlam", "Birim"],
            rows: [
              [r`$m$, $k$, $c$`, "Kütle, yay sabiti, viskoz sönüm katsayısı", "kg, N/m, N·s/m"],
              [r`$F_0$, $\omega$, $\varphi$`, "Sürücü kuvvetin genliği, açısal frekansı ve fazı", "N, rad/s, rad"],
              [r`$\omega_0$, $\zeta$, $\gamma$`, r`Doğal açısal frekans, sönüm oranı, genlik sönüm hızı $c/(2m)$`, "rad/s, –, 1/s"],
              [r`$A$, $\delta$`, "Kararlı durum genliği ve yer değiştirmenin kuvvete göre faz gecikmesi", "m, rad"],
              [r`$e$`, "Çarpışma (geri sıçrama) katsayısı", "–"],
              [r`$\theta_i$, $m_i$, $L_i$`, r`$i$. çubuğun açısı, ucundaki kütle ve çubuğun boyu`, "rad, kg, m"],
              [r`$\mu_i$`, r`$i$. mafsaldan aşağıdaki toplam kütle, $\sum_{k \ge i} m_k$`, "kg"],
              [r`$b$`, "Mafsal viskoz sürtünme katsayısı", "N·m·s/rad"],
              [r`$E_k$, $E_p$, $Q$, $W$`, "Kinetik enerji, potansiyel enerji, ısıya dönüşen enerji, sürücünün yaptığı iş", "J"],
              [r`$h$, $p$`, "Zaman adımı, yöntemin mertebesi", "s, –"],
              [r`$\lambda$`, "En büyük Lyapunov üsteli", "1/s"],
            ],
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "osilator",
    number: "2",
    title: "Sönümlü ve sürülen osilatör",
    summary:
      "Hareket denklemi, üç sönüm rejimi, sürülen kararlı durum ve rezonans, mekanik durdurucular ve her terimi ayrı izlenen enerji dengesi.",
    sections: [
      {
        id: "osilator-model",
        title: "Model ve hareket denklemi",
        blocks: [
          {
            kind: "p",
            text: r`Kütlesi $m$ olan taşıyıcı sürtünmesiz bir ray üzerinde hareket eder, sabiti $k$ olan doğrusal bir yayla duvara bağlıdır, hızıyla orantılı bir sönüm kuvveti ve harmonik bir sürücü kuvvet etkisindedir. Denge konumundan ölçülen yer değiştirme $x$ için`,
          },
          { kind: "eq", label: "2.1", tex: r`m\ddot{x} + c\dot{x} + kx = F_0\cos\varphi, \qquad \dot{\varphi} = \omega` },
          {
            kind: "p",
            text: r`Sürücünün fazı $\varphi$ ayrı bir durum değişkeni olarak integre edilir. Böylece frekans çalışma sırasında değiştirildiğinde kuvvet süreksizlik göstermez; gerçek bir işaret üreteci de faz süreklidir. Hızla orantılı sönüm, düzenekte bir girdap akımı freni olarak gösterilmiştir: iletken bir şeridin mıknatıs kutupları arasındaki hareketi düşük hızlarda $F = -c\dot{x}$ biçiminde bir kuvvet doğurur [@wiederick1987; @heald1988]. Denklem iki parametreyle boyutsuzlaştırılır:`,
          },
          {
            kind: "eq",
            label: "2.2",
            tex: r`\omega_0 = \sqrt{\frac{k}{m}}, \qquad \zeta = \frac{c}{2\sqrt{km}}, \qquad \gamma = \frac{c}{2m} = \zeta\omega_0`,
          },
          {
            kind: "table",
            caption: "Çizelge 2.1. Arayüzde ayarlanabilen parametre aralıkları.",
            head: ["Parametre", "Aralık"],
            rows: [
              [r`Kütle $m$`, "0,5 – 10 kg"],
              [r`Yay sabiti $k$`, "4 – 80 N/m"],
              [r`Sönüm katsayısı $c$`, "0 – 60 N·s/m"],
              [r`Sürücü genliği $F_0$`, "0 – 25 N"],
              [r`Sürücü açısal frekansı $\omega$`, "0,2 – 14 rad/s"],
            ],
          },
        ],
      },
      {
        id: "osilator-serbest",
        title: "Serbest yanıt ve sönüm rejimleri",
        blocks: [
          {
            kind: "p",
            text: r`$F_0 = 0$ için çözümün biçimini sönüm oranı belirler [@french1971; @taylor2005; @rao2017]. Başlangıç koşulları $x(0) = x_0$, $\dot{x}(0) = v_0$ olmak üzere, zayıf sönümde ($\zeta < 1$) hareket üstel zarflı bir salınımdır:`,
          },
          {
            kind: "eq",
            label: "2.3",
            tex: r`x(t) = e^{-\gamma t}\left[x_0\cos\omega_d t + \frac{v_0 + \gamma x_0}{\omega_d}\sin\omega_d t\right], \qquad \omega_d = \omega_0\sqrt{1-\zeta^2}`,
          },
          {
            kind: "p",
            text: r`Kritik sönümde ($\zeta = 1$) ve aşırı sönümde ($\zeta > 1$, $s = \omega_0\sqrt{\zeta^2 - 1}$) salınım yoktur:`,
          },
          {
            kind: "eq",
            label: "2.4",
            tex: r`x(t) = \left[x_0 + (v_0 + \omega_0 x_0)\,t\right]e^{-\omega_0 t}, \qquad x(t) = e^{-\gamma t}\left[x_0\cosh st + \frac{v_0 + \gamma x_0}{s}\sinh st\right]`,
          },
          {
            kind: "p",
            text: r`Uygulama bu kapalı biçimli çözümü sayısal çözümle birlikte hesaplar ve aradaki en büyük farkı gösterir; fark, durduruculara çarpma olmadığı sürece doğrudan çözücünün hatasıdır. Zayıf sönümde ardışık iki tepe arasındaki oran sabittir. Bu oranın doğal logaritması **logaritmik azalma**, salınımın keskinliğini ölçen büyüklük **kalite faktörü** adını alır:`,
          },
          {
            kind: "eq",
            label: "2.5",
            tex: r`\Lambda = \ln\frac{x_k}{x_{k+1}} = \gamma T_d = \frac{2\pi\zeta}{\sqrt{1-\zeta^2}}, \qquad Q = \frac{\omega_0 m}{c} = \frac{1}{2\zeta}`,
          },
          {
            kind: "p",
            text: r`Durgun bırakılan kütlenin dengeyi ilk aşışı, başlangıç yer değiştirmesinin $M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}$ katıdır. Kritik sönümde aşım yoktur ve $(1+\omega_0 t)e^{-\omega_0 t} = 0{,}02$ denkleminin çözümünden %2 yerleşme süresi $t_s = 5{,}834/\omega_0$ bulunur. Aşıma izin verilirse yerleşme daha da kısalır: $M_p = 0{,}02$ koşulu $\zeta \approx 0{,}78$ değerinde sağlanır ve kütle %2'lik banda ilk girişinde orada kalır.`,
          },
        ],
      },
      {
        id: "osilator-surulen",
        title: "Sürülen kararlı durum ve rezonans",
        blocks: [
          {
            kind: "p",
            text: r`Sönüm varken geçici çözüm $e^{-\gamma t}$ ile söner ve geriye sürücüyle aynı frekansta, ona göre $\delta$ kadar geciken bir salınım kalır: $x(t) = A\cos(\omega t - \delta)$. Genlik ve faz gecikmesi [@french1971; @taylor2005; @thornton2004]`,
          },
          {
            kind: "eq",
            label: "2.6",
            tex: r`A(\omega) = \frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2 + (2\gamma\omega)^2}}, \qquad \tan\delta = \frac{c\,\omega}{k - m\omega^2}, \quad 0 \le \delta \le \pi`,
          },
          {
            kind: "p",
            text: r`Genlik en büyük değerini doğal frekansın biraz altında alır; bu tepe yalnızca $\zeta < 1/\sqrt{2}$ için vardır:`,
          },
          {
            kind: "eq",
            label: "2.7",
            tex: r`\omega_r = \omega_0\sqrt{1-2\zeta^2}, \qquad A_\mathrm{max} = \frac{F_0/k}{2\zeta\sqrt{1-\zeta^2}}`,
          },
          {
            kind: "p",
            text: r`Sürücünün bir periyotta aktardığı ortalama güç ise tam $\omega_0$ değerinde en büyüktür ve güç eğrisinin yarı yükseklikteki tam genişliği her sönüm değeri için tam olarak $c/m$ kadardır:`,
          },
          {
            kind: "eq",
            label: "2.8",
            tex: r`\langle P\rangle = \tfrac12 c\,\omega^2 A^2, \qquad \langle P\rangle_\mathrm{max} = \frac{F_0^2}{2c}\ \ (\omega = \omega_0), \qquad \Delta\omega = \frac{c}{m} = \frac{\omega_0}{Q}`,
          },
          {
            kind: "p",
            text: r`Sönüm yokken ($c = 0$) kararlı durum oluşmaz. Tam rezonansta genlik zamanla doğru orantılı büyür, $x(t) = \dfrac{F_0}{2m\omega_0}\,t\sin\omega_0 t$; rezonansın yakınında ise iki frekansın girişimi **vuru** üretir ve zarfın periyodu $2\pi/|\omega_0 - \omega|$ olur. Her iki durum hazır deneyler arasındadır.`,
          },
          {
            kind: "note",
            tone: "info",
            title: "Ölçülen yanıt eğrisi",
            text: r`Frekans sekmesindeki eğri (2.6) bağıntısıdır; üzerindeki noktalar ise sanal cihazların kararlı durumda ölçtüğü genliklerdir. “Frekans taraması” aynı ölçümü bir frekans dizisi için otomatik yapar. Beş frekansta ölçülen genliğin kuramdan bağıl sapması en çok $3{,}3 \times 10^{-8}$ değerindedir (Bölüm 7).`,
          },
        ],
      },
      {
        id: "osilator-durdurucu",
        title: "Mekanik durdurucular ve çarpma",
        blocks: [
          {
            kind: "p",
            text: r`Taşıyıcının hareketi iki yönde sınırlıdır. Duvar tarafında sınırı yayın **katı boyu** belirler: sarımlar birbirine değdiğinde yay daha fazla kısalamaz. Uçları düz bırakılmış bir basma yayında katı boy $L_s = d\,(N_t + 1)$ ile verilir [@budynas2015]; $N_t = 14$ sarım ve $L_s = 1{,}45$ m için tel çapı $d = 0{,}097$ m olur. Yayın sabit ucu $x = -7{,}05$ m, taşıyıcının yarı boyu 0,85 m olduğundan taşıyıcının merkezi $x_\mathrm{min} = -7{,}05 + 1{,}45 + 0{,}85 = -4{,}75$ m konumunun ötesine geçemez. Öbür yönde ray sonundaki durdurucu $x_\mathrm{max} = 6{,}50$ m sınırını koyar. Sahnedeki bütün parçalar bu ölçülerle çizilir; hiçbir parça bir başkasının içinden geçmez.`,
          },
          {
            kind: "p",
            text: r`Durdurucu, tek yönlü rijit bir kısıt olarak modellenir. Çarpma anında Newton'un kinematik geri sıçrama yasası uygulanır [@stronge2000]:`,
          },
          { kind: "eq", label: "2.9", tex: r`v^{+} = -e\,v^{-}, \qquad \Delta Q_e = \tfrac12 m\,(v^{-})^2\,(1-e^2)` },
          {
            kind: "p",
            text: r`Yitirilen kinetik enerji çarpma ısısı olarak deftere yazılır. Uygulanan net kuvvet taşıyıcıyı durdurucuya bastırmayı sürdürüyorsa taşıyıcı orada durur ve kuvvet yön değiştirince ayrılır. Çarpma anı zaman adımının içinde ikiye bölme yöntemiyle bulunur (Bölüm 4); kapalı biçimli çözümle karşılaştırıldığında çarpma anındaki hata $10^{-12}$ s mertebesindedir.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "e = 0,45 bir model parametresidir",
            text: r`Çelik bir gövdenin kauçuk bir tampona çarpması için el kitabı niteliğinde bir geri sıçrama katsayısı bulunamamıştır. Rijit taneciklerin kauçuk bir bloğa çarpması için ölçülen değerler 0,37–0,44 aralığındadır [@sandeep2021]; seçilen değer bu büyüklük mertebesindedir ve çarpmada kinetik enerjinin yaklaşık %80'inin yitirildiği anlamına gelir. Geri sıçrama katsayısı gerçekte çarpma hızına bağlıdır; bu bağımlılığı veren sürekli temas modelleri [@hunt1975] burada kullanılmamıştır.`,
          },
        ],
      },
      {
        id: "osilator-enerji",
        title: "Enerji defteri",
        blocks: [
          {
            kind: "p",
            text: r`(2.1) denklemi $\dot{x}$ ile çarpılıp zamana göre integre edilirse, çarpmalar da eklenerek, her an sağlanması gereken bir denge elde edilir:`,
          },
          {
            kind: "eq",
            label: "2.10",
            tex: r`\underbrace{\tfrac12 m\dot{x}^2}_{E_k} + \underbrace{\tfrac12 kx^2}_{E_p} + \underbrace{\int_0^t c\,\dot{x}^2\,dt'}_{Q_c} + Q_e - \underbrace{\int_0^t F_0\cos\varphi\;\dot{x}\,dt'}_{W} = E_0`,
          },
          {
            kind: "p",
            text: r`$Q_c$ ve $W$ durum vektörünün parçasıdır ve hareketle aynı yöntemle, aynı adımda integre edilir; $Q_e$ çarpmalarda (2.9) ile artar. Sol taraf ile $E_0$ arasındaki fark, yani **artık** $\Delta E$, tam bir çözümde sıfırdır; sıfırdan farklı her değer sayısal hatadır. Artık, durum çubuğunda ve Enerji sekmesinde sürekli gösterilir; bağıl değeri hesaplanırken payda olarak $|E_0|$, anlık mekanik enerji ve $Q + |W|$ büyüklüklerinin en büyüğü alınır. Sönüm, sürücü ve 27 çarpmanın birlikte bulunduğu 60 saniyelik bir doğrulama deneyinde bağıl artık $1{,}3 \times 10^{-12}$ değerini aşmaz.`,
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "sarkac",
    number: "3",
    title: "N bağlantılı sarkaç",
    summary:
      "Lagrange fonksiyonu ve hareket denklemleri, mafsal sürtünmesi, tek sarkacın tam periyodu, küçük salınım modları, çubuk kuvvetleri ve tepeden aşma için enerji eşiği.",
    sections: [
      {
        id: "sarkac-model",
        title: "Model ve Lagrange fonksiyonu",
        blocks: [
          {
            kind: "p",
            text: r`Zincir, kütlesiz ve rijit $N$ çubuktan oluşur; $i$. çubuğun boyu $L_i$, alt ucundaki noktasal kütle $m_i$ değerindedir. Genelleştirilmiş koordinatlar çubukların aşağı düşeyle yaptığı mutlak açılardır, $\theta_1,\dots,\theta_N$. Mafsalın altında kalan toplam kütle $\mu_i = \sum_{k \ge i} m_k$ ile gösterilirse kinetik ve potansiyel enerji [@goldstein2002; @landau1976; @konishi2023]`,
          },
          {
            kind: "eq",
            label: "3.1",
            tex: r`T = \frac12\sum_{i=1}^{N}\sum_{j=1}^{N}\mu_{\max(i,j)}\,L_iL_j\cos(\theta_i-\theta_j)\,\dot\theta_i\dot\theta_j, \qquad V = g\sum_{i=1}^{N}\mu_iL_i\,(1-\cos\theta_i)`,
          },
          {
            kind: "p",
            text: r`Potansiyel enerji asılı denge konumundan ölçülür; en büyük değeri, zincirin dimdik yukarı durduğu konumdaki $2g\sum_i\mu_iL_i$ değeridir. Açıların mutlak seçilmesi kütle matrisini simetrik ve yapısını yalın tutar; bedeli, mafsal sürtünmesinin komşu açısal hızların farkına bağlı olmasıdır.`,
          },
          {
            kind: "table",
            caption: "Çizelge 3.1. Parametre aralıkları ve hazır yerçekimi değerleri.",
            head: ["Büyüklük", "Değer", "Kaynak"],
            rows: [
              [r`Kütleler $m_i$`, "0,3 – 6 kg", "–"],
              [r`Çubuk boyları $L_i$`, "0,4 – 1,8 m", "–"],
              [r`Mafsal sönümü $b$`, "0 – 2 N·m·s/rad", "–"],
              ["Dünya (standart yerçekimi ivmesi)", r`$9{,}80665\ \mathrm{m/s^2}$, tanım gereği tam`, "[@cgpm1901; @bipm2019si]"],
              ["Ay", r`$1{,}62\ \mathrm{m/s^2}$`, "[@nasa_moonfact]"],
              ["Mars", r`$3{,}73\ \mathrm{m/s^2}$ (ortalama yüzey çekimi)`, "[@nasa_marsfact]"],
              ["Jüpiter", r`$25{,}92\ \mathrm{m/s^2}$ (ortalama, 1 bar düzeyi)`, "[@nasa_jupiterfact]"],
              [
                "Serbest düşüş",
                r`$g = 0$ idealleştirmesi; Uluslararası Uzay İstasyonu'nda yarı durağan artık ivme $10^{-6}g$ mertebesindedir`,
                "[@delombard2006]",
              ],
            ],
          },
        ],
      },
      {
        id: "sarkac-denklem",
        title: "Hareket denklemleri",
        blocks: [
          { kind: "p", text: r`Euler–Lagrange denklemleri her $i$ için` },
          {
            kind: "eq",
            label: "3.2",
            tex: r`\sum_{j=1}^{N}\mu_{\max(i,j)}L_iL_j\left[\cos(\theta_i-\theta_j)\,\ddot\theta_j + \sin(\theta_i-\theta_j)\,\dot\theta_j^{\,2}\right] + \mu_i\,g\,L_i\sin\theta_i = Q_i`,
          },
          {
            kind: "p",
            text: r`biçimindedir; $Q_i$ korunumsuz genelleştirilmiş kuvvettir. İvmelerin katsayı matrisi $A_{ij} = \mu_{\max(i,j)}L_iL_j\cos(\theta_i-\theta_j)$ simetrik ve pozitif tanımlıdır, çünkü $T = \tfrac12\dot{\boldsymbol\theta}^{\mathsf T}\mathbf{A}\,\dot{\boldsymbol\theta}$ her sıfırdan farklı hız için pozitiftir. Bu yüzden ivmeler her adımda Cholesky ayrışımıyla çözülür [@golub2013]; ayrışımın başarısız olması modelde bir hata olduğunu gösterir. $N = 1$ için denklem bilinen $\ddot\theta = -(g/L)\sin\theta$ biçimine iner. Aynı Lagrange fonksiyonu çoklu sarkaç için hakemli yayınlarda da verilmiştir [@konishi2023; @braun2003; @udwadia2015].`,
          },
        ],
      },
      {
        id: "sarkac-surtunme",
        title: "Mafsal sürtünmesi",
        blocks: [
          {
            kind: "p",
            text: r`Her mafsalda, birleştirdiği iki çubuğun bağıl açısal hızıyla orantılı bir sürtünme torku vardır; sabit askı noktası için $\dot\theta_0 = 0$ alınır. Hızın karesel bir fonksiyonu olan Rayleigh yitim fonksiyonu [@rayleigh1873; @goldstein2002] ve ondan türeyen genelleştirilmiş kuvvetler`,
          },
          {
            kind: "eq",
            label: "3.3",
            tex: r`D = \frac{b}{2}\sum_{i=1}^{N}\left(\dot\theta_i - \dot\theta_{i-1}\right)^2, \qquad Q_i = -\frac{\partial D}{\partial\dot\theta_i} = -b\,(\dot\theta_i-\dot\theta_{i-1}) + b\,(\dot\theta_{i+1}-\dot\theta_i)`,
          },
          {
            kind: "p",
            text: r`biçimindedir; son terim en alttaki çubuk için yoktur. Isıya dönüşen güç $2D$ kadardır. Bu güç ek bir durum değişkeni olarak integre edilir ve enerji defteri $T + V + Q_b = E_0$ biçiminde izlenir. Model viskoz sürtünmedir; kuru (Coulomb) sürtünme ve hava direnci içermez.`,
          },
        ],
      },
      {
        id: "sarkac-periyot",
        title: "Tek sarkaç: tam periyot",
        blocks: [
          {
            kind: "p",
            text: r`Küçük açılarda $\sin\theta \approx \theta$ alınırsa periyot genlikten bağımsız çıkar, $T_0 = 2\pi\sqrt{L/g}$. Genlik $\theta_0$ büyüdükçe bu yaklaşıklık bozulur. Enerjinin korunumundan elde edilen tam periyot birinci tür tam eliptik integral $K$ ile verilir [@belendez2007; @dlmf; @nelson1986]:`,
          },
          {
            kind: "eq",
            label: "3.4",
            tex: r`T = 4\sqrt{\frac{L}{g}}\;K\!\left(\sin\frac{\theta_0}{2}\right) = T_0\left(1 + \frac{\theta_0^2}{16} + \frac{11\,\theta_0^4}{3072} + \cdots\right)`,
          },
          {
            kind: "p",
            text: r`$K$ aritmetik–geometrik ortalama ile hesaplanır: $K(k) = \pi/\bigl(2\,\mathrm{AGM}(1,\sqrt{1-k^2})\bigr)$, dolayısıyla $T = T_0/\mathrm{AGM}(1,\cos(\theta_0/2))$ [@carvalhaes2008]. Yineleme ikinci dereceden yakınsar; çift duyarlıkta beş altı adım yeter. Sarkaç tepeden aşacak kadar enerjiliyse hareket salınım değil sürekli dönmedir. En alt noktadan ölçülen enerjiyle tanımlanan $\kappa^2 = E/(2mgL) = \sin^2(\theta/2) + L\dot\theta^2/(4g)$ parametresi iki hareketi ayırır: $\kappa < 1$ salınım, $\kappa > 1$ dönme, $\kappa = 1$ ise periyodu sonsuz olan separatristir. Bir tam dönüşün süresi`,
          },
          { kind: "eq", label: "3.5", tex: r`T_\mathrm{rot} = \frac{2}{\kappa}\sqrt{\frac{L}{g}}\;K\!\left(\frac{1}{\kappa}\right), \qquad \kappa > 1` },
          {
            kind: "table",
            caption: "Çizelge 3.2. Tek sarkacın periyodunun küçük açı değerine oranı.",
            head: [r`Genlik $\theta_0$`, "5°", "10°", "30°", "60°", "90°", "120°", "150°", "170°"],
            rows: [[r`$T/T_0$`, "1,0005", "1,0019", "1,0174", "1,0732", "1,1803", "1,3729", "1,7622", "2,4394"]],
          },
          {
            kind: "p",
            text: r`Ölçümler sekmesi bu kuramsal değerleri anlık enerjiden hesaplar ve periyot ölçerin verdiği değerle karşılaştırır. Doğrulama deneylerinde ölçülen periyot ile (3.4) ve (3.5) arasındaki bağıl fark 10°–170° genlik aralığında ve dönme hareketinde $2{,}4 \times 10^{-10}$ değerini aşmaz.`,
          },
        ],
      },
      {
        id: "sarkac-modlar",
        title: "Küçük salınımlar ve normal modlar",
        blocks: [
          {
            kind: "p",
            text: r`Asılı denge çevresinde doğrusallaştırılan sürtünmesiz denklemler $\mathbf{M}\ddot{\boldsymbol\theta} + \mathbf{K}\boldsymbol\theta = \mathbf{0}$ biçimini alır; burada $M_{ij} = \mu_{\max(i,j)}L_iL_j$ ve $\mathbf{K} = g\,\mathrm{diag}(\mu_iL_i)$. $\boldsymbol\theta = \mathbf{a}\cos(\omega t + \varphi)$ denemesi genelleştirilmiş simetrik özdeğer problemini verir:`,
          },
          { kind: "eq", label: "3.6", tex: r`\left(\mathbf{K} - \omega^2\mathbf{M}\right)\mathbf{a} = \mathbf{0}` },
          {
            kind: "p",
            text: r`Problemin $N$ pozitif özdeğeri vardır; her biri bütün parçaların aynı frekansla salındığı bir **normal mod**dur. Eşit kütleli ve eşit boylu çift sarkaçta $\omega^2 = (2 \mp \sqrt{2})\,g/L$ ve açı oranları $\theta_2/\theta_1 = \pm\sqrt{2}$ bulunur [@taylor2005]. Eşit kütleli ve eşit boylu $N$ bağlantılı zincirde özfrekanslar Laguerre çokterimlisinin sıfırlarıyla verilir [@muller2007; @braun2003]:`,
          },
          { kind: "eq", label: "3.7", tex: r`\omega_k^2 = \frac{g}{\ell}\,x_k, \qquad L_N(x_k) = 0, \quad k = 1,\dots,N` },
          {
            kind: "p",
            text: r`Bağlantı sayısı artarken zincir, toplam boyu $\Lambda$ olan asılı bir ipe yaklaşır; ipin frekansları Bessel fonksiyonu $J_0$ sıfırlarıyla verilir, $\omega_k = \tfrac12 j_{0,k}\sqrt{g/\Lambda}$ ve $j_{0,1} = 2{,}4048$ [@verbin2015; @dlmf10]. Asılı zincirin salınımlarını ilk çözen Daniel Bernoulli'dir [@bernoulli1738; @bernoulli1740; @cannon1981]. Yakınsama yavaştır: altı eşit bağlantılı zincirin temel frekansı ip değerinin %3,8 altındadır. Uygulama (3.6) problemini seçili zincir için sayısal olarak çözer; eşit zincirlerde sonuç (3.7) ile $10^{-15}$ bağıl hata düzeyinde örtüşür.`,
          },
        ],
      },
      {
        id: "sarkac-kuvvet",
        title: "Çubuk kuvvetleri: bağımsız bir denetim",
        blocks: [
          {
            kind: "p",
            text: r`Serbest cisim diyagramındaki kuvvetler Lagrange denklemlerinden değil, her kütle için ayrı ayrı yazılan Newton'un ikinci yasasından hesaplanır: ivmeler bilindiğinde, en alttaki kütleden başlanarak her çubuğun taşıması gereken kuvvet bulunur. İdeal bir çubuk yalnızca kendi doğrultusunda kuvvet taşır; dolayısıyla hesaplanan kuvvetin çubuğa dik bileşeni, iki türetim tutarlıysa sıfır olmalıdır. Rastgele seçilmiş 200 durumda dik bileşenin gerilmeye oranı $6 \times 10^{-15}$ değerini aşmaz. Tek sarkaçta sonuç bilinen $T = m(g\cos\theta + L\dot\theta^2)$ bağıntısına iner.`,
          },
          {
            kind: "note",
            tone: "info",
            title: "Negatif gerilme",
            text: r`Hızlı hareketlerde bir çubuktaki eksenel kuvvet işaret değiştirebilir: çubuk çekilmek yerine itilir. Rijit çubuk bunu taşır; aynı düzenek iple kurulsaydı ip o anda gevşerdi. Ölçümler sekmesi bu durumu “basma” olarak belirtir.`,
          },
        ],
      },
      {
        id: "sarkac-esik",
        title: "Tepeden aşma için enerji eşiği",
        blocks: [
          {
            kind: "p",
            text: r`$k$. çubuğun dimdik yukarı konumdan ($\theta_k = \pi$) geçebilmesi için mekanik enerjinin en az o çubuğa ait potansiyel enerji terimi kadar olması gerekir. Bütün çubuklar için en küçük eşik`,
          },
          { kind: "eq", label: "3.8", tex: r`E^{\ast} = \min_k\; 2\,g\,\mu_kL_k` },
          {
            kind: "p",
            text: r`değerindedir. Mekanik enerji bunun altındaysa hiçbir çubuk tepeden aşamaz; üstünde olması ise gerekli ama yeterli olmayan bir koşuldur. Eşit kütleli ve eşit boylu noktasal kütleli çift sarkaç durgun bırakıldığında koşul $2\cos\theta_1 + \cos\theta_2 > 1$ biçimini alır: bu bölgeden bırakılan sarkaç hiçbir zaman takla atamaz.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“3 cos θ₁ + cos θ₂ > 2” koşulu başka bir modele aittir",
            text: r`Sık alıntılanan bu eşitsizlik, kütlesi çubuk boyunca düzgün dağılmış iki özdeş çubuktan oluşan bileşik çift sarkaç için geçerlidir [@heyl2008; @rafat2009]. Buradaki model noktasal kütleli olduğundan katsayılar farklıdır; iki koşul birbirinin yerine kullanılamaz.`,
          },
        ],
      },
    ],
  },
];
