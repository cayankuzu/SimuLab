import type { TaskId } from "@/sim/tasks";

/** Bir deney föyünün metni. Ölçütlerin sayısı ve sırası src/sim/tasks.ts ile aynı olmalıdır. */
export interface TaskText {
  title: string;
  /** Föy listesinde görünen tek satırlık özet. */
  summary: string;
  goal: string;
  /** Tahmin sorusu ve seçenekleri; doğru seçeneğin sırası src/content/tasks.ts içindedir. */
  question: string;
  options: string[];
  /** Formülün altındaki kısa açıklama. */
  note: string;
  criteria: string[];
  /** Föy tamamlanınca gösterilen açıklama; [@anahtar] atıfları içerebilir. */
  explain: string;
}

const items: Record<TaskId, TaskText> = {
  periodDesign: {
    title: "Periyodu tasarla: T = 2 s",
    summary: "Kütleyi ve yay sabitini seçerek ölçülen periyodu 2 s yap.",
    goal: "Sönümsüz ve sürücüsüz osilatörün **ölçülen** periyodunu 2,00 s yap. Kütleyi ve yay sabitini değiştirebilirsin. Sonuç kaydırıcıların konumundan değil, periyot ölçerin verdiği değerden okunur; ölçer her parametre değişikliğinde sıfırlanır ve yeniden altı tam periyot sayar.",
    question: "Yay aynı kalırken kütle dört katına çıkarılırsa periyot nasıl değişir?",
    options: ["Değişmez", "İki katına çıkar", "Dört katına çıkar", "Yarıya iner"],
    note: "$T_0 = 2\\ \\mathrm{s}$ için $k/m = \\pi^2 \\approx 9{,}87\\ \\mathrm{s^{-2}}$ gerekir. Doğrusal yayda periyot genliğe bağlı değildir.",
    criteria: [
      "Sönüm ve sürücü kapalı (c = 0, F₀ = 0)",
      "Son değişiklikten sonra en az 6 tam periyot ölçüldü",
      "Ölçülen periyot 2,00 s ± 0,02 s",
    ],
    explain:
      "Geri çağırıcı kuvvet yer değiştirmeyle, eylemsizlik kütleyle orantılıdır; bu yüzden periyot yalnızca $m/k$ oranına bağlıdır ve $\\sqrt{m}$ ile büyür: kütle dört katına çıkınca periyot iki katına çıkar. Genliği değiştirip ölçümü yinele: doğrusal yayda periyot değişmez. Ölçümler sekmesi, kuramsal $T_0$ ile ölçülen periyodu ve aralarındaki sapmayı yan yana verir [@french1971; @taylor2005].",
  },

  criticalDamping: {
    title: "Kritik sönümü bul",
    summary: "Dengeyi aşmadan en çabuk yerleşen sönüm katsayısını bul.",
    goal: "$m = 4\\ \\mathrm{kg}$, $k = 36\\ \\mathrm{N/m}$ olan düzenek $x_0 = 3\\ \\mathrm{m}$ konumundan durgun bırakılıyor. Sönüm katsayısını öyle seç ki kütle dengeyi **aşmadan** ve olabildiğince **çabuk** yerleşsin. Sönümü her değiştirdiğinde deneyi yeniden başlat (üst çubuktaki “Başlangıç koşullarına dön” düğmesi ya da R tuşu): aşım ve yerleşme süresi bırakma anından başlayarak ölçülür ve bir parametre değiştiğinde ölçüm silinir.",
    question: "Sönüm katsayısı büyüdükçe kütle dengeye hep daha çabuk mu yerleşir?",
    options: [
      "Evet; sönüm ne kadar büyükse o kadar çabuk yerleşir",
      "Hayır; aşımsız en hızlı dönüş tek bir değerde olur, daha büyük sönüm dönüşü yavaşlatır",
      "Sönüm yalnızca genliği etkiler, yerleşme süresini etkilemez",
    ],
    note: "$\\zeta < 1$ ise kütle dengeyi aşar; $\\zeta > 1$ ise aşmaz ama yavaş döner. $\\zeta = 1$ için %2 yerleşme süresi $5{,}834/\\omega_0$ değerindedir; bu düzenekte ($\\omega_0 = 3\\ \\mathrm{rad/s}$) 1,945 s.",
    criteria: [
      "Sürücü kapalı; kütle |x₀| ≥ 1,5 m konumundan durgun bırakıldı ve bırakıştan sonra parametre değiştirilmedi",
      "Kütle yerleşti ve aşım |x₀| değerinin %0,5'ini geçmedi",
      "%2 yerleşme süresi, kritik sönümdeki değerin (5,834/ω₀) en çok 1,1 katı",
    ],
    explain:
      "Kritik sönüm $c_\\mathrm{kr} = 2\\sqrt{km} = 24\\ \\mathrm{N\\,s/m}$ değerindedir. Daha küçük sönümde kütle dengeyi aşar ve salınır; daha büyük sönümde aşmaz, ama yavaş sönen üstel terim baskın olduğundan dönüş uzar [@rao2017]. Aşıma izin verilirse yerleşme daha da kısalır: aşım tam %2 olduğunda, yani $e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}} = 0{,}02$ koşulunu sağlayan $\\zeta \\approx 0{,}78$ değerinde, kütle %2'lik banda ilk girişinde orada kalır. Bu yüzden “en iyi” sönüm amaca bağlıdır. Otomobil süspansiyonları kritik sönümlü değildir: binek araçlarda sönüm oranı tipik olarak 0,2–0,4 arasındadır [@gillespie1992; @dixon2007].",
  },

  resonancePeak: {
    title: "Rezonans tepesini bul",
    summary: "Sürücü frekansını tarayarak kararlı genliğin en büyük olduğu frekansı bul.",
    goal: "$m = 2\\ \\mathrm{kg}$, $k = 24{,}5\\ \\mathrm{N/m}$, $c = 3{,}5\\ \\mathrm{N\\,s/m}$ olan osilatör $F_0 = 4\\ \\mathrm{N}$ genlikli harmonik bir kuvvetle sürülüyor. Sürücü frekansını değiştirerek **kararlı durum genliğinin** en büyük olduğu frekansı bul. Frekansı her değiştirdiğinde geçici rejimin sönmesini bekle (bu düzenekte en az 5,3 s): genlik ölçütü yalnızca kararlı durumda değerlendirilir. Frekans sekmesindeki yanıt eğrisi, ölçtüğün noktaları kuramsal eğrinin üzerine işaretler.",
    question: "Genlik en büyük değerine hangi sürücü frekansında ulaşır?",
    options: ["Tam doğal frekansta (ω = ω₀)", "ω₀ değerinin biraz altında", "ω₀ değerinin biraz üstünde"],
    note: "Bu düzenekte $\\omega_0 = 3{,}5\\ \\mathrm{rad/s}$ ve $\\zeta = 0{,}25$. Genlik tepesi yalnızca $\\zeta < 1/\\sqrt{2}$ için vardır.",
    criteria: [
      "Kararlı durum: son değişiklikten sonra geçici rejimin %1'e inmesine yetecek süre geçti (bu düzenekte ln 100/γ ≈ 5,3 s); bir salınımdan ötekine tepeden tepeye genlik %1'den az değişti ve salınım merkezi genliğin %1'inden az kaydı",
      "Kararlı durumda ölçülen genlik, kuramsal tepe genliğinin en az %98'i",
      "Kütle durduruculara çarpmadı",
    ],
    explain:
      "Genlik tepesi $\\omega_r = \\omega_0\\sqrt{1-2\\zeta^2} \\approx 3{,}27\\ \\mathrm{rad/s}$ değerindedir, yani doğal frekansın yaklaşık %6,5 altındadır; tepe genliği $(F_0/k)/(2\\zeta\\sqrt{1-\\zeta^2}) \\approx 0{,}337\\ \\mathrm{m}$ olur. Düzenek tam $\\omega_0$ değerinde sürüldüğünde genlik bunun %96,8'inde kalır; föyün %98 ölçütü bu yüzden doğal frekansta sağlanmaz. Hız genliği ve sürücüden soğurulan ortalama güç ise tam $\\omega_0$ değerinde en büyüktür; güç eğrisinin yarı yükseklikteki tam genişliği $c/m$ kadardır. Zayıf sönümde iki tepe pratikte çakışır: “rezonans $\\omega_0$ değerindedir” cümlesi güç için tam, genlik için yaklaşık olarak doğrudur [@french1971; @taylor2005]. Tacoma Narrows köprüsünün 1940'taki yıkılışı sık sık bu tür zorlanmış rezonansa örnek gösterilir; gerçekte olay, yapının kendi hareketinden beslenen aeroelastik burulma çırpınmasıdır [@billah1991].",
  },

  integratorError: {
    title: "Sayısal yöntemin hatasını ölç",
    summary: "Açık Euler yönteminin enerji defterini nasıl bozduğunu gör, sonra hatayı kapat.",
    goal: "Sönümsüz ve sürücüsüz osilatörde mekanik enerji korunur; enerji defterinin kalıntısı $\\Delta E$ bu yüzden doğrudan sayısal hatayı gösterir. Düzenek açık Euler yöntemiyle (300 Hz) kurulur. Önce bağıl kalıntının %5'e ulaşmasını izle. Sonra üst çubuktaki sayısal çözücü düğmesinden RK4 ya da Dormand–Prince yöntemini seç; yöntem değiştiğinde deney kendiliğinden baştan başlar. Bağıl kalıntının, bu yöntemle çözülen 20 s boyunca $10^{-6}$ değerini aşmadığını göster.",
    question: "Açık Euler yöntemiyle çözülen sönümsüz osilatörün hesaplanan toplam enerjisi zamanla ne yapar?",
    options: ["Sabit kalır", "Yavaşça azalır", "Her adımda büyür"],
    note: "$h$ adım büyüklüğü, $\\omega_0$ doğal açısal frekanstır. Çarpan Euler yönteminde 1'den büyük, RK4 yönteminde 1'den çok az küçüktür.",
    criteria: [
      "Sönümsüz ve sürücüsüz osilatörde açık Euler ile bağıl enerji kalıntısı %5'e ulaştı",
      "Ardından RK4 ya da Dormand–Prince ile kesintisiz 20 s çözüldü ve bu sürede bağıl kalıntı 10⁻⁶ değerini aşmadı",
    ],
    explain:
      "Açık Euler adımı sönümsüz osilatörün enerjisini her adımda tam olarak $1 + h^2\\omega_0^2$ ile çarpar: adım ne kadar küçük seçilirse seçilsin enerji üstel büyür ve faz yörüngesi dışa doğru sarmal çizer. Klasik RK4 yönteminde çarpan $1 - (h\\omega_0)^6/72 + \\dots$ biçimindedir; $h = 1\\ \\mathrm{ms}$ ve $\\omega_0 \\approx 3{,}5\\ \\mathrm{rad/s}$ için adım başına bağıl kayıp $10^{-17}$ mertebesindedir, yani çift duyarlıklı sayıların yuvarlama hatasının altındadır [@hairer2006]. Açık Runge–Kutta yöntemlerinin hiçbiri simplektik değildir [@sanzserna1988]; çok uzun süreli hesaplarda enerji davranışı önemliyse simplektik yöntemler yeğlenir [@hairer2003]. Bu laboratuvar enerji defterini her çalıştırmada gösterir: sayısal hata gizlenmez, ölçülür.",
  },

  secondsPendulum: {
    title: "Saniye sarkacı",
    summary: "Periyodu 2 s olan sarkacın boyunu ölçerek bul.",
    goal: "Standart yerçekiminde ($g = 9{,}80665\\ \\mathrm{m/s^2}$; Parametreler sekmesinde “Dünya”) tek sarkacın boyunu, küçük genlikte **ölçülen** periyot 2,000 s olacak biçimde ayarla. Boyu her değiştirdiğinde periyot ölçer sıfırlanır ve yeniden altı tam periyot sayar. Böyle bir sarkacın bir uçtan öbür uca her geçişi 1 s sürer; adı buradan gelir.",
    question: "Periyodu 2 s olan sarkacın boyu yaklaşık ne kadardır?",
    options: ["0,25 m", "0,5 m", "1 m", "2 m"],
    note: "Formül küçük açılar içindir; 5° genlikte periyot bundan yalnızca %0,05 uzundur.",
    criteria: [
      "Tek sarkaç, mafsal sönümü yok, g = 9,80665 m/s² (±0,0005 m/s²)",
      "Genlik en çok 6°",
      "Son değişiklikten sonra en az 6 tam periyot ölçüldü",
      "Ölçülen periyot 2,000 s ± 0,003 s",
    ],
    explain:
      "$L = g/\\pi^2 = 0{,}9936\\ \\mathrm{m}$ bulunur: saniye sarkacı neredeyse tam bir metre uzunluğundadır. Bu bir rastlantı değildir. Fransa'da 1790'da uzunluk birimi olarak 45° enlemindeki saniye sarkacının boyu önerilmiş; Borda, Lagrange, Laplace, Monge ve Condorcet'den oluşan Akademi komisyonu ise 19 Mart 1791 tarihli raporunda çeyrek meridyenin on milyonda birini yeğlemiştir [@borda1791]. Sarkacın periyodu kütleye bağlı değildir ve $\\sqrt{g}$ ile ters orantılıdır; aynı sarkaç Ay'da ($g = 1{,}62\\ \\mathrm{m/s^2}$) yaklaşık 2,46 kat yavaş salınır. Buradaki $g$ değeri, 1901'de kabul edilen standart yerçekimi ivmesidir [@cgpm1901].",
  },

  anharmonic: {
    title: "Büyük genlikte periyot",
    summary: "Eşzamanlılığın büyük açılarda bozulduğunu ölç, eliptik integralle karşılaştır.",
    goal: "Tek sarkacı 90° ya da daha büyük bir açıdan durgun bırak (kütleyi sürükleyebilir ya da başlangıç açısını yazabilirsin). Periyodu ölç ve iki kuramsal değerle karşılaştır: küçük açı formülünün verdiği $T_0$ ve eliptik integralle verilen tam periyot.",
    question: "Genlik 5°'den 120°'ye çıkarılırsa periyot nasıl değişir?",
    options: ["Değişmez; sarkacın periyodu genlikten bağımsızdır", "Kısalır", "Uzar"],
    note: "$K$ birinci tür tam eliptik integraldir. $\\theta_0 = 90^\\circ$ için $T/T_0 = 1{,}1803$.",
    criteria: [
      "Tek sarkaç, mafsal sönümü yok, g > 0; genlik en az 90° (salınım, tam dönme değil)",
      "En az 4 tam periyot ölçüldü",
      "Ölçülen periyot tam çözümle binde bir içinde uyuşuyor ve T₀ değerinin en az 1,15 katı",
    ],
    explain:
      "Geri çağırıcı tork $\\sin\\theta$ ile orantılıdır ve büyük açılarda $\\theta$ değerinden daha yavaş büyür; sarkaç “yumuşar” ve periyot uzar: 90° genlikte %18, 120° genlikte %37, 150° genlikte %76. Galileo'nun eşzamanlılık gözlemi yalnızca küçük açılar için yaklaşık olarak doğrudur. Huygens tam eşzamanlı eğrinin çember değil sikloit olduğunu 1659'da bulmuş ve 1673'te yayımlamıştır [@huygens1673]. Çembersel sarkacın tam periyodu kapalı biçimde eliptik integralle verilir ve aritmetik–geometrik ortalamayla birkaç adımda hesaplanır [@belendez2007; @carvalhaes2008].",
  },

  butterfly: {
    title: "Kelebek etkisini ölç",
    summary: "Binde bir radyanlık farkın 1 rad olması ne kadar sürer?",
    goal: "Çift sarkaç, birinci açısı $\\delta_0 = 0{,}001\\ \\mathrm{rad}$ (yaklaşık 0,06°) farklı bir ikiziyle birlikte bırakılır. İki sarkaç arasındaki açısal ayrılığın 1 rad değerine ulaştığı anı ölç. Kaos sekmesindeki ayrılma grafiği logaritmik eksendedir; üstel büyüme orada düz bir doğru olarak görünür.",
    question: "İki sarkaç arasındaki fark 1 rad değerine ne zaman ulaşır?",
    options: [
      "Hiç ulaşmaz; fark hep küçük kalır",
      "Fark zamanla doğru orantılı büyür; ulaşması dakikalar sürer",
      "Fark üstel büyür; saniyeler ya da birkaç on saniye içinde ulaşır",
    ],
    note: "$\\lambda$ en büyük Lyapunov üsteli, $a$ kabul edilen hata payıdır (burada 1 rad).",
    criteria: ["En az iki bağlantı; ikiz açık ve δ₀ ≤ 0,001 rad", "Açısal ayrılık 1 rad değerine ulaştı"],
    explain:
      "Ayrılık ortalamada üstel büyür; büyüme hızı en büyük Lyapunov üsteli $\\lambda$ ile verilir. Başlangıç farkını bin kat küçültmek ($\\delta_0 = 10^{-6}\\ \\mathrm{rad}$) öngörü süresini bin kat değil, yalnızca $\\ln 1000/\\lambda \\approx 6{,}9/\\lambda$ kadar uzatır: ölçüm duyarlılığındaki her iyileşme öngörü ufkuna sabit bir süre ekler [@strogatz2015]. İkizin başlangıç farkını değiştirip deneyi yinele ve bunu ölç. Hareket yine de bütünüyle deterministiktir: aynı başlangıç koşulları aynı yörüngeyi verir. Öngörülemezlik rastgelelikten değil, başlangıç koşullarının sonsuz duyarlıkla bilinememesinden doğar. Gerçek bir çift sarkaçta ölçülen ayrılma hızı $7{,}5 \\pm 1{,}5\\ \\mathrm{s^{-1}}$ değerindedir [@shinbrot1992]; bu değer düzeneğin boyutlarına ve enerjisine bağlıdır, buradaki modelin değeriyle doğrudan karşılaştırılamaz.",
  },

  regularIsland: {
    title: "Düzenli ada",
    summary: "Aynı çift sarkacın küçük enerjide kaotik olmadığını göster.",
    goal: "Çift sarkaç her koşulda kaotik değildir. İkiz açıkken ($\\delta_0 = 0{,}001\\ \\mathrm{rad}$) başlangıç açılarını öyle seç ki iki sarkaç arasındaki ayrılık en az 60 s boyunca 0,05 rad değerine ulaşmasın ve Lyapunov üsteli kestirimi, en az 30 s üzerinden ortalanmış olarak, $0{,}1\\ \\mathrm{s^{-1}}$ değerinin altında kalsın. Süre, ikizin son bırakıldığı andan sayılır; ikizi kapatıp açmak sayımı yeniden başlatır.",
    question: "Çift sarkaç çok küçük açılardan bırakılırsa ikizinden yine hızla ayrılır mı?",
    options: [
      "Evet; çift sarkaç her koşulda kaotiktir",
      "Hayır; küçük enerjide hareket düzenlidir ve fark küçük kalır",
      "Yalnızca sürtünme varsa ayrılmaz",
    ],
    note: "Düzenli (yarı periyodik) harekette ayrılık en çok zamanla doğru orantılı büyür ve $\\lambda$ sıfıra yaklaşır; sonlu süreli kestirim yaklaşık $\\ln t/t$ gibi azalır.",
    criteria: [
      "Çift sarkaç, ikiz açık, mafsal sönümü yok ve sarkaç salınıyor (mekanik enerji 0,05 J'den büyük)",
      "İkiz en az 60 s kesintisiz izlendi",
      "En az 60 s izlenen koşu boyunca ayrılık hep 0,05 rad değerinin altında kaldı",
      "60 s dolduktan sonra Lyapunov üsteli kestirimi, en az 30 s üzerinden ortalanmış olarak, 0,1 s⁻¹ değerinin altında",
    ],
    explain:
      "Küçük açılarda hareket denklemleri doğrusallaşır ve hareket iki normal modun toplamı olur: yarı periyodik ve öngörülebilirdir. Enerji arttıkça faz uzayındaki düzenli bölgeler küçülür, kaotik bölgeler büyür [@stachowiak2006]; çok yüksek enerjide ise yerçekimi dönme enerjisinin yanında önemsiz kalır ve hareket yeniden düzenlileşir [@rafat2009]. Bu yüzden “çift sarkaç kaotiktir” cümlesi eksiktir: kaos sistemin değil, belirli bir enerji aralığındaki yörüngelerinin özelliğidir. Kaos sekmesindeki Poincaré kesitinde düzenli yörüngeler kapalı eğriler, kaotik yörüngeler bir alanı dolduran nokta bulutu olarak görünür.",
  },

  normalMode: {
    title: "Normal modu yakala",
    summary: "Çift sarkacı tek frekansla salınacak biçimde bırak.",
    goal: "Çift sarkacın küçük salınımları genellikle iki frekansın karışımıdır. Başlangıç açılarını öyle seç ki hareket **tek frekanslı** olsun: $\\theta_1$ genliği 0,5° ile 5° arasında kalsın, $\\theta_1$ için ölçülen periyot salınımdan salınıma değişmesin ve iki kuramsal mod periyodundan birine eşit çıksın. Mod biçimleri, yani açıların oranları, Ölçümler sekmesindeki çizelgede verilir.",
    question: "Çift sarkacın küçük salınımlarında, bütün parçaların aynı frekansla salındığı kaç farklı hareket biçimi vardır?",
    options: ["Bir", "İki", "Sonsuz sayıda"],
    note: "$\\mathbf{M}$ kütle matrisi, $\\mathbf{K} = g\\,\\mathrm{diag}(\\mu_i L_i)$ katılık matrisidir; $\\mu_i$, $i$. mafsaldan aşağıdaki toplam kütledir. Özvektör $\\mathbf{a}$ açıların oranını verir.",
    criteria: [
      "Çift sarkaç, mafsal sönümü yok, g > 0; θ₁ genliği 0,5° ile 5° arasında",
      "En az 12 tam periyot ölçüldü",
      "Periyodun bağıl yayılımı en çok %0,3 (tek frekans)",
      "Ölçülen periyot T₁ ya da T₂ ile %2,5 içinde uyuşuyor",
    ],
    explain:
      "$N$ serbestlik dereceli doğrusal bir sistemin tam $N$ normal modu vardır; çift sarkaçta iki tane. Birincide iki çubuk aynı yöne, ikincide zıt yönlere sapar ve ikincinin frekansı daha yüksektir. Sarkaç bir özvektörün oranlarıyla bırakılırsa yalnızca o mod uyarılır ve her açı tek bir kosinüs gibi salınır; başka her başlangıç koşulu iki modun toplamıdır ve genlikler vuru yapar. Eşit kütleli ve eşit boylu çift sarkaçta $\\omega^2 = (2 \\mp \\sqrt{2})\\,g/L$ ve $\\theta_2/\\theta_1 = \\pm\\sqrt{2}$ bulunur [@taylor2005]; üstteki işaretler aynı yönlü, yavaş moda, alttakiler zıt yönlü, hızlı moda aittir. Bu föyün düzeneğinde kütleler ve boylar eşit olmadığından oranlar $\\theta_2/\\theta_1 \\approx +1{,}39$ ve $-1{,}82$ değerindedir. Eşit kütleli ve eşit boylu $N$ bağlantılı zincirde $\\omega_k^2 = (g/\\ell)\\,x_k$ olur; $x_k$, $N$. Laguerre çokterimlisinin sıfırlarıdır [@muller2007; @braun2003].",
  },
};

