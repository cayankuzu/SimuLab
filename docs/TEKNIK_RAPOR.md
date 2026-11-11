# SimuLab: Salınım ve Deterministik Kaos için Doğrulanmış, Etkileşimli Bir Hesaplamalı Fizik Laboratuvarı

**Teknik rapor: kuram, sayısal yöntemler ve doğrulama**

*Bu belge 2026-11-11 tarihinde “npm run docs” komutuyla kaynak koddan üretilmiştir. Metni değiştirmek için src/content/theory altındaki dosyalar düzenlenmelidir.*

## Özet

Bu rapor, tarayıcıda çalışan üç boyutlu bir fizik laboratuvarı olan SimuLab'ın kuramsal temelini, sayısal yöntemlerini ve doğrulama sonuçlarını belgeler. Laboratuvar iki deney düzeneği içerir: rijit durdurucuları olan, sönümlü ve harmonik olarak sürülen bir yay–kütle osilatörü ile N = 1…6 bağlantılı düzlemsel bir sarkaç zinciri. Hareket denklemleri sabit adımlı açık Runge–Kutta yöntemleriyle çözülür (varsayılan: klasik dördüncü mertebe yöntem, h = 1 ms). Adım dizisi ekran yenileme hızından bağımsızdır; bu nedenle kaotik yörüngeler de aynı başlangıç koşullarından aynen yeniden üretilir. Her terimi ayrı ayrı integre edilen bir enerji defteri (kinetik ve potansiyel enerji, sönüm ısısı, çarpışma ısısı, sürücünün yaptığı iş) sayısal hatayı çalışma sırasında sürekli görünür kılar. On dört doğrulama deneyi, çözücüyü kapalı biçimli çözümlerle, korunum yasalarıyla ve bağımsız türetimlerle karşılaştırır: klasik Runge–Kutta yöntemi için gözlenen yakınsama mertebesi 4,005'tir; serbest yanıtta, dört sönüm rejiminde 20 s boyunca en büyük konum hatası 1,6×10⁻¹⁰ m'dir; sonlu genlikli sarkacın ölçülen periyodu eliptik integral çözümünden bağıl olarak 3×10⁻¹⁰'dan az sapar; sürtünmesiz çift sarkaçta 60 s'lik bağıl enerji sapması 2×10⁻⁹'dur. Kaos nicel olarak incelenir: Benettin yöntemiyle kestirilen en büyük Lyapunov üsteli, ikiz yörüngenin ayrılması, Poincaré kesiti ve genlik spektrumu birlikte sunulur. Ölçüme dayalı dokuz deney föyü; periyot, sönüm oranı, rezonans genliği gibi büyüklüklerin sanal cihazlarla ölçülmesini ve kuramsal değerle karşılaştırılmasını ister. Rapor, ders kitaplarında sık rastlanan bazı yanılgıları kaynak göstererek düzeltir ve modelin varsayımlarını ve sınırlılıklarını açıkça belirtir.

**Anahtar sözcükler:** hesaplamalı fizik; harmonik osilatör; rezonans; çoklu sarkaç; deterministik kaos; Lyapunov üsteli; Runge–Kutta yöntemleri; doğrulama ve geçerleme; fizik eğitimi.

## İçindekiler

