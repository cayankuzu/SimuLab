import type { ValidationCaseId } from "@/physics/validation";

/** Bir doğrulama deneyinin metni. `rows`, deneyin döndürdüğü satırlarla aynı sayıda ve sırada olmalıdır. */
export interface ValidationCaseText {
  title: string;
  /** Satır içi matematik ($...$) ve atıf ([@anahtar]) içerebilir. */
  description: string;
  rows: string[];
}

const cases: Record<ValidationCaseId, ValidationCaseText> = {
  convergence: {
    title: "Gözlenen yakınsama mertebesi",
    description:
      "Kapalı biçimli çözümü bilinen sürülen, sönümlü osilatör ($m = 1$ kg, $k = 4\\pi^2$ N/m, $c = 0{,}4$ N·s/m, $F_0 = 3$ N, $\\omega = 4$ rad/s) $t = 2$ s anına kadar iki farklı adım büyüklüğüyle çözülür. İki hatadan hesaplanan gözlenen mertebe $p = \\ln(e_1/e_2)/\\ln(h_1/h_2)$, yöntemin kuramsal mertebesiyle karşılaştırılır [@roache1998; @oberkampf2010].",
    rows: ["Açık Euler", "Simplektik Euler", "Orta nokta (RK2)", "Klasik Runge–Kutta (RK4)", "Dormand–Prince 5"],
  },
  freeResponse: {
    title: "Serbest yanıt ve kapalı biçimli çözüm",
    description:
      "$m = 2$ kg ve $k = 24$ N/m olan osilatör $x_0 = 2$ m konumundan durgun bırakılır ve RK4 yöntemiyle, $h = 1$ ms adımla 20 s boyunca çözülür. Çizelge, dört sönüm rejiminde sayısal konumun analitik çözümden en büyük sapmasını verir.",
    rows: ["$\\zeta = 0$ (sönümsüz)", "$\\zeta = 0{,}1$ (zayıf sönüm)", "$\\zeta = 1$ (kritik sönüm)", "$\\zeta = 2{,}5$ (aşırı sönüm)"],
  },
  steadyState: {
    title: "Sürülen kararlı durum: genlik ve faz gecikmesi",
    description:
      "$m = 2$ kg, $k = 24{,}5$ N/m, $c = 0{,}55$ N·s/m, $F_0 = 1$ N. Osilatör beş frekansta, geçici rejim $e^{-16}$ çarpanıyla sönene kadar sürülür; genlik ve faz gecikmesi uygulamadaki sanal cihazlarla ölçülür ve kuramsal $A(\\omega)$, $\\delta(\\omega)$ değerleriyle karşılaştırılır.",
    rows: [
      "$A(0{,}5\\,\\omega_0)$",
      "$\\delta(0{,}5\\,\\omega_0)$",
      "$A(0{,}9\\,\\omega_0)$",
      "$\\delta(0{,}9\\,\\omega_0)$",
      "$A(\\omega_0)$",
      "$\\delta(\\omega_0)$",
      "$A(1{,}1\\,\\omega_0)$",
      "$\\delta(1{,}1\\,\\omega_0)$",
      "$A(1{,}5\\,\\omega_0)$",
      "$\\delta(1{,}5\\,\\omega_0)$",
    ],
  },
  criticalDamping: {
    title: "Basamak yanıtı: aşım ve yerleşme süresi",
    description:
      "$m = 4$ kg, $k = 36$ N/m, $x_0 = 2$ m. Kritik sönümde aşım olmamalı ve %2 yerleşme süresi $5{,}834/\\omega_0$ değerine eşit olmalıdır; $\\zeta = 0{,}5$ için aşım $e^{-\\pi\\zeta/\\sqrt{1-\\zeta^2}}$ değerini vermelidir. Yerleşme süresi 1 ms çözünürlükle ölçülür.",
    rows: ["Aşım, $\\zeta = 1$", "%2 yerleşme süresi, $\\zeta = 1$", "Aşım, $\\zeta = 0{,}5$"],
  },
  impact: {
    title: "Durdurucuya çarpma: an, hız ve enerji kaybı",
    description:
      "Sönümsüz osilatör ($m = 2$ kg, $k = 24$ N/m) $x_0 = 6$ m konumundan bırakılır ve $x_\\mathrm{min} = -4{,}75$ m konumundaki durdurucuya çarpar. Çarpma anı $\\arccos(x_\\mathrm{min}/x_0)/\\omega_0$, çarpma hızı $\\omega_0\\sqrt{x_0^2 - x_\\mathrm{min}^2}$ ve yitirilen enerji $\\tfrac12 m v^2(1-e^2)$ kapalı biçimde bilinir. Çarpma anı adımın içinde ikiye bölme yöntemiyle bulunur.",
    rows: ["Çarpma anı", "Çarpma hızı", "Çarpmada yitirilen enerji", "Çarpmadan sonraki mekanik enerji"],
  },
  energyLedger: {
    title: "Enerji defterinin kapanması",
    description:
      "Sönüm, sürücü ve durdurucular birlikte etkindir ($c = 0{,}55$ N·s/m, $F_0 = 12$ N, $\\omega = 3{,}5$ rad/s; 60 s içinde 27 çarpma). $E_k + E_p + Q_c + Q_e - W$ toplamının başlangıç enerjisinden en büyük bağıl sapması ölçülür.",
    rows: ["RK4, 1000 Hz", "RK4, 300 Hz"],
  },
  pendulumPeriod: {
    title: "Sonlu genlikli sarkacın periyodu",
    description:
      "$L = 1$ m boyundaki tek sarkacın ölçülen periyodu, $T = 4\\sqrt{L/g}\\,K(\\sin(\\theta_0/2))$ eliptik integral çözümüyle karşılaştırılır [@belendez2007; @dlmf]. Son satır, tepeden aşarak sürekli dönen sarkaçtır: $T = (2/\\kappa)\\sqrt{L/g}\\,K(1/\\kappa)$.",
    rows: [
      "$\\theta_0 = 10^\\circ$",
      "$\\theta_0 = 45^\\circ$",
      "$\\theta_0 = 90^\\circ$",
      "$\\theta_0 = 135^\\circ$",
      "$\\theta_0 = 170^\\circ$",
      "Dönme, $\\kappa = 1{,}2$",
    ],
  },
  energyDrift: {
    title: "Sürtünmesiz zincirde enerji sapması",
    description:
      "Varsayılan kütle ve boylarla kurulan zincir büyük açılardan bırakılır ve 60 s izlenir; çizelge enerji defterinin en büyük bağıl sapmasını verir. Açık Euler satırı yöntemin yetersizliğini göstermek için vardır ve bir alt sınır ölçütüdür. Son iki satır izin verilen parametre aralığının en zor köşesidir (üç ağır ve uzun bağlantı, üç hafif ve kısa bağlantıyı sürükler): sabit adımlı yöntemin hatası burada gözle görülür, hata denetimli yöntemin hatası görülmez.",
    rows: [
      "$N = 1$, RK4, 1000 Hz",
      "$N = 2$, RK4, 1000 Hz",
      "$N = 3$, RK4, 1000 Hz",
      "$N = 6$, RK4, 1000 Hz",
      "$N = 2$, RK4, 300 Hz",
      "$N = 2$, Dormand–Prince 5",
      "$N = 2$, viskoz mafsal sürtünmesi ($b = 0{,}3$)",
      "$N = 2$, açık Euler, 1000 Hz (alt sınır)",
      "$N = 6$, uç kütle oranı, RK4, 1000 Hz",
      "$N = 6$, uç kütle oranı, Dormand–Prince 5",
    ],
  },
  normalModes: {
    title: "Küçük salınım spektrumu",
    description:
      "Eşit kütleli ve eşit boylu zincirin sayısal özfrekansları, $\\omega_k^2 = (g/\\ell)\\,x_k$ bağıntısındaki Laguerre sıfırlarıyla [@muller2007; @braun2003]; çift sarkacınkiler kapalı biçimli $(2 \\mp \\sqrt2)\\,g/\\ell$ sonucuyla [@taylor2005]; altı bağlantılı zincirin temel frekansı asılı ipin Bessel sıfırıyla verilen değeriyle [@verbin2015] karşılaştırılır. Son satır doğrusal olmayan benzetimin küçük genlikte birinci modun periyodunu yeniden ürettiğini denetler.",
    rows: [
      "$N = 2$: özfrekanslar ve Laguerre sıfırları",
      "$N = 3$: özfrekanslar ve Laguerre sıfırları",
      "$N = 6$: özfrekanslar ve Laguerre sıfırları",
      "$N = 2$: $\\omega_1$",
      "$N = 2$: $\\omega_2$",
      "$N = 6$: temel frekans ve asılı ip sınırı",
      "$N = 2$: benzetimle ölçülen 1. mod periyodu",
    ],
  },
  newtonEuler: {
    title: "Lagrange ve Newton türetimlerinin uyumu",
    description:
      "Hareket denklemleri Lagrange yöntemiyle türetilmiştir. Çubuk kuvvetleri ise her kütle için Newton'un ikinci yasasından ayrıca hesaplanır; ideal bir çubuk yalnızca kendi doğrultusunda kuvvet taşıdığından, iki türetim tutarlıysa enine bileşen sıfır olmalıdır. Ölçüt, rastgele seçilmiş 200 durumda enine bileşenin gerilmeye oranıdır. Son satır tek sarkacın bilinen gerilmesidir: $T = m(g\\cos\\theta + L\\dot\\theta^2)$.",
    rows: ["$N = 2$: enine kuvvet / gerilme", "$N = 6$: enine kuvvet / gerilme", "$N = 1$: çubuk gerilmesi"],
  },
  lyapunov: {
    title: "En büyük Lyapunov üsteli",
    description:
      "Benettin yöntemiyle [@benettin1976] 400 s boyunca kestirilen üstel, düzenli hareketlerde sıfıra yakın, kaotik çift sarkaçta ise belirgin biçimde pozitif olmalıdır. Son iki satır kestirimin sayısal parametrelere duyarlılığını ölçer: adım yarıya indirilir ve başlangıç ayrılığı on kat büyütülür.",
    rows: [
      "$N = 1$, $\\theta_0 = 120^\\circ$ (düzenli)",
      "$N = 2$, küçük açılar (düzenli)",
      "$N = 2$, $\\theta = (2{,}15;\\ 1{,}65)$ rad (kaotik)",
      "Aynı deney, adım yarıya indirilmiş",
      "Aynı deney, $d_0 = 10^{-7}$",
    ],
  },
  reversibility: {
    title: "Zamanda tersinirlik",
    description:
      "Sürtünmesiz hareket denklemleri zamanda tersinirdir. Zincir ileri doğru çözülür, hızların işareti değiştirilir ve aynı süre kadar yeniden çözülür; çizelge başlangıç durumuna dönüşteki en büyük hatayı verir. Kaotik yörüngede hata üstel büyüdüğü için süre kısa, tolerans geniştir.",
    rows: ["$N = 2$, düzenli; 20 s ileri ve geri", "$N = 3$, düzenli; 20 s ileri ve geri", "$N = 2$, kaotik; 5 s ileri ve geri"],
  },
  crossIntegrator: {
    title: "Bağımsız iki yöntemin uyumu",
    description:
      "Üç bağlantılı zincir 5 s boyunca hem sabit adımlı RK4 ile hem de hata denetimli Dormand–Prince yöntemiyle çözülür. Adım dört kat küçültüldüğünde RK4 ile başvuru çözümü arasındaki fark, dördüncü mertebe bir yöntemden beklendiği gibi yaklaşık $4^4 = 256$ kat küçülmelidir.",
    rows: ["RK4 (1000 Hz) ile DP5 arasındaki fark", "RK4 (4000 Hz) ile DP5 arasındaki fark", "Hata oranı (beklenen: yaklaşık 256)"],
  },
  spectrum: {
    title: "Spektrum çözümleyici",
    description:
      "Frekansı 1,2345 Hz ve genliği 0,7 olan, sabit bir bileşen eklenmiş sinüs 100 Hz ile örneklenir (4096 örnek). Frekans hiçbir FFT kutusuna tam denk gelmez; Hann penceresi [@harris1978] ve iki kutulu ara değerleme [@grandke1983] ile tepe frekansı ve genliği yeniden elde edilir.",
    rows: ["Tepe frekansı", "Tepe genliği"],
  },
};