/** Föyler paneli. */
export const tasks = {
  title: "Deney föyleri",
  intro:
    "Her föy önce bir tahmin ister, ölçümle tamamlanır ve bir açıklamayla biter. Tamamlanma, kaydırıcıların konumundan değil sanal cihazların ölçtüğü değerlerden belirlenir.",
  progress: (done: number, total: number) => `${done} / ${total} tamamlandı`,
  groups: { oscillator: "Yay–kütle osilatörü", pendulum: "Sarkaç zinciri" },
  status: { completed: "tamamlandı", active: "sürüyor" },
  actions: {
    back: "Tüm föyler",
    start: "Düzeneği kur ve başla",
    restart: "Düzeneği yeniden kur",
    stop: "Föyü bırak",
    reveal: "Açıklamayı göster",
    next: "Sıradaki föy",
    goToExperiment: "Deneye dön",
  },
  headings: {
    goal: "Amaç",
    predict: "Tahmin et",
    observe: "Gözle ve ölç",
    explain: "Açıkla",
    criteria: "Tamamlanma ölçütleri",
    readouts: "Cihaz okumaları",
    theory: "İlgili bağıntı",
    references: "Kaynaklar",
  },
  steps: { predict: "1", observe: "2", explain: "3" },
  predict: {
    hint: "Düzeneği kurmadan önce bir yanıt seç. Föy bitince tahminin gözleminle karşılaştırılır.",
    correct: "Tahminin gözlemle uyuştu.",
    wrong: "Tahminin gözlemle uyuşmadı. Açıklamayı okurken neden farklı çıktığını düşün; föyün en öğretici yeri burasıdır.",
    skipped: "Bu föyde tahmin seçmedin.",
    answer: (text: string) => `Kuramla ve ölçümle uyuşan yanıt: ${text}`,
    agrees: "kuramla ve ölçümle uyuşan yanıt",
  },
  observe: {
    idle: "Düzenek kurulduğunda ölçütler cihaz okumalarından sürekli değerlendirilir. Parametreler sekmesine geçmen değerlendirmeyi durdurmaz.",
    otherActive: (title: string) => `Şu anda başka bir föy sürüyor: ${title}. Bu föyü başlatırsan o föy bırakılır.`,
    wrongModule: (experiment: string) => `Bu föy “${experiment}” düzeneğinde yürütülür; şu anda öbür düzenek görüntüleniyor.`,
    met: "sağlandı",
    unmet: "henüz sağlanmadı",
    summary: (met: number, total: number) => `${met} / ${total} ölçüt sağlandı`,
  },
  explain: {
    locked: "Açıklama föy tamamlanınca açılır. Önce kendi açıklamanı düşün.",
  },
  done: {
    announce: (title: string) => `Föy tamamlandı: ${title}`,
  },
  readouts: {
    measuredPeriod: "Ölçülen periyot",
    theoryPeriod: "Kuramsal periyot T₀",
    target: "Hedef",
    zeta: "Sönüm oranı ζ",
    overshoot: "Aşım",
    settling: "%2 yerleşme süresi",
    bestSettling: "Kritik sönümde yerleşme süresi",
    amplitude: "Genlik",
    peakAmplitude: "Kuramsal tepe genliği",
    driveFrequency: "Sürücü açısal frekansı",
    residual: "Bağıl enerji kalıntısı",
    elapsed: "Ölçüt için sayılan süre",
    length: "Çubuk boyu",
    exactPeriod: "Tam periyot (eliptik integral)",
    smallAnglePeriod: "Küçük açı periyodu T₀",
    separation: "İkizden açısal ayrılık",
    divergenceTime: "İkizin bırakılışından 1 rad'a ulaşmaya kadar geçen süre",
    lyapunov: "Lyapunov üsteli (kestirim)",
    horizon: "Öngörü ufku (kestirim)",
    maxSeparation: "En büyük ayrılık",
    spread: "Periyodun bağıl yayılımı",
    mode1Period: "1. mod periyodu T₁",
    mode2Period: "2. mod periyodu T₂",
  } as Record<string, string>,
  items,
};