- [1. Kapsam, ilgili çalışmalar ve gösterim](#kapsam)
  - [Amaç ve kapsam](#kapsam-amac)
  - [İlgili çalışmalar](#kapsam-ilgili)
  - [Gösterim ve birimler](#kapsam-gosterim)
- [2. Sönümlü ve sürülen osilatör](#osilator)
  - [Model ve hareket denklemi](#osilator-model)
  - [Serbest yanıt ve sönüm rejimleri](#osilator-serbest)
  - [Sürülen kararlı durum ve rezonans](#osilator-surulen)
  - [Mekanik durdurucular ve çarpma](#osilator-durdurucu)
  - [Enerji defteri](#osilator-enerji)
- [3. N bağlantılı sarkaç](#sarkac)
  - [Model ve Lagrange fonksiyonu](#sarkac-model)
  - [Hareket denklemleri](#sarkac-denklem)
  - [Mafsal sürtünmesi](#sarkac-surtunme)
  - [Tek sarkaç: tam periyot](#sarkac-periyot)
  - [Küçük salınımlar ve normal modlar](#sarkac-modlar)
  - [Çubuk kuvvetleri: bağımsız bir denetim](#sarkac-kuvvet)
  - [Tepeden aşma için enerji eşiği](#sarkac-esik)
- [4. Sayısal yöntemler](#sayisal)
  - [Tek adımlı açık yöntemler](#sayisal-yontemler)
  - [Kararlılık ve enerji davranışı](#sayisal-kararlilik)
  - [Sabit adımlı döngü ve yeniden üretilebilirlik](#sayisal-dongu)
  - [Çarpma anının bulunması](#sayisal-olay)
  - [Uyarlamalı adım: Dormand–Prince 5(4)](#sayisal-uyarlamali)
  - [Doğrusal cebir ve özel fonksiyonlar](#sayisal-cebir)
- [5. Deterministik kaos](#kaos)
  - [Başlangıç koşullarına duyarlılık](#kaos-duyarlilik)
  - [Lyapunov üstelinin kestirimi](#kaos-benettin)
  - [Öngörü ufku](#kaos-ufuk)
  - [Kaos ne zaman olanaklıdır](#kaos-kosul)
  - [Poincaré kesiti](#kaos-poincare)
  - [Kaotik yörüngelerde sayısal doğruluk ne anlama gelir](#kaos-dogruluk)
- [6. Ölçüm ve çözümleme araçları](#olcum)
  - [Sanal cihazlar](#olcum-cihazlar)
  - [Genlik spektrumu](#olcum-spektrum)
  - [Grafikler ve renkler](#olcum-grafikler)
  - [Veri dışa aktarma](#olcum-veri)
  - [Sonifikasyon](#olcum-ses)
- [7. Doğrulama](#dogrulama)
  - [Doğrulama ve geçerleme ayrımı](#dogrulama-yontem)
  - [Sonuçların özeti](#dogrulama-sonuclar)
  - [Sonuçların yorumu](#dogrulama-yorum)
- [8. Yaygın yanılgılar ve düzeltmeleri](#yanilgilar)
  - [Rezonans üzerine](#yanilgilar-rezonans)
  - [Sönüm üzerine](#yanilgilar-sonum)
  - [Sarkaç üzerine](#yanilgilar-sarkac)
  - [Kaos üzerine](#yanilgilar-kaos)
- [9. Varsayımlar ve sınırlılıklar](#sinirlar)
  - [Fiziksel model](#sinirlar-model)
  - [Sayısal sonuçlar](#sinirlar-sayisal)
  - [Geçerleme ve eğitsel etki](#sinirlar-gecerleme)
  - [Gelecek çalışma](#sinirlar-gelecek)
- [10. Yazılım mimarisi](#mimari)
  - [Katmanlar ve veri akışı](#mimari-katmanlar)
  - [Sabit adımlı döngü](#mimari-dongu)
  - [Kalite güvencesi](#mimari-kalite)
  - [Yeniden yazımdan önceki durumla karşılaştırma](#mimari-karsilastirma)
- [11. Arayüz ve etkileşim tasarımı](#arayuz)
  - [Yerleşim: parametre, sahne ve grafik aynı anda](#arayuz-yerlesim)
  - [Doğrudan manipülasyon](#arayuz-manipulasyon)
  - [Nicelik–renk eşlemesi](#arayuz-renk)
  - [Ölçekli vektörler ve sahne içi ölçü araçları](#arayuz-vektor)
  - [Grafikler](#arayuz-grafik)
  - [Erişilebilirlik](#arayuz-erisilebilirlik)
  - [Sonifikasyon](#arayuz-ses)
- [12. Pedagojik tasarım](#pedagoji)
  - [Benzetimlerle öğrenmeye ilişkin bulgular](#pedagoji-bulgular)
  - [Deney föylerinin kuruluşu](#pedagoji-foyler)
- [Ek A. Doğrulama çizelgeleri](#verification)
- [Kaynakça](#references)

<a id="kapsam"></a>

## 1. Kapsam, ilgili çalışmalar ve gösterim

*Laboratuvarın neyi modellediği, benzer araçlardan nerede ayrıldığı ve metin boyunca kullanılan simgeler.*

<a id="kapsam-amac"></a>

### Amaç ve kapsam

SimuLab iki klasik mekanik düzeneğini tarayıcıda, üç boyutlu bir sahnede ve gerçek zamanlı olarak çözer: rijit durdurucuları olan, sönümlü ve harmonik olarak sürülen bir **yay–kütle osilatörü** ile $`N = 1,\dots,6`$ bağlantılı düzlemsel bir **sarkaç zinciri**. Birincisi doğrusal titreşim kuramının bütün temel kavramlarını (doğal frekans, sönüm oranı, rezonans, faz gecikmesi, geçici ve kararlı rejim) tek bir denklemde toplar; ikincisi aynı mekaniğin doğrusal olmayan ucudur ve $`N \ge 2`$ için deterministik kaos gösterir.

Çalışmanın iddiası görsellik değil **doğrulanabilirliktir**. Her sayısal sonuç, yanıtı bağımsız olarak bilinen bir problemle karşılaştırılmıştır (Bölüm 7); çalışma sırasında bir enerji defteri sayısal hatayı sürekli gösterir; ekranda görülen yörünge ekran yenileme hızına değil yalnızca başlangıç koşullarına, parametrelere ve seçilen yönteme bağlıdır (Bölüm 4). Metindeki her olgusal ifade ya bir türetime ya ölçülmüş bir doğrulama sonucuna ya da künyesi birincil kaynağından denetlenmiş bir yayına dayanır.

> **Sınırlılık — Üç boyut görselleştirmeye aittir**
>
> Her iki düzeneğin dinamiği düzlemseldir: osilatör tek serbestlik derecelidir, sarkaç zinciri düşey bir düzlemde hareket eder. Üç boyutlu sahne düzeneği bir laboratuvar tezgâhı gibi incelemeyi sağlar; küresel sarkaç ya da düzlem dışı hareket modellenmemiştir.

<a id="kapsam-ilgili"></a>

### İlgili çalışmalar

Salınım ve sarkaç konularında yaygın kullanılan ücretsiz araçların modelleri ve zaman adımlama yöntemleri Çizelge 1.1'de özetlenmiştir. Bilgiler araçların kendi sayfalarından, belgelerinden ve erişilebildiği ölçüde kaynak kodlarından derlenmiştir.

*Çizelge 1.1. Benzer araçlar: model ve zaman adımlama yöntemi.*

| Araç | Model | Zaman adımlama | Kaynak |
| --- | --- | --- | --- |
| PhET Pendulum Lab | Bir ya da iki bağımsız basit sarkaç, iki boyutlu | Klasik RK4, kare başına en az 7 alt adım | [[1](#ref-1)] |
| PhET Masses and Springs | Düşey yay–kütle, iki boyutlu | Zaman adımlama yok: sönümlü osilatörün kapalı biçimli çözümü her karede değerlendirilir | [[2](#ref-2)] |
| myPhysicsLab | Çift sarkaç dâhil yaklaşık 50 benzetim, hepsi iki boyutlu | Varsayılan RK4, adım 0,025 s; Euler yalnızca seçenek | [[3](#ref-3)] |
| Easy Java/JavaScript Simulations, Open Source Physics | Yazarlık aracı ve model koleksiyonu; Poincaré kesitli bir çift sarkaç modeli içerir | Yeni bir ODE sayfasında varsayılan: uyarlamalı Cash–Karp 5(4) | [[4](#ref-4), [5](#ref-5), [6](#ref-6)] |
| GeoGebra, oPhysics | Kullanıcıların yazdığı uygulamalar | SolveODE komutu Runge–Kutta yöntemlerine dayanır | [[7](#ref-7), [8](#ref-8)] |
| Algodoo | İki boyutlu serbest kurgu ortamı | Üreticiye göre varyasyonel integratörler | [[9](#ref-9), [10](#ref-10)] |
| Falstad, W. Fendt | İki boyutlu uygulamalar | Normal mod ya da kapalı biçimli formüller | [[11](#ref-11), [12](#ref-12)] |
| Web VPython | Üç boyutlu programlama ortamı | Giriş derslerinde bilinçli olarak Euler–Cromer | [[13](#ref-13)] |

> **Yaygın yanılgı — “Eğitim amaçlı benzetimler Euler yöntemi kullanır”**
>
> Bu genelleme adı geçen araçlar için doğru değildir: PhET Pendulum Lab ve myPhysicsLab dördüncü mertebe Runge–Kutta yöntemi kullanır, PhET Masses and Springs hiç zaman adımlamaz, Easy Java/JavaScript Simulations uyarlamalı bir yöntemle başlar. Euler türü adımlama, öğrencinin kodu kendisinin yazdığı giriş derslerinde bilinçli bir tercihtir [[13](#ref-13)]. Bu çalışmanın katkısı dolayısıyla “daha iyi bir integratör” değil; hatanın ölçülmesi, gösterilmesi ve belgelenmesidir.

Bildiğimiz kadarıyla, incelenen yaygın ücretsiz araçların hiçbiri (PhET, myPhysicsLab, Open Source Physics ve EJS, GeoGebra ve oPhysics, Algodoo, Falstad, W. Fendt) şu özellikleri bir arada sunmaz: altı bağlantıya kadar sarkaç zinciri, çalışma sırasında en büyük Lyapunov üsteli kestirimi, sürekli açık enerji defteri ve dışa aktarılabilir telemetri. Bu olumsuz bir tarama sonucudur, kanıt değildir. Kısmen örtüşen ve yaygınlaşmamış açık kaynaklı kişisel projeler vardır; örneğin GitHub'daki “Chaotic-n-Pendulums-Visualizer” deposu düzlemsel N bağlantılı sarkaç için istek üzerine Benettin kestirimi sunar. Çift sarkaçta kaosun öğretimine yönelik güncel bir derleme için bkz. [[14](#ref-14)]; tarayıcı tabanlı laboratuvar örnekleri için bkz. [[15](#ref-15), [16](#ref-16)].

Sanal laboratuvarların öğrenmeye etkisi konusundaki kanıt karışıktır. Bir çalışmada benzetimle çalışan öğrenciler hem kavramsal sorularda hem de gerçek devre kurmada gerçek donanımla çalışanlardan daha başarılı olmuştur [[17](#ref-17)]; deney tasarımı öğretiminde fiziksel ve sanal malzeme eşit etkili bulunmuştur [[18](#ref-18)]; sarkaç problemlerinde yedinci sınıf öğrencileriyle yapılan bir çalışmada benzetim ile elle yapılan deney arasında fark bulunmamış, öğrencilerin benzetimde değişkenleri daha seyrek denetlediği görülmüştür [[19](#ref-19)]. 2001–2010 yıllarını kapsayan bir derleme, benzetimlerin özellikle laboratuvar etkinliklerini destekleyebildiğini, ancak çalışmaların çoğunun öğretmen desteğini ve dersin kurgusunu göz ardı ettiğini bildirir [[20](#ref-20)]; fiziksel ve sanal laboratuvarların karşılaştırmalı bir değerlendirmesi için bkz. [[21](#ref-21)]. Bu rapor kendi aracı için bir öğrenme kazanımı iddia etmez (Bölüm 9).

<a id="kapsam-gosterim"></a>

### Gösterim ve birimler

Bütün büyüklükler SI birimleriyle verilir; simgeler ISO 80000 ile uyumludur [[22](#ref-22), [23](#ref-23), [24](#ref-24)]. Zamana göre türev nokta ile gösterilir. Açılar aşağı düşeyden, saat yönünün tersine ölçülür ve radyan cinsindendir; arayüz kolaylık için derece de gösterir. Arayüzdeki sayısal göstergeler ve sayı alanlarının iletileri ondalık nokta kullanır; böylece ekranda okunan bir değer sayı alanına aynen yazılabilir ve dışa aktarılan veriyle birebir aynıdır. Arayüzün açıklama metinlerinde ve bu metinde ise Türkçe yazım gereği ondalık virgül kullanılır.

*Çizelge 1.2. Başlıca simgeler.*

| Simge | Anlam | Birim |
| --- | --- | --- |
| $`m`$, $`k`$, $`c`$ | Kütle, yay sabiti, viskoz sönüm katsayısı | kg, N/m, N·s/m |
| $`F_0`$, $`\omega`$, $`\varphi`$ | Sürücü kuvvetin genliği, açısal frekansı ve fazı | N, rad/s, rad |
| $`\omega_0`$, $`\zeta`$, $`\gamma`$ | Doğal açısal frekans, sönüm oranı, genlik sönüm hızı $`c/(2m)`$ | rad/s, –, 1/s |
| $`A`$, $`\delta`$ | Kararlı durum genliği ve yer değiştirmenin kuvvete göre faz gecikmesi | m, rad |
| $`e`$ | Çarpışma (geri sıçrama) katsayısı | – |
| $`\theta_i`$, $`m_i`$, $`L_i`$ | $`i`$. çubuğun açısı, ucundaki kütle ve çubuğun boyu | rad, kg, m |
| $`\mu_i`$ | $`i`$. mafsaldan aşağıdaki toplam kütle, $`\sum_{k \ge i} m_k`$ | kg |
| $`b`$ | Mafsal viskoz sürtünme katsayısı | N·m·s/rad |
| $`E_k`$, $`E_p`$, $`Q`$, $`W`$ | Kinetik enerji, potansiyel enerji, ısıya dönüşen enerji, sürücünün yaptığı iş | J |
| $`h`$, $`p`$ | Zaman adımı, yöntemin mertebesi | s, – |
| $`\lambda`$ | En büyük Lyapunov üsteli | 1/s |

<a id="osilator"></a>

## 2. Sönümlü ve sürülen osilatör

*Hareket denklemi, üç sönüm rejimi, sürülen kararlı durum ve rezonans, mekanik durdurucular ve her terimi ayrı izlenen enerji dengesi.*

<a id="osilator-model"></a>

### Model ve hareket denklemi

Kütlesi $`m`$ olan araba sürtünmesiz bir ray üzerinde hareket eder, sabiti $`k`$ olan doğrusal bir yayla duvara bağlıdır, hızıyla orantılı bir sönüm kuvveti ve harmonik bir sürücü kuvvet etkisindedir. Denge konumundan ölçülen yer değiştirme $`x`$ için

```math
m\ddot{x} + c\dot{x} + kx = F_0\cos\varphi, \qquad \dot{\varphi} = \omega \tag{2.1}
```

Sürücünün fazı $`\varphi`$ ayrı bir durum değişkenidir. Böylece frekans çalışma sırasında değiştirildiğinde kuvvet süreksizlik göstermez; gerçek bir işaret üreteci de faz süreklidir. İki parametre değişikliği arasında $`\dot{\varphi} = \omega`$ sabit olduğundan faz adım adım biriktirilmez: her adımın sonunda $`\varphi_b + \omega\,(t - t_b)`$ değerine eşitlenir; burada $`t_b`$ ve $`\varphi_b`$, deneyin başındaki ya da son parametre değişikliği anındaki zaman ve fazdır (Bölüm 4). Hızla orantılı sönüm, düzenekte bir girdap akımı freni olarak gösterilmiştir: iletken bir şeridin mıknatıs kutupları arasındaki hareketi düşük hızlarda $`F = -c\dot{x}`$ biçiminde bir kuvvet doğurur [[25](#ref-25), [26](#ref-26)]. Denklem iki parametreyle boyutsuzlaştırılır:

```math
\omega_0 = \sqrt{\frac{k}{m}}, \qquad \zeta = \frac{c}{2\sqrt{km}}, \qquad \gamma = \frac{c}{2m} = \zeta\omega_0 \tag{2.2}
```

*Çizelge 2.1. Arayüzde ayarlanabilen parametre aralıkları.*

| Parametre | Aralık |
| --- | --- |
| Kütle $`m`$ | 0,5 – 10 kg |
| Yay sabiti $`k`$ | 4 – 80 N/m |
| Sönüm katsayısı $`c`$ | 0 – 60 N·s/m |
| Sürücü genliği $`F_0`$ | 0 – 25 N |
| Sürücü açısal frekansı $`\omega`$ | 0,2 – 14 rad/s |

<a id="osilator-serbest"></a>

### Serbest yanıt ve sönüm rejimleri

$`F_0 = 0`$ için çözümün biçimini sönüm oranı belirler [[27](#ref-27), [28](#ref-28), [29](#ref-29)]. Başlangıç koşulları $`x(0) = x_0`$, $`\dot{x}(0) = v_0`$ olmak üzere, zayıf sönümde ($`\zeta < 1`$) hareket üstel zarflı bir salınımdır:

```math
x(t) = e^{-\gamma t}\left[x_0\cos\omega_d t + \frac{v_0 + \gamma x_0}{\omega_d}\sin\omega_d t\right], \qquad \omega_d = \omega_0\sqrt{1-\zeta^2} \tag{2.3}
```

Kritik sönümde ($`\zeta = 1`$) ve aşırı sönümde ($`\zeta > 1`$, $`s = \omega_0\sqrt{\zeta^2 - 1}`$) salınım yoktur:

```math
x(t) = \left[x_0 + (v_0 + \omega_0 x_0)\,t\right]e^{-\omega_0 t}, \qquad x(t) = e^{-\gamma t}\left[x_0\cosh st + \frac{v_0 + \gamma x_0}{s}\sinh st\right] \tag{2.4}
```

Uygulama bu kapalı biçimli çözümü sayısal çözümle birlikte hesaplar ve aradaki en büyük farkı gösterir; fark, durduruculara çarpma olmadığı sürece doğrudan çözücünün hatasıdır. “Sönümsüz” hazır deneyinde ($`m = 2`$ kg, $`k = 24`$ N/m, $`x_0 = 2`$ m) bu fark 60 s sonunda varsayılan 1 ms'lik adımla $`4{,}9 \times 10^{-10}`$ m, bunun yarısı kadar adımla $`3{,}1 \times 10^{-11}`$ m'dir: dördüncü mertebe bir yöntemin vermesi gereken 16 katlık oran. Zayıf sönümde ardışık iki tepe arasındaki oran sabittir. Bu oranın doğal logaritması **logaritmik azalma**, salınımın keskinliğini ölçen büyüklük **kalite faktörü** adını alır:

```math
\Lambda = \ln\frac{x_k}{x_{k+1}} = \gamma T_d = \frac{2\pi\zeta}{\sqrt{1-\zeta^2}}, \qquad Q = \frac{\omega_0 m}{c} = \frac{1}{2\zeta} \tag{2.5}
```

Durgun bırakılan kütlenin dengeyi ilk aşışı, başlangıç yer değiştirmesinin $`M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}}`$ katıdır. Kritik sönümde aşım yoktur ve $`(1+\omega_0 t)e^{-\omega_0 t} = 0{,}02`$ denkleminin çözümünden %2 yerleşme süresi $`t_s = 5{,}834/\omega_0`$ bulunur. Aşıma izin verilirse yerleşme daha da kısalır: $`M_p = 0{,}02`$ koşulu $`\zeta \approx 0{,}78`$ değerinde sağlanır ve kütle %2'lik banda ilk girişinde orada kalır.

<a id="osilator-surulen"></a>

### Sürülen kararlı durum ve rezonans

Sönüm varken geçici çözüm söner: $`\zeta \le 1`$ için $`\gamma`$ hızıyla, $`\zeta > 1`$ için ise yavaş sönen teriminin $`\gamma - \sqrt{\gamma^2 - \omega_0^2}`$ hızıyla. Geriye sürücüyle aynı frekansta, ona göre $`\delta`$ kadar geciken bir salınım kalır: $`x(t) = A\cos(\omega t - \delta)`$. Genlik ve faz gecikmesi [[27](#ref-27), [28](#ref-28), [30](#ref-30)]

```math
A(\omega) = \frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2 + (2\gamma\omega)^2}}, \qquad \tan\delta = \frac{c\,\omega}{k - m\omega^2}, \quad 0 \le \delta \le \pi \tag{2.6}
```

Genlik en büyük değerini doğal frekansın biraz altında alır; bu tepe yalnızca $`\zeta < 1/\sqrt{2}`$ için vardır:

```math
\omega_r = \omega_0\sqrt{1-2\zeta^2}, \qquad A_\mathrm{max} = \frac{F_0/k}{2\zeta\sqrt{1-\zeta^2}} \tag{2.7}
```

Sürücünün bir periyotta aktardığı ortalama güç ise tam $`\omega_0`$ değerinde en büyüktür ve güç eğrisinin yarı yükseklikteki tam genişliği her sönüm değeri için tam olarak $`c/m`$ kadardır:

```math
\langle P\rangle = \tfrac12 c\,\omega^2 A^2, \qquad \langle P\rangle_\mathrm{max} = \frac{F_0^2}{2c}\ \ (\omega = \omega_0), \qquad \Delta\omega = \frac{c}{m} = \frac{\omega_0}{Q} \tag{2.8}
```

Sönüm yokken ($`c = 0`$) kararlı durum oluşmaz. Tam rezonansta genlik zamanla doğru orantılı büyür, $`x(t) = \dfrac{F_0}{2m\omega_0}\,t\sin\omega_0 t`$; rezonansın yakınında ise iki frekansın girişimi **vuru** üretir ve zarfın periyodu $`2\pi/|\omega_0 - \omega|`$ olur. Her iki durum hazır deneyler arasındadır.

> **Not — Ölçülen yanıt eğrisi**
>
> Frekans sekmesindeki eğri (2.6) bağıntısıdır; üzerindeki noktalar ise sanal cihazların ölçtüğü genliklerdir. Sürmekte olan deney her salınımda bir nokta ekler; geçici rejim söndükçe bu noktalar eğrinin üzerine oturur. “Frekans taraması” ölçümü kararlı durumda, $`0{,}3\,\omega_0`$ ile $`2\,\omega_0`$ arasındaki 25 frekansta yapar: her frekans için denklem, geçici rejimin en yavaş sönen terimi $`e^{-12}`$ katına inene kadar ayrıca çözülür (RK4, $`h = 2`$ ms). Tarama $`\zeta \ge 0{,}01`$ için sunulur; daha küçük sönümde kararlı duruma ulaşmak uygulanamayacak kadar uzun sürer. Doğrulama deneyinde, beş frekansta, ölçülen genliğin kuramdan bağıl sapması en çok $`3{,}3 \times 10^{-8}`$ değerindedir (Bölüm 7).

<a id="osilator-durdurucu"></a>

### Mekanik durdurucular ve çarpma

Arabanın hareketi iki yönde sınırlıdır. Duvar tarafında sınırı yayın **katı boyu** belirler: sarımlar birbirine değdiğinde yay daha fazla kısalamaz. Uçları düz bırakılmış bir basma yayında katı boy $`L_s = d\,(N_t + 1)`$ ile verilir [[31](#ref-31)]; $`N_t = 14`$ sarım ve $`L_s = 1{,}45`$ m için tel çapı $`d = 0{,}097`$ m olur. Yayın sabit ucu $`x = -7{,}05`$ m, arabanın yarı boyu 0,85 m olduğundan arabanın merkezi $`x_\mathrm{min} = -7{,}05 + 1{,}45 + 0{,}85 = -4{,}75`$ m konumunun ötesine geçemez. Öbür yönde ray sonundaki durdurucu $`x_\mathrm{max} = 6{,}50`$ m sınırını koyar. Sahnedeki bütün parçalar bu ölçülerle çizilir; hiçbir parça bir başkasının içinden geçmez.

Durdurucu, tek yönlü rijit bir kısıt olarak modellenir. Çarpma anında Newton'un kinematik geri sıçrama yasası uygulanır [[32](#ref-32)]:

```math
v^{+} = -e\,v^{-}, \qquad \Delta Q_e = \tfrac12 m\,(v^{-})^2\,(1-e^2) \tag{2.9}
```

Yitirilen kinetik enerji çarpışma ısısı olarak deftere yazılır. Uygulanan net kuvvet arabayı durdurucuya bastırmayı sürdürüyorsa araba orada durur ve kuvvet yön değiştirince ayrılır. Çarpma anı zaman adımının içinde ikiye bölme yöntemiyle bulunur (Bölüm 4); kapalı biçimli çözümle karşılaştırıldığında çarpma anındaki hata $`10^{-12}`$ s mertebesindedir.

> **Sınırlılık — e = 0,45 bir model parametresidir**
>
> Çelik bir gövdenin kauçuk bir tampona çarpması için el kitabı niteliğinde bir geri sıçrama katsayısı bulunamamıştır. Rijit taneciklerin kauçuk bir bloğa çarpması için ölçülen değerler 0,37–0,44 aralığındadır [[33](#ref-33)]; seçilen değer bu büyüklük mertebesindedir ve çarpmada kinetik enerjinin yaklaşık %80'inin yitirildiği anlamına gelir. Geri sıçrama katsayısı gerçekte çarpma hızına bağlıdır; bu bağımlılığı veren sürekli temas modelleri [[34](#ref-34)] burada kullanılmamıştır.

<a id="osilator-enerji"></a>

### Enerji defteri

(2.1) denklemi $`\dot{x}`$ ile çarpılıp zamana göre integre edilirse, çarpmalar da eklenerek, her an sağlanması gereken bir denge elde edilir:

```math
\underbrace{\tfrac12 m\dot{x}^2}_{E_k} + \underbrace{\tfrac12 kx^2}_{E_p} + \underbrace{\int_0^t c\,\dot{x}^2\,dt'}_{Q_c} + Q_e - \underbrace{\int_0^t F_0\cos\varphi\;\dot{x}\,dt'}_{W} = E_0 \tag{2.10}
```

$`Q_c`$ ve $`W`$ durum vektörünün parçasıdır ve hareketle aynı yöntemle, aynı adımda integre edilir; $`Q_e`$ çarpmalarda (2.9) ile artar. Sol taraf ile $`E_0`$ arasındaki fark, yani **kalıntı** $`\Delta E`$, tam bir çözümde sıfırdır; sıfırdan farklı her değer sayısal hatadır. Kalıntı, durum çubuğunda ve Enerji sekmesinde sürekli gösterilir; bağıl değeri hesaplanırken payda olarak $`|E_0|`$, anlık mekanik enerji ve $`Q + |W|`$ büyüklüklerinin en büyüğü alınır. Sönüm, sürücü ve 27 çarpmanın birlikte bulunduğu 60 saniyelik bir doğrulama deneyinde bağıl kalıntı $`1{,}3 \times 10^{-12}`$ değerini aşmaz.

<a id="sarkac"></a>

## 3. N bağlantılı sarkaç

*Lagrange fonksiyonu ve hareket denklemleri, mafsal sürtünmesi, tek sarkacın tam periyodu, küçük salınım modları, çubuk kuvvetleri ve tepeden aşma için enerji eşiği.*

<a id="sarkac-model"></a>

### Model ve Lagrange fonksiyonu

Zincir, kütlesiz ve rijit $`N`$ çubuktan oluşur; $`i`$. çubuğun boyu $`L_i`$, alt ucundaki noktasal kütle $`m_i`$ değerindedir. Genelleştirilmiş koordinatlar çubukların aşağı düşeyle yaptığı mutlak açılardır, $`\theta_1,\dots,\theta_N`$. Mafsalın altında kalan toplam kütle $`\mu_i = \sum_{k \ge i} m_k`$ ile gösterilirse kinetik ve potansiyel enerji [[35](#ref-35), [36](#ref-36), [37](#ref-37)]

```math
T = \frac12\sum_{i=1}^{N}\sum_{j=1}^{N}\mu_{\max(i,j)}\,L_iL_j\cos(\theta_i-\theta_j)\,\dot\theta_i\dot\theta_j, \qquad V = g\sum_{i=1}^{N}\mu_iL_i\,(1-\cos\theta_i) \tag{3.1}
```

Potansiyel enerji asılı denge konumundan ölçülür; en büyük değeri, zincirin dimdik yukarı durduğu konumdaki $`2g\sum_i\mu_iL_i`$ değeridir. Açıların mutlak seçilmesi kütle matrisini simetrik ve yapısını yalın tutar; bedeli, mafsal sürtünmesinin komşu açısal hızların farkına bağlı olmasıdır.

*Çizelge 3.1. Parametre aralıkları ve hazır yerçekimi değerleri.*

| Büyüklük | Değer | Kaynak |
| --- | --- | --- |
| Kütleler $`m_i`$ | 0,3 – 6 kg | – |
| Çubuk boyları $`L_i`$ | 0,4 – 1,8 m | – |
| Mafsal sönümü $`b`$ | 0 – 2 N·m·s/rad | – |
| Dünya (standart yerçekimi ivmesi) | $`9{,}80665\ \mathrm{m/s^2}`$, tanım gereği tam | [[38](#ref-38), [24](#ref-24)] |
| Ay | $`1{,}62\ \mathrm{m/s^2}`$ | [[39](#ref-39)] |
| Mars | $`3{,}73\ \mathrm{m/s^2}`$ (ortalama yüzey çekimi) | [[40](#ref-40)] |
| Jüpiter | $`25{,}92\ \mathrm{m/s^2}`$ (ortalama, 1 bar düzeyi) | [[41](#ref-41)] |
| Serbest düşüş | $`g = 0`$ idealleştirmesi; Uluslararası Uzay İstasyonu'nda yarı durağan artık ivme $`10^{-6}g`$ mertebesindedir | [[42](#ref-42)] |

<a id="sarkac-denklem"></a>

### Hareket denklemleri

Euler–Lagrange denklemleri her $`i`$ için

```math
\sum_{j=1}^{N}\mu_{\max(i,j)}L_iL_j\left[\cos(\theta_i-\theta_j)\,\ddot\theta_j + \sin(\theta_i-\theta_j)\,\dot\theta_j^{\,2}\right] + \mu_i\,g\,L_i\sin\theta_i = Q_i \tag{3.2}
```

biçimindedir; $`Q_i`$ korunumsuz genelleştirilmiş kuvvettir. İvmelerin katsayı matrisi $`A_{ij} = \mu_{\max(i,j)}L_iL_j\cos(\theta_i-\theta_j)`$ simetrik ve pozitif tanımlıdır, çünkü $`T = \tfrac12\dot{\boldsymbol\theta}^{\mathsf T}\mathbf{A}\,\dot{\boldsymbol\theta}`$ her sıfırdan farklı hız için pozitiftir. Bu yüzden ivmeler her adımda Cholesky ayrışımıyla çözülür [[43](#ref-43)]; sonlu bir durumda ayrışımın başarısız olması modelde bir hata olduğunu gösterir. Sonlu bir sayı olmayan bir değer içeren durum da ayrıştırılamaz; model o zaman sonlu olmayan sonucu aynen iletir ve çalışma zamanı deneyi durdurur (Bölüm 4). $`N = 1`$ için denklem bilinen $`\ddot\theta = -(g/L)\sin\theta`$ biçimine iner. Aynı Lagrange fonksiyonu çoklu sarkaç için hakemli yayınlarda da verilmiştir [[37](#ref-37), [44](#ref-44), [45](#ref-45)].

<a id="sarkac-surtunme"></a>

### Mafsal sürtünmesi

Her mafsalda, birleştirdiği iki çubuğun bağıl açısal hızıyla orantılı bir sürtünme torku vardır; sabit askı noktası için $`\dot\theta_0 = 0`$ alınır. Hızın karesel bir fonksiyonu olan Rayleigh yitim fonksiyonu [[46](#ref-46), [35](#ref-35)] ve ondan türeyen genelleştirilmiş kuvvetler

```math
D = \frac{b}{2}\sum_{i=1}^{N}\left(\dot\theta_i - \dot\theta_{i-1}\right)^2, \qquad Q_i = -\frac{\partial D}{\partial\dot\theta_i} = -b\,(\dot\theta_i-\dot\theta_{i-1}) + b\,(\dot\theta_{i+1}-\dot\theta_i) \tag{3.3}
```

biçimindedir; son terim en alttaki çubuk için yoktur. Isıya dönüşen güç $`2D`$ kadardır. Bu güç ek bir durum değişkeni olarak integre edilir ve enerji defteri $`T + V + Q_b = E_0`$ biçiminde izlenir. Model viskoz sürtünmedir; kuru (Coulomb) sürtünme ve hava direnci içermez.

<a id="sarkac-periyot"></a>

### Tek sarkaç: tam periyot

Küçük açılarda $`\sin\theta \approx \theta`$ alınırsa periyot genlikten bağımsız çıkar, $`T_0 = 2\pi\sqrt{L/g}`$. Genlik $`\theta_0`$ büyüdükçe bu yaklaşıklık bozulur. Enerjinin korunumundan elde edilen tam periyot birinci tür tam eliptik integral $`K`$ ile verilir [[47](#ref-47), [48](#ref-48), [49](#ref-49)]:

```math
T = 4\sqrt{\frac{L}{g}}\;K\!\left(\sin\frac{\theta_0}{2}\right) = T_0\left(1 + \frac{\theta_0^2}{16} + \frac{11\,\theta_0^4}{3072} + \cdots\right) \tag{3.4}
```

$`K`$ aritmetik–geometrik ortalama ile hesaplanır: $`K(k) = \pi/\bigl(2\,\mathrm{AGM}(1,\sqrt{1-k^2})\bigr)`$, dolayısıyla $`T = T_0/\mathrm{AGM}(1,\cos(\theta_0/2))`$ [[50](#ref-50)]. Yineleme ikinci dereceden yakınsar; çift duyarlıkta beş altı adım yeter. Sarkaç tepeden aşacak kadar enerjiliyse hareket salınım değil sürekli dönmedir. En alt noktadan ölçülen enerjiyle tanımlanan $`\kappa^2 = E/(2mgL) = \sin^2(\theta/2) + L\dot\theta^2/(4g)`$ parametresi iki hareketi ayırır: $`\kappa < 1`$ salınım, $`\kappa > 1`$ dönme, $`\kappa = 1`$ ise periyodu sonsuz olan separatristir. Bir tam dönüşün süresi

```math
T_\mathrm{rot} = \frac{2}{\kappa}\sqrt{\frac{L}{g}}\;K\!\left(\frac{1}{\kappa}\right), \qquad \kappa > 1 \tag{3.5}
```

*Çizelge 3.2. Tek sarkacın periyodunun küçük açı değerine oranı.*

| Genlik $`\theta_0`$ | 5° | 10° | 30° | 60° | 90° | 120° | 150° | 170° |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $`T/T_0`$ | 1,0005 | 1,0019 | 1,0174 | 1,0732 | 1,1803 | 1,3729 | 1,7622 | 2,4394 |

Ölçümler sekmesi bu kuramsal değerleri anlık enerjiden hesaplar ve periyot ölçerin verdiği değerle karşılaştırır. Doğrulama deneylerinde ölçülen periyot ile (3.4) ve (3.5) arasındaki bağıl fark 10°–170° genlik aralığında ve dönme hareketinde $`2{,}4 \times 10^{-10}`$ değerini aşmaz.

<a id="sarkac-modlar"></a>

### Küçük salınımlar ve normal modlar

Asılı denge çevresinde doğrusallaştırılan sürtünmesiz denklemler $`\mathbf{M}\ddot{\boldsymbol\theta} + \mathbf{K}\boldsymbol\theta = \mathbf{0}`$ biçimini alır; burada $`M_{ij} = \mu_{\max(i,j)}L_iL_j`$ ve $`\mathbf{K} = g\,\mathrm{diag}(\mu_iL_i)`$. $`\boldsymbol\theta = \mathbf{a}\cos(\omega t + \varphi)`$ denemesi genelleştirilmiş simetrik özdeğer problemini verir:

```math
\left(\mathbf{K} - \omega^2\mathbf{M}\right)\mathbf{a} = \mathbf{0} \tag{3.6}
```

Problemin $`N`$ pozitif özdeğeri vardır; her biri bütün parçaların aynı frekansla salındığı bir **normal mod**dur. Eşit kütleli ve eşit boylu çift sarkaçta $`\omega^2 = (2 \mp \sqrt{2})\,g/L`$ ve açı oranları $`\theta_2/\theta_1 = \pm\sqrt{2}`$ bulunur [[28](#ref-28)]. Eşit kütleli ve eşit boylu $`N`$ bağlantılı zincirde özfrekanslar Laguerre çokterimlisinin sıfırlarıyla verilir [[51](#ref-51), [44](#ref-44)]:

```math
\omega_k^2 = \frac{g}{\ell}\,x_k, \qquad L_N(x_k) = 0, \quad k = 1,\dots,N \tag{3.7}
```

Bağlantı sayısı artarken zincir, toplam boyu $`\Lambda`$ olan asılı bir ipe yaklaşır; ipin frekansları Bessel fonksiyonu $`J_0`$ sıfırlarıyla verilir, $`\omega_k = \tfrac12 j_{0,k}\sqrt{g/\Lambda}`$ ve $`j_{0,1} = 2{,}4048`$ [[52](#ref-52), [53](#ref-53)]. Asılı zincirin salınımlarını ilk çözen Daniel Bernoulli'dir [[54](#ref-54), [55](#ref-55), [56](#ref-56)]. Yakınsama yavaştır: altı eşit bağlantılı zincirin temel frekansı ip değerinin %3,8 altındadır. Uygulama (3.6) problemini seçili zincir için sayısal olarak çözer; eşit zincirlerde sonuç (3.7) ile $`10^{-15}`$ bağıl hata düzeyinde örtüşür.

<a id="sarkac-kuvvet"></a>

### Çubuk kuvvetleri: bağımsız bir denetim

Serbest cisim diyagramındaki kuvvetler Lagrange denklemlerinden değil, her kütle için ayrı ayrı yazılan Newton'un ikinci yasasından hesaplanır: ivmeler bilindiğinde, en alttaki kütleden başlanarak her çubuğun taşıması gereken kuvvet bulunur. İdeal bir çubuk yalnızca kendi doğrultusunda kuvvet taşır; dolayısıyla hesaplanan kuvvetin çubuğa dik bileşeni, iki türetim tutarlıysa sıfır olmalıdır. Rastgele seçilmiş 200 durumda dik bileşenin gerilmeye oranı $`6 \times 10^{-15}`$ değerini aşmaz. Tek sarkaçta sonuç bilinen $`T = m(g\cos\theta + L\dot\theta^2)`$ bağıntısına iner.

> **Not — Negatif gerilme**
>
> Hızlı hareketlerde bir çubuktaki eksenel kuvvet işaret değiştirebilir: çubuk çekilmek yerine itilir. Rijit çubuk bunu taşır; aynı düzenek iple kurulsaydı ip o anda gevşerdi. Ölçümler sekmesi bu durumu “basma” olarak belirtir.

<a id="sarkac-esik"></a>

### Tepeden aşma için enerji eşiği

$`k`$. çubuğun dimdik yukarı konumdan ($`\theta_k = \pi`$) geçebilmesi için mekanik enerjinin en az o çubuğa ait potansiyel enerji terimi kadar olması gerekir. Bütün çubuklar için en küçük eşik

```math
E^{\ast} = \min_k\; 2\,g\,\mu_kL_k \tag{3.8}
```

değerindedir. Mekanik enerji bunun altındaysa hiçbir çubuk tepeden aşamaz; üstünde olması ise gerekli ama yeterli olmayan bir koşuldur. Eşit kütleli ve eşit boylu noktasal kütleli çift sarkaç durgun bırakıldığında koşul $`2\cos\theta_1 + \cos\theta_2 > 1`$ biçimini alır: bu bölgeden bırakılan sarkaç hiçbir zaman takla atamaz.

> **Yaygın yanılgı — “3 cos θ₁ + cos θ₂ > 2” koşulu başka bir modele aittir**
>
> Sık alıntılanan bu eşitsizlik, kütlesi çubuk boyunca düzgün dağılmış iki özdeş çubuktan oluşan bileşik çift sarkaç için geçerlidir [[57](#ref-57), [58](#ref-58)]. Buradaki model noktasal kütleli olduğundan katsayılar farklıdır; iki koşul birbirinin yerine kullanılamaz.

<a id="sayisal"></a>

## 4. Sayısal yöntemler

*Kullanılan tek adımlı yöntemler, kararlılık ve enerji davranışları, ekran hızından bağımsız sabit adımlı döngü, çarpma anının bulunması ve uyarlamalı adım.*

<a id="sayisal-yontemler"></a>

### Tek adımlı açık yöntemler

Her iki model birinci mertebe bir sistem olarak yazılır, $`\dot{\mathbf{y}} = \mathbf{f}(t,\mathbf{y})`$; osilatörde $`\mathbf{y} = (x, \dot{x}, \varphi, Q_c, W)`$, sarkaçta $`\mathbf{y} = (\theta_1,\dots,\theta_N, \dot\theta_1,\dots,\dot\theta_N, Q_b)`$. Enerji defterinin integral terimleri durum vektörünün parçasıdır; dolayısıyla hareketle aynı doğrulukta integre edilirler. Varsayılan yöntem klasik dördüncü mertebe Runge–Kutta yöntemidir [[59](#ref-59), [60](#ref-60), [61](#ref-61)]:

```math
\begin{aligned} \mathbf{k}_1 &= \mathbf{f}(t_n, \mathbf{y}_n), & \mathbf{k}_2 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_1\right), \\ \mathbf{k}_3 &= \mathbf{f}\!\left(t_n + \tfrac{h}{2},\, \mathbf{y}_n + \tfrac{h}{2}\mathbf{k}_2\right), & \mathbf{k}_4 &= \mathbf{f}(t_n + h,\, \mathbf{y}_n + h\,\mathbf{k}_3), \\ \mathbf{y}_{n+1} &= \mathbf{y}_n + \tfrac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right) \end{aligned} \tag{4.1}
```

Mertebesi $`p`$ olan bir yöntemin tek adımdaki hatası $`O(h^{p+1})`$, sabit bir zaman aralığının sonundaki toplam hatası $`O(h^p)`$ büyüklüğündedir [[61](#ref-61), [62](#ref-62)]. Çizelge 4.1'deki öbür yöntemler karşılaştırma ve öğretim amacıyla seçilebilir: düşük mertebeli bir yöntemin ne yaptığını görmek, yüksek mertebeli yöntemin neden gerektiğini anlamanın en kısa yoludur.

*Çizelge 4.1. Seçilebilen yöntemler ve doğrulama deneyinde gözlenen mertebeler.*

| Yöntem | Mertebe | Gözlenen mertebe | Adım başına türev sayısı | Not |
| --- | --- | --- | --- | --- |
| Açık Euler | 1 | 1,007 | 1 | Sönümsüz osilatörde enerji her adımda büyür |
| Simplektik Euler | 1 | 1,005 | 1 | Osilatörde enerji hatası sınırlı kalır |
| Orta nokta (RK2) | 2 | 2,0005 | 2 | – |
| Klasik Runge–Kutta (RK4) | 4 | 4,005 | 4 | Varsayılan |
| Dormand–Prince 5(4) | 5 | 5,02 | 7 | Gömülü hata kestirimi, uyarlamalı adım |

Gözlenen mertebe, kapalı biçimli çözümü bilinen bir problemin iki adım büyüklüğüyle çözülmesinden hesaplanır, $`p = \ln(e_1/e_2)/\ln(h_1/h_2)`$; kodun yöntemi doğru uyguladığının en doğrudan kanıtıdır [[63](#ref-63), [64](#ref-64), [65](#ref-65)].

<a id="sayisal-kararlilik"></a>

### Kararlılık ve enerji davranışı

Yöntemlerin sönümsüz osilatördeki davranışı kapalı biçimde bilinir. $`z = h\omega_0`$ olmak üzere açık Euler adımı enerjiyi her adımda tam olarak $`1 + z^2`$ ile çarpar; yani adım ne kadar küçük olursa olsun enerji üstel büyür. Klasik RK4 için çarpan

```math
\frac{E_{n+1}}{E_n} = 1 - \frac{z^6}{72} + \frac{z^8}{576}, \qquad z = h\omega_0 \tag{4.2}
```

biçimindedir: yöntem enerjiyi çok yavaş **yitirir** ve sanal eksen üzerinde $`|z| \le 2\sqrt{2}`$ için kararlıdır [[66](#ref-66), [67](#ref-67)]. Varsayılan $`h = 1`$ ms adımla, parametre aralığının en sert osilatöründe ($`k = 80`$ N/m, $`m = 0{,}5`$ kg, $`\omega_0 = 12{,}6`$ rad/s) adım başına bağıl kayıp $`6 \times 10^{-14}`$, 60 saniyede toplam $`3 \times 10^{-9}`$ değerindedir. Simplektik Euler yöntemi osilatörde değiştirilmiş bir enerjiyi tam olarak korur ve $`z < 2`$ için sınırlı kalır [[68](#ref-68)].

> **Sınırlılık — Açık Runge–Kutta yöntemleri simplektik değildir**
>
> Hiçbir açık Runge–Kutta yöntemi Hamilton sistemlerinin faz uzayı yapısını tam olarak korumaz [[69](#ref-69), [67](#ref-67)]. Buradaki simplektik Euler de yalnızca ayrılabilir Hamilton fonksiyonları için simplektiktir; sarkaç zincirinin kütle matrisi açılara bağlı olduğundan bu özellik zincirde geçerli değildir. Sönüm, sürücü ve çarpma içeren genel durumda sistem zaten Hamilton sistemi değildir. Bu çalışmada enerji korunumu varsayılmaz, ölçülür: enerji defterinin kalıntısı her an ekrandadır.

<a id="sayisal-dongu"></a>

### Sabit adımlı döngü ve yeniden üretilebilirlik

Her canlandırma karesinin duvar saati süresi, zaman ölçeğiyle çarpılarak bir bütçeye eklenir. Bütçe tam olarak $`h = 1/f_s`$ büyüklüğünde adımlarla harcanır; artan kısım sonraki kareye devreder [[70](#ref-70)]. Adım frekansı $`f_s`$ 60, 120, 300, 600, 1000 ya da 2000 Hz olarak seçilebilir; varsayılan değer 1000 Hz'tir. Tek bir kare bütçeye en çok 0,1 s'lik duvar saati süresi ekler; bu, 2000 Hz'te ve en büyük zaman ölçeği olan 2'de 400 adım eder. Daha uzun süren kare 0,1 saniyeye kırpılır: artan bölüm benzetime aktarılmaz, benzetim zamanı duvar saatinin gerisinde kalır ve bu tür kareler son başlatmadan beri sayılır. Durum çubuğu sayıyı (“Geciken kare”), kareler yinelendiğinde, yani duvar saatiyle iki saniye içinde dört kez gösterir: sayfanın yüklenmesi, deneyin değiştirilmesi ya da kuram okuyucusunun açılması bir iki uzun kareye mal olur; bu, benzetimin yetişemediği anlamına gelmez. Sekme arka plandan döndüğünde kare süresinin ölçümü yeniden başlar; arka planda geçen süre bu yüzden ne benzetime aktarılır ne de sayılır. Adım büyüklüğü hiçbir zaman değişmez. Telemetri, 300 Hz ve üzerindeki adım frekanslarında 10 ms'de bir, 60 Hz ve 120 Hz'te ise her adımda kaydedilir.

Bu düzende durum dizisi yalnızca başlangıç koşullarına, parametrelere, yönteme ve $`h`$ değerine bağlıdır. Otomatik sınamalar bunu doğrudan denetler: aynı deney bir kez düzgün 60 Hz karelerle, bir kez rastgele kare süreleriyle yürütülür ve ortak adım sayılarındaki durumların bit düzeyinde eşit olduğu görülür. Deney dosyası ve paylaşım bağlantısı yalnızca bu girdileri taşır; alıcı aynı yörüngeyi yeniden üretir. Aynı nedenle yöntemin ya da adım frekansının değiştirilmesi sürmekte olan deneyi devam ettirmez: iki deney de başlangıç koşullarından yeniden başlar; böylece bir kayıt, o kaydın enerji defteri ve hata istatistikleri her zaman tek bir yönteme ve tek bir adıma aittir.

Benzetim zamanı adımların toplamıdır ve bu toplamın kendi yuvarlama hatası vardır. $`h = 1`$ ms değerini olağan kayan noktalı aritmetikle 600 000 kez toplamak $`7 \times 10^{-9}`$ s yitirir. Arabanın 6,9 m/s hıza ulaştığı “Sönümsüz” hazır deneyinde yalnızca bu kayıp, Bölüm 2'deki kapalı biçimli başvuru çözümünü, arabanın en hızlı olduğu yerde yaklaşık $`5 \times 10^{-8}`$ m kaydırırdı; bu, RK4 yönteminin aynı 600 s içindeki hatasının on katıdır. Osilatörün saati bu yüzden dengelemeli (Kahan) toplamayla ilerletilir; sürücünün fazı da biriktirilmek yerine saatten hesaplanır. Sarkacın denklemleri zamanı açık olarak içermez; saati olağan bir toplamdır ve yuvarlama hatası yalnızca kaydın zaman damgalarına yansır.

Çalışma zamanı her adımdan sonra çözümün sonlu aralıkta kalıp kalmadığını denetler. Sarkaçta bu, bütün açıların ve açısal hızların mutlak değerce $`10^7`$'nin (rad ve rad/s) altında olması demektir; denetim asıl yörüngeyi, gösterildiği sürece ikiz yörüngeyi ve Lyapunov kestiriminin gölge yörüngesini kapsar. Osilatörde konumun sonlu, hızın $`10^6`$ m/s'nin altında olması aranır. Denetim sağlanmazsa o adımdan önceki durum geri konur, deney durdurulur ve arayüz çözümün ıraksadığını bildirir; fizik çekirdeğinde oluşan bir istisna (exception) da deneyi aynı biçimde durdurur. Düşük mertebeli bir yöntem iri bir adımla böyle sonlanabilir: altı bağlantılı hazır zincir 60 Hz'te açık Euler yöntemiyle çözüldüğünde 12 s sonra durdurulur. Durdurma iki deney için de geçerlidir; deneylerden biri yeniden başlatıldığında ya da bir çözücü seçildiğinde kalkar ve her iki işlem ıraksayan deneyi de yeniden başlatır.

> **Sınırlılık — Yeniden üretilebilirliğin sınırı**
>
> Hesaplar IEEE 754 çift duyarlıklı sayılarla yapılır (53 bitlik anlamlı kısım, $`\varepsilon = 2^{-52} \approx 2{,}2 \times 10^{-16}`$) [[71](#ref-71), [72](#ref-72)]. Dört işlem ve karekök standartça tam tanımlıdır; trigonometrik fonksiyonların son basamağı ise çalışma ortamına göre değişebilir. Kaotik bir yörüngede $`10^{-16}`$ büyüklüğündeki bir fark, üstel $`\lambda \approx 1\ \mathrm{s^{-1}}`$ iken yaklaşık $`\ln(10^{16})/\lambda \approx 37`$ s içinde 1 rad düzeyine büyür. Bit düzeyinde yinelenebilirlik bu yüzden aynı çalışma ortamı için sınanmıştır; farklı tarayıcı motorları arasında karşılaştırma yapılmamıştır.

<a id="sayisal-olay"></a>

### Çarpma anının bulunması

Durdurucular hareket denklemini parçalı yapar; çarpma anı adımın içinde bulunmazsa hata adım büyüklüğüyle doğru orantılı olur ve yöntemin mertebesi yitirilir. Bir adımın sonunda araba sınırın dışına çıkmışsa, adımın $`s \in [0,1]`$ kesri üzerinde ikiye bölme yapılır: adımın başındaki durumdan $`s\,h`$ kadar ilerlenir ve arabanın hâlâ içeride kaldığı en büyük $`s`$ aranır. 52 yineleme, çift duyarlığın bütün basamaklarını tüketir. Sonra durum bu ana kadar ilerletilir, (2.9) uygulanır ve adımın kalan kısmı çözülür. Bir adımda altıdan fazla çarpma olursa (arabanın durdurucu üzerinde giderek küçülen sıçramaları) araba durdurucuda durgun kabul edilir ve kalan kinetik enerji ısıya yazılır.

Doğrulama deneyinde çarpma anı kapalı biçimli değerden $`9 \times 10^{-13}`$ s, çarpma hızı bağıl olarak $`3 \times 10^{-14}`$ sapar.

<a id="sayisal-uyarlamali"></a>

### Uyarlamalı adım: Dormand–Prince 5(4)

Dormand–Prince çifti aynı türev değerlendirmelerinden beşinci mertebe bir çözüm ile dördüncü mertebe bir karşılaştırma çözümü üretir; ikisinin farkı yerel hatanın kestirimidir [[73](#ref-73), [61](#ref-61)]. MATLAB'ın ode45 çözücüsü de bu çifte dayanır [[74](#ref-74)]. Uygulamada sabit dış adım $`h`$ korunur; yöntem bu adımı, kestirilen hata $`10^{-10}`$ bağıl ve $`10^{-12}`$ mutlak toleransın altında kalacak biçimde kendi iç adımlarına böler. Böylece adım dizisi yine kare süresinden bağımsızdır.

Sabit adımlı RK4 varsayılan parametrelerde yeterlidir: çift sarkaçta 60 saniyelik bağıl enerji sapması $`2 \times 10^{-9}`$, altı bağlantılı zincirde $`3 \times 10^{-7}`$ değerindedir. İzin verilen aralığın en zor köşesinde ise (üç ağır ve uzun bağlantı, üç hafif ve kısa bağlantıyı sürükler; açısal hızlar 140 rad/s değerini aşar) sabit adımın sapması $`1{,}5 \times 10^{-3}`$ düzeyine çıkar; Dormand–Prince aynı deneyde $`4 \times 10^{-9}`$ verir. Sabit adımlı bir yöntemle çözülen deneyde bağıl kalıntı $`10^{-5}`$ değerine ulaştığında durum çubuğu uyarlamalı yöntemle yeniden başlatmayı önerir; öneri kabul edildiğinde, her çözücü değişikliğinde olduğu gibi, iki deney de baştan başlar.

<a id="sayisal-cebir"></a>

### Doğrusal cebir ve özel fonksiyonlar

- **İvmeler.** (3.2) sistemindeki simetrik pozitif tanımlı matris her türev değerlendirmesinde Cholesky ayrışımıyla çözülür [[43](#ref-43)].
- **Normal modlar.** (3.6) problemi, $`\mathbf{M}`$ matrisinin Cholesky ayrışımıyla standart simetrik özdeğer problemine indirgenir ve Jacobi döndürmeleriyle çözülür [[75](#ref-75), [43](#ref-43)].
- **Laguerre sıfırları.** Doğrulamada başvuru değeri olarak kullanılan sıfırlar, üç terimli yineleme bağıntısından kurulan üç köşegenli matrisin özdeğerleri olarak hesaplanır [[76](#ref-76)].
- **Eliptik integral.** $`K(k)`$ aritmetik–geometrik ortalama ile hesaplanır [[48](#ref-48), [50](#ref-50)].

<a id="kaos"></a>

## 5. Deterministik kaos

*Başlangıç koşullarına duyarlılık, Lyapunov üstelinin kestirimi, öngörü ufku, kaosun hangi koşullarda olanaklı olduğu ve Poincaré kesiti.*

<a id="kaos-duyarlilik"></a>

### Başlangıç koşullarına duyarlılık

Deterministik bir sistemde aynı başlangıç koşulları her zaman aynı yörüngeyi verir. Kaotik bir sistemde ise birbirine çok yakın iki başlangıç koşulundan çıkan yörüngeler ortalamada üstel hızla ayrılır. Faz uzayında başlangıçta $`\delta_0`$ kadar ayrık iki yörünge için

```math
\lVert\delta(t)\rVert \approx \lVert\delta_0\rVert\,e^{\lambda t}, \qquad \lambda = \lim_{t\to\infty}\,\lim_{\lVert\delta_0\rVert\to 0}\frac{1}{t}\ln\frac{\lVert\delta(t)\rVert}{\lVert\delta_0\rVert} \tag{5.1}
```

ile tanımlanan $`\lambda`$ **en büyük Lyapunov üsteli**dir; varlığı ve hemen her başlangıç yönü için aynı değeri alması çarpımsal ergodik teoremle güvence altındadır [[77](#ref-77), [78](#ref-78)]. Pozitif bir üstel kaosun nicel işaretidir. Uygulama bu ayrılmayı iki yoldan gösterir: birinci açısı $`\delta_0`$ kadar farklı bırakılan görünür bir **ikiz sarkaç** ve arka planda sürekli çalışan bir üstel kestirimi.

> **Yaygın yanılgı — Lorenz'in yuvarlanmış sayısı**
>
> Duyarlılığın keşfine ilişkin ünlü olay 1963 tarihli makaleden [[79](#ref-79)] değil, 1961 kışından kalmadır ve üç değişkenli ünlü sistemle değil, on iki değişkenli bir hava modeliyle ilgilidir. Lorenz kendi anlatımında üç basamağa yuvarlanmış bir çıktı satırını yeniden girdiğini söyler, ama rakam vermez [[80](#ref-80)]; sık alıntılanan 0,506127 ve 0,506 sayıları Gleick'in kitabından gelir [[81](#ref-81)]. “Kelebek” benzetmesi ise 1972 tarihli bir konuşmanın başlığıdır [[82](#ref-82)].

<a id="kaos-benettin"></a>

### Lyapunov üstelinin kestirimi

Üstel, Benettin, Galgani ve Strelcyn'in iki yörüngeli yöntemiyle kestirilir [[83](#ref-83), [84](#ref-84)]. Asıl yörüngenin yanında, faz uzayında ondan $`d_0 = 10^{-8}`$ uzaklıkta bir gölge yörünge aynı yöntemle ve aynı adımla çözülür. Her $`\tau`$ aralığının sonunda ayrılık $`d_k`$ ölçülür ve gölge, ayrılığın o andaki doğrultusu korunarak yeniden $`d_0`$ uzaklığına çekilir; $`\tau`$, 300 Hz ve üzerindeki adım frekanslarında 0,01 s, 60 Hz ve 120 Hz'te ise bir adımdır. Akan kestirim

```math
\lambda(t) = \frac{1}{t}\sum_{k=1}^{t/\tau}\ln\frac{d_k}{d_0} \tag{5.2}
```

biçimindedir. Yeniden ölçekleme, ayrılığın doğrusal büyüme bölgesinde kalmasını sağlar; aynı düşüncenin bütün üstelleri veren genellemesi için bkz. [[85](#ref-85), [86](#ref-86)], deneysel zaman serilerinden kestirim için [[87](#ref-87)]. Uzaklık, açıların ve açısal hızların oluşturduğu $`2N`$ boyutlu uzayda Öklid normuyla ölçülür.

> **Sınırlılık — Gösterilen değer sonlu süreli bir kestirimdir**
>
> $`\lambda(t)`$ ancak $`t \to \infty`$ sınırında üstele yakınsar. Düzenli harekette kestirim yaklaşık $`\ln t/t`$ gibi sıfıra iner; bu yüzden kısa bir gözlemde küçük ama pozitif bir değer kaos kanıtı değildir. Doğrulama deneylerinde 400 saniyelik kestirim tek sarkaçta 0,017, küçük açılı çift sarkaçta 0,003, kaotik çift sarkaçta 1,04 $`\mathrm{s^{-1}}`$ değerindedir. Adım yarıya indirildiğinde kaotik değer %7 değişir: fark yöntemin değil, sonlu süreli ortalamanın belirsizliğidir.

<a id="kaos-ufuk"></a>

### Öngörü ufku

Başlangıç durumu $`\delta_0`$ belirsizlikle biliniyorsa ve $`a`$ büyüklüğündeki bir hata öngörünün başarısızlığı sayılıyorsa, öngörü yaklaşık şu süre boyunca anlamlıdır [[88](#ref-88)]:

```math
t_\mathrm{u} \approx \frac{1}{\lambda}\,\ln\frac{a}{\delta_0} \tag{5.3}
```

Bağımlılık logaritmiktir: başlangıç belirsizliğini bin kat küçültmek ufku yalnızca $`\ln 1000/\lambda \approx 6{,}9/\lambda`$ kadar uzatır. Bağıntı bir büyüklük mertebesi kestirimidir; yerel büyüme hızı yörünge boyunca değiştiğinden gözlenen ayrılma süresi bundan birkaç kat farklı olabilir. Uygulama kestirilen ufku, ikizin bırakıldığı andan 1 rad ayrıldığı ana kadar gerçekten geçen süreyle yan yana verir.

> **Not — Hava tahmini**
>
> Aynı düşünce atmosfere uygulandığında, orta enlemlerde günlük hava olaylarının öngörülebilirliğinin **içkin** sınırı yaklaşık iki hafta, bugünkü modeller ve çözümlemelerle **uygulamadaki** sınırı yaklaşık on gün olarak bulunmuştur [[89](#ref-89)]; böyle bir sınırın varlığına ilişkin klasik çalışma Lorenz'e aittir [[90](#ref-90)].

<a id="kaos-kosul"></a>

### Kaos ne zaman olanaklıdır

Sürücüsüz tek sarkacın faz uzayı iki boyutludur $`(\theta, \dot\theta)`$. Poincaré–Bendixson teoremine göre düzlemdeki özerk bir akışta sınırlı bir yörünge ancak bir denge noktasına, kapalı bir yörüngeye ya da bunları birleştiren eğrilere yaklaşabilir; kaos için en az üç boyutlu bir faz uzayı gerekir [[88](#ref-88), [91](#ref-91)]. Tek sarkaç bu yüzden ne kadar büyük açıyla bırakılırsa bırakılsın kaotik olamaz; üstel kestirimi sıfıra iner. Çift sarkacın faz uzayı dört boyutludur ve enerji korunumu hareketi üç boyutlu bir yüzeye kısıtlar: kaos olanaklıdır.

Olanaklı olması her yörüngenin kaotik olduğu anlamına gelmez. Küçük enerjide çift sarkacın hareketi iki normal modun toplamıdır ve düzenlidir; enerji arttıkça faz uzayının giderek büyüyen bölümü kaotik olur [[92](#ref-92), [93](#ref-93)]; çok yüksek enerjide yerçekimi dönme enerjisinin yanında önemsiz kalır ve hareket yeniden düzenlileşir [[58](#ref-58), [94](#ref-94)]. Gerçek bir çift sarkaçta, stroboskop fotoğraflarından ölçülen ayrılma hızı $`7{,}5 \pm 1{,}5\ \mathrm{s^{-1}}`$ değerindedir [[95](#ref-95)]; bu değer düzeneğe ve enerjiye özgüdür ve $`\sqrt{g/L}`$ ile ölçeklenir.

<a id="kaos-poincare"></a>

### Poincaré kesiti

Çift sarkacın üç boyutlu enerji yüzeyindeki yörüngeyi görmenin yolu, onu iki boyutlu bir yüzeyle kesmektir. Uygulama $`\theta_2 = 0`$ (mod $`2\pi`$) yüzeyini, $`\theta_2`$ artarken her geçişte kaydeder ve $`(\theta_1, p_1)`$ noktasını işaretler; $`p_1`$, $`\theta_1`$ açısına eşlenik kanonik momentumdur:

```math
p_1 = \frac{\partial L}{\partial\dot\theta_1} = \sum_{j=1}^{N}\mu_{\max(1,j)}\,L_1L_j\cos(\theta_1-\theta_j)\,\dot\theta_j \tag{5.4}
```

Kanonik değişkenlerin seçilmesi kesit dönüşümünü alan koruyan bir dönüşüm yapar. Düzenli bir yörünge değişmez bir tor üzerinde kalır ve kesitte kapalı bir eğri çizer; kaotik bir yörünge kesitte bir alanı doldurur [[96](#ref-96), [78](#ref-78)]. Geçiş anı ardışık iki adım arasında doğrusal ara değerlemeyle bulunur; bu, $`h = 1`$ ms adımda grafiğin çözünürlüğünün çok altında bir hata verir. Kesit yüzeyine tam olarak inen yöntem için bkz. [[97](#ref-97)].

<a id="kaos-dogruluk"></a>

### Kaotik yörüngelerde sayısal doğruluk ne anlama gelir

Kaotik bir yörüngede sayısal hata da fiziksel ayrılık gibi üstel büyür. Çift sarkaçta adım başına bağıl enerji hatası $`10^{-14}`$ düzeyindedir; bu kadar küçük bir fark bile, $`\lambda \approx 1\ \mathrm{s^{-1}}`$ iken yaklaşık $`\ln(10^{14})/\lambda \approx 30`$ s içinde yörüngeyi tam çözümünden bütünüyle ayırır. Bu, hiçbir sonlu duyarlıklı hesabın aşamayacağı bir sınırdır ve çözücünün kusuru değildir. Uzun süreli kaotik bir benzetimde anlamlı olan, tek tek durumlar değil yörüngenin istatistiksel ve geometrik özellikleridir: Lyapunov üsteli, Poincaré kesitinin yapısı, enerjinin korunumu. Doğrulama deneyleri bunu ölçer: kaotik çift sarkaç 5 s ileri ve 5 s geri çözüldüğünde başlangıç durumuna $`4 \times 10^{-10}`$ rad hatayla döner; düzenli harekette aynı deney 20 s için $`5 \times 10^{-12}`$ rad verir.

<a id="olcum"></a>

## 6. Ölçüm ve çözümleme araçları

*Kuramın benzetimin kendi formülleriyle değil, ondan yapılan ölçümlerle karşılaştırılmasını sağlayan sanal cihazlar ve grafikler.*

<a id="olcum-cihazlar"></a>

### Sanal cihazlar

Bir benzetimde kuramsal değeri ekrana yazmak kolaydır, ama bu bir doğrulama değildir. Buradaki cihazlar yalnızca örneklenmiş çözümü görür ve bir deneycinin kronometreyle, cetvelle ve osiloskopla yapacağı ölçümü yapar:

- **Periyot ölçer.** İşaretin aynı yöndeki ardışık sıfır geçişleri arasındaki süreyi ölçer; geçiş anı iki örnek arasında doğrusal ara değerlemeyle bulunur. Yukarı ve aşağı yönlü geçişler ayrı ayrı izlenir; bu yüzden bir salınımın her periyodu iki aralık verir (dönen sarkacın her turu bir aralık). Son on iki aralığın ortalaması ve standart sapması gösterilir. Sarkaçta $`\sin\theta`$ izlenir ve yalnızca alt noktadaki geçişler sayılır; böylece tepeden aşan sarkacın dönme periyodu da ölçülür.
- **Tepe dedektörü.** Uç değerler en büyük örnek aranarak değil, hızın sıfır geçişinden bulunur; bu, örnekleme aralığından çok daha ince bir zaman çözünürlüğü verir. Genlik, son tepe ile son çukurun farkının yarısıdır.
- **Logaritmik azalma.** Ardışık pozitif tepelerden (2.5) ile hesaplanır; sönüm oranı $`\zeta = \Lambda/\sqrt{4\pi^2 + \Lambda^2}`$ bağıntısından elde edilir.
- **Kararlı durum ölçütü.** Üç koşul birlikte aranır. Bir salınımdan ötekine tepeden tepeye genlik %1'den az değişmeli ve salınım merkezi, yani son tepe ile son çukurun orta noktası, genliğin %1'inden az kaymalıdır. Ayrıca son değişiklikten (yeniden başlatma, parametre değişikliği, çarpma) bu yana, geçici rejimin en yavaş sönen teriminin %1'ine inmesine yeten $`\ln 100/r`$ süresi geçmiş olmalıdır; burada $`\zeta \le 1`$ için $`r = \gamma`$, $`\zeta > 1`$ için $`r = \gamma - \sqrt{\gamma^2 - \omega_0^2}`$ alınır. Birinci koşul tek başına yetmez: yavaş sönen bir geçici rejim genliği salınım başına yalnızca kendi büyüklüğünün $`e^{rT} - 1`$ katı kadar değiştirir, dolayısıyla gözlenen değişimin birkaç katı büyüklükte olabilir. Salınmayan bir geçici terim, örneğin aşırı sönümlü sistemin yavaş sönen üsteli, tepeden tepeye genliği hiç değiştirmez; yalnızca merkezi kaydırır ve bunu ikinci koşul yakalar. Sönüm yokken bekleme süresi sonsuzdur ve kararlı durum bildirilmez. Faz gecikmesi, yer değiştirmenin son tepesi anındaki sürücü fazıdır.
- **Basamak yanıtı ölçer.** Durgun bırakılan kütle için aşımı, yani dengenin ötesindeki en uç örneğin başlangıç yer değiştirmesine oranını, ve yerleşme süresini, yani $`|x|`$ değerinin başlangıç yer değiştirmesinin %2'si içinde kalmaya başladığı anı ölçer. Bu banda giriş anı, bandın dışındaki son örnek ile içindeki ilk örnek arasında doğrusal ara değerlemeyle bulunur; değer, yanıt bu sürenin dörtte biri kadar ve en az 0,25 s bandın içinde kaldıktan sonra gösterilir. Yanında verilen kuramsal değer, eldeki sönüm oranı için (2.3) ve (2.4) kapalı biçimli çözümlerinin yerleşme süresidir ve ikiye bölme yöntemiyle bulunur; $`\zeta = 1`$ için $`5{,}834/\omega_0`$ değerine eşittir. Bırakıştan sonra bir parametre değiştirilirse ölçüm sona erer ve bir sonraki bırakışla yeniden başlar.

Ölçümler sekmesi her büyüklük için kuramsal değeri, ölçülen değeri ve aradaki sapmayı yan yana verir. Deney föylerinin tamamlanma ölçütleri de bu cihazların okumalarına bağlıdır; bir kaydırıcıyı doğru konuma getirmek föyü tamamlamaz, ölçümün yapılması gerekir.

<a id="olcum-spektrum"></a>

### Genlik spektrumu

Kaydedilen işaretin en yeni örnekleri Hann penceresiyle çarpılır ve hızlı Fourier dönüşümüyle çözümlenir [[98](#ref-98), [99](#ref-99)]. Çözümlenen kayıt $`N`$ örnekten oluşur; $`N`$, son başlatmadan beri kaydedilen telemetrinin doldurabildiği, ikinin en büyük kuvvetidir: en az 256 (100 Hz'lik telemetriyle 2,56 s), en çok 4096 (41 s). Kayıt hiçbir zaman sıfırlarla uzatılmaz; bu yüzden frekans çözünürlüğü kaydın kendi çözünürlüğüdür, $`f_s/N`$: 100 Hz'te en kısa kayıt için 0,39 Hz, en uzun kayıt için $`100/4096 = 0{,}024`$ Hz. Örnekleme frekansı $`f_s`$ kaydın zaman damgalarından alınır; 100 Hz'tir, yalnızca 60 Hz ve 120 Hz adım frekanslarında adım frekansına eşittir. Pencerenin tutarlı kazancı 0,5 ve eşdeğer gürültü bant genişliği 1,5 kutudur [[100](#ref-100)]; genlik ekseni tutarlı kazanca göre ölçeklenir, böylece frekansı bir kutuya tam denk gelen bir sinüs kendi genliğiyle okunur. Bir sinüsün frekansı genellikle iki kutunun arasına düşer; tepe frekansı ve genliği o zaman en büyük iki kutudan, Hann penceresi için verilen ara değerleme bağıntısıyla elde edilir [[101](#ref-101)]. Bağıntı sabit genlikli bir çizgi ve aralarında kayıt süresinin tersi kadar fark bulunan kutular varsayar; kaydın sıfırlarla uzatılmamasının nedeni budur. Çizgi sıfır frekansa yakın olduğunda, negatif frekanstaki görüntüsü bağıntıyı bozar: 20 000 tek sinüsle yapılan bir denemede frekans okuması, tepe sıfır frekansın üstündeki ikinci kutudayken en kötü durumda %8, dördüncü kutudan başlayarak ise en çok %0,05 hata vermiştir. Grafik bu yüzden baskın tepeyi yalnızca spektrumun en güçlü kutusu $`4 f_s/N`$ frekansında ya da daha yukarıdaysa bildirir. Doğrulama deneyinde, 4096 örnekle ve çizgi 51. kutunun yakınındayken, 1,2345 Hz frekanslı bir sinüsün frekansı $`5 \times 10^{-9}`$ Hz, genliği bağıl olarak $`10^{-8}`$ hatayla geri elde edilir.

Spektrum, zaman grafiğinde seçilemeyen ayrımı gösterir: düzenli bir hareketin spektrumu birkaç keskin çizgiden (normal mod frekansları ve bunların birleşimleri) oluşur, kaotik bir hareketinki ise geniş bantlıdır. Grafikte kuramsal frekanslar işaretlenir.

<a id="olcum-grafikler"></a>

### Grafikler ve renkler

Zaman grafiği, faz portresi, enerji defteri, yanıt eğrisi, spektrum, ayrılma grafiği ve Poincaré kesiti aynı telemetriyi farklı sorulara yanıt verecek biçimde gösterir. Ayrılma grafiğinin düşey ekseni logaritmiktir; üstel büyüme orada eğimi $`\lambda`$ olan bir doğrudur. Her fiziksel büyüklük bütün görünümlerde aynı rengi taşır: sahnedeki vektör, grafikteki eğri, göstergedeki sayı. Renkler, renk görme farklılıklarında da ayırt edilebilen Okabe–Ito paletinden seçilmiştir [[102](#ref-102), [103](#ref-103)]; hiçbir nicelik yalnızca rengiyle tanıtılmaz.

<a id="olcum-veri"></a>

### Veri dışa aktarma

Telemetri CSV dosyası olarak indirilebilir. Sütun adları birimi taşır (örneğin $`t`$ için “t_s”, açı için “theta1_rad”); başlık satırları parametreleri, başlangıç koşullarını, yöntemi, adımı ve örnekleme aralığını kaydeder. Çözücü değişikliği yeni bir deney başlattığından, bir dosyadaki her satır başlıkta adı geçen yöntemle ve adımla hesaplanmıştır. Parametreler ise dışa aktarma anındaki değerleriyle yazılır: deney sürerken değiştirilen bir parametre ayrı bir olay olarak kaydedilmez ve değişiklikten önceki satırlar önceki değere aittir. Başlık satırları “#” ile başlar, alan ayırıcısını ve tırnak işaretini içermez; dosyayı CSV biçiminin kurallarına göre okuyan bir program bu yüzden her birini tek bir alan olarak alır ve altlarındaki çizelge bozulmaz. İki yazım sunulur: ondalık noktalı ve virgülle ayrılmış biçim (Python, MATLAB, R) ile ondalık virgüllü ve noktalı virgülle ayrılmış biçim (Türkçe ayarlı hesap tabloları). Deney tanımı ayrıca JSON dosyası ya da bağlantı olarak paylaşılabilir; veriler hiçbir sunucuya gönderilmez.

<a id="olcum-ses"></a>

### Sonifikasyon

Düzeneklerin mekanik frekansları duyma eşiğinin çok altındadır; duyulan ses bir kayıt değil, büyüklüklerin bilinçli olarak sese eşlenmesidir [[104](#ref-104)]. Osilatörde bir sinüs tonunun perdesi yer değiştirmeyi (3,5 m başına bir oktav), şiddeti hızı izler; durdurucuya çarpma, çarpma hızıyla ölçeklenen kısa bir tık sesi verir. Sarkaçta birinci çubuğun düşeyden her geçişi bir tıklamadır: tek sarkaç saat gibi düzenli, kaotik zincir düzensiz tıklar. Ses, kullanıcı açmadıkça çalmaz.

<a id="dogrulama"></a>

## 7. Doğrulama

*Çözücünün, yanıtı bağımsız olarak bilinen on dört problemde ölçülen hataları ve bu sonuçların neyi gösterip neyi göstermediği.*

<a id="dogrulama-yontem"></a>

### Doğrulama ve geçerleme ayrımı

Hesaplamalı bilimde iki ayrı soru sorulur [[105](#ref-105), [63](#ref-63)]. **Doğrulama** (verification) “denklemler doğru çözülüyor mu?” sorusudur ve matematiksel bir iştir: kodun yöntemi doğru uyguladığı ve sayısal hatanın bilinen sınırlar içinde kaldığı gösterilir. **Geçerleme** (validation) “doğru denklemler mi çözülüyor?” sorusudur ve ancak fiziksel bir deneyle karşılaştırılarak yanıtlanır.

Bu çalışma birincisini yapar. Kod doğrulaması için gözlenen yakınsama mertebesi ölçülür ve kapalı biçimli çözümlerle karşılaştırma yapılır [[64](#ref-64), [65](#ref-65)]; çözüm doğrulaması için korunum yasaları, adım küçültme, zamanda tersinirlik ve bağımsız iki yöntemin uyumu denetlenir. Deneyler tek bir kaynaktan (src/physics/validation.ts) üç yerde çalışır: otomatik sınama paketinde, bu okuyucunun Doğrulama sekmesinde ve teknik raporun ekinde.

> **Sınırlılık — Geçerleme yapılmamıştır**
>
> Model, gerçek bir yay–kütle düzeneği ya da gerçek bir çoklu sarkaçla karşılaştırılmamıştır. Dolayısıyla “doğrulanmış” sözü denklemlerin doğru çözüldüğünü anlatır; denklemlerin belirli bir fiziksel düzeneği ne kadar iyi temsil ettiğini anlatmaz (Bölüm 9).

<a id="dogrulama-sonuclar"></a>

### Sonuçların özeti

*Çizelge 7.1. Doğrulama deneylerinin özeti (klasik RK4, h = 1 ms). Her deneyin bütün satırları Doğrulama sekmesinde ve raporun ekinde verilir.*

| Deney | Ölçülen büyüklük | Sonuç | Tolerans |
| --- | --- | --- | --- |
| Yakınsama mertebesi | Gözlenen $`p`$ (RK4 için beklenen 4) | 4,005 | $`\pm 0{,}1`$ |
| Serbest yanıt, dört rejim, 20 s | En büyük konum hatası | $`1{,}6 \times 10^{-10}`$ m | $`10^{-9}`$ m |
| Kararlı durum, beş frekans | Genliğin bağıl hatası | $`3{,}3 \times 10^{-8}`$ | $`10^{-5}`$ |
| Kararlı durum, beş frekans | Faz gecikmesinin hatası | $`3{,}3 \times 10^{-8}`$ rad | $`10^{-3}`$ rad |
| Kritik sönüm | %2 yerleşme süresinin bağıl hatası | $`1{,}5 \times 10^{-7}`$ | $`2 \times 10^{-3}`$ |
| Durdurucuya çarpma | Çarpma anının hatası | $`8{,}6 \times 10^{-13}`$ s | $`10^{-8}`$ s |
| Enerji defteri, 27 çarpma, 60 s | En büyük bağıl kalıntı | $`1{,}3 \times 10^{-12}`$ | $`10^{-8}`$ |
| Sarkaç periyodu, 10°–170° ve dönme | Bağıl hata | $`2{,}3 \times 10^{-10}`$ | $`10^{-7}`$ |
| Enerji sapması, 60 s | $`N = 1;\ 2;\ 3;\ 6`$ | $`4{,}7 \times 10^{-13}`$; $`2{,}0 \times 10^{-9}`$; $`2{,}4 \times 10^{-8}`$; $`3{,}3 \times 10^{-7}`$ | $`10^{-6}`$ |
| Özfrekanslar | Laguerre sıfırlarından bağıl sapma | $`8{,}5 \times 10^{-16}`$ | $`10^{-10}`$ |
| Lagrange ve Newton türetimleri | Enine kuvvet / gerilme | $`5{,}3 \times 10^{-15}`$ | $`10^{-10}`$ |
| Lyapunov üsteli, 400 s | Düzenli; kaotik | $`\le 0{,}017`$; $`1{,}04\ \mathrm{s^{-1}}`$ | $`\le 0{,}05`$; $`\ge 0{,}5\ \mathrm{s^{-1}}`$ |
| Zamanda tersinirlik, 20 s | Başlangıç durumuna dönüş hatası | $`4{,}6 \times 10^{-12}`$ rad | $`10^{-9}`$ rad |
| RK4 ile Dormand–Prince | Adım dört kat küçülünce hata oranı | 256,6 | $`256 \pm \%25`$ |
| Spektrum çözümleyici | Tepe frekansının hatası | $`4{,}6 \times 10^{-9}`$ Hz | $`10^{-4}`$ Hz |

Bu değerler geliştirme makinesinde ölçülmüştür. Doğrulama sekmesindeki düğme aynı deneyleri okuyucunun kendi tarayıcısında, o anda yüklü olan kodla yeniden çalıştırır; sonuçların burada verilenlerle aynı büyüklük mertebesinde çıkması beklenir.

<a id="dogrulama-yorum"></a>

### Sonuçların yorumu

- **Toleranslar ölçülen hatalardan geniştir, ama her ölçütte aynı oranda değil.** Güvenlik payı, yani toleransın ölçülen hataya (alt sınır ölçütlerinde ölçülen değerin sınıra) oranı, 67 ölçütün 47'sinde iki büyüklük mertebesi ya da daha fazla, 12'sinde bir ile iki mertebe arasında, 8'inde ise on katın altındadır. Bu sekiz ölçütten Çizelge 7.1'de yer alanlar sönümsüz serbest yanıt (6 kat), altı bağlantılı zincirin enerji sapması (3 kat) ve iki Lyapunov sınırıdır (3 ve 2 kat). Ötekiler Dormand–Prince yönteminin gözlenen mertebesi (4 kat), parametre aralığının en zor köşesinde sabit adımın sapması (6 kat), adım yarıya indirildiğinde Lyapunov kestirimindeki değişim (4 kat) ve altı bağlantılı zincirin asılı iple karşılaştırılmasıdır (1,3 kat); bu sonuncusunda ölçülen fark sayısal bir hata değil, altı bağlantı ile sürekli ortam arasındaki fiziksel farktır. Toleranslar, deneylerin farklı çalışma ortamlarında da geçmesi ve gerçek bir kod hatasını (mertebenin düşmesi, yanlış bir katsayı) yine de yakalaması için seçilmiştir; güvenlik payı dar olan ölçütlerin başka bir ortamda geçip geçmediği sınanmamıştır (Bölüm 9).
- **Enerji sapması bağlantı sayısıyla büyür.** Daha çok bağlantı daha yüksek açısal hızlar ve daha sert bir doğrusal olmayan bağlaşım demektir; aynı adımla altı bağlantılı zincirin sapması çift sarkacınkinin yaklaşık 160 katıdır, ama hâlâ $`10^{-6}`$ değerinin altındadır.
- **Adım büyüklüğü belirleyicidir.** Çift sarkaçta adım 1 ms yerine 3,3 ms seçildiğinde sapma $`2{,}0 \times 10^{-9}`$ değerinden $`5{,}3 \times 10^{-7}`$ değerine çıkar. Açık Euler aynı deneyde, aynı adımla enerji defterinde %24'lük bir sapma üretir; bu satır pakette bilerek bir **alt sınır** ölçütü olarak durur.
- **Yöntemin mertebesi kaotik yörüngede de gözlenir.** Üç bağlantılı zincirde RK4 ile hata denetimli başvuru çözümü arasındaki fark, adım dört kat küçültüldüğünde 256,6 kat küçülür; dördüncü mertebe bir yöntem için beklenen değer $`4^4 = 256`$ olur.
- **İki bağımsız türetim örtüşür.** Hareket denklemleri Lagrange yöntemiyle, çubuk kuvvetleri Newton yasalarıyla hesaplanır; aralarındaki tutarsızlık makine duyarlığı düzeyindedir. Bu, modelin kodlanmasındaki bir işaret ya da indis hatasına karşı en güçlü denetimdir.

<a id="yanilgilar"></a>

## 8. Yaygın yanılgılar ve düzeltmeleri

*Salınım ve kaos anlatılırken sık yinelenen, ama kaynaklara bakıldığında doğru çıkmayan ya da eksik kalan ifadeler.*

<a id="yanilgilar-rezonans"></a>

### Rezonans üzerine

> **Yaygın yanılgı — “Tacoma Narrows köprüsü rezonans yüzünden yıkıldı”**
>
> 7 Kasım 1940'ta köprü yaklaşık 19 m/s hızındaki sabit bir rüzgârda 0,2 Hz frekanslı burulma hareketiyle yıkılmıştır. Girdap kopması açıklaması tutmaz: o rüzgâr hızında kopma frekansı yaklaşık 1 Hz, yani gözlenen frekansın beş katıdır ve ortada periyodik bir dış kuvvet yoktur. Olay, yapının kendi hareketine bağlı aerodinamik momentin burulma sönümünü negatif yaptığı, kendi kendini besleyen bir aeroelastik çırpınmadır [[106](#ref-106), [107](#ref-107)]. Zorlanmış rezonansta denklemin sağ yanında dış bir kuvvet vardır ve genliği sönüm sınırlar; çırpınmada sönüm katsayısının kendisi işaret değiştirir. Uygulamadaki sürülen osilatör birincisinin modelidir.

> **Yaygın yanılgı — “Rezonans tam doğal frekansta olur”**
>
> Soğurulan güç ve hız genliği için doğrudur. Yer değiştirme genliği ise $`\omega_0\sqrt{1-2\zeta^2}`$ değerinde, yani doğal frekansın altında en büyüktür ve $`\zeta \ge 1/\sqrt{2}`$ için hiç tepe yapmaz (Bölüm 2). Zayıf sönümde fark küçüktür: $`\zeta = 0{,}1`$ için tepe $`\omega_0`$ değerinin %1 altındadır ve tam $`\omega_0`$ değerindeki genlik tepe değerinin %99,5'idir. “Rezonans tepesini bul” föyü bu yüzden $`\zeta = 0{,}25`$ ile kurulur; bu sönümde tepe $`\omega_0`$ değerinin %6,5 altındadır ve $`\omega_0`$ değerindeki genlik tepe değerinin %96,8'inde kalır. Föy, kararlı durumda ölçülen genliğin tepe değerinin en az %98'i olmasını ister; dolayısıyla doğal frekansta değil, onun altında tamamlanır.

> **Yaygın yanılgı — “Köprüler uygun adım yürüyen askerler yüzünden yıkılır”**
>
> Belgelenmiş olay 12 Nisan 1831'de Manchester yakınındaki Broughton asma köprüsüdür: uygun adım yürüyen 74 askerin altında köprü çökmüş, ölen olmamıştır; dönemin raporu çöküşü bir askı zinciri bağlantısındaki kusurlu cıvataya bağlar [[108](#ref-108)]. Londra'daki Millennium Köprüsü'nün 10 Haziran 2000'deki yanal sallantısı ise uygun adım yürüyüş değildir: yayalar adımlarını köprünün hareketine uydurdukça sallantı büyümüş, denetimli deneyde yanıt 166 yayaya kadar küçük kalıp sonra hızla artmıştır [[109](#ref-109), [110](#ref-110)]. Sonraki çalışmalar kararsızlığın eşzamanlanma olmadan da ortaya çıkabildiğini gösterir [[111](#ref-111)].

> **Yaygın yanılgı — “Opera sanatçıları sesleriyle kadeh kırar”**
>
> Sahnede bunu yaptığı doğrulanmış bir opera sanatçısı yoktur. Olay fiziksel olarak olanaklıdır ve denetimli koşullarda, yükseltici kullanılmadan bir kez belgelenmiştir [[112](#ref-112)]; laboratuvar gösterileri ise kadehin doğal frekansına kilitlenen, yükseltilmiş ses kullanır [[113](#ref-113)].

<a id="yanilgilar-sonum"></a>

### Sönüm üzerine

> **Yaygın yanılgı — “Otomobil amortisörleri kritik sönümlüdür”**
>
> Binek araçların süspansiyonunda sönüm oranı tipik olarak 0,2–0,4 arasındadır, yani belirgin biçimde zayıf sönümlüdür; yarış araçlarında değer 1'e yaklaşır [[114](#ref-114), [115](#ref-115)]. Kritik sönüm sürüş konforu için fazla serttir.

> **Yaygın yanılgı — “Sönüm ne kadar büyükse sistem o kadar çabuk durur”**
>
> Kritik değerin üstünde sönümü artırmak dönüşü yavaşlatır, çünkü yavaş sönen üstel terim baskın olur. Aşımsız en hızlı dönüş $`\zeta = 1`$ değerindedir; küçük bir aşıma izin verilirse en kısa yerleşme $`\zeta \approx 0{,}78`$ dolayındadır (Bölüm 2).

<a id="yanilgilar-sarkac"></a>

### Sarkaç üzerine

> **Yaygın yanılgı — “Sarkacın periyodu genlikten bağımsızdır”**
>
> Galileo'nun eşzamanlılık gözlemi [[116](#ref-116), [117](#ref-117)] yalnızca küçük açılar için yaklaşık olarak doğrudur: periyot 10° genlikte %0,19, 30° genlikte %1,7, 90° genlikte %18 uzar. Huygens tam eşzamanlı eğrinin sikloit olduğunu 1659'da bulmuş ve *Horologium Oscillatorium* (1673) içinde yayımlamıştır [[118](#ref-118), [119](#ref-119)].

> **Not — Saniye sarkacı ve metre**
>
> Periyodu 2 s olan sarkacın boyu standart yerçekiminde $`g/\pi^2 = 0{,}9936`$ m'dir. Bu yakınlık rastlantı değildir: 1790'da uzunluk birimi olarak saniye sarkacının boyu önerilmiş, Akademi komisyonu 19 Mart 1791 tarihli raporunda çeyrek meridyenin on milyonda birini yeğlemiştir [[120](#ref-120)].

<a id="yanilgilar-kaos"></a>

### Kaos üzerine

> **Yaygın yanılgı — “Kaos rastgeleliktir”**
>
> Kaotik bir sistem bütünüyle deterministiktir; aynı başlangıç koşulları aynı yörüngeyi verir ve uygulamada her deney aynen yinelenebilir. Öngörülemezlik, başlangıç koşullarının sonlu duyarlıkla bilinmesinden ve hatanın üstel büyümesinden doğar [[88](#ref-88)].

> **Yaygın yanılgı — “Çift sarkaç kaotiktir”**
>
> Kaos sistemin değil, yörüngenin özelliğidir. Aynı çift sarkaç küçük enerjide düzenli, ara enerjilerde büyük ölçüde kaotik, çok yüksek enerjide yeniden düzenlidir [[58](#ref-58), [92](#ref-92)]. “Düzenli ada” föyü bunu ölçtürür.

> **Yaygın yanılgı — “Tek sarkaç büyük açılarda kaotik olur”**
>
> Sürücüsüz tek sarkacın faz uzayı iki boyutludur ve Poincaré–Bendixson teoremi kaosu dışlar [[88](#ref-88)]. Büyük açıda değişen şey periyottur, öngörülebilirlik değil. Tek sarkaçta kaos ancak periyodik bir sürücüyle, yani üçüncü bir faz uzayı boyutuyla ortaya çıkar [[121](#ref-121)]; bu model burada yoktur.

> **Yaygın yanılgı — “Kırbacın ucu ses duvarını aşar ve şaklar”**
>
> Çok bağlantılı zincirlerde uca doğru hızlanma sık sık kırbaçla açıklanır. Şaklama gerçekten bir şok dalgasıdır, ama onu kırbacın ucu değil, kırbaç boyunca ilerleyen ilmek üretir: incelen kırbaçta hızlanan ilmek ses hızına ulaştığında şaklama oluşur; o anda uç ilmeğin yaklaşık iki katı hızla hareket etmektedir [[122](#ref-122)]. Havada ses hızı 20 °C'de yaklaşık 343 m/s'dir [[123](#ref-123)].

<a id="sinirlar"></a>

## 9. Varsayımlar ve sınırlılıklar

*Modelin neyi içermediği, sayısal sonuçların nereye kadar güvenilir olduğu ve yapılmamış olan çalışmalar.*

<a id="sinirlar-model"></a>

### Fiziksel model

- **Noktasal kütleler, kütlesiz rijit çubuklar.** Çubukların eylemsizlik momenti ve esnekliği yoktur. Gerçek çift sarkaçlar bileşik sarkaçlardır [[95](#ref-95), [58](#ref-58)]; buradaki sayısal değerler (periyotlar, eşikler, Lyapunov üsteli) böyle bir düzenekle doğrudan karşılaştırılamaz.
- **Düzlemsel hareket.** Zincir düşey bir düzlemde hareket eder. Çubuklar ve kütleler ardışık paralel düzlemlere yerleştirilmiştir; tam dönme serbestliği ile parçaların birbirinin içinden geçmemesi koşulu böyle birlikte sağlanır. Düzlemler arasındaki küçük uzaklığın dinamiğe etkisi modellenmemiştir.
- **Yalnızca viskoz sürtünme.** Kuru sürtünme ve hava direnci yoktur; sönüm kuvveti her hızda hızla doğru orantılıdır. Girdap akımı freni için bu, yalnızca düşük hızlarda geçerli bir yaklaşıklıktır [[25](#ref-25), [26](#ref-26)].
- **Doğrusal, kütlesiz yay.** Yay kuvveti katı boya kadar tam doğrusaldır ve yayın kendi kütlesi yoktur. Çizilen yay ölçekli bir tasarım değildir: aynı geometri çelik telden yapılsaydı $`k = Gd^4/(8D^3N_a)`$ bağıntısı yaklaşık $`10^5`$ N/m verirdi [[31](#ref-31), [124](#ref-124)]. Düzeneğin metre ölçeğindeki boyutları görünürlük için seçilmiştir.
- **Rijit durdurucular, sabit geri sıçrama katsayısı.** Çarpma anlıktır; temas süresi, hıza bağlı geri sıçrama ve tamponun biçim değiştirmesi modellenmemiştir.
- **İdeal sürücü.** Sürücü, arabanın hareketinden etkilenmeyen ideal bir kuvvet kaynağıdır.

<a id="sinirlar-sayisal"></a>

### Sayısal sonuçlar

- **Enerji sapması birikir.** RK4 simplektik değildir; sapma zamanla büyür. Verilen değerler 60 saniyelik deneylere aittir; saatler süren bir çalıştırmada kalıntı izlenmeli, gerekirse adım küçültülmeli ya da uyarlamalı yönteme geçilmelidir. Her iki değişiklik de deneyi baştan başlatır (Bölüm 4).
- **Çözüm ıraksayabilir.** Düşük mertebeli bir yöntem ve iri bir adımla sarkaç zincirinin çözümü sonlu aralıktan çıkabilir. Deney o zaman durdurulur (Bölüm 4); hiçbir şey değiştirilmeden aynı çözücüyle yeniden başlatılırsa aynı anda yine durdurulur.
- **Kaotik yörüngeler ufkun ötesinde tek tek anlamlı değildir.** Bölüm 5'te açıklandığı gibi, birkaç on saniyeden sonra gösterilen durum tam çözümün durumu değildir; anlamlı olan istatistiksel ve geometrik özelliklerdir.
- **Lyapunov üsteli sonlu süreli bir kestirimdir** ve yörüngeye bağlıdır; bir düzeneğin “üsteli” olarak tek bir sayı verilemez.
- **Gerçek zaman güvencesi yoktur.** Yavaş bir aygıt ya da yüksek bir adım frekansı bir karenin 0,1 saniyeden uzun sürmesine yol açtığında, karenin 0,1 saniyeyi aşan bölümü benzetime aktarılmaz ve benzetim zamanı duvar saatinin gerisinde kalır; durum çubuğu son başlatmadan beri bu karelerin sayısını, kareler yinelendiğinde (iki saniye içinde dört) gösterir; böylece tek bir uzun kare bildirime yol açmaz. Adım dizisi aynı kaldığı için fiziksel sonuç etkilenmez.
- **Çalışma ortamları arası yinelenebilirlik sınanmamıştır** (Bölüm 4).

<a id="sinirlar-gecerleme"></a>

### Geçerleme ve eğitsel etki

İki önemli çalışma yapılmamıştır. Birincisi, model fiziksel bir düzenekle karşılaştırılmamıştır. İkincisi, aracın kullanılabilirliği ve öğrenmeye etkisi kullanıcılarla ölçülmemiştir. Arayüz ve föy tasarımında dayanılan ilkeler yayımlanmış araştırmalardan gelir (Bölüm 11 ve 12), ama bu ilkelerin burada da aynı sonucu verdiği bir varsayımdır. Sanal laboratuvarlar üzerine kanıtın karışık olduğu Bölüm 1'de belirtilmiştir; benzetimin gerçek ölçümün yerini değil yanını tutması amaçlanmıştır.

<a id="sinirlar-gelecek"></a>

### Gelecek çalışma

- Kütlesi dağılmış çubuklarla bileşik sarkaç modeli ve gerçek bir çift sarkacın video çözümlemesiyle [[125](#ref-125)] karşılaştırılması.
- Kuru sürtünme ve hıza bağlı geri sıçrama içeren temas modelleri [[34](#ref-34), [32](#ref-32)].
- Periyodik olarak sürülen tek sarkaç: en az serbestlik dereceli kaotik mekanik sistem [[121](#ref-121), [126](#ref-126)].
- Uzun süreli çalıştırmalar için simplektik ya da varyasyonel integratörler [[67](#ref-67)].
- Bütün Lyapunov spektrumunun hesaplanması [[86](#ref-86)].
- Öğrencilerle yapılacak, ön ve son ölçümlü bir kullanıcı çalışması.

<a id="mimari"></a>

## 10. Yazılım mimarisi

*Fizik çekirdeği, çalışma zamanı ve gözlemciler olarak ayrılmış üç katman; sabit adımlı döngü; ölçülebilir kalite ölçütleri ve yeniden yazımdan önceki durumla karşılaştırma.*

<a id="mimari-katmanlar"></a>

### Katmanlar ve veri akışı

Kod üç katmana ayrılmıştır ve bağımlılıklar yalnızca aşağıya doğrudur. **Fizik çekirdeği** (src/physics) hiçbir çerçeveye bağlı değildir: integratörler, iki deneyin modelleri, Lyapunov kestirimi, ölçüm cihazları, spektrum çözümleyici ve doğrulama deneyleri saf fonksiyonlar ve küçük sınıflardır; tarayıcı olmadan sınanabilirler. **Çalışma zamanı** (src/sim) durumu taşır: sabit adımlı döngüyü yürütür, telemetriyi halka tamponlara yazar, sanal cihazları besler ve deney tanımını dosyaya ya da bağlantıya dönüştürür. **Gözlemciler** çalışma zamanını yalnızca okur: üç boyutlu sahne (src/scene), grafikler (src/ui/plots) ve React bileşenleri (src/ui).

Sürekli durum (konumlar, hızlar, enerji terimleri) React durumunda tutulmaz. Sahne ve grafikler her canlandırma karesinde çalışma zamanından doğrudan okuyarak çizer; sayısal göstergeler ise saniyede en çok on iki kez yenilenir. Böylece fizik adımı, çizim ve arayüz birbirinin maliyetinden bağımsızdır. Parametreler, çalışma durumu ve başlangıç koşulları gibi kesikli durum, değişmez (immutable) bir nesne olarak yayımlanır ve bileşenler yalnızca kullandıkları dilime abone olur.

Sıcak yolda bellek ayrılmaz: integratörler çalışma dizilerini kendileri tutar, yayın sarmal geometrisi her karede aynı tamponun içinde analitik olarak güncellenir, vektör okları ve stroboskop görüntüleri önceden ayrılmış örneklerdir. Sahne yalnızca durum, kamera, katmanlar ya da görünüm boyutu değiştiğinde yeniden çizilir.

<a id="mimari-dongu"></a>

### Sabit adımlı döngü

Her canlandırma karesinin duvar saati süresi bir bütçeye eklenir; bütçe, tam olarak $`h = 1/f_s`$ büyüklüğünde adımlarla harcanır ve artan kısım bir sonraki kareye devreder [[70](#ref-70)]. Bir kare bütçeye en çok 0,1 s'lik duvar saati süresi ekler; kare başına adım sayısı böylece sınırlıdır (en yüksek adım frekansında ve zaman ölçeğinde 400). Daha uzun süren kare bu uzunluğa kırpılır ve sayılır (durum çubuğu sayıyı bu tür kareler yinelendiğinde gösterir); sekmenin arka planda geçirdiği süre ise atılır. Bu düzenle durum dizisi yalnızca başlangıç koşullarına, parametrelere, yönteme ve $`h`$ değerine bağlıdır. Sınama paketi bunu doğrudan denetler: aynı deney bir kez düzgün 60 Hz karelerle, bir kez rastgele kare süreleriyle yürütülür ve ortak adım sayılarında durumların bit düzeyinde eşit olduğu doğrulanır.

> **Not — Neden önemli**
>
> Kaotik bir sistemde adım büyüklüğündeki en küçük fark üstel olarak büyür. Adımın kare süresinden türetildiği önceki sürümde aynı çift sarkaç deneyi 60 Hz ve 144 Hz ekranlarda 30 s sonunda 214° farklı durumdaydı; yani gözlenen yörünge fiziğe değil ekrana bağlıydı.

<a id="mimari-kalite"></a>

### Kalite güvencesi

- TypeScript katı kipte derlenir; statik çözümleme (ESLint) uyarısız geçer.
- 154 otomatik sınama vardır: doğrusal cebir, özel fonksiyonlar, integratörler, her iki model, ölçüm cihazları, çalışma zamanı, veri alışverişi ve on dört doğrulama deneyi; arayüz renklerinin karşıtlık oranları (ve bu bölümün onların verdiği değerleri doğru aktardığı), sayı girişinin okunması, saklanan tercihlerin doğrulanması ve spektrum göstergesinin kayıt ve tepe kuralları da sınanır. Her deney föyü için sınamalar, föyün öngörülen ölçümle tamamlandığını ve yanlış bir ayarla açık kaldığını gösterir. İçerik de sınanır: kuram metninin iki dilde aynı yapıda olması, her atfın kaynakçada bulunması, her formülün dizilebilmesi ve föy ile doğrulama metinlerinin koddaki ölçüt ve satır sayılarıyla uyuşması.
- Dışarıdan gelen veri (deney dosyası, paylaşım bağlantısı) kullanılmadan önce doğrulanır. Yapısı yanlış olan ya da bilinmeyen bir yöntem, sunulan altı değerden başka bir adım frekansı ya da sonlu bir sayı olmayan bir değer içeren veri bütünüyle reddedilir. Aralığının dışındaki bir parametre en yakın sınıra çekilir; başlangıç koşullarına sayı alanlarının sınırları uygulanır: konum iki durdurucunun arasında, hız ±30 m/s, açılar ±1800°, açısal hızlar ±40 rad/s içinde kalır. Sınırı aşan bir açı tam turlar atılarak (−180°, 180°] aralığına indirgenir; böylece zincirin biçimi korunur. İşaretçiyle tutulan bir zincir de bırakıldığında aynı biçimde saklanır. Tarayıcının yerel deposunda saklanan tercihler de aynı biçimde doğrulanır: arayüzün kullanamayacağı bir değerin yerine varsayılanı alınır.
- Sürekli tümleştirme her değişiklikte tür denetimi, statik çözümleme, sınamalar ve üretim derlemesini çalıştırır.

<a id="mimari-karsilastirma"></a>

### Yeniden yazımdan önceki durumla karşılaştırma

Aşağıdaki çizelgede soldaki sayılar önceki kodun değiştirilmeden çalıştırılmasıyla, sağdakiler bu sürümün doğrulama paketiyle ölçülmüştür. Önceki sürümün Lagrange denklemleri ve tek RK4 adımı doğruydu; eksik olan, çevresindeki ölçüm ve muhasebe düzeniydi.

*Çizelge 10.1. Ölçülebilir ölçütlerde önceki sürüm ile bu sürüm.*

| Ölçüt | Önceki sürüm | Bu sürüm |
| --- | --- | --- |
| Zaman adımı | Kare süresinden türetilir (60 Hz'te 3,33 ms; 144 Hz'te 2,31 ms) | Sabit $`h = 1`$ ms; kare hızından bağımsız |
| Aynı çift sarkaç deneyi, 60 Hz ve 144 Hz ekranda | 30 s sonunda 214° durum farkı | Bit düzeyinde özdeş |
| Çift sarkaç, 60 s bağıl enerji sapması | $`5{,}7\times10^{-7}`$ | $`2{,}0\times10^{-9}`$ |
| Altı bağlantılı zincir, 60 s bağıl enerji sapması | $`9{,}0\times10^{-5}`$ | $`3{,}3\times10^{-7}`$ |
| Durdurucuya çarpma | Sekme kare hızına bağlı: $`x(3\,\mathrm{s}) = 2{,}19`$ m (60 Hz), $`4{,}05`$ m (120 Hz) | Olay konumlama; çarpışma anındaki hata $`9\times10^{-13}`$ s |
| Enerji muhasebesi (sürülen, durduruculu deney) | Çarpışma kayıpları ve sürücü işi kayıt dışı; gösterilen “toplam” 60 s'de 0,49 J'den 4414 J'ye çıkar | Beş terimli defter; 27 çarpışmada bağıl kalıntı $`1{,}3\times10^{-12}`$ |
| Sarkaçta ısı | $`E_0 - E_\mathrm{mek}`$ olarak tanımlı; $`g`$ değişince 4,78 J'den 66,63 J'ye sıçrar | Ayrı durum değişkeni olarak integre edilir; parametre değişiminde defter yeniden tabanlanır |
| Dışa aktarılan CSV | Satırların %99,6'sında enerji başka bir ana ait; 4,3 s'lik kayıt | Her satır tek bir an; 60 000 satıra kadar kayıt (varsayılan adım frekansında 600 s); parametreleri, başlangıç koşullarını, yöntemi ve adımı veren başlık |
| Yay geometrisi | Karede yeniden oluşturulur: 1031 KiB bellek, 0,57 ms | Aynı tamponda güncellenir; bellek ayrılmaz |
| Otomatik sınama | Yok | 154 sınama, 14'ü doğrulama deneyi |
| Erişilebilirlik | ARIA özniteliği, klavye denetimi ve iletişim kutusu anlamı yok | Bütün denetimler klavyeyle kullanılır; görünür odak; etiketli denetimler |
| İngilizce arayüz | 68 çeviri anahtarının 19'u kullanılıyor | İki dil tam; anahtar eşliği derleme zamanında denetlenir |

<a id="arayuz"></a>

## 11. Arayüz ve etkileşim tasarımı

*Yerleşim, doğrudan manipülasyon, nicelik–renk eşlemesi, ölçekli vektörler, grafik ilkeleri, erişilebilirlik ve sonifikasyon kararlarının gerekçeleri.*

<a id="arayuz-yerlesim"></a>

### Yerleşim: parametre, sahne ve grafik aynı anda

Bir laboratuvar tezgâhında bir düğme çevrilirken osiloskoba bakılır. Bu nedenle üç bölge aynı anda görünür tutulur: ortada deney düzeneği, altında grafik paneli, sağında parametre paneli. Bir parametre değiştirildiğinde etkisi sahnede ve grafiklerde aynı anda izlenir; ölçüm çizelgesi ile deney föyleri sağdaki panelin öteki sekmeleridir. 1024 pikselden dar bir pencerede bu panel, sahnenin üzerinde açılan bir yan panele dönüşür. Alt kenardaki durum çubuğu sayısal durumu gösterir: enerji defteri kalıntısı her genişlikte, (osilatörde) analitik çözümden sapma 1024 pikselden, çözücü, adım ve mertebe ise 1280 pikselden başlayarak görünür; daha dar bir pencerede üst çubuktaki çözücü düğmesi yöntemi ve 640 pikselden başlayarak adım frekansını yazmayı sürdürür. Durum çubuğu geciken kareleri bildirirken ya da uyarlamalı çözücüyü önerirken bu bildirimler göstergelerin önüne geçer.

Geri bildirim süreleri için yerleşik eşikler gözetilir: yaklaşık 0,1 s altındaki tepki anlık algılanır, 1 s düşünce akışını bozmadan fark edilir, 10 s dikkatin korunabildiği sınırdır [[127](#ref-127), [128](#ref-128), [129](#ref-129)]. Parametre değişikliği aynı karede uygulanır; uzun süren iki işlem, frekans taraması ve doğrulama paketi, ilerleme göstererek parçalar hâlinde yürütülür; tarama iptal edilebilir.

<a id="arayuz-manipulasyon"></a>

### Doğrudan manipülasyon

Cisimler işaretçiyle tutulur, sürüklenir ve bırakılır; ilgilenilen nesne sürekli görünürdür, eylem fizikseldir ve sonucu anında geri alınabilir [[130](#ref-130), [131](#ref-131)]. Araba tek serbestlik derecelidir: işaretçi ışınının ray eksenine en yakın noktası alınır, böylece eşleme her kamera açısında tutarlıdır. Sarkaç bağlantısı, işaretçi ışınının bağlantının kendi dönme düzlemini kestiği noktaya yöneltilir. Bırakma anındaki hız, son 90 ms'deki işaretçi hareketinden kestirilir ve cisme aktarılır; işaretçi durdurulup bırakılırsa cisim durgun bırakılır.

Sürükleme tek giriş yolu değildir. Aynı başlangıç koşulları parametre panelindeki sayı alanlarından klavyeyle ve kesin değerle girilebilir; bu hem erişilebilirlik hem de yinelenebilirlik gereğidir. “Başlangıç koşullarına dön” komutu (R tuşu) varsayılan değerlere değil, yürütülmekte olan deneyin başlangıç koşullarına döner.

<a id="arayuz-renk"></a>

### Nicelik–renk eşlemesi

Bir fiziksel nicelik her yerde aynı renkle gösterilir: konum ve açı gök mavisi, hız mavimsi yeşil, net kuvvet turuncu, yay kuvveti sarı, sönüm kuvveti kırmızımsı mor, sürücü kuvveti ve ağırlık kızıl turuncudur; kinetik enerji hızın, potansiyel enerji konumun rengini taşır. Birden çok bağlantılı bir zincirde ise her bağlantının sahnede, grafiklerde ve çizelgelerde koruduğu kendi rengi vardır (birinci bağlantı gök mavisi, ötekiler sırasıyla turuncu, mavimsi yeşil, sarı, mavi ve kızıl turuncu). Renkler Okabe–Ito paletinden alınmıştır [[102](#ref-102), [103](#ref-103)]. Kuzey Avrupa kökenli erkeklerin %8'e varan bölümünde ve kadınların %0,5'inde yaygın kırmızı–yeşil renk görme farklılığı bulunduğundan [[103](#ref-103)] bu seçim süsleme değil okunabilirlik koşuludur; bilimsel görsellerde renk seçiminin veriyi çarpıtabildiği de belgelenmiştir [[132](#ref-132)]. Hiçbir nicelik yalnızca rengiyle tanıtılmaz: her vektörün simgesi ve sayısal değeri, her eğrinin etiketi vardır.

<a id="arayuz-vektor"></a>

### Ölçekli vektörler ve sahne içi ölçü araçları

Vektör okları ölçeklidir: uzunluk büyüklükle doğru orantılıdır ve geçerli ölçek (örneğin 1 m ≙ 20 N) sahnede yazılıdır. Ölçek, son birkaç saniyenin tipik (karekök ortalama) büyüklüğüne göre 1–2–5 dizisinden seçilir. Kısa süreli sıçramalar — örneğin savrulan zincirde çubuk kuvveti — ölçeği bozmasın diye en büyük uzunluğu aşan ok kırpılır ve çift uçla işaretlenir; etiket her zaman gerçek değeri gösterir. Serbest cisim diyagramında her kuvvet ayrı ayrı çizilir; sarkaçta çubuk kuvveti, hareket denklemlerinden bağımsız olarak Newton'un ikinci yasasından hesaplanır ve basınç durumunda yön değiştirir.

Düzenekler ölçü araçlarıyla birlikte çizilir: osilatörde tezgâh kenarında 0,1 m bölmeli bir cetvel ve arabaya bağlı bir gösterge iğnesi, sarkaçta mafsalın arkasında bir açıölçer bulunur. Düzeneklerde hiçbir katı cisim bir başkasının içinden geçmez: yay telinin çapı, sarımlar tam katı boyda birbirine değecek biçimde seçilmiştir; sarkaç bağlantıları gerçek çok bağlantılı sarkaçlarda olduğu gibi ardışık paralel düzlemlerde döner; stand, zincirin en alt noktası tezgâha değmeyecek biçimde zincir boyuyla birlikte uzar.

<a id="arayuz-grafik"></a>

### Grafikler

Her grafikte birimli ve sayısal eksenler, 1–2–5 aralıklı bölmeler ve silik bir ızgara vardır; süsleme yoktur [[133](#ref-133)]. Nicel karşılaştırmalar, algısal olarak en doğru okunan kodlamayla, ortak bir ölçek üzerindeki konumla yapılır [[134](#ref-134)]. Eksen sınırları veriyi titremeden izler: veri aralığın dışına çıkınca hemen genişler, daralınca yavaşça toplanır. Açılar $`(-\pi, \pi]`$ aralığına sarılır ve eğri sarma noktasında kesilir; böylece yanıltıcı düşey çizgiler oluşmaz. Zaman ekseni kare sayısına değil benzetim zamanına bağlıdır; telemetri 300 Hz ve üzerindeki adım frekanslarında 100 Hz'te, 60 Hz ve 120 Hz'te ise her adımda kaydedilir.

<a id="arayuz-erisilebilirlik"></a>

### Erişilebilirlik

Hedef, WCAG 2.2'nin AA düzeyidir [[135](#ref-135)]. Bu belgeden alınan ve tasarımı en doğrudan belirleyen ölçütler, arayüzün bunları karşılamak için yaptıklarıyla birlikte aşağıda sıralanmıştır. Karşıtlık oranları renk değerlerinden, o belgedeki bağıntıyla hesaplanmıştır; otomatik sınamalar aynı hesabı yineler, 4,5:1 ile 3:1 eşiklerinin adı geçen yüzeylerde sağlandığını ve aşağıda verilen değerlerin renk değerlerinden çıkan değerler olduğunu denetler.

- **1.1.1 Metin dışı içerik:** dizilen her formül iki kez üretilir: görsel dizgi olarak ve yardımcı teknolojilerin okuduğu MathML olarak. Sahnenin ve grafiklerin metin açıklaması vardır; bunlarda ölçülen büyüklükler Ölçümler sekmesinde metin olarak listelenir.
- **1.4.3 Karşıtlık (en az):** metin için en az 4,5:1. Üç ana metin rengi her yüzeyde en az 5,17:1 verir. Etiketlerde ve birimlerde kullanılan en soluk metin rengi panel zemininde 5,50:1, göründüğü her yüzeyde en az 4,76:1 verir; en küçük değer, üzerine gelinen bir öğenin zeminindedir. Seçili öğelerin ve ipuçlarının zemini olan en açık yüzeyde bu renk yalnızca 4,21:1 verirdi; orada kullanılmaz.
- **1.4.11 Metin dışı karşıtlık:** bir denetimi ya da durumunu tanıtan öğeler için en az 3:1. Bu işi yalnızca bir çerçevenin ya da bir işaretin gördüğü yerlerde, her yüzeyde en az 3,06:1 (panel zemininde 4,01:1) veren tek bir renk kullanılır: sayı alanlarının, anahtarın ve föylerdeki seçenek halkalarının çerçevesi, kaydırıcıların yolu, bölmeli denetimlerde seçili öğenin çerçevesi ve grafik panelinin tutamağındaki çizgi. Odak halkası en az 6,43:1, kaydırma çubuklarının tutamağı en az 3,10:1 verir. Basılı durumdaki bir aç-kapa düğmesi, vurgu renginde ve hem kendi renkli dolgusuna hem çevresindeki yüzeye karşı en az 3,59:1 veren bir çerçeve taşır. Bölgeleri ayıran ve düğmeleri çevreleyen ince çizgiler bilerek 3:1'in altında tutulmuştur (1,1:1 ile 1,6:1 arasında); bunlar süslemedir, bir düğmeyi etiketi tanıtır.
- **1.4.1 Renk kullanımı:** aşağıdaki durumlar yalnızca renkle değil, ikinci bir işaretle de belirtilir. Çalışma durumu renkli noktanın yanında sözcükle yazılır; varsayılan dışı bir çözücü, çözücü düğmesinin rengiyle birlikte simgesini de değiştirir; bölmeli denetimde seçili öğe ile basılı durumdaki bir aç-kapa düğmesi (sahne katmanları, ses) çerçeve taşır; kuram okuyucusunun içindekiler listesinde bulunulan başlık, ön kenarında bir çizgi taşır; reddedilen bir girdi hata rengindeki çerçeveye ek olarak simgeli bir iletiyle bildirilir; doğrulama sonuçları ile tamamlanan föyler bir onay ya da çarpı işaretiyle ve ekran okuyucular için bir metinle belirtilir.
- **2.1.1 Klavye:** bütün denetimlere klavyeyle ulaşılabilir ve hepsi klavyeyle kullanılabilir; grafik panelinin tutamağı da bunlardandır. Vektörlerin çizildiği sarkaç kütlesi, vektör ölçeğinin yanındaki seçiciyle belirlenir; kütleye tıklamak da aynı işi görür. Sahne odaktayken ok tuşları kamerayı 3°'lik adımlarla döndürür, Shift ile birlikte kaydırır; bakış yönleri ve yakınlaştırma için düğmeler vardır. İşaretçi gerektiren tek işlev bir cismin tutulup fırlatılmasıdır; karşılığı, başlangıç koşullarının sayı alanlarıdır.
- **2.1.4 Karakter tuşu kısayolları:** tek tuşlu kısayollar kısayollar penceresinden kapatılabilir; boşluk tuşu çalışmayı sürdürür. Bir iletişim kutusu, menü ya da liste açıkken, bir alana yazı yazılırken ve bir cisim tutulurken kısayollar işlem yapmaz.
- **2.4.7 Görünür odak:** odaktaki denetim vurgu renginde 2 piksellik bir çerçeve taşır; sayı alanı odağı vurgu rengindeki kenarlığıyla, menü ise vurgulanan satırıyla gösterir.
- **2.4.11 Odağın örtülmemesi (en az):** başlığı yerinde sabit kalan iki kaydırılabilir panel en az bu başlığın yüksekliği kadar pay bırakır; böylece odak aldığı için görünüme getirilen bir denetim başlığın altında kalmaz.
- **2.5.7 Sürükleme hareketleri:** sürükleyerek yapılan her ayar sürüklemeden de yapılabilir: grafik panelinin yüksekliği, tıklandıkça dört yükseklik (180, 288, 404 ve 520 piksel) arasında sırayla geçen tutamağıyla; bir kaydırıcı, yoluna tıklanarak ya da sayı alanından; kamera, bakış düğmeleri ve ok tuşlarıyla; bir cismin konumu, başlangıç koşullarının sayı alanlarından ayarlanır.
- **2.5.8 Hedef boyutu (en az):** denetimler her iki yönde en az 24 CSS pikseli olacak biçimde boyutlandırılmıştır. En küçükleri 24 piksel yüksekliğindedir: küçük bölmeli denetimlerin öğeleri, anahtar (40×24), gök cisimlerinin yerçekimini seçen düğmeler, grafik panelinin tutamağı, durum çubuğundaki öneri ve kaynakça listesindeki bağlantılar. Metin içindeki atıf numaraları, ölçütün cümle içindeki hedefler için tanıdığı ayrıcalığa dayanır.
- **3.3.1 Hata tanımlama:** sayı alanı, sayı olmayan bir metni kabul etmez: metin alanda kalır, alan işaretlenir ve izin verilen aralığı bildiren bir ileti görünür; ileti ekran okuyuculara da duyurulur. Aralığın dışındaki bir sayı en yakın sınıra çekilir: alan kullanılan değeri gösterir, ekran okuyuculara da duyurulan kısa bir not aralığı ve kullanılan sınırı bildirir.

İletişim kutuları odağı içeride tutar, Escape ile kapanır ve odağı kendilerini açan denetime geri verir. Saat, canlı duyurusu kapalı bir zamanlayıcı olarak sunulur; böylece süren bir deney ekran okuyucuyu kesintiye uğratmaz. Belge dili arayüz diliyle birlikte değişir. 1024 pikselin altında üst çubuk, denetimleri kesmek yerine alt satırlara geçirir. Üst çubukta ancak 1536 pikselden başlayarak yer bulan zaman ölçeği parametre panelinin başında da ayarlanır; 1'den farklı olduğu sürece sahnedeki ölçek anahtarında, sahnenin her boyutunda yazılı olarak görünür. İşletim sisteminde hareket azaltma tercihi açıksa arayüz geçişleri algılanamayacak kadar kısaltılır, kamera yeni bir bakışa süzülerek değil doğrudan geçer ve döndürme denetiminin eylemsizliği kalkar; deneyin hareketi içeriğin kendisi olduğu için sürer ve her an duraklatılabilir.

> **Sınırlılık — Bu önlemlerin kapsamadıkları**
>
> Bir denetim ve dört gösterge yalnızca daha geniş pencerelerde bulunur: zaman grafiğindeki “Analitik çözümü göster” anahtarı ile üst çubuktaki saat 768 pikselden, durum çubuğunda kare hızı 640 pikselden (geciken kareler bildirilirken 768 pikselden), kare başına fizik süresi 1280 pikselden ve kayıtlı örnek sayısı 1536 pikselden başlayarak görünür. Daha dar bir pencerede, ya da pencereyi CSS pikseli cinsinden o kadar daraltan bir yakınlaştırma düzeyinde, bunlara ulaşılamaz. 640 pikselden dar bir pencerede durum çubuğu, bir bildirim gösterdiği sürece, çalışma durumunu yalnızca noktanın rengiyle verir; o durumda çalıştırma düğmesi durumu simgesiyle gösterir, ıraksamayı ise sahnenin üstündeki uyarı sözcükle bildirir. Bir cisim yalnızca işaretçiyle tutulup fırlatılabilir. Bu raporda ekran okuyucuyla ya da yardımcı teknolojiye gereksinim duyan kişilerle yapılmış bir sınama yoktur; yukarıdaki ifadeler kaynak koda ve hesaba dayanır.

<a id="arayuz-ses"></a>

### Sonifikasyon

Mekanik frekanslar (en çok birkaç hertz) işitme aralığının çok altındadır; bu yüzden ses bir kayıt değil, parametre eşlemeli bir işitsel göstergedir [[104](#ref-104)]. Osilatörde ton yüksekliği konumu (3,5 m başına bir oktav), ses şiddeti hızı izler; durdurucuya çarpma, çarpma hızıyla orantılı kısa bir vuruşla duyulur. Sarkaçta birinci bağlantının düşeyden her geçişi, yöne göre farklı perdede bir tıkla işaretlenir: tek sarkaç saat gibi düzenli, kaotik zincir düzensiz duyulur. Ses yalnızca kullanıcı açtığında, benzetim yürürken ve sekme görünürken çalar.

<a id="pedagoji"></a>

## 12. Pedagojik tasarım

*Etkileşimli benzetimlerin öğrenmeye etkisine ilişkin bulgular ve bu bulguların deney föylerinin kuruluşuna nasıl yansıtıldığı.*

<a id="pedagoji-bulgular"></a>

### Benzetimlerle öğrenmeye ilişkin bulgular

Etkileşimli benzetimlerin fizik öğretimindeki yeri iyi belgelenmiştir [[136](#ref-136), [137](#ref-137)]. 2001–2010 arasındaki 51 yayını inceleyen bir derleme, benzetimlerin geleneksel öğretimi — özellikle laboratuvar etkinliklerini — güçlendirebildiğine ilişkin sağlam kanıt bulmuş, ancak çalışmaların çoğunun öğretmen desteğini ve benzetimin ders içindeki yerini göz ardı ettiğini de saptamıştır [[20](#ref-20)]. Benzer sonuçlara başka derlemeler de varmıştır [[138](#ref-138), [21](#ref-21)]. Denetimli bir çalışmada, doğru akım devrelerini benzetimle çalışan öğrenciler gerçek donanımla çalışanlara göre hem kavramsal sorularda hem de gerçek devre kurma görevinde daha başarılı olmuştur [[17](#ref-17)].

Bu bulgular benzetimin kendiliğinden öğrettiği anlamına gelmez. 62 giriş dersini ve 6542 öğrenciyi kapsayan bir taramada, etkileşimli katılım yöntemleri kullanan derslerde ortalama normalize kazanım $`0{,}48 \pm 0{,}14`$, geleneksel derslerde $`0{,}23 \pm 0{,}04`$ bulunmuştur [[139](#ref-139)]; belirleyici olan araç değil, öğrencinin etkin biçimde düşünmeye yöneltilmesidir. Açık gözlemlere olanak veren bir benzetimin bile kavramsal anlamayı güvence altına almadığı ayrıca gösterilmiştir [[19](#ref-19)].

<a id="pedagoji-foyler"></a>

### Deney föylerinin kuruluşu

Föyler tahmin et – gözle – açıkla düzenini izler [[140](#ref-140), [141](#ref-141)]: öğrenci önce föyün sorusuna verilen yanıtlardan birini seçerek bir öngörüde bulunur, sonra düzeneği kurar ve ölçer; föy tamamlandığında öngörüsü gözlemiyle karşılaştırılır ve ölçümü kuramla bağdaştıran, kaynak gösteren bir açıklama açılır. Ölçütler, öğrenci parametreleri değiştirirken arka planda sürekli değerlendirilir. Bir föyün tamamlanması bir kaydırıcının konumuna değil ölçüme bağlıdır: periyot sıfır geçişlerinden, sönüm ardışık tepe değerlerinden, aşım ve yerleşme süresi basamak yanıtından, öngörülebilirlik ikiz yörüngenin ayrılmasından ve Lyapunov kestiriminden okunur. Örneğin “kritik sönüm” föyü, sönüm oranının 1 olarak ayarlanmasıyla değil, ölçülen aşımın en çok %0,5 ve ölçülen yerleşme süresinin kritik sönümdeki değerin en çok 1,1 katı olmasıyla tamamlanır; kritik sönümün yarısı aşım ölçütünde, iki katı ise süre ölçütünde başarısız olur. Bir parametre değiştirilmeden önce yapılmış ölçüm sayılmaz: basamak yanıtı bir sonraki bırakıştan başlayarak yeniden ölçülür.

Aynı olgu birden çok gösterimle sunulur — hareketin kendisi, zaman serisi, faz portresi, enerji defteri, spektrum — ve gösterimler renk ve simge bakımından tutarlıdır; çoklu gösterimlerin öğrenmeye katkısı, aralarındaki bağın açık kurulmasına bağlıdır [[142](#ref-142)]. Bilişsel yükü sınırlamak için [[143](#ref-143), [144](#ref-144)] ayrıntılı türetimler ayrı bir okuyucuya alınmış, çalışma yüzeyinde yalnızca o anda gereken denetimler ve göstergeler bırakılmıştır.

Arayüz, eğitim benzetimleri için yayımlanmış tasarım yönergeleriyle uyumludur: tutulup sürüklenebilen nesneler, sezgisel denetimler, açık bir görsel model, tutarlı gösterimler ve sınırlı metin [[145](#ref-145)]. Yönlendirme, talimat listeleriyle değil, denetimlerin ve göstergelerin kendisiyle yapılır [[146](#ref-146), [147](#ref-147)].

> **Sınırlılık — Kapsamın sınırı**
>
> Bu çalışmada öğrenme kazanımı ölçülmemiştir. Yukarıdaki kaynaklar tasarım kararlarının gerekçesidir; bu laboratuvarın öğrenmeye etkisi hakkında bir iddia ancak denetimli bir sınıf çalışmasıyla desteklenebilir.

<a id="verification"></a>

## Ek A. Doğrulama çizelgeleri

Aşağıdaki değerler bu belge üretilirken ölçülmüştür (Node.js 26.11.1, Windows_NT x64; RK4, h = 1 ms). Hata sütunu, ölçülen değer ile başvuru değeri arasındaki bağıl ya da mutlak farktır. Başvuru değeri olmayan satırlarda ölçülen değerin kendisi bir sınırla karşılaştırılır. Aynı deneyler uygulamanın içinden de çalıştırılabilir: Kuram ve kaynakça → Doğrulama.

### A.1 Gözlenen yakınsama mertebesi

Kapalı biçimli çözümü bilinen sürülen, sönümlü osilatör ($`m = 1`$ kg, $`k = 4\pi^2`$ N/m, $`c = 0{,}4`$ N·s/m, $`F_0 = 3`$ N, $`\omega = 4`$ rad/s) $`t = 2`$ s anına kadar iki farklı adım büyüklüğüyle çözülür. İki hatadan hesaplanan gözlenen mertebe $`p = \ln(e_1/e_2)/\ln(h_1/h_2)`$, yöntemin kuramsal mertebesiyle karşılaştırılır [[63](#ref-63), [105](#ref-105)].

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| Açık Euler | 1.007261 | 1 | 0.007260591 | ≤ 0.1 | geçti |
| Simplektik Euler | 1.005086 | 1 | 0.005086394 | ≤ 0.1 | geçti |
| Orta nokta (RK2) | 2.000519 | 2 | 5.19×10⁻⁴ | ≤ 0.1 | geçti |
| Klasik Runge–Kutta (RK4) | 4.004818 | 4 | 0.004817861 | ≤ 0.1 | geçti |
| Dormand–Prince 5 | 5.023805 | 5 | 0.02380499 | ≤ 0.1 | geçti |

### A.2 Serbest yanıt ve kapalı biçimli çözüm

$`m = 2`$ kg ve $`k = 24`$ N/m olan osilatör $`x_0 = 2`$ m konumundan durgun bırakılır ve RK4 yöntemiyle, $`h = 1`$ ms adımla 20 s boyunca çözülür. Çizelge, dört sönüm rejiminde sayısal konumun analitik çözümden en büyük sapmasını verir.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`\zeta = 0`$ (sönümsüz) | 1.62×10⁻¹⁰ m | — | — | ≤ 1.00×10⁻⁹ | geçti |
| $`\zeta = 0{,}1`$ (zayıf sönüm) | 8.86×10⁻¹² m | — | — | ≤ 1.00×10⁻⁹ | geçti |
| $`\zeta = 1`$ (kritik sönüm) | 2.77×10⁻¹² m | — | — | ≤ 1.00×10⁻⁹ | geçti |
| $`\zeta = 2{,}5`$ (aşırı sönüm) | 2.15×10⁻¹¹ m | — | — | ≤ 1.00×10⁻⁹ | geçti |

### A.3 Sürülen kararlı durum: genlik ve faz gecikmesi

$`m = 2`$ kg, $`k = 24{,}5`$ N/m, $`c = 0{,}55`$ N·s/m, $`F_0 = 1`$ N. Osilatör beş frekansta, geçici rejim $`e^{-16}`$ çarpanıyla sönene kadar sürülür; genlik ve faz gecikmesi uygulamadaki sanal cihazlarla ölçülür ve kuramsal $`A(\omega)`$, $`\delta(\omega)`$ değerleriyle karşılaştırılır.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`A(0{,}5\,\omega_0)`$ | 0.05434726 m | 0.05434726 m | 9.48×10⁻¹⁰ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(0{,}5\,\omega_0)`$ | 0.05233312 rad | 0.05233312 rad | 4.15×10⁻⁹ | ≤ 0.001 | geçti |
| $`A(0{,}9\,\omega_0)`$ | 0.2013308 m | 0.2013308 m | 2.43×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(0{,}9\,\omega_0)`$ | 0.3562965 rad | 0.3562964 rad | 1.09×10⁻⁸ | ≤ 0.001 | geçti |
| $`A(\omega_0)`$ | 0.5194805 m | 0.5194805 m | 2.62×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(\omega_0)`$ | 1.570796 rad | 1.570796 rad | 8.74×10⁻⁹ | ≤ 0.001 | geçti |
| $`A(1{,}1\,\omega_0)`$ | 0.1797363 m | 0.1797363 m | 3.30×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(1{,}1\,\omega_0)`$ | 2.751157 rad | 2.751157 rad | 1.63×10⁻⁹ | ≤ 0.001 | geçti |
| $`A(1{,}5\,\omega_0)`$ | 0.03250888 m | 0.03250888 m | 1.05×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(1{,}5\,\omega_0)`$ | 3.047585 rad | 3.047585 rad | 3.28×10⁻⁸ | ≤ 0.001 | geçti |

### A.4 Basamak yanıtı: aşım ve yerleşme süresi

$`m = 4`$ kg, $`k = 36`$ N/m, $`x_0 = 2`$ m. Kritik sönümde aşım olmamalı ve %2 yerleşme süresi $`5{,}834/\omega_0`$ değerine eşit olmalıdır; $`\zeta = 0{,}5`$ için aşım $`e^{-\pi\zeta/\sqrt{1-\zeta^2}}`$ değerini vermelidir. Basamak yanıtı ölçer her 1 ms'lik adımın sonunda bir örnek alır ve %2'lik banda giriş anını iki örnek arasında doğrusal ara değerlemeyle bulur.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| Aşım, $`\zeta = 1`$ | 0 | — | — | ≤ 1.00×10⁻⁹ | geçti |
| %2 yerleşme süresi, $`\zeta = 1`$ | 1.944641 s | 1.944641 s | 1.47×10⁻⁷ | ≤ 0.002 | geçti |
| Aşım, $`\zeta = 0{,}5`$ | 0.1630335 | 0.1630335 | 1.79×10⁻⁷ | ≤ 1.00×10⁻⁴ | geçti |

### A.5 Durdurucuya çarpma: an, hız ve enerji kaybı

Sönümsüz osilatör ($`m = 2`$ kg, $`k = 24`$ N/m) $`x_0 = 6`$ m konumundan bırakılır ve $`x_\mathrm{min} = -4{,}75`$ m konumundaki durdurucuya çarpar. Çarpma anı $`\arccos(x_\mathrm{min}/x_0)/\omega_0`$, çarpma hızı $`\omega_0\sqrt{x_0^2 - x_\mathrm{min}^2}`$ ve yitirilen enerji $`\tfrac12 m v^2(1-e^2)`$ kapalı biçimde bilinir. Çarpma anı adımın içinde ikiye bölme yöntemiyle bulunur.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| Çarpma anı | 0.7171639 s | 0.7171639 s | 8.64×10⁻¹³ | ≤ 1.00×10⁻⁸ | geçti |
| Çarpma hızı | 12.69843 m/s | 12.69843 m/s | 2.70×10⁻¹⁴ | ≤ 1.00×10⁻⁸ | geçti |
| Çarpmada yitirilen enerji | 128.5969 J | 128.5969 J | 5.41×10⁻¹⁴ | ≤ 1.00×10⁻⁸ | geçti |
| Çarpmadan sonraki mekanik enerji | 303.4031 J | 303.4031 J | 6.00×10⁻¹⁵ | ≤ 1.00×10⁻⁸ | geçti |

### A.6 Enerji defterinin kapanması

Sönüm, sürücü ve durdurucular birlikte etkindir ($`c = 0{,}55`$ N·s/m, $`F_0 = 12`$ N, $`\omega = 3{,}5`$ rad/s; 60 s içinde 27 çarpma). $`E_k + E_p + Q_c + Q_e - W`$ toplamının başlangıç enerjisinden en büyük bağıl sapması ölçülür.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| RK4, 1000 Hz | 1.27×10⁻¹² | — | — | ≤ 1.00×10⁻⁸ | geçti |
| RK4, 300 Hz | 1.49×10⁻¹⁰ | — | — | ≤ 1.00×10⁻⁶ | geçti |

### A.7 Sonlu genlikli sarkacın periyodu

$`L = 1`$ m boyundaki tek sarkacın ölçülen periyodu, $`T = 4\sqrt{L/g}\,K(\sin(\theta_0/2))`$ eliptik integral çözümüyle karşılaştırılır [[47](#ref-47), [48](#ref-48)]. Son satır, tepeden aşarak sürekli dönen sarkaçtır: $`T = (2/\kappa)\sqrt{L/g}\,K(1/\kappa)`$.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`\theta_0 = 10^\circ`$ | 2.010236 s | 2.010236 s | 3.61×10⁻¹¹ | ≤ 1.00×10⁻⁷ | geçti |
| $`\theta_0 = 45^\circ`$ | 2.086612 s | 2.086612 s | 3.74×10⁻¹² | ≤ 1.00×10⁻⁷ | geçti |
| $`\theta_0 = 90^\circ`$ | 2.368246 s | 2.368246 s | 1.03×10⁻¹⁰ | ≤ 1.00×10⁻⁷ | geçti |
| $`\theta_0 = 135^\circ`$ | 3.065688 s | 3.065688 s | 1.85×10⁻¹¹ | ≤ 1.00×10⁻⁷ | geçti |
| $`\theta_0 = 170^\circ`$ | 4.89436 s | 4.89436 s | 7.25×10⁻¹² | ≤ 1.00×10⁻⁷ | geçti |
| Dönme, $`\kappa = 1{,}2`$ | 1.100227 s | 1.100227 s | 2.33×10⁻¹⁰ | ≤ 1.00×10⁻⁷ | geçti |

### A.8 Sürtünmesiz zincirde enerji sapması

Varsayılan kütle ve boylarla kurulan zincir büyük açılardan bırakılır ve 60 s izlenir; çizelge enerji defterinin en büyük bağıl sapmasını verir. Açık Euler satırı yöntemin yetersizliğini göstermek için vardır ve bir alt sınır ölçütüdür. Son iki satır izin verilen parametre aralığının en zor köşesidir (üç ağır ve uzun bağlantı, üç hafif ve kısa bağlantıyı sürükler): sabit adımlı yöntemin hatası burada gözle görülür, hata denetimli yöntemin hatası görülmez.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 1`$, RK4, 1000 Hz | 4.67×10⁻¹³ | — | — | ≤ 1.00×10⁻⁶ | geçti |
| $`N = 2`$, RK4, 1000 Hz | 2.04×10⁻⁹ | — | — | ≤ 1.00×10⁻⁶ | geçti |
| $`N = 3`$, RK4, 1000 Hz | 2.41×10⁻⁸ | — | — | ≤ 1.00×10⁻⁶ | geçti |
| $`N = 6`$, RK4, 1000 Hz | 3.34×10⁻⁷ | — | — | ≤ 1.00×10⁻⁶ | geçti |
| $`N = 2`$, RK4, 300 Hz | 5.34×10⁻⁷ | — | — | ≤ 1.00×10⁻⁴ | geçti |
| $`N = 2`$, Dormand–Prince 5 | 6.53×10⁻¹² | — | — | ≤ 1.00×10⁻⁷ | geçti |
| $`N = 2`$, viskoz mafsal sürtünmesi ($`b = 0{,}3`$) | 5.54×10⁻¹¹ | — | — | ≤ 1.00×10⁻⁶ | geçti |
| $`N = 2`$, açık Euler, 1000 Hz (alt sınır) | 0.2415891 | — | — | ≥ 0.01 | geçti |
| $`N = 6`$, uç kütle oranı, RK4, 1000 Hz | 0.00154048 | — | — | ≤ 0.01 | geçti |
| $`N = 6`$, uç kütle oranı, Dormand–Prince 5 | 4.21×10⁻⁹ | — | — | ≤ 1.00×10⁻⁷ | geçti |

### A.9 Küçük salınım spektrumu

Eşit kütleli ve eşit boylu zincirin sayısal özfrekansları, $`\omega_k^2 = (g/\ell)\,x_k`$ bağıntısındaki Laguerre sıfırlarıyla [[51](#ref-51), [44](#ref-44)]; çift sarkacınkiler kapalı biçimli $`(2 \mp \sqrt2)\,g/\ell`$ sonucuyla [[28](#ref-28)]; altı bağlantılı zincirin temel frekansı asılı ipin Bessel sıfırıyla verilen değeriyle [[52](#ref-52)] karşılaştırılır. Son satır doğrusal olmayan benzetimin küçük genlikte birinci modun periyodunu yeniden ürettiğini denetler.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$: özfrekanslar ve Laguerre sıfırları | 1.31×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | geçti |
| $`N = 3`$: özfrekanslar ve Laguerre sıfırları | 2.65×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | geçti |
| $`N = 6`$: özfrekanslar ve Laguerre sıfırları | 8.50×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | geçti |
| $`N = 2`$: $`\omega_1`$ | 3.389573 rad/s | 3.389573 rad/s | 0 | ≤ 1.00×10⁻¹² | geçti |
| $`N = 2`$: $`\omega_2`$ | 8.183153 rad/s | 8.183153 rad/s | 2.17×10⁻¹⁶ | ≤ 1.00×10⁻¹² | geçti |
| $`N = 6`$: temel frekans ve asılı ip sınırı | 2.090636 rad/s | 2.173969 rad/s | 0.03833225 | ≤ 0.05 | geçti |
| $`N = 2`$: benzetimle ölçülen 1. mod periyodu | 2.736786 s | 2.736775 s | 4.04×10⁻⁶ | ≤ 1.00×10⁻⁴ | geçti |

### A.10 Lagrange ve Newton türetimlerinin uyumu

Hareket denklemleri Lagrange yöntemiyle türetilmiştir. Çubuk kuvvetleri ise her kütle için Newton'un ikinci yasasından ayrıca hesaplanır; ideal bir çubuk yalnızca kendi doğrultusunda kuvvet taşıdığından, iki türetim tutarlıysa enine bileşen sıfır olmalıdır. Ölçüt, rastgele seçilmiş 200 durumda enine bileşenin gerilmeye oranıdır. Son satır tek sarkacın bilinen gerilmesidir: $`T = m(g\cos\theta + L\dot\theta^2)`$.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$: enine kuvvet / gerilme | 3.62×10⁻¹⁵ | — | — | ≤ 1.00×10⁻¹⁰ | geçti |
| $`N = 6`$: enine kuvvet / gerilme | 5.29×10⁻¹⁵ | — | — | ≤ 1.00×10⁻¹⁰ | geçti |
| $`N = 1`$: çubuk gerilmesi | 18.36231 N | 18.36231 N | 0 | ≤ 1.00×10⁻¹³ | geçti |

### A.11 En büyük Lyapunov üsteli

Benettin yöntemiyle [[83](#ref-83)] 400 s boyunca kestirilen üstel, düzenli hareketlerde sıfıra yakın, kaotik çift sarkaçta ise belirgin biçimde pozitif olmalıdır. Son iki satır kestirimin sayısal parametrelere duyarlılığını ölçer: adım yarıya indirilir ve başlangıç ayrılığı on kat büyütülür.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 1`$, $`\theta_0 = 120^\circ`$ (düzenli) | 0.01664401 1/s | — | — | ≤ 0.05 | geçti |
| $`N = 2`$, küçük açılar (düzenli) | 0.003477017 1/s | — | — | ≤ 0.05 | geçti |
| $`N = 2`$, $`\theta = (2{,}15;\ 1{,}65)`$ rad (kaotik) | 1.040591 1/s | — | — | ≥ 0.5 | geçti |
| Aynı deney, adım yarıya indirilmiş | 0.96936 1/s | 1.040591 1/s | 0.06845228 | ≤ 0.25 | geçti |
| Aynı deney, $`d_0 = 10^{-7}`$ | 1.040513 1/s | 1.040591 1/s | 7.50×10⁻⁵ | ≤ 0.25 | geçti |

### A.12 Zamanda tersinirlik

Sürtünmesiz hareket denklemleri zamanda tersinirdir. Zincir ileri doğru çözülür, hızların işareti değiştirilir ve aynı süre kadar yeniden çözülür; çizelge başlangıç durumuna dönüşteki en büyük hatayı verir. Kaotik yörüngede hata üstel büyüdüğü için süre kısa, tolerans geniştir.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$, düzenli; 20 s ileri ve geri | 4.57×10⁻¹² rad | — | — | ≤ 1.00×10⁻⁹ | geçti |
| $`N = 3`$, düzenli; 20 s ileri ve geri | 3.14×10⁻¹² rad | — | — | ≤ 1.00×10⁻⁹ | geçti |
| $`N = 2`$, kaotik; 5 s ileri ve geri | 3.92×10⁻¹⁰ rad | — | — | ≤ 1.00×10⁻⁶ | geçti |

### A.13 Bağımsız iki yöntemin uyumu

Üç bağlantılı zincir 5 s boyunca hem sabit adımlı RK4 ile hem de hata denetimli Dormand–Prince yöntemiyle çözülür. Adım dört kat küçültüldüğünde RK4 ile başvuru çözümü arasındaki fark, dördüncü mertebe bir yöntemden beklendiği gibi yaklaşık $`4^4 = 256`$ kat küçülmelidir.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| RK4 (1000 Hz) ile DP5 arasındaki fark | 8.43×10⁻⁸ rad | — | — | ≤ 1.00×10⁻⁶ | geçti |
| RK4 (4000 Hz) ile DP5 arasındaki fark | 3.28×10⁻¹⁰ rad | — | — | ≤ 1.00×10⁻⁸ | geçti |
| Hata oranı (beklenen: yaklaşık 256) | 256.6497 | 256 | 0.002537926 | ≤ 0.25 | geçti |

### A.14 Spektrum çözümleyici

Frekansı 1,2345 Hz ve genliği 0,7 olan, sabit bir bileşen eklenmiş sinüs 100 Hz ile örneklenir (4096 örnek). Frekans hiçbir FFT kutusuna tam denk gelmez; Hann penceresi [[99](#ref-99)] ve iki kutulu ara değerleme [[101](#ref-101)] ile tepe frekansı ve genliği yeniden elde edilir.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| Tepe frekansı | 1.2345 Hz | 1.2345 Hz | 4.62×10⁻⁹ | ≤ 1.00×10⁻⁴ | geçti |
| Tepe genliği | 0.7 | 0.7 | 1.02×10⁻⁸ | ≤ 0.001 | geçti |

<a id="references"></a>

## Kaynakça

Kaynaklar metinde ilk geçtikleri sırayla numaralanmıştır. Her künye 2026-11-10 tarihinde birincil kaynağından denetlenmiştir; web kaynakları için erişim tarihi de budur.

<a id="ref-1"></a>1. PhET Interactive Simulations (2026). Pendulum Lab (HTML5 simulation, version 1.0.37). *PhET Interactive Simulations, University of Colorado Boulder*. University of Colorado Boulder. <https://phet.colorado.edu/en/simulations/pendulum-lab>

<a id="ref-2"></a>2. PhET Interactive Simulations (2026). Masses and Springs (HTML5 simulation, version 1.0.31). *PhET Interactive Simulations, University of Colorado Boulder*. University of Colorado Boulder. <https://phet.colorado.edu/en/simulations/masses-and-springs>

<a id="ref-3"></a>3. Neumann, E. (2024). myPhysicsLab [interactive physics simulations; website and open-source TypeScript library, Apache License 2.0]. *myphysicslab.com; GitHub repository myphysicslab/myphysicslab*. Erik Neumann. <https://github.com/myphysicslab/myphysicslab>

<a id="ref-4"></a>4. Easy Java/JavaScript Simulations (EjsS) Wiki (n.d.). ModelODESolvers (survey of the ODE solvers included in EJS version 4.2 and later). *EjsS Wiki, Universidad de Murcia*. Universidad de Murcia. <https://www.um.es/fem/EjsWiki/Main/ModelODESolvers>

<a id="ref-5"></a>5. Christian, W.; Esquembre, F. (2007). Modeling Physics with Easy Java Simulations. *The Physics Teacher* 45(8), 475-480. American Association of Physics Teachers. [doi:10.1119/1.2798358](https://doi.org/10.1119/1.2798358)

<a id="ref-6"></a>6. Christian, W.; Hampton, D. (2009). Double Pendulum With Poincare Map Model (Version 1.0) [Computer software]. *Open Source Physics collection, AAPT ComPADRE*. AAPT ComPADRE. <https://www.compadre.org/osp/items/detail.cfm?ID=9384>

<a id="ref-7"></a>7. GeoGebra (n.d.). GeoGebra Manual: SolveODE Command; NSolveODE Command; 3D Graphics View. *GeoGebra Manual (online documentation)*. GeoGebra. <https://geogebra.github.io/docs/manual/en/commands/SolveODE/>

<a id="ref-8"></a>8. Walsh, T. (2017). Creating interactive physics simulations using the power of GeoGebra. *The Physics Teacher* 55(5), 316-317. American Association of Physics Teachers. [doi:10.1119/1.4981047](https://doi.org/10.1119/1.4981047)

<a id="ref-9"></a>9. Algoryx Simulation AB (n.d.). Algodoo (Version 2.2.4) [Computer software]. *algodoo.com*. Algoryx Simulation AB. <https://www.algodoo.com/what-is-it/>

<a id="ref-10"></a>10. Gregorcic, B.; Bodin, M. (2017). Algodoo: A Tool for Encouraging Creativity in Physics Teaching and Learning. *The Physics Teacher* 55(1), 25-28. American Association of Physics Teachers. [doi:10.1119/1.4972493](https://doi.org/10.1119/1.4972493)

<a id="ref-11"></a>11. Falstad, P. (n.d.). Math, Physics, and Engineering Applets (including Coupled Oscillations Applet). *falstad.com*. <https://www.falstad.com/mathphysics.html>

<a id="ref-12"></a>12. Fendt, W. (2025). Apps on Physics (HTML5). *walter-fendt.de*. <https://www.walter-fendt.de/html5/phen/>

<a id="ref-13"></a>13. Chabay, R.; Sherwood, B. (2008). Computational physics in the introductory calculus-based course. *American Journal of Physics* 76(4), 307-313. American Association of Physics Teachers. [doi:10.1119/1.2835054](https://doi.org/10.1119/1.2835054)

<a id="ref-14"></a>14. Oliveira, S. R. de (2024). Deterministic chaos: A pedagogical review of the double pendulum case. *Revista Brasileira de Ensino de Física* 46, e20240060. Sociedade Brasileira de Física (SciELO). [doi:10.1590/1806-9126-RBEF-2024-0060](https://doi.org/10.1590/1806-9126-RBEF-2024-0060)

<a id="ref-15"></a>15. Chopyk, P. I.; Oleksiuk, V. P.; Chukhrai, O. P. (2024). Using the Three.js library to develop remote physical laboratory to investigate diffraction. *Proceedings of the 6th Workshop for Young Scientists in Computer Science & Software Engineering (CS&SE@SW 2023), Virtual Event, Kryvyi Rih, Ukraine, February 2, 2024. CEUR Workshop Proceedings (eds. S. O. Semerikov, A. M. Striuk)* 3662, 246-259. CEUR-WS.org. <https://ceur-ws.org/Vol-3662/paper23.pdf>

<a id="ref-16"></a>16. Halder, A.; Banerjee, S. (2026). Bridging the gap between virtual and physical laboratories: a web-based interactive platform for undergraduate physics practicals. *Physics Education* 61(1), 015044. IOP Publishing. [doi:10.1088/1361-6552/ae29d5](https://doi.org/10.1088/1361-6552/ae29d5)

<a id="ref-17"></a>17. Finkelstein, N. D.; Adams, W. K.; Keller, C. J.; Kohl, P. B.; Perkins, K. K.; Podolefsky, N. S.; Reid, S.; LeMaster, R. (2005). When learning about the real world is better done virtually: A study of substituting computer simulations for laboratory equipment. *Physical Review Special Topics - Physics Education Research* 1(1), 010103 (8 pp.). American Physical Society. [doi:10.1103/PhysRevSTPER.1.010103](https://doi.org/10.1103/PhysRevSTPER.1.010103)

<a id="ref-18"></a>18. Triona, L. M.; Klahr, D. (2003). Point and Click or Grab and Heft: Comparing the Influence of Physical and Virtual Instructional Materials on Elementary School Students' Ability to Design Experiments. *Cognition and Instruction* 21(2), 149-173. Taylor & Francis (Informa UK). [doi:10.1207/S1532690XCI2102_02](https://doi.org/10.1207/S1532690XCI2102_02)

<a id="ref-19"></a>19. Renken, M. D.; Nunez, N. (2013). Computer simulations and clear observations do not guarantee conceptual understanding. *Learning and Instruction* 23, 10-23. Elsevier. [doi:10.1016/j.learninstruc.2012.08.006](https://doi.org/10.1016/j.learninstruc.2012.08.006)

<a id="ref-20"></a>20. Rutten, N.; van Joolingen, W. R.; van der Veen, J. T. (2012). The learning effects of computer simulations in science education. *Computers & Education* 58(1), 136-153. Elsevier. [doi:10.1016/j.compedu.2011.07.017](https://doi.org/10.1016/j.compedu.2011.07.017)

<a id="ref-21"></a>21. de Jong, T.; Linn, M. C.; Zacharia, Z. C. (2013). Physical and Virtual Laboratories in Science and Engineering Education. *Science* 340(6130), 305-308. American Association for the Advancement of Science. [doi:10.1126/science.1230579](https://doi.org/10.1126/science.1230579)

<a id="ref-22"></a>22. International Organization for Standardization (ISO) (2019). *ISO 80000-3:2019, Quantities and units - Part 3: Space and time* (Edition 2 (2019-10; catalogue date 2019-10-22); amended by ISO 80000-3:2019/Amd 1:2025 (2025-07-24, 3 pp.)). 11 pp.. ISO, Geneva (ISO/TC 12 with IEC/TC 25). <https://www.iso.org/standard/64974.html>

<a id="ref-23"></a>23. International Organization for Standardization (ISO) (2019). *ISO 80000-4:2019, Quantities and units - Part 4: Mechanics* (Edition 2 (2019-08; catalogue date 2019-08-26); amended by ISO 80000-4:2019/Amd 1:2025 (2025-07-24, 1 p.)). 15 pp.. ISO, Geneva (ISO/TC 12 with IEC/TC 25). <https://www.iso.org/standard/64975.html>

<a id="ref-24"></a>24. Bureau International des Poids et Mesures (BIPM) (2019). *The International System of Units (SI) [Le Système international d'unités (SI)]* (9th edition (2019); text online on 2026-11-10 is version V4.01, updated June 2026). g_n: Appendix 1, pp. 153-154 (English text, V4.01). Bureau International des Poids et Mesures, Pavillon de Breteuil, F-92312 Sèvres Cedex, France (ISBN 978-92-822-2272-0). [doi:10.59161/AUEZ1291](https://doi.org/10.59161/AUEZ1291)

<a id="ref-25"></a>25. Wiederick, H. D.; Gauthier, N.; Campbell, D. A.; Rochon, P. (1987). Magnetic braking: Simple theory and experiment. *American Journal of Physics* 55(6), 500-503. American Association of Physics Teachers. [doi:10.1119/1.15103](https://doi.org/10.1119/1.15103)

<a id="ref-26"></a>26. Heald, M. A. (1988). Magnetic braking: Improved theory. *American Journal of Physics* 56(6), 521-522. American Association of Physics Teachers. [doi:10.1119/1.15570](https://doi.org/10.1119/1.15570)

<a id="ref-27"></a>27. French, A. P. (1971). *Vibrations and Waves* (1st). *The M.I.T. Introductory Physics Series*. W. W. Norton, New York. <https://openlibrary.org/isbn/9780393099362>

<a id="ref-28"></a>28. Taylor, J. R. (2005). *Classical Mechanics*. University Science Books, Sausalito, CA. <https://lccn.loc.gov/2004054971>

<a id="ref-29"></a>29. Rao, S. S. (2017). *Mechanical Vibrations* (6th). Pearson, Hoboken, NJ. <https://www.pearson.com/us/higher-education/program/Rao-Mechanical-Vibrations-6th-Edition/PGM173840.html>

<a id="ref-30"></a>30. Thornton, S. T.; Marion, J. B. (2004). *Classical Dynamics of Particles and Systems* (5th). Brooks/Cole (Thomson), Belmont, CA. <https://openlibrary.org/isbn/9780534408961>

<a id="ref-31"></a>31. Budynas, R. G.; Nisbett, J. K. (2015). *Shigley's Mechanical Engineering Design* (10th). *McGraw-Hill Series in Mechanical Engineering*. McGraw-Hill Education, New York. <https://highered.mheducation.com/sites/0073398209/information_center_view0>

<a id="ref-32"></a>32. Stronge, W. J. (2000). *Impact Mechanics* (1st). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511626432](https://doi.org/10.1017/CBO9780511626432)

<a id="ref-33"></a>33. Sandeep, C. S.; Senetakis, K.; Cheung, D.; Choi, C. E.; Wang, Y.; Coop, M. R.; Ng, C. W. W. (2021). Experimental study on the coefficient of restitution of grain against block interfaces for natural and engineered materials. *Canadian Geotechnical Journal* 58(1), 35-48. Canadian Science Publishing. [doi:10.1139/cgj-2018-0712](https://doi.org/10.1139/cgj-2018-0712)

<a id="ref-34"></a>34. Hunt, K. H.; Crossley, F. R. E. (1975). Coefficient of Restitution Interpreted as Damping in Vibroimpact. *Journal of Applied Mechanics* 42(2), 440-445. American Society of Mechanical Engineers (ASME). [doi:10.1115/1.3423596](https://doi.org/10.1115/1.3423596)

<a id="ref-35"></a>35. Goldstein, H.; Poole, C. P.; Safko, J. L. (2002). *Classical Mechanics* (3rd). Addison Wesley (San Francisco). <https://openlibrary.org/isbn/9780201657029>

<a id="ref-36"></a>36. Landau, L. D.; Lifshitz, E. M. (1976). *Mechanics* (3rd). *Course of Theoretical Physics, Vol. 1*. Pergamon Press, Oxford (reprinted by Butterworth-Heinemann/Elsevier). <https://openlibrary.org/isbn/9780750628969>

<a id="ref-37"></a>37. Konishi, T.; Yanagita, T. (2023). Multiple pendulum and nonuniform distribution of average kinetic energy. *Physical Review E* 108(1), 014204. American Physical Society. [doi:10.1103/PhysRevE.108.014204](https://doi.org/10.1103/PhysRevE.108.014204)

<a id="ref-38"></a>38. Conférence Générale des Poids et Mesures (CGPM) (1901). Declaration 2 of the 3rd CGPM (1901): Declaration on the unit of mass and on the definition of weight; conventional value of g_n. *Proceedings of the 3rd CGPM (1901) (Comptes Rendus, CR)*, 70. Bureau International des Poids et Mesures (BIPM). [doi:10.59161/CGPM1901DECL2E](https://doi.org/10.59161/CGPM1901DECL2E)

<a id="ref-39"></a>39. Williams, D. R. (2024). Moon Fact Sheet. *NASA Space Science Data Coordinated Archive (NSSDCA), Planetary Fact Sheets*. NASA Goddard Space Flight Center, Greenbelt, MD. <https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html>

<a id="ref-40"></a>40. Williams, D. R. (2025). Mars Fact Sheet. *NASA Space Science Data Coordinated Archive (NSSDCA), Planetary Fact Sheets*. NASA Goddard Space Flight Center, Greenbelt, MD. <https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html>

<a id="ref-41"></a>41. Williams, D. R. (2024). Jupiter Fact Sheet. *NASA Space Science Data Coordinated Archive (NSSDCA), Planetary Fact Sheets*. NASA Goddard Space Flight Center, Greenbelt, MD. <https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html>

<a id="ref-42"></a>42. DeLombard, R.; Kelly, E. M.; Hrovat, K.; Nelson, E. S.; Pettit, D. R. (2006). *Motion of Air Bubbles in Water Subjected to Microgravity Accelerations*. *NASA Technical Memorandum NASA/TM-2006-214327 (also AIAA-2005-0722; prepared for the 43rd AIAA Aerospace Sciences Meeting and Exhibit, Reno, Nevada, 10-13 January 2005)*, p. 2 (ISS quasi-steady microgravity environment). NASA Glenn Research Center, Cleveland, Ohio. <https://ntrs.nasa.gov/citations/20060017837>

<a id="ref-43"></a>43. Golub, G. H.; Van Loan, C. F. (2013). *Matrix Computations* (4th ed.). *Johns Hopkins Studies in the Mathematical Sciences*, xxi, 756 pp.. The Johns Hopkins University Press, Baltimore, MD. <https://zbmath.org/?q=an:1268.65037>

<a id="ref-44"></a>44. Braun, M. (2003). On some properties of the multiple pendulum. *Archive of Applied Mechanics* 72(11), 899-910. Springer. [doi:10.1007/s00419-002-0263-4](https://doi.org/10.1007/s00419-002-0263-4)

<a id="ref-45"></a>45. Udwadia, F. E.; Koganti, P. B. (2015). Dynamics and control of a multi-body planar pendulum. *Nonlinear Dynamics* 81(1-2), 845-866. Springer. [doi:10.1007/s11071-015-2034-0](https://doi.org/10.1007/s11071-015-2034-0)

<a id="ref-46"></a>46. Strutt, J. W. (Lord Rayleigh) (1873). Some General Theorems relating to Vibrations. *Proceedings of the London Mathematical Society (Series 1; paper read 12 June 1873)* s1-4(1), 357-368. London Mathematical Society (online edition: Wiley). [doi:10.1112/plms/s1-4.1.357](https://doi.org/10.1112/plms/s1-4.1.357)

<a id="ref-47"></a>47. Beléndez, A.; Pascual, C.; Méndez, D. I.; Beléndez, T.; Neipp, C. (2007). Exact solution for the nonlinear pendulum. *Revista Brasileira de Ensino de Física* 29(4), 645-648. Sociedade Brasileira de Física (SciELO). [doi:10.1590/S1806-11172007000400024](https://doi.org/10.1590/S1806-11172007000400024)

<a id="ref-48"></a>48. Carlson, B. C. (2026). Chapter 19: Elliptic Integrals. *NIST Digital Library of Mathematical Functions, https://dlmf.nist.gov/, Release 1.2.8 of 2026-09-15 (F. W. J. Olver, A. B. Olde Daalhuis, D. W. Lozier, B. I. Schneider, R. F. Boisvert, C. W. Clark, B. R. Miller, B. V. Saunders, H. S. Cohl, M. A. McClain, eds.)*. National Institute of Standards and Technology. <https://dlmf.nist.gov/19>

<a id="ref-49"></a>49. Nelson, R. A.; Olsson, M. G. (1986). The pendulum - Rich physics from a simple system. *American Journal of Physics* 54(2), 112-121. American Association of Physics Teachers. [doi:10.1119/1.14703](https://doi.org/10.1119/1.14703)

<a id="ref-50"></a>50. Carvalhaes, C. G.; Suppes, P. (2008). Approximations for the period of the simple pendulum based on the arithmetic-geometric mean. *American Journal of Physics* 76(12), 1150-1154. American Association of Physics Teachers. [doi:10.1119/1.2968864](https://doi.org/10.1119/1.2968864)

<a id="ref-51"></a>51. Müller, P. C. (2007). On Natural Frequencies of Conservative Multi-Degree-of-Freedom Mass-Spring Vibration Systems. *Proceedings of the XII International Symposium on Dynamic Problems of Mechanics (DINAME 2007), P. S. Varoto and M. A. Trindade (eds.), Ilhabela, SP, Brazil, 26 February - 2 March 2007*, paper DIN07-0055, 7 pp.. ABCM (Brazilian Society of Mechanical Sciences and Engineering). <https://www.abcm.org.br/anais/diname/2007/PDF/DIN07-0055.pdf>

<a id="ref-52"></a>52. Verbin, Y. (2015). Boundary conditions and modes of the vertically hanging chain. *European Journal of Physics* 36(1), 015005. IOP Publishing. [doi:10.1088/0143-0807/36/1/015005](https://doi.org/10.1088/0143-0807/36/1/015005)

<a id="ref-53"></a>53. Olver, F. W. J.; Maximon, L. C. (2026). Chapter 10: Bessel Functions. *NIST Digital Library of Mathematical Functions, https://dlmf.nist.gov/, Release 1.2.8 of 2026-09-15 (F. W. J. Olver, A. B. Olde Daalhuis, D. W. Lozier, B. I. Schneider, R. F. Boisvert, C. W. Clark, B. R. Miller, B. V. Saunders, H. S. Cohl, M. A. McClain, eds.)*, §10.21 Zeros (gives no numerical values of the zeros); published tables are listed in §10.75(iii). National Institute of Standards and Technology. <https://dlmf.nist.gov/10>

<a id="ref-54"></a>54. Bernoulli, D. (1738). Theoremata de oscillationibus corporum filo flexili connexorum et catenae verticaliter suspensae. *Commentarii Academiae Scientiarum Imperialis Petropolitanae* 6 (for 1732-33), 108-122. Academia Scientiarum Imperialis Petropolitana, St Petersburg.

<a id="ref-55"></a>55. Bernoulli, D. (1740). Demonstrationes theorematum suorum de oscillationibus corporum filo flexili connexorum et catenae verticaliter suspensae. *Commentarii Academiae Scientiarum Imperialis Petropolitanae* 7 (for 1734-35), 162-173. Academia Scientiarum Imperialis Petropolitana, St Petersburg.

<a id="ref-56"></a>56. Cannon, J. T.; Dostrovsky, S. (1981). *The Evolution of Dynamics: Vibration Theory from 1687 to 1742* (1st). *Studies in the History of Mathematics and Physical Sciences, vol. 6*, ix + 184 (chapter 9, 'Daniel Bernoulli (1733; 1734); Euler (1736)', pp. 53-69). Springer-Verlag, New York. [doi:10.1007/978-1-4613-9461-7](https://doi.org/10.1007/978-1-4613-9461-7)

<a id="ref-57"></a>57. Heyl, J. S. (2008). *The Double Pendulum Fractal*. *Unpublished manuscript, Department of Physics and Astronomy, University of British Columbia (dated 11 August 2008)*, 5 pp.. <https://www.famaf.unc.edu.ar/~vmarconi/fiscomp/Double.pdf>

<a id="ref-58"></a>58. Rafat, M. Z.; Wheatland, M. S.; Bedding, T. R. (2009). Dynamics of a double pendulum with distributed mass. *American Journal of Physics* 77(3), 216-223. American Association of Physics Teachers. [doi:10.1119/1.3052072](https://doi.org/10.1119/1.3052072)

<a id="ref-59"></a>59. Runge, C. (1895). Ueber die numerische Auflösung von Differentialgleichungen. *Mathematische Annalen* 46(2), 167-178. Springer. [doi:10.1007/BF01446807](https://doi.org/10.1007/BF01446807)

<a id="ref-60"></a>60. Kutta, W. (1901). Beitrag zur näherungsweisen Integration totaler Differentialgleichungen. *Zeitschrift für Mathematik und Physik* 46, 435-453. B. G. Teubner, Leipzig. <https://archive.org/details/zeitschriftfrma12runggoog>

<a id="ref-61"></a>61. Hairer, E.; Nørsett, S. P.; Wanner, G. (1993). *Solving Ordinary Differential Equations I: Nonstiff Problems* (2nd rev. ed.). *Springer Series in Computational Mathematics* 8, xv, 528 pp.. Springer-Verlag, Berlin. [doi:10.1007/978-3-540-78862-1](https://doi.org/10.1007/978-3-540-78862-1)

<a id="ref-62"></a>62. Butcher, J. C. (2016). *Numerical Methods for Ordinary Differential Equations* (3rd ed.). John Wiley & Sons. [doi:10.1002/9781119121534](https://doi.org/10.1002/9781119121534)

<a id="ref-63"></a>63. Roache, P. J. (1998). *Verification and Validation in Computational Science and Engineering*. Hermosa Publishers, Albuquerque, NM. <https://openlibrary.org/books/OL400789M>

<a id="ref-64"></a>64. Salari, K.; Knupp, P. (2000). *Code Verification by the Method of Manufactured Solutions*. *Sandia National Laboratories Report SAND2000-1444*. Sandia National Laboratories, Albuquerque, NM, and Livermore, CA. [doi:10.2172/759450](https://doi.org/10.2172/759450)

<a id="ref-65"></a>65. Roy, C. J. (2005). Review of code and solution verification procedures for computational simulation. *Journal of Computational Physics* 205(1), 131-156. Elsevier. [doi:10.1016/j.jcp.2004.10.036](https://doi.org/10.1016/j.jcp.2004.10.036)

<a id="ref-66"></a>66. Hairer, E.; Wanner, G. (1996). *Solving Ordinary Differential Equations II: Stiff and Differential-Algebraic Problems* (2nd rev. ed.). *Springer Series in Computational Mathematics* 14, xvi, 614 pp.. Springer, Berlin. [doi:10.1007/978-3-642-05221-7](https://doi.org/10.1007/978-3-642-05221-7)

<a id="ref-67"></a>67. Hairer, E.; Lubich, C.; Wanner, G. (2006). *Geometric Numerical Integration: Structure-Preserving Algorithms for Ordinary Differential Equations* (2nd ed.). *Springer Series in Computational Mathematics* 31, xvii, 644 pp.. Springer, Berlin. [doi:10.1007/3-540-30666-8](https://doi.org/10.1007/3-540-30666-8)

<a id="ref-68"></a>68. Hairer, E.; Lubich, C.; Wanner, G. (2003). Geometric numerical integration illustrated by the Störmer–Verlet method. *Acta Numerica* 12, 399-450. Cambridge University Press. [doi:10.1017/S0962492902000144](https://doi.org/10.1017/S0962492902000144)

<a id="ref-69"></a>69. Sanz-Serna, J. M. (1988). Runge-Kutta schemes for Hamiltonian systems. *BIT* 28(4), 877-883. Springer. [doi:10.1007/BF01954907](https://doi.org/10.1007/BF01954907)

<a id="ref-70"></a>70. Fiedler, G. (2004). Fix Your Timestep!. *Gaffer On Games*. <https://gafferongames.com/post/fix_your_timestep/>

<a id="ref-71"></a>71. IEEE (Microprocessor Standards Committee of the IEEE Computer Society) (2019). *IEEE Standard for Floating-Point Arithmetic* (Approved 13 June 2019; published 22 July 2019). *IEEE Std 754-2019 (Revision of IEEE Std 754-2008)*, 1-84. IEEE, New York (ISBN 978-1-5044-5924-2, electronic). [doi:10.1109/IEEESTD.2019.8766229](https://doi.org/10.1109/IEEESTD.2019.8766229)

<a id="ref-72"></a>72. Goldberg, D. (1991). What every computer scientist should know about floating-point arithmetic. *ACM Computing Surveys* 23(1), 5-48. ACM. [doi:10.1145/103162.103163](https://doi.org/10.1145/103162.103163)

<a id="ref-73"></a>73. Dormand, J. R.; Prince, P. J. (1980). A family of embedded Runge-Kutta formulae. *Journal of Computational and Applied Mathematics* 6(1), 19-26. Elsevier. [doi:10.1016/0771-050X(80)90013-3](https://doi.org/10.1016/0771-050X(80)90013-3)

<a id="ref-74"></a>74. Shampine, L. F.; Reichelt, M. W. (1997). The MATLAB ODE Suite. *SIAM Journal on Scientific Computing* 18(1), 1-22. SIAM. [doi:10.1137/S1064827594276424](https://doi.org/10.1137/S1064827594276424)

<a id="ref-75"></a>75. Jacobi, C. G. J. (1846). Über ein leichtes Verfahren die in der Theorie der Säcularstörungen vorkommenden Gleichungen numerisch aufzulösen. *Journal für die reine und angewandte Mathematik (Crelles Journal)* 30(1), 51-94. G. Reimer, Berlin (now Walter de Gruyter). [doi:10.1515/crll.1846.30.51](https://doi.org/10.1515/crll.1846.30.51)

<a id="ref-76"></a>76. Golub, G. H.; Welsch, J. H. (1969). Calculation of Gauss quadrature rules. *Mathematics of Computation* 23(106), 221-230. American Mathematical Society. [doi:10.1090/S0025-5718-69-99647-1](https://doi.org/10.1090/S0025-5718-69-99647-1)

<a id="ref-77"></a>77. Oseledec, V. I. (1968). A multiplicative ergodic theorem. Ljapunov characteristic numbers for dynamical systems. *Trudy Moskovskogo Matematicheskogo Obshchestva (in Russian); English translation: Transactions of the Moscow Mathematical Society 19 (1968), 197-231* 19, 179-210. Moscow State University (original); American Mathematical Society (translation). <https://www.mathnet.ru/eng/mmo214>

<a id="ref-78"></a>78. Ott, E. (2002). *Chaos in Dynamical Systems* (2nd). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511803260](https://doi.org/10.1017/CBO9780511803260)

<a id="ref-79"></a>79. Lorenz, E. N. (1963). Deterministic Nonperiodic Flow. *Journal of the Atmospheric Sciences* 20(2), 130-141. American Meteorological Society. [doi:10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2](https://doi.org/10.1175/1520-0469(1963)020<0130:DNF>2.0.CO;2)

<a id="ref-80"></a>80. Lorenz, E. N. (1993). *The Essence of Chaos*. *The Jessie and John Danz Lectures*, xii+227 pp.. University of Washington Press, Seattle. <https://lccn.loc.gov/93001835>

<a id="ref-81"></a>81. Gleick, J. (1987). *Chaos: Making a New Science*. Viking, New York. <https://lccn.loc.gov/87040025>

<a id="ref-82"></a>82. Lorenz, E. N. (1972). Predictability: Does the Flap of a Butterfly's Wings in Brazil Set Off a Tornado in Texas?. *Talk presented at the 139th Meeting of the American Association for the Advancement of Science, Washington, DC, 29 December 1972 (unpublished press-release text). Reprinted as Appendix 1, 'The Butterfly Effect', in: Lorenz, E. N. (1993), The Essence of Chaos*, Appendix 1, beginning on p. 181 (usually cited as pp. 181-184; the end page was not confirmed in this run). University of Washington Press, Seattle (reprint). <https://mathsciencehistory.com/wp-content/uploads/2020/03/132_kap6_lorenz_artikel_the_butterfly_effect.pdf>

<a id="ref-83"></a>83. Benettin, G.; Galgani, L.; Strelcyn, J.-M. (1976). Kolmogorov entropy and numerical experiments. *Physical Review A* 14(6), 2338-2345. American Physical Society. [doi:10.1103/PhysRevA.14.2338](https://doi.org/10.1103/PhysRevA.14.2338)

<a id="ref-84"></a>84. Skokos, Ch. (2010). The Lyapunov Characteristic Exponents and Their Computation. *Dynamics of Small Solar System Bodies and Exoplanets (eds. J. J. Souchay and R. Dvorak), Lecture Notes in Physics* 790, 63-135. Springer, Berlin, Heidelberg. [doi:10.1007/978-3-642-04458-8_2](https://doi.org/10.1007/978-3-642-04458-8_2)

<a id="ref-85"></a>85. Benettin, G.; Galgani, L.; Giorgilli, A.; Strelcyn, J.-M. (1980). Lyapunov characteristic exponents for smooth dynamical systems and for Hamiltonian systems; a method for computing all of them. Part 1: Theory. *Meccanica* 15(1), 9-20. Springer. [doi:10.1007/BF02128236](https://doi.org/10.1007/BF02128236)

<a id="ref-86"></a>86. Benettin, G.; Galgani, L.; Giorgilli, A.; Strelcyn, J.-M. (1980). Lyapunov characteristic exponents for smooth dynamical systems and for Hamiltonian systems; a method for computing all of them. Part 2: Numerical application. *Meccanica* 15(1), 21-30. Springer. [doi:10.1007/BF02128237](https://doi.org/10.1007/BF02128237)

<a id="ref-87"></a>87. Wolf, A.; Swift, J. B.; Swinney, H. L.; Vastano, J. A. (1985). Determining Lyapunov exponents from a time series. *Physica D: Nonlinear Phenomena* 16(3), 285-317. Elsevier. [doi:10.1016/0167-2789(85)90011-9](https://doi.org/10.1016/0167-2789(85)90011-9)

<a id="ref-88"></a>88. Strogatz, S. H. (2015). *Nonlinear Dynamics and Chaos: With Applications to Physics, Biology, Chemistry, and Engineering* (2nd). Westview Press (Perseus Books Group), Boulder, CO; reissued 2018 by CRC Press. [doi:10.1201/9780429492563](https://doi.org/10.1201/9780429492563)

<a id="ref-89"></a>89. Zhang, F.; Sun, Y. Q.; Magnusson, L.; Buizza, R.; Lin, S.-J.; Chen, J.-H.; Emanuel, K. (2019). What Is the Predictability Limit of Midlatitude Weather?. *Journal of the Atmospheric Sciences* 76(4), 1077-1091. American Meteorological Society. [doi:10.1175/JAS-D-18-0269.1](https://doi.org/10.1175/JAS-D-18-0269.1)

<a id="ref-90"></a>90. Lorenz, E. N. (1969). The predictability of a flow which possesses many scales of motion. *Tellus* 21(3), 289-307. Stockholm University Press (current DOI registrant). [doi:10.1111/j.2153-3490.1969.tb00444.x](https://doi.org/10.1111/j.2153-3490.1969.tb00444.x)

<a id="ref-91"></a>91. Bendixson, I. (1901). Sur les courbes définies par des équations différentielles. *Acta Mathematica* 24, 1-88. Institut Mittag-Leffler. [doi:10.1007/BF02403068](https://doi.org/10.1007/BF02403068)

<a id="ref-92"></a>92. Stachowiak, T.; Okada, T. (2006). A numerical analysis of chaos in the double pendulum. *Chaos, Solitons & Fractals* 29(2), 417-422. Elsevier. [doi:10.1016/j.chaos.2005.08.032](https://doi.org/10.1016/j.chaos.2005.08.032)

<a id="ref-93"></a>93. Levien, R. B.; Tan, S. M. (1993). Double pendulum: An experiment in chaos. *American Journal of Physics* 61(11), 1038-1044. American Association of Physics Teachers. [doi:10.1119/1.17335](https://doi.org/10.1119/1.17335)

<a id="ref-94"></a>94. Richter, P. H.; Scholz, H.-J. (1984). Chaos in Classical Mechanics: The Double Pendulum. *Stochastic Phenomena and Chaotic Behaviour in Complex Systems (ed. P. Schuster), Springer Series in Synergetics* 21, 86-97. Springer, Berlin, Heidelberg. [doi:10.1007/978-3-642-69591-9_9](https://doi.org/10.1007/978-3-642-69591-9_9)

<a id="ref-95"></a>95. Shinbrot, T.; Grebogi, C.; Wisdom, J.; Yorke, J. A. (1992). Chaos in a double pendulum. *American Journal of Physics* 60(6), 491-499. American Association of Physics Teachers. [doi:10.1119/1.16860](https://doi.org/10.1119/1.16860)

<a id="ref-96"></a>96. Lichtenberg, A. J.; Lieberman, M. A. (1992). *Regular and Chaotic Dynamics* (2nd). *Applied Mathematical Sciences* 38, xxii+692 pp.. Springer-Verlag, New York. [doi:10.1007/978-1-4757-2184-3](https://doi.org/10.1007/978-1-4757-2184-3)

<a id="ref-97"></a>97. Hénon, M. (1982). On the numerical computation of Poincaré maps. *Physica D: Nonlinear Phenomena* 5(2-3), 412-414. Elsevier. [doi:10.1016/0167-2789(82)90034-3](https://doi.org/10.1016/0167-2789(82)90034-3)

<a id="ref-98"></a>98. Cooley, J. W.; Tukey, J. W. (1965). An algorithm for the machine calculation of complex Fourier series. *Mathematics of Computation* 19(90), 297-301. American Mathematical Society. [doi:10.1090/S0025-5718-1965-0178586-1](https://doi.org/10.1090/S0025-5718-1965-0178586-1)

<a id="ref-99"></a>99. Harris, F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. *Proceedings of the IEEE* 66(1), 51-83. IEEE. [doi:10.1109/PROC.1978.10837](https://doi.org/10.1109/PROC.1978.10837)

<a id="ref-100"></a>100. Heinzel, G.; Rüdiger, A.; Schilling, R. (2002). *Spectrum and spectral density estimation by the Discrete Fourier transform (DFT), including a comprehensive list of window functions and some new flat-top windows*. *Technical report, Max-Planck-Institut für Gravitationsphysik (Albert-Einstein-Institut), Teilinstitut Hannover*. Max-Planck-Institut für Gravitationsphysik (Albert-Einstein-Institut), Hannover. <https://hdl.handle.net/11858/00-001M-0000-0013-557A-5>

<a id="ref-101"></a>101. Grandke, T. (1983). Interpolation Algorithms for Discrete Fourier Transforms of Weighted Signals. *IEEE Transactions on Instrumentation and Measurement* 32(2), 350-355. IEEE. [doi:10.1109/TIM.1983.4315077](https://doi.org/10.1109/TIM.1983.4315077)

<a id="ref-102"></a>102. Okabe, M.; Ito, K. (2002 (revised 2008)). Color Universal Design (CUD): How to make figures and presentations that are friendly to Colorblind people. *J*FLY (web site, University of Cologne mirror)*. <https://jfly.uni-koeln.de/color/>

<a id="ref-103"></a>103. Wong, B. (2011). Points of view: Color blindness. *Nature Methods* 8(6), 441. Nature Publishing Group (Springer Nature). [doi:10.1038/nmeth.1618](https://doi.org/10.1038/nmeth.1618)

<a id="ref-104"></a>104. Hermann, T.; Hunt, A.; Neuhoff, J. G. (eds.) (2011). *The Sonification Handbook* (1st). Logos Publishing House (Logos Verlag), Berlin. <https://sonification.de/handbook/>

<a id="ref-105"></a>105. Oberkampf, W. L.; Roy, C. J. (2010). *Verification and Validation in Scientific Computing* (1st ed.). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511760396](https://doi.org/10.1017/CBO9780511760396)

<a id="ref-106"></a>106. Billah, K. Y.; Scanlan, R. H. (1991). Resonance, Tacoma Narrows bridge failure, and undergraduate physics textbooks. *American Journal of Physics* 59(2), 118-124. American Association of Physics Teachers. [doi:10.1119/1.16590](https://doi.org/10.1119/1.16590)

<a id="ref-107"></a>107. Green, D.; Unruh, W. G. (2006). The failure of the Tacoma Bridge: A physical model. *American Journal of Physics* 74(8), 706-716. American Association of Physics Teachers. [doi:10.1119/1.2201854](https://doi.org/10.1119/1.2201854)

<a id="ref-108"></a>108. Anonymous (1831). Fall of the Broughton suspension bridge, near Manchester. *The Philosophical Magazine (Series 2; full title: The Philosophical Magazine, or Annals of Chemistry, Mathematics, Astronomy, Natural History, and General Science)* 9(53), 384-389. Richard Taylor, London (now Taylor & Francis). [doi:10.1080/14786443108647630](https://doi.org/10.1080/14786443108647630)

<a id="ref-109"></a>109. Dallard, P.; Fitzpatrick, A. J.; Flint, A.; Le Bourva, S.; Low, A.; Ridsdill Smith, R. M.; Willford, M. (2001). The London Millennium Footbridge. *The Structural Engineer* 79(22), 17-33. The Institution of Structural Engineers. <https://www.istructe.org/journal/volumes/volume-79-(published-in-2001)/issue-22/the-london-millennium-footbridge/>

<a id="ref-110"></a>110. Strogatz, S. H.; Abrams, D. M.; McRobie, A.; Eckhardt, B.; Ott, E. (2005). Crowd synchrony on the Millennium Bridge. *Nature* 438(7064), 43-44. Nature Publishing Group. [doi:10.1038/438043a](https://doi.org/10.1038/438043a)

<a id="ref-111"></a>111. Belykh, I.; Bocian, M.; Champneys, A. R.; Daley, K.; Jeter, R.; Macdonald, J. H. G.; McRobie, A. (2021). Emergence of the London Millennium Bridge instability without synchronisation. *Nature Communications* 12(1), 7223. Springer Nature. [doi:10.1038/s41467-021-27568-y](https://doi.org/10.1038/s41467-021-27568-y)

<a id="ref-112"></a>112. Schrock, K. (2007). Fact or Fiction?: An Opera Singer's Piercing Voice Can Shatter Glass. *Scientific American (online), 23 August 2007*. Scientific American. <https://www.scientificamerican.com/article/fact-or-fiction-opera-singer-can-shatter-glass/>

<a id="ref-113"></a>113. Skeldon, K. D.; Nadeau, V. J.; Adams, C. (1998). The resonant excitation of a wineglass using positive feedback with optical sensing. *American Journal of Physics* 66(10), 851-860. American Association of Physics Teachers. [doi:10.1119/1.19031](https://doi.org/10.1119/1.19031)

<a id="ref-114"></a>114. Gillespie, T. D. (1992). *Fundamentals of Vehicle Dynamics* (1st). *SAE book R-114*. SAE International (Society of Automotive Engineers), Warrendale, PA. [doi:10.4271/R-114](https://doi.org/10.4271/R-114)

<a id="ref-115"></a>115. Dixon, J. C. (2007). *The Shock Absorber Handbook* (2nd). John Wiley & Sons, Chichester. [doi:10.1002/9780470516430](https://doi.org/10.1002/9780470516430)

<a id="ref-116"></a>116. Galilei, G. (1638). *Discorsi e dimostrazioni matematiche intorno a due nuove scienze* (1st). Appresso gli Elsevirii, Leida (Leiden). <https://openlibrary.org/works/OL15231447W>

<a id="ref-117"></a>117. Galilei, G. (1914). *Dialogues Concerning Two New Sciences* (English translation by Henry Crew and Alfonso de Salvio, with an introduction by Antonio Favaro). Macmillan, New York. <https://archive.org/details/dialoguesconcern00galiuoft>

<a id="ref-118"></a>118. Huygens, C. (1673). *Horologium oscillatorium sive de motu pendulorum ad horologia aptato demonstrationes geometricae* (1st). F. Muguet, Paris (Parisiis, apud F. Muguet). <https://openlibrary.org/works/OL4850524W>

<a id="ref-119"></a>119. Huygens, C. (1986). *Christiaan Huygens' The Pendulum Clock, or Geometrical Demonstrations Concerning the Motion of Pendula as Applied to Clocks* (English translation with notes by Richard J. Blackwell; introduction by H. J. M. Bos). Iowa State University Press, Ames. <https://openlibrary.org/isbn/9780813809335>

<a id="ref-120"></a>120. Borda, J.-C. de; Lagrange, J.-L.; Laplace, P.-S.; Monge, G.; Condorcet, N. de (1791). *Rapport sur le choix d'une unité de mesure, lu à l'Académie des sciences le 19 mars 1791*. *Imprimé par ordre de l'Assemblée nationale*, 12 pp.. De l'Imprimerie nationale, Paris. <https://archive.org/details/rapportsurlechoi00bord>

<a id="ref-121"></a>121. Baker, G. L.; Gollub, J. P. (1996). *Chaotic Dynamics: An Introduction* (2nd). Cambridge University Press, Cambridge; New York. [doi:10.1017/CBO9781139170864](https://doi.org/10.1017/CBO9781139170864)

<a id="ref-122"></a>122. Goriely, A.; McMillen, T. (2002). Shape of a Cracking Whip. *Physical Review Letters* 88(24), 244301. American Physical Society. [doi:10.1103/PhysRevLett.88.244301](https://doi.org/10.1103/PhysRevLett.88.244301)

<a id="ref-123"></a>123. Cramer, O. (1993). The variation of the specific heat ratio and the speed of sound in air with temperature, pressure, humidity, and CO2 concentration. *The Journal of the Acoustical Society of America* 93(5), 2510-2516. Acoustical Society of America. [doi:10.1121/1.405827](https://doi.org/10.1121/1.405827)

<a id="ref-124"></a>124. Budynas, R. G.; Nisbett, J. K. (2020). *Shigley's Mechanical Engineering Design* (11th edition). McGraw-Hill Education, New York (ISBN 978-0-07-339821-1). <https://scholarsmine.mst.edu/mec_aereng_facwork/2395>

<a id="ref-125"></a>125. Brown, D.; Cox, A. J. (2009). Innovative Uses of Video Analysis. *The Physics Teacher* 47(3), 145-150. American Association of Physics Teachers. [doi:10.1119/1.3081296](https://doi.org/10.1119/1.3081296)

<a id="ref-126"></a>126. Baker, G. L.; Blackburn, J. A. (2005). *The Pendulum: A Case Study in Physics*. Oxford University Press, Oxford; New York. [doi:10.1093/oso/9780198567547.001.0001](https://doi.org/10.1093/oso/9780198567547.001.0001)

<a id="ref-127"></a>127. Nielsen, J. (1993). *Usability Engineering* (1st). Academic Press, Boston. [doi:10.1016/C2009-0-21512-1](https://doi.org/10.1016/C2009-0-21512-1)

<a id="ref-128"></a>128. Miller, R. B. (1968). Response time in man-computer conversational transactions. *Proceedings of the December 9-11, 1968, Fall Joint Computer Conference, Part I (AFIPS '68), San Francisco, California; AFIPS Conference Proceedings vol. 33* 33, 267-277. ACM, New York. [doi:10.1145/1476589.1476628](https://doi.org/10.1145/1476589.1476628)

<a id="ref-129"></a>129. Card, S. K.; Robertson, G. G.; Mackinlay, J. D. (1991). The information visualizer, an information workspace. *Proceedings of the SIGCHI Conference on Human Factors in Computing Systems: Reaching Through Technology (CHI '91), New Orleans, Louisiana, 27 April - 2 May 1991*, 181-186. ACM, New York. [doi:10.1145/108844.108874](https://doi.org/10.1145/108844.108874)

<a id="ref-130"></a>130. Shneiderman, B. (1983). Direct Manipulation: A Step Beyond Programming Languages. *Computer* 16(8), 57-69. IEEE Computer Society. [doi:10.1109/MC.1983.1654471](https://doi.org/10.1109/MC.1983.1654471)

<a id="ref-131"></a>131. Hutchins, E. L.; Hollan, J. D.; Norman, D. A. (1985). Direct Manipulation Interfaces. *Human-Computer Interaction* 1(4), 311-338. Lawrence Erlbaum Associates (now Taylor & Francis). [doi:10.1207/s15327051hci0104_2](https://doi.org/10.1207/s15327051hci0104_2)

<a id="ref-132"></a>132. Crameri, F.; Shephard, G. E.; Heron, P. J. (2020). The misuse of colour in science communication. *Nature Communications* 11(1), 5444. Springer Nature. [doi:10.1038/s41467-020-19160-7](https://doi.org/10.1038/s41467-020-19160-7)

<a id="ref-133"></a>133. Tufte, E. R. (2001). *The Visual Display of Quantitative Information* (2nd). Graphics Press, Cheshire, Connecticut. <https://www.edwardtufte.com/book/the-visual-display-of-quantitative-information/>

<a id="ref-134"></a>134. Cleveland, W. S.; McGill, R. (1984). Graphical Perception: Theory, Experimentation, and Application to the Development of Graphical Methods. *Journal of the American Statistical Association* 79(387), 531-554. American Statistical Association (Taylor & Francis). [doi:10.1080/01621459.1984.10478080](https://doi.org/10.1080/01621459.1984.10478080)

<a id="ref-135"></a>135. World Wide Web Consortium (W3C); Campbell, A.; Adams, C.; Montgomery, R. B.; Cooper, M.; Kirkpatrick, A. (eds.) (2023). *Web Content Accessibility Guidelines (WCAG) 2.2* (W3C Recommendation 5 October 2023; republished with updates 12 December 2024). *W3C Recommendation*. World Wide Web Consortium. <https://www.w3.org/TR/2023/REC-WCAG22-20231005/>

<a id="ref-136"></a>136. Wieman, C. E.; Adams, W. K.; Perkins, K. K. (2008). PhET: Simulations That Enhance Learning. *Science* 322(5902), 682-683. American Association for the Advancement of Science. [doi:10.1126/science.1161948](https://doi.org/10.1126/science.1161948)

<a id="ref-137"></a>137. Perkins, K.; Adams, W.; Dubson, M.; Finkelstein, N.; Reid, S.; Wieman, C.; LeMaster, R. (2006). PhET: Interactive Simulations for Teaching and Learning Physics. *The Physics Teacher* 44(1), 18-23. American Association of Physics Teachers. [doi:10.1119/1.2150754](https://doi.org/10.1119/1.2150754)

<a id="ref-138"></a>138. Smetana, L. K.; Bell, R. L. (2012). Computer Simulations to Support Science Instruction and Learning: A critical review of the literature. *International Journal of Science Education* 34(9), 1337-1370. Routledge (Taylor & Francis). [doi:10.1080/09500693.2011.605182](https://doi.org/10.1080/09500693.2011.605182)

<a id="ref-139"></a>139. Hake, R. R. (1998). Interactive-engagement versus traditional methods: A six-thousand-student survey of mechanics test data for introductory physics courses. *American Journal of Physics* 66(1), 64-74. American Association of Physics Teachers. [doi:10.1119/1.18809](https://doi.org/10.1119/1.18809)

<a id="ref-140"></a>140. White, R.; Gunstone, R. (1992). *Probing Understanding* (1st). The Falmer Press, London. [doi:10.4324/9780203761342](https://doi.org/10.4324/9780203761342)

<a id="ref-141"></a>141. Champagne, A. B.; Klopfer, L. E.; Anderson, J. H. (1980). Factors influencing the learning of classical mechanics. *American Journal of Physics* 48(12), 1074-1079. American Association of Physics Teachers. [doi:10.1119/1.12290](https://doi.org/10.1119/1.12290)

<a id="ref-142"></a>142. Ainsworth, S. (2006). DeFT: A conceptual framework for considering learning with multiple representations. *Learning and Instruction* 16(3), 183-198. Elsevier. [doi:10.1016/j.learninstruc.2006.03.001](https://doi.org/10.1016/j.learninstruc.2006.03.001)

<a id="ref-143"></a>143. Sweller, J. (1988). Cognitive Load During Problem Solving: Effects on Learning. *Cognitive Science* 12(2), 257-285. Wiley (Cognitive Science Society). [doi:10.1207/s15516709cog1202_4](https://doi.org/10.1207/s15516709cog1202_4)

<a id="ref-144"></a>144. Mayer, R. E. (2009). *Multimedia Learning* (2nd). Cambridge University Press. [doi:10.1017/CBO9780511811678](https://doi.org/10.1017/CBO9780511811678)

<a id="ref-145"></a>145. Adams, W. K.; Reid, S.; LeMaster, R.; McKagan, S. B.; Perkins, K. K.; Dubson, M.; Wieman, C. E. (2008). A Study of Educational Simulations Part II - Interface Design. *Journal of Interactive Learning Research* 19(4), 551-577. Association for the Advancement of Computing in Education (AACE), Chesapeake, VA. <https://eric.ed.gov/?id=EJ810084>

<a id="ref-146"></a>146. Podolefsky, N. S.; Perkins, K. K.; Adams, W. K. (2010). Factors promoting engaged exploration with computer simulations. *Physical Review Special Topics - Physics Education Research* 6(2), 020117 (11 pp.). American Physical Society. [doi:10.1103/PhysRevSTPER.6.020117](https://doi.org/10.1103/PhysRevSTPER.6.020117)

<a id="ref-147"></a>147. Podolefsky, N. S.; Moore, E. B.; Perkins, K. K. (2013). *Implicit scaffolding in interactive simulations: Design strategies to support multiple educational goals*. *arXiv e-prints (physics.ed-ph)*, arXiv:1306.6544. arXiv. [doi:10.48550/arXiv.1306.6544](https://doi.org/10.48550/arXiv.1306.6544)
