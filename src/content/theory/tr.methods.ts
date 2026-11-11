import type { TheoryDocument } from "./types";

const r = String.raw;

/** Bölüm 4-6: sayısal yöntemler, deterministik kaos, ölçüm ve çözümleme araçları. */
export const methodsTr: TheoryDocument = [
  {
    id: "sayisal",
    number: "4",
    title: "Sayısal yöntemler",
    summary:
      "Kullanılan tek adımlı yöntemler, kararlılık ve enerji davranışları, ekran hızından bağımsız sabit adımlı döngü, çarpma anının bulunması ve uyarlamalı adım.",
    sections: [
      {
        id: "sayisal-yontemler",
        title: "Tek adımlı açık yöntemler",
        blocks: [
          {
            kind: "p",
            text: r`Her iki model birinci mertebe bir sistem olarak yazılır, $\dot{\mathbf{y}} = \mathbf{f}(t,\mathbf{y})$; osilatörde $\mathbf{y} = (x, \dot{x}, \varphi, Q_c, W)$, sarkaçta $\mathbf{y} = (\theta_1,\dots,\theta_N, \dot\theta_1,\dots,\dot\theta_N, Q_b)$. Enerji defterinin integral terimleri durum vektörünün parçasıdır; dolayısıyla hareketle aynı doğrulukta integre edilirler. Varsayılan yöntem klasik dördüncü mertebe Runge–Kutta yöntemidir [@runge1895; @kutta1901; @hairer1993]:`,
          },
          {
            kind: "eq",
            label: "4.1",
            tex: r`\begin{aligned} \mathbf{k}_1 &= \mathbf{f}(t_n, \mathbf{y}_n), & \mathbf{k}_2 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_1\right), \\ \mathbf{k}_3 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_2\right), & \mathbf{k}_4 &= \mathbf{f}(t_n + h,\, \mathbf{y}_n + h\,\mathbf{k}_3), \\ \mathbf{y}_{n+1} &= \mathbf{y}_n + \tfrac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right) \end{aligned}`,
          },
          {
            kind: "p",
            text: r`Mertebesi $p$ olan bir yöntemin tek adımdaki hatası $O(h^{p+1})$, sabit bir zaman aralığının sonundaki toplam hatası $O(h^p)$ büyüklüğündedir [@hairer1993; @butcher2016]. Çizelge 4.1'deki öbür yöntemler karşılaştırma ve öğretim amacıyla seçilebilir: düşük mertebeli bir yöntemin ne yaptığını görmek, yüksek mertebeli yöntemin neden gerektiğini anlamanın en kısa yoludur.`,
          },
          {
            kind: "table",
            caption: "Çizelge 4.1. Seçilebilen yöntemler ve doğrulama deneyinde gözlenen mertebeler.",
            head: ["Yöntem", "Mertebe", "Gözlenen mertebe", "Adım başına türev sayısı", "Not"],
            rows: [
              ["Açık Euler", "1", "1,007", "1", "Sönümsüz osilatörde enerji her adımda büyür"],
              ["Simplektik Euler", "1", "1,005", "1", "Osilatörde enerji hatası sınırlı kalır"],
              ["Orta nokta (RK2)", "2", "2,0005", "2", "–"],
              ["Klasik Runge–Kutta (RK4)", "4", "4,005", "4", "Varsayılan"],
              ["Dormand–Prince 5(4)", "5", "5,02", "7", "Gömülü hata kestirimi, uyarlamalı adım"],
            ],
          },
          {
            kind: "p",
            text: r`Gözlenen mertebe, kapalı biçimli çözümü bilinen bir problemin iki adım büyüklüğüyle çözülmesinden hesaplanır, $p = \ln(e_1/e_2)/\ln(h_1/h_2)$; kodun yöntemi doğru uyguladığının en doğrudan kanıtıdır [@roache1998; @salari2000; @roy2005].`,
          },
        ],
      },
      {
        id: "sayisal-kararlilik",
        title: "Kararlılık ve enerji davranışı",
        blocks: [
          {
            kind: "p",
            text: r`Yöntemlerin sönümsüz osilatördeki davranışı kapalı biçimde bilinir. $z = h\omega_0$ olmak üzere açık Euler adımı enerjiyi her adımda tam olarak $1 + z^2$ ile çarpar; yani adım ne kadar küçük olursa olsun enerji üstel büyür. Klasik RK4 için çarpan`,
          },
          { kind: "eq", label: "4.2", tex: r`\frac{E_{n+1}}{E_n} = 1 - \frac{z^6}{72} + \frac{z^8}{576}, \qquad z = h\omega_0` },
          {
            kind: "p",
            text: r`biçimindedir: yöntem enerjiyi çok yavaş **yitirir** ve sanal eksen üzerinde $|z| \le 2\sqrt{2}$ için kararlıdır [@hairer1996; @hairer2006]. Varsayılan $h = 1$ ms adımla, parametre aralığının en sert osilatöründe ($k = 80$ N/m, $m = 0{,}5$ kg, $\omega_0 = 12{,}6$ rad/s) adım başına bağıl kayıp $6 \times 10^{-14}$, 60 saniyede toplam $3 \times 10^{-9}$ değerindedir. Simplektik Euler yöntemi osilatörde değiştirilmiş bir enerjiyi tam olarak korur ve $z < 2$ için sınırlı kalır [@hairer2003].`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "Açık Runge–Kutta yöntemleri simplektik değildir",
            text: r`Hiçbir açık Runge–Kutta yöntemi Hamilton sistemlerinin faz uzayı yapısını tam olarak korumaz [@sanzserna1988; @hairer2006]. Buradaki simplektik Euler de yalnızca ayrılabilir Hamilton fonksiyonları için simplektiktir; sarkaç zincirinin kütle matrisi açılara bağlı olduğundan bu özellik zincirde geçerli değildir. Sönüm, sürücü ve çarpma içeren genel durumda sistem zaten Hamilton sistemi değildir. Bu çalışmada enerji korunumu varsayılmaz, ölçülür: enerji defterinin kalıntısı her an ekrandadır.`,
          },
        ],
      },
      {
        id: "sayisal-dongu",
        title: "Sabit adımlı döngü ve yeniden üretilebilirlik",
        blocks: [
          {
            kind: "p",
            text: r`Her canlandırma karesinin duvar saati süresi, zaman ölçeğiyle çarpılarak bir bütçeye eklenir. Bütçe tam olarak $h = 1/f_s$ büyüklüğünde adımlarla harcanır; artan kısım sonraki kareye devreder [@fiedler2004]. Adım frekansı $f_s$ 60, 120, 300, 600, 1000 ya da 2000 Hz olarak seçilebilir; varsayılan değer 1000 Hz'tir. Tek bir kare bütçeye en çok 0,1 s'lik duvar saati süresi ekler; bu, 2000 Hz'te ve en büyük zaman ölçeği olan 2'de 400 adım eder. Daha uzun süren kare 0,1 saniyeye kırpılır: artan bölüm benzetime aktarılmaz, benzetim zamanı duvar saatinin gerisinde kalır ve durum çubuğu son başlatmadan beri bu tür kareleri sayar (“Geciken kare”). Sekme arka plandan döndüğünde kare süresinin ölçümü yeniden başlar; arka planda geçen süre bu yüzden ne benzetime aktarılır ne de sayılır. Adım büyüklüğü hiçbir zaman değişmez. Telemetri, 300 Hz ve üzerindeki adım frekanslarında 10 ms'de bir, 60 Hz ve 120 Hz'te ise her adımda kaydedilir.`,
          },
          {
            kind: "p",
            text: r`Bu düzende durum dizisi yalnızca başlangıç koşullarına, parametrelere, yönteme ve $h$ değerine bağlıdır. Otomatik sınamalar bunu doğrudan denetler: aynı deney bir kez düzgün 60 Hz karelerle, bir kez rastgele kare süreleriyle yürütülür ve ortak adım sayılarındaki durumların bit düzeyinde eşit olduğu görülür. Deney dosyası ve paylaşım bağlantısı yalnızca bu girdileri taşır; alıcı aynı yörüngeyi yeniden üretir. Aynı nedenle yöntemin ya da adım frekansının değiştirilmesi sürmekte olan deneyi devam ettirmez: iki deney de başlangıç koşullarından yeniden başlar; böylece bir kayıt, o kaydın enerji defteri ve hata istatistikleri her zaman tek bir yönteme ve tek bir adıma aittir.`,
          },
          {
            kind: "p",
            text: r`Benzetim zamanı adımların toplamıdır ve bu toplamın kendi yuvarlama hatası vardır. $h = 1$ ms değerini olağan kayan noktalı aritmetikle 600 000 kez toplamak $7 \times 10^{-9}$ s yitirir. Arabanın 6,9 m/s hıza ulaştığı “Sönümsüz” hazır deneyinde yalnızca bu kayıp, Bölüm 2'deki kapalı biçimli başvuru çözümünü, arabanın en hızlı olduğu yerde yaklaşık $5 \times 10^{-8}$ m kaydırırdı; bu, RK4 yönteminin aynı 600 s içindeki hatasının on katıdır. Osilatörün saati bu yüzden dengelemeli (Kahan) toplamayla ilerletilir; sürücünün fazı da biriktirilmek yerine saatten hesaplanır. Sarkacın denklemleri zamanı açık olarak içermez; saati olağan bir toplamdır ve yuvarlama hatası yalnızca kaydın zaman damgalarına yansır.`,
          },
          {
            kind: "p",
            text: r`Çalışma zamanı her adımdan sonra çözümün sonlu aralıkta kalıp kalmadığını denetler. Sarkaçta bu, bütün açıların ve açısal hızların mutlak değerce $10^7$'nin (rad ve rad/s) altında olması demektir; denetim asıl yörüngeyi, gösterildiği sürece ikiz yörüngeyi ve Lyapunov kestiriminin gölge yörüngesini kapsar. Osilatörde konumun sonlu, hızın $10^6$ m/s'nin altında olması aranır. Denetim sağlanmazsa o adımdan önceki durum geri konur, deney durdurulur ve arayüz çözümün ıraksadığını bildirir; fizik çekirdeğinde oluşan bir istisna (exception) da deneyi aynı biçimde durdurur. Düşük mertebeli bir yöntem iri bir adımla böyle sonlanabilir: altı bağlantılı hazır zincir 60 Hz'te açık Euler yöntemiyle çözüldüğünde 12 s sonra durdurulur. Durdurma iki deney için de geçerlidir; deneylerden biri yeniden başlatıldığında ya da bir çözücü seçildiğinde kalkar ve her iki işlem ıraksayan deneyi de yeniden başlatır.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "Yeniden üretilebilirliğin sınırı",
            text: r`Hesaplar IEEE 754 çift duyarlıklı sayılarla yapılır (53 bitlik anlamlı kısım, $\varepsilon = 2^{-52} \approx 2{,}2 \times 10^{-16}$) [@ieee754-2019; @goldberg1991]. Dört işlem ve karekök standartça tam tanımlıdır; trigonometrik fonksiyonların son basamağı ise çalışma ortamına göre değişebilir. Kaotik bir yörüngede $10^{-16}$ büyüklüğündeki bir fark, üstel $\lambda \approx 1\ \mathrm{s^{-1}}$ iken yaklaşık $\ln(10^{16})/\lambda \approx 37$ s içinde 1 rad düzeyine büyür. Bit düzeyinde yinelenebilirlik bu yüzden aynı çalışma ortamı için sınanmıştır; farklı tarayıcı motorları arasında karşılaştırma yapılmamıştır.`,
          },
        ],
      },
      {
        id: "sayisal-olay",
        title: "Çarpma anının bulunması",
        blocks: [
          {
            kind: "p",
            text: r`Durdurucular hareket denklemini parçalı yapar; çarpma anı adımın içinde bulunmazsa hata adım büyüklüğüyle doğru orantılı olur ve yöntemin mertebesi yitirilir. Bir adımın sonunda araba sınırın dışına çıkmışsa, adımın $s \in [0,1]$ kesri üzerinde ikiye bölme yapılır: adımın başındaki durumdan $s\,h$ kadar ilerlenir ve arabanın hâlâ içeride kaldığı en büyük $s$ aranır. 52 yineleme, çift duyarlığın bütün basamaklarını tüketir. Sonra durum bu ana kadar ilerletilir, (2.9) uygulanır ve adımın kalan kısmı çözülür. Bir adımda altıdan fazla çarpma olursa (arabanın durdurucu üzerinde giderek küçülen sıçramaları) araba durdurucuda durgun kabul edilir ve kalan kinetik enerji ısıya yazılır.`,
          },
          {
            kind: "p",
            text: r`Doğrulama deneyinde çarpma anı kapalı biçimli değerden $9 \times 10^{-13}$ s, çarpma hızı bağıl olarak $3 \times 10^{-14}$ sapar.`,
          },
        ],
      },
      {
        id: "sayisal-uyarlamali",
        title: "Uyarlamalı adım: Dormand–Prince 5(4)",
        blocks: [
          {
            kind: "p",
            text: r`Dormand–Prince çifti aynı türev değerlendirmelerinden beşinci mertebe bir çözüm ile dördüncü mertebe bir karşılaştırma çözümü üretir; ikisinin farkı yerel hatanın kestirimidir [@dormand1980; @hairer1993]. MATLAB'ın ode45 çözücüsü de bu çifte dayanır [@shampine1997]. Uygulamada sabit dış adım $h$ korunur; yöntem bu adımı, kestirilen hata $10^{-10}$ bağıl ve $10^{-12}$ mutlak toleransın altında kalacak biçimde kendi iç adımlarına böler. Böylece adım dizisi yine kare süresinden bağımsızdır.`,
          },
          {
            kind: "p",
            text: r`Sabit adımlı RK4 varsayılan parametrelerde yeterlidir: çift sarkaçta 60 saniyelik bağıl enerji sapması $2 \times 10^{-9}$, altı bağlantılı zincirde $3 \times 10^{-7}$ değerindedir. İzin verilen aralığın en zor köşesinde ise (üç ağır ve uzun bağlantı, üç hafif ve kısa bağlantıyı sürükler; açısal hızlar 140 rad/s değerini aşar) sabit adımın sapması $1{,}5 \times 10^{-3}$ düzeyine çıkar; Dormand–Prince aynı deneyde $4 \times 10^{-9}$ verir. Sabit adımlı bir yöntemle çözülen deneyde bağıl kalıntı $10^{-5}$ değerine ulaştığında durum çubuğu uyarlamalı yöntemle yeniden başlatmayı önerir; öneri kabul edildiğinde, her çözücü değişikliğinde olduğu gibi, iki deney de baştan başlar.`,
          },
        ],
      },
      {
        id: "sayisal-cebir",
        title: "Doğrusal cebir ve özel fonksiyonlar",
        blocks: [
          {
            kind: "list",
            items: [
              r`**İvmeler.** (3.2) sistemindeki simetrik pozitif tanımlı matris her türev değerlendirmesinde Cholesky ayrışımıyla çözülür [@golub2013].`,
              r`**Normal modlar.** (3.6) problemi, $\mathbf{M}$ matrisinin Cholesky ayrışımıyla standart simetrik özdeğer problemine indirgenir ve Jacobi döndürmeleriyle çözülür [@jacobi1846; @golub2013].`,
              r`**Laguerre sıfırları.** Doğrulamada başvuru değeri olarak kullanılan sıfırlar, üç terimli yineleme bağıntısından kurulan üç köşegenli matrisin özdeğerleri olarak hesaplanır [@golub1969].`,
              r`**Eliptik integral.** $K(k)$ aritmetik–geometrik ortalama ile hesaplanır [@dlmf; @carvalhaes2008].`,
            ],
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "kaos",
    number: "5",
    title: "Deterministik kaos",
    summary:
      "Başlangıç koşullarına duyarlılık, Lyapunov üstelinin kestirimi, öngörü ufku, kaosun hangi koşullarda olanaklı olduğu ve Poincaré kesiti.",
    sections: [
      {
        id: "kaos-duyarlilik",
        title: "Başlangıç koşullarına duyarlılık",
        blocks: [
          {
            kind: "p",
            text: r`Deterministik bir sistemde aynı başlangıç koşulları her zaman aynı yörüngeyi verir. Kaotik bir sistemde ise birbirine çok yakın iki başlangıç koşulundan çıkan yörüngeler ortalamada üstel hızla ayrılır. Faz uzayında başlangıçta $\delta_0$ kadar ayrık iki yörünge için`,
          },
          {
            kind: "eq",
            label: "5.1",
            tex: r`\lVert\delta(t)\rVert \approx \lVert\delta_0\rVert\,e^{\lambda t}, \qquad \lambda = \lim_{t\to\infty}\,\lim_{\lVert\delta_0\rVert\to 0}\frac{1}{t}\ln\frac{\lVert\delta(t)\rVert}{\lVert\delta_0\rVert}`,
          },
          {
            kind: "p",
            text: r`ile tanımlanan $\lambda$ **en büyük Lyapunov üsteli**dir; varlığı ve hemen her başlangıç yönü için aynı değeri alması çarpımsal ergodik teoremle güvence altındadır [@oseledec1968; @ott2002]. Pozitif bir üstel kaosun nicel işaretidir. Uygulama bu ayrılmayı iki yoldan gösterir: birinci açısı $\delta_0$ kadar farklı bırakılan görünür bir **ikiz sarkaç** ve arka planda sürekli çalışan bir üstel kestirimi.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "Lorenz'in yuvarlanmış sayısı",
            text: r`Duyarlılığın keşfine ilişkin ünlü olay 1963 tarihli makaleden [@lorenz1963] değil, 1961 kışından kalmadır ve üç değişkenli ünlü sistemle değil, on iki değişkenli bir hava modeliyle ilgilidir. Lorenz kendi anlatımında üç basamağa yuvarlanmış bir çıktı satırını yeniden girdiğini söyler, ama rakam vermez [@lorenz1993]; sık alıntılanan 0,506127 ve 0,506 sayıları Gleick'in kitabından gelir [@gleick1987]. “Kelebek” benzetmesi ise 1972 tarihli bir konuşmanın başlığıdır [@lorenz1972].`,
          },
        ],
      },
      {
        id: "kaos-benettin",
        title: "Lyapunov üstelinin kestirimi",
        blocks: [
          {
            kind: "p",
            text: r`Üstel, Benettin, Galgani ve Strelcyn'in iki yörüngeli yöntemiyle kestirilir [@benettin1976; @skokos2010]. Asıl yörüngenin yanında, faz uzayında ondan $d_0 = 10^{-8}$ uzaklıkta bir gölge yörünge aynı yöntemle ve aynı adımla çözülür. Her $\tau$ aralığının sonunda ayrılık $d_k$ ölçülür ve gölge, ayrılığın o andaki doğrultusu korunarak yeniden $d_0$ uzaklığına çekilir; $\tau$, 300 Hz ve üzerindeki adım frekanslarında 0,01 s, 60 Hz ve 120 Hz'te ise bir adımdır. Akan kestirim`,
          },
          { kind: "eq", label: "5.2", tex: r`\lambda(t) = \frac{1}{t}\sum_{k=1}^{t/\tau}\ln\frac{d_k}{d_0}` },
          {
            kind: "p",
            text: r`biçimindedir. Yeniden ölçekleme, ayrılığın doğrusal büyüme bölgesinde kalmasını sağlar; aynı düşüncenin bütün üstelleri veren genellemesi için bkz. [@benettin1980a; @benettin1980b], deneysel zaman serilerinden kestirim için [@wolf1985]. Uzaklık, açıların ve açısal hızların oluşturduğu $2N$ boyutlu uzayda Öklid normuyla ölçülür.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "Gösterilen değer sonlu süreli bir kestirimdir",
            text: r`$\lambda(t)$ ancak $t \to \infty$ sınırında üstele yakınsar. Düzenli harekette kestirim yaklaşık $\ln t/t$ gibi sıfıra iner; bu yüzden kısa bir gözlemde küçük ama pozitif bir değer kaos kanıtı değildir. Doğrulama deneylerinde 400 saniyelik kestirim tek sarkaçta 0,017, küçük açılı çift sarkaçta 0,003, kaotik çift sarkaçta 1,04 $\mathrm{s^{-1}}$ değerindedir. Adım yarıya indirildiğinde kaotik değer %7 değişir: fark yöntemin değil, sonlu süreli ortalamanın belirsizliğidir.`,
          },
        ],
      },
      {
        id: "kaos-ufuk",
        title: "Öngörü ufku",
        blocks: [
          {
            kind: "p",
            text: r`Başlangıç durumu $\delta_0$ belirsizlikle biliniyorsa ve $a$ büyüklüğündeki bir hata öngörünün başarısızlığı sayılıyorsa, öngörü yaklaşık şu süre boyunca anlamlıdır [@strogatz2015]:`,
          },
          { kind: "eq", label: "5.3", tex: r`t_\mathrm{u} \approx \frac{1}{\lambda}\,\ln\frac{a}{\delta_0}` },
          {
            kind: "p",
            text: r`Bağımlılık logaritmiktir: başlangıç belirsizliğini bin kat küçültmek ufku yalnızca $\ln 1000/\lambda \approx 6{,}9/\lambda$ kadar uzatır. Bağıntı bir büyüklük mertebesi kestirimidir; yerel büyüme hızı yörünge boyunca değiştiğinden gözlenen ayrılma süresi bundan birkaç kat farklı olabilir. Uygulama kestirilen ufku, ikizin bırakıldığı andan 1 rad ayrıldığı ana kadar gerçekten geçen süreyle yan yana verir.`,
          },
          {
            kind: "note",
            tone: "info",
            title: "Hava tahmini",
            text: r`Aynı düşünce atmosfere uygulandığında, orta enlemlerde günlük hava olaylarının öngörülebilirliğinin **içkin** sınırı yaklaşık iki hafta, bugünkü modeller ve çözümlemelerle **uygulamadaki** sınırı yaklaşık on gün olarak bulunmuştur [@zhang2019]; böyle bir sınırın varlığına ilişkin klasik çalışma Lorenz'e aittir [@lorenz1969].`,
          },
        ],
      },
      {
        id: "kaos-kosul",
        title: "Kaos ne zaman olanaklıdır",
        blocks: [
          {
            kind: "p",
            text: r`Sürücüsüz tek sarkacın faz uzayı iki boyutludur $(\theta, \dot\theta)$. Poincaré–Bendixson teoremine göre düzlemdeki özerk bir akışta sınırlı bir yörünge ancak bir denge noktasına, kapalı bir yörüngeye ya da bunları birleştiren eğrilere yaklaşabilir; kaos için en az üç boyutlu bir faz uzayı gerekir [@strogatz2015; @bendixson1901]. Tek sarkaç bu yüzden ne kadar büyük açıyla bırakılırsa bırakılsın kaotik olamaz; üstel kestirimi sıfıra iner. Çift sarkacın faz uzayı dört boyutludur ve enerji korunumu hareketi üç boyutlu bir yüzeye kısıtlar: kaos olanaklıdır.`,
          },
          {
            kind: "p",
            text: r`Olanaklı olması her yörüngenin kaotik olduğu anlamına gelmez. Küçük enerjide çift sarkacın hareketi iki normal modun toplamıdır ve düzenlidir; enerji arttıkça faz uzayının giderek büyüyen bölümü kaotik olur [@stachowiak2006; @levien1993]; çok yüksek enerjide yerçekimi dönme enerjisinin yanında önemsiz kalır ve hareket yeniden düzenlileşir [@rafat2009; @richter1984]. Gerçek bir çift sarkaçta, stroboskop fotoğraflarından ölçülen ayrılma hızı $7{,}5 \pm 1{,}5\ \mathrm{s^{-1}}$ değerindedir [@shinbrot1992]; bu değer düzeneğe ve enerjiye özgüdür ve $\sqrt{g/L}$ ile ölçeklenir.`,
          },
        ],
      },
      {
        id: "kaos-poincare",
        title: "Poincaré kesiti",
        blocks: [
          {
            kind: "p",
            text: r`Çift sarkacın üç boyutlu enerji yüzeyindeki yörüngeyi görmenin yolu, onu iki boyutlu bir yüzeyle kesmektir. Uygulama $\theta_2 = 0$ (mod $2\pi$) yüzeyini, $\theta_2$ artarken her geçişte kaydeder ve $(\theta_1, p_1)$ noktasını işaretler; $p_1$, $\theta_1$ açısına eşlenik kanonik momentumdur:`,
          },
          {
            kind: "eq",
            label: "5.4",
            tex: r`p_1 = \frac{\partial L}{\partial\dot\theta_1} = \sum_{j=1}^{N}\mu_{\max(1,j)}\,L_1L_j\cos(\theta_1-\theta_j)\,\dot\theta_j`,
          },
          {
            kind: "p",
            text: r`Kanonik değişkenlerin seçilmesi kesit dönüşümünü alan koruyan bir dönüşüm yapar. Düzenli bir yörünge değişmez bir tor üzerinde kalır ve kesitte kapalı bir eğri çizer; kaotik bir yörünge kesitte bir alanı doldurur [@lichtenberg1992; @ott2002]. Geçiş anı ardışık iki adım arasında doğrusal ara değerlemeyle bulunur; bu, $h = 1$ ms adımda grafiğin çözünürlüğünün çok altında bir hata verir. Kesit yüzeyine tam olarak inen yöntem için bkz. [@henon1982].`,
          },
        ],
      },
      {
        id: "kaos-dogruluk",
        title: "Kaotik yörüngelerde sayısal doğruluk ne anlama gelir",
        blocks: [
          {
            kind: "p",
            text: r`Kaotik bir yörüngede sayısal hata da fiziksel ayrılık gibi üstel büyür. Çift sarkaçta adım başına bağıl enerji hatası $10^{-14}$ düzeyindedir; bu kadar küçük bir fark bile, $\lambda \approx 1\ \mathrm{s^{-1}}$ iken yaklaşık $\ln(10^{14})/\lambda \approx 30$ s içinde yörüngeyi tam çözümünden bütünüyle ayırır. Bu, hiçbir sonlu duyarlıklı hesabın aşamayacağı bir sınırdır ve çözücünün kusuru değildir. Uzun süreli kaotik bir benzetimde anlamlı olan, tek tek durumlar değil yörüngenin istatistiksel ve geometrik özellikleridir: Lyapunov üsteli, Poincaré kesitinin yapısı, enerjinin korunumu. Doğrulama deneyleri bunu ölçer: kaotik çift sarkaç 5 s ileri ve 5 s geri çözüldüğünde başlangıç durumuna $4 \times 10^{-10}$ rad hatayla döner; düzenli harekette aynı deney 20 s için $5 \times 10^{-12}$ rad verir.`,
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "olcum",
    number: "6",
    title: "Ölçüm ve çözümleme araçları",
    summary:
      "Kuramın benzetimin kendi formülleriyle değil, ondan yapılan ölçümlerle karşılaştırılmasını sağlayan sanal cihazlar ve grafikler.",
    sections: [
      {
        id: "olcum-cihazlar",
        title: "Sanal cihazlar",
        blocks: [
          {
            kind: "p",
            text: r`Bir benzetimde kuramsal değeri ekrana yazmak kolaydır, ama bu bir doğrulama değildir. Buradaki cihazlar yalnızca örneklenmiş çözümü görür ve bir deneycinin kronometreyle, cetvelle ve osiloskopla yapacağı ölçümü yapar:`,
          },
          {
            kind: "list",
            items: [
              r`**Periyot ölçer.** İşaretin aynı yöndeki ardışık sıfır geçişleri arasındaki süreyi ölçer; geçiş anı iki örnek arasında doğrusal ara değerlemeyle bulunur. Yukarı ve aşağı yönlü geçişler ayrı ayrı izlenir; bu yüzden bir salınımın her periyodu iki aralık verir (dönen sarkacın her turu bir aralık). Son on iki aralığın ortalaması ve standart sapması gösterilir. Sarkaçta $\sin\theta$ izlenir ve yalnızca alt noktadaki geçişler sayılır; böylece tepeden aşan sarkacın dönme periyodu da ölçülür.`,
              r`**Tepe dedektörü.** Uç değerler en büyük örnek aranarak değil, hızın sıfır geçişinden bulunur; bu, örnekleme aralığından çok daha ince bir zaman çözünürlüğü verir. Genlik, son tepe ile son çukurun farkının yarısıdır.`,
              r`**Logaritmik azalma.** Ardışık pozitif tepelerden (2.5) ile hesaplanır; sönüm oranı $\zeta = \Lambda/\sqrt{4\pi^2 + \Lambda^2}$ bağıntısından elde edilir.`,
              r`**Kararlı durum ölçütü.** Üç koşul birlikte aranır. Bir salınımdan ötekine tepeden tepeye genlik %1'den az değişmeli ve salınım merkezi, yani son tepe ile son çukurun orta noktası, genliğin %1'inden az kaymalıdır. Ayrıca son değişiklikten (yeniden başlatma, parametre değişikliği, çarpma) bu yana, geçici rejimin en yavaş sönen teriminin %1'ine inmesine yeten $\ln 100/r$ süresi geçmiş olmalıdır; burada $\zeta \le 1$ için $r = \gamma$, $\zeta > 1$ için $r = \gamma - \sqrt{\gamma^2 - \omega_0^2}$ alınır. Birinci koşul tek başına yetmez: yavaş sönen bir geçici rejim genliği salınım başına yalnızca kendi büyüklüğünün $e^{rT} - 1$ katı kadar değiştirir, dolayısıyla gözlenen değişimin birkaç katı büyüklükte olabilir. Salınmayan bir geçici terim, örneğin aşırı sönümlü sistemin yavaş sönen üsteli, tepeden tepeye genliği hiç değiştirmez; yalnızca merkezi kaydırır ve bunu ikinci koşul yakalar. Sönüm yokken bekleme süresi sonsuzdur ve kararlı durum bildirilmez. Faz gecikmesi, yer değiştirmenin son tepesi anındaki sürücü fazıdır.`,
              r`**Basamak yanıtı ölçer.** Durgun bırakılan kütle için aşımı, yani dengenin ötesindeki en uç örneğin başlangıç yer değiştirmesine oranını, ve yerleşme süresini, yani $|x|$ değerinin başlangıç yer değiştirmesinin %2'si içinde kalmaya başladığı anı ölçer. Bu banda giriş anı, bandın dışındaki son örnek ile içindeki ilk örnek arasında doğrusal ara değerlemeyle bulunur; değer, yanıt bu sürenin dörtte biri kadar ve en az 0,25 s bandın içinde kaldıktan sonra gösterilir. Yanında verilen kuramsal değer, eldeki sönüm oranı için (2.3) ve (2.4) kapalı biçimli çözümlerinin yerleşme süresidir ve ikiye bölme yöntemiyle bulunur; $\zeta = 1$ için $5{,}834/\omega_0$ değerine eşittir. Bırakıştan sonra bir parametre değiştirilirse ölçüm sona erer ve bir sonraki bırakışla yeniden başlar.`,
            ],
          },
          {
            kind: "p",
            text: r`Ölçümler sekmesi her büyüklük için kuramsal değeri, ölçülen değeri ve aradaki sapmayı yan yana verir. Deney föylerinin tamamlanma ölçütleri de bu cihazların okumalarına bağlıdır; bir kaydırıcıyı doğru konuma getirmek föyü tamamlamaz, ölçümün yapılması gerekir.`,
          },
        ],
      },
      {
        id: "olcum-spektrum",
        title: "Genlik spektrumu",
        blocks: [
          {
            kind: "p",
            text: r`Kaydedilen işaretin en yeni örnekleri Hann penceresiyle çarpılır ve hızlı Fourier dönüşümüyle çözümlenir [@cooley1965; @harris1978]. Çözümlenen kayıt $N$ örnekten oluşur; $N$, son başlatmadan beri kaydedilen telemetrinin doldurabildiği, ikinin en büyük kuvvetidir: en az 256 (100 Hz'lik telemetriyle 2,56 s), en çok 4096 (41 s). Kayıt hiçbir zaman sıfırlarla uzatılmaz; bu yüzden frekans çözünürlüğü kaydın kendi çözünürlüğüdür, $f_s/N$: 100 Hz'te en kısa kayıt için 0,39 Hz, en uzun kayıt için $100/4096 = 0{,}024$ Hz. Örnekleme frekansı $f_s$ kaydın zaman damgalarından alınır; 100 Hz'tir, yalnızca 60 Hz ve 120 Hz adım frekanslarında adım frekansına eşittir. Pencerenin tutarlı kazancı 0,5 ve eşdeğer gürültü bant genişliği 1,5 kutudur [@heinzel2002]; genlik ekseni tutarlı kazanca göre ölçeklenir, böylece frekansı bir kutuya tam denk gelen bir sinüs kendi genliğiyle okunur. Bir sinüsün frekansı genellikle iki kutunun arasına düşer; tepe frekansı ve genliği o zaman en büyük iki kutudan, Hann penceresi için verilen ara değerleme bağıntısıyla elde edilir [@grandke1983]. Bağıntı sabit genlikli bir çizgi ve aralarında kayıt süresinin tersi kadar fark bulunan kutular varsayar; kaydın sıfırlarla uzatılmamasının nedeni budur. Çizgi sıfır frekansa yakın olduğunda, negatif frekanstaki görüntüsü bağıntıyı bozar: 20 000 tek sinüsle yapılan bir denemede frekans okuması, tepe sıfır frekansın üstündeki ikinci kutudayken en kötü durumda %8, dördüncü kutudan başlayarak ise en çok %0,05 hata vermiştir. Grafik bu yüzden baskın tepeyi yalnızca spektrumun en güçlü kutusu $4 f_s/N$ frekansında ya da daha yukarıdaysa bildirir. Doğrulama deneyinde, 4096 örnekle ve çizgi 51. kutunun yakınındayken, 1,2345 Hz frekanslı bir sinüsün frekansı $5 \times 10^{-9}$ Hz, genliği bağıl olarak $10^{-8}$ hatayla geri elde edilir.`,
          },
          {
            kind: "p",
            text: r`Spektrum, zaman grafiğinde seçilemeyen ayrımı gösterir: düzenli bir hareketin spektrumu birkaç keskin çizgiden (normal mod frekansları ve bunların birleşimleri) oluşur, kaotik bir hareketinki ise geniş bantlıdır. Grafikte kuramsal frekanslar işaretlenir.`,
          },
        ],
      },
      {
        id: "olcum-grafikler",
        title: "Grafikler ve renkler",
        blocks: [
          {
            kind: "p",
            text: r`Zaman grafiği, faz portresi, enerji defteri, yanıt eğrisi, spektrum, ayrılma grafiği ve Poincaré kesiti aynı telemetriyi farklı sorulara yanıt verecek biçimde gösterir. Ayrılma grafiğinin düşey ekseni logaritmiktir; üstel büyüme orada eğimi $\lambda$ olan bir doğrudur. Her fiziksel büyüklük bütün görünümlerde aynı rengi taşır: sahnedeki vektör, grafikteki eğri, göstergedeki sayı. Renkler, renk görme farklılıklarında da ayırt edilebilen Okabe–Ito paletinden seçilmiştir [@okabe2008; @wong2011]; hiçbir nicelik yalnızca rengiyle tanıtılmaz.`,
          },
        ],
      },
      {
        id: "olcum-veri",
        title: "Veri dışa aktarma",
        blocks: [
          {
            kind: "p",
            text: r`Telemetri CSV dosyası olarak indirilebilir. Sütun adları birimi taşır (örneğin $t$ için “t_s”, açı için “theta1_rad”); başlık satırları parametreleri, başlangıç koşullarını, yöntemi, adımı ve örnekleme aralığını kaydeder. Çözücü değişikliği yeni bir deney başlattığından, bir dosyadaki her satır başlıkta adı geçen yöntemle ve adımla hesaplanmıştır. Parametreler ise dışa aktarma anındaki değerleriyle yazılır: deney sürerken değiştirilen bir parametre ayrı bir olay olarak kaydedilmez ve değişiklikten önceki satırlar önceki değere aittir. Başlık satırları “#” ile başlar, alan ayırıcısını ve tırnak işaretini içermez; dosyayı CSV biçiminin kurallarına göre okuyan bir program bu yüzden her birini tek bir alan olarak alır ve altlarındaki çizelge bozulmaz. İki yazım sunulur: ondalık noktalı ve virgülle ayrılmış biçim (Python, MATLAB, R) ile ondalık virgüllü ve noktalı virgülle ayrılmış biçim (Türkçe ayarlı hesap tabloları). Deney tanımı ayrıca JSON dosyası ya da bağlantı olarak paylaşılabilir; veriler hiçbir sunucuya gönderilmez.`,
          },
        ],
      },
      {
        id: "olcum-ses",
        title: "Sonifikasyon",
        blocks: [
          {
            kind: "p",
            text: r`Düzeneklerin mekanik frekansları duyma eşiğinin çok altındadır; duyulan ses bir kayıt değil, büyüklüklerin bilinçli olarak sese eşlenmesidir [@hermann2011]. Osilatörde bir sinüs tonunun perdesi yer değiştirmeyi (3,5 m başına bir oktav), şiddeti hızı izler; durdurucuya çarpma, çarpma hızıyla ölçeklenen kısa bir tık sesi verir. Sarkaçta birinci çubuğun düşeyden her geçişi bir tıklamadır: tek sarkaç saat gibi düzenli, kaotik zincir düzensiz tıklar. Ses, kullanıcı açmadıkça çalmaz.`,
          },
        ],
      },
    ],
  },
];