/** Doğrulama paneli. */
export const verification = {
  title: "Doğrulama deneyleri",
  intro:
    "Aşağıdaki on dört deney, uygulamanın çözücü kodunu yanıtı bağımsız olarak bilinen problemlerde çalıştırır: kapalı biçimli çözüm, korunum yasası, özel fonksiyon değeri ya da bağımsız bir türetim. Deneyler bu tarayıcıda, şu anda yüklü olan kodla koşturulur; aynı deneyler otomatik sınama paketinin ve teknik raporun da parçasıdır.",
  run: "Deneyleri çalıştır",
  rerun: "Yeniden çalıştır",
  progress: (done: number, total: number) => `${done} / ${total} deney tamamlandı`,
  idle: "Deneyler henüz çalıştırılmadı.",
  summary: (passed: number, total: number, seconds: string) => `${total} ölçütün ${passed} tanesi sağlandı · ${seconds} s`,
  allPassed: "Tüm ölçütler sağlandı",
  someFailed: (count: number) => `${count} ölçüt sağlanmadı`,
  failed: "Deney çalıştırılamadı",
  columns: {
    quantity: "Büyüklük",
    measured: "Ölçülen",
    reference: "Başvuru değeri",
    error: "Hata",
    tolerance: "Tolerans",
    result: "Sonuç",
  },
  pass: "geçti",
  fail: "kaldı",
  pending: "bekliyor",
  running: "çalışıyor",
  metrics: {
    relative: "bağıl hata",
    absolute: "mutlak hata",
    atMost: "üst sınır",
    atLeast: "alt sınır",
  },
  metricNote:
    "Hata sütunu, ölçülen değer ile başvuru değeri arasındaki bağıl ya da mutlak farktır. Başvuru değeri olmayan satırlarda ölçülen değerin kendisi bir sınırla karşılaştırılır.",
  cases,
};
