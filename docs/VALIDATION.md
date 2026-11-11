# SimuLab — Doğrulama çizelgeleri / Verification tables

*2026-11-11 · Node.js 26.11.1, Windows_NT x64; RK4, h = 1 ms*

Bu dosya “npm run docs” komutuyla üretilir: 14 deney, 67 ölçüt; hepsi sağlanmadıkça dosya yazılmaz. Kuram ve kaynakça için [TEKNIK_RAPOR.md](TEKNIK_RAPOR.md).

This file is produced by “npm run docs”: 14 experiments, 67 criteria; it is not written unless all of them are met. For theory and references see [TECHNICAL_REPORT.md](TECHNICAL_REPORT.md).

## Türkçe

Hata sütunu, ölçülen değer ile başvuru değeri arasındaki bağıl ya da mutlak farktır. Başvuru değeri olmayan satırlarda ölçülen değerin kendisi bir sınırla karşılaştırılır.

### A.1 Gözlenen yakınsama mertebesi

Kapalı biçimli çözümü bilinen sürülen, sönümlü osilatör ($`m = 1`$ kg, $`k = 4\pi^2`$ N/m, $`c = 0{,}4`$ N·s/m, $`F_0 = 3`$ N, $`\omega = 4`$ rad/s) $`t = 2`$ s anına kadar iki farklı adım büyüklüğüyle çözülür. İki hatadan hesaplanan gözlenen mertebe $`p = \ln(e_1/e_2)/\ln(h_1/h_2)`$, yöntemin kuramsal mertebesiyle karşılaştırılır [[1](#ref-1), [2](#ref-2)].

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
| $`A(0{,}5\,\omega_0)`$ | 0.05434726 m | 0.05434726 m | 9.43×10⁻¹⁰ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(0{,}5\,\omega_0)`$ | 0.05233312 rad | 0.05233312 rad | 4.15×10⁻⁹ | ≤ 0.001 | geçti |
| $`A(0{,}9\,\omega_0)`$ | 0.2013308 m | 0.2013308 m | 2.43×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(0{,}9\,\omega_0)`$ | 0.3562965 rad | 0.3562964 rad | 1.09×10⁻⁸ | ≤ 0.001 | geçti |
| $`A(\omega_0)`$ | 0.5194805 m | 0.5194805 m | 2.61×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(\omega_0)`$ | 1.570796 rad | 1.570796 rad | 8.93×10⁻⁹ | ≤ 0.001 | geçti |
| $`A(1{,}1\,\omega_0)`$ | 0.1797363 m | 0.1797363 m | 3.30×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(1{,}1\,\omega_0)`$ | 2.751157 rad | 2.751157 rad | 1.63×10⁻⁹ | ≤ 0.001 | geçti |
| $`A(1{,}5\,\omega_0)`$ | 0.03250888 m | 0.03250888 m | 1.04×10⁻⁸ | ≤ 1.00×10⁻⁵ | geçti |
| $`\delta(1{,}5\,\omega_0)`$ | 3.047585 rad | 3.047585 rad | 3.28×10⁻⁸ | ≤ 0.001 | geçti |

### A.4 Basamak yanıtı: aşım ve yerleşme süresi

$`m = 4`$ kg, $`k = 36`$ N/m, $`x_0 = 2`$ m. Kritik sönümde aşım olmamalı ve %2 yerleşme süresi $`5{,}834/\omega_0`$ değerine eşit olmalıdır; $`\zeta = 0{,}5`$ için aşım $`e^{-\pi\zeta/\sqrt{1-\zeta^2}}`$ değerini vermelidir. Yerleşme süresi 1 ms çözünürlükle ölçülür.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| Aşım, $`\zeta = 1`$ | 0 | — | — | ≤ 1.00×10⁻⁹ | geçti |
| %2 yerleşme süresi, $`\zeta = 1`$ | 1.944 s | 1.944641 s | 3.29×10⁻⁴ | ≤ 0.002 | geçti |
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

$`L = 1`$ m boyundaki tek sarkacın ölçülen periyodu, $`T = 4\sqrt{L/g}\,K(\sin(\theta_0/2))`$ eliptik integral çözümüyle karşılaştırılır [[3](#ref-3), [4](#ref-4)]. Son satır, tepeden aşarak sürekli dönen sarkaçtır: $`T = (2/\kappa)\sqrt{L/g}\,K(1/\kappa)`$.

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

Eşit kütleli ve eşit boylu zincirin sayısal özfrekansları, $`\omega_k^2 = (g/\ell)\,x_k`$ bağıntısındaki Laguerre sıfırlarıyla [[5](#ref-5), [6](#ref-6)]; çift sarkacınkiler kapalı biçimli $`(2 \mp \sqrt2)\,g/\ell`$ sonucuyla [[7](#ref-7)]; altı bağlantılı zincirin temel frekansı asılı ipin Bessel sıfırıyla verilen değeriyle [[8](#ref-8)] karşılaştırılır. Son satır doğrusal olmayan benzetimin küçük genlikte birinci modun periyodunu yeniden ürettiğini denetler.

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

Benettin yöntemiyle [[9](#ref-9)] 400 s boyunca kestirilen üstel, düzenli hareketlerde sıfıra yakın, kaotik çift sarkaçta ise belirgin biçimde pozitif olmalıdır. Son iki satır kestirimin sayısal parametrelere duyarlılığını ölçer: adım yarıya indirilir ve başlangıç ayrılığı on kat büyütülür.

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

Frekansı 1,2345 Hz ve genliği 0,7 olan, sabit bir bileşen eklenmiş sinüs 100 Hz ile örneklenir (4096 örnek). Frekans hiçbir FFT kutusuna tam denk gelmez; Hann penceresi [[10](#ref-10)] ve iki kutulu ara değerleme [[11](#ref-11)] ile tepe frekansı ve genliği yeniden elde edilir.

| Büyüklük | Ölçülen | Başvuru değeri | Hata | Tolerans | Sonuç |
| --- | ---: | ---: | ---: | ---: | :---: |
| Tepe frekansı | 1.2345 Hz | 1.2345 Hz | 4.62×10⁻⁹ | ≤ 1.00×10⁻⁴ | geçti |
| Tepe genliği | 0.7 | 0.7 | 1.02×10⁻⁸ | ≤ 0.001 | geçti |

## English

The error column is the relative or absolute difference between the measured value and the reference value. In rows without a reference value the measured value itself is compared with a bound.

### A.1 Observed order of accuracy

A driven, damped oscillator with a known closed-form solution ($`m = 1`$ kg, $`k = 4\pi^2`$ N/m, $`c = 0.4`$ N·s/m, $`F_0 = 3`$ N, $`\omega = 4`$ rad/s) is integrated to $`t = 2`$ s with two step sizes. The observed order $`p = \ln(e_1/e_2)/\ln(h_1/h_2)`$ computed from the two errors is compared with the theoretical order of the method [[1](#ref-1), [2](#ref-2)].

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Explicit Euler | 1.007261 | 1 | 0.007260591 | ≤ 0.1 | passed |
| Symplectic Euler | 1.005086 | 1 | 0.005086394 | ≤ 0.1 | passed |
| Midpoint (RK2) | 2.000519 | 2 | 5.19×10⁻⁴ | ≤ 0.1 | passed |
| Classical Runge–Kutta (RK4) | 4.004818 | 4 | 0.004817861 | ≤ 0.1 | passed |
| Dormand–Prince 5 | 5.023805 | 5 | 0.02380499 | ≤ 0.1 | passed |

### A.2 Free response against the closed-form solution

The oscillator with $`m = 2`$ kg and $`k = 24`$ N/m is released from rest at $`x_0 = 2`$ m and integrated with RK4 at $`h = 1`$ ms for 20 s. The table gives the largest deviation of the numerical position from the analytical solution in the four damping regimes.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`\zeta = 0`$ (undamped) | 1.62×10⁻¹⁰ m | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`\zeta = 0.1`$ (underdamped) | 8.86×10⁻¹² m | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`\zeta = 1`$ (critically damped) | 2.77×10⁻¹² m | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`\zeta = 2.5`$ (overdamped) | 2.15×10⁻¹¹ m | — | — | ≤ 1.00×10⁻⁹ | passed |

### A.3 Driven steady state: amplitude and phase lag

$`m = 2`$ kg, $`k = 24.5`$ N/m, $`c = 0.55`$ N·s/m, $`F_0 = 1`$ N. The oscillator is driven at five frequencies until the transient has decayed by a factor $`e^{-16}`$; amplitude and phase lag are measured with the virtual instruments of the application and compared with the theoretical $`A(\omega)`$ and $`\delta(\omega)`$.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`A(0.5\,\omega_0)`$ | 0.05434726 m | 0.05434726 m | 9.43×10⁻¹⁰ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(0.5\,\omega_0)`$ | 0.05233312 rad | 0.05233312 rad | 4.15×10⁻⁹ | ≤ 0.001 | passed |
| $`A(0.9\,\omega_0)`$ | 0.2013308 m | 0.2013308 m | 2.43×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(0.9\,\omega_0)`$ | 0.3562965 rad | 0.3562964 rad | 1.09×10⁻⁸ | ≤ 0.001 | passed |
| $`A(\omega_0)`$ | 0.5194805 m | 0.5194805 m | 2.61×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(\omega_0)`$ | 1.570796 rad | 1.570796 rad | 8.93×10⁻⁹ | ≤ 0.001 | passed |
| $`A(1.1\,\omega_0)`$ | 0.1797363 m | 0.1797363 m | 3.30×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(1.1\,\omega_0)`$ | 2.751157 rad | 2.751157 rad | 1.63×10⁻⁹ | ≤ 0.001 | passed |
| $`A(1.5\,\omega_0)`$ | 0.03250888 m | 0.03250888 m | 1.04×10⁻⁸ | ≤ 1.00×10⁻⁵ | passed |
| $`\delta(1.5\,\omega_0)`$ | 3.047585 rad | 3.047585 rad | 3.28×10⁻⁸ | ≤ 0.001 | passed |

### A.4 Step response: overshoot and settling time

$`m = 4`$ kg, $`k = 36`$ N/m, $`x_0 = 2`$ m. At critical damping there must be no overshoot and the 2 % settling time must equal $`5.834/\omega_0`$; for $`\zeta = 0.5`$ the overshoot must equal $`e^{-\pi\zeta/\sqrt{1-\zeta^2}}`$. The settling time is measured with a resolution of 1 ms.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Overshoot, $`\zeta = 1`$ | 0 | — | — | ≤ 1.00×10⁻⁹ | passed |
| 2 % settling time, $`\zeta = 1`$ | 1.944 s | 1.944641 s | 3.29×10⁻⁴ | ≤ 0.002 | passed |
| Overshoot, $`\zeta = 0.5`$ | 0.1630335 | 0.1630335 | 1.79×10⁻⁷ | ≤ 1.00×10⁻⁴ | passed |

### A.5 Impact with a stop: instant, speed and energy loss

The undamped oscillator ($`m = 2`$ kg, $`k = 24`$ N/m) is released at $`x_0 = 6`$ m and hits the stop at $`x_\mathrm{min} = -4.75`$ m. The instant of impact $`\arccos(x_\mathrm{min}/x_0)/\omega_0`$, the impact speed $`\omega_0\sqrt{x_0^2 - x_\mathrm{min}^2}`$ and the energy lost $`\tfrac12 m v^2(1-e^2)`$ are known in closed form. The instant of impact is located inside the step by bisection.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Instant of impact | 0.7171639 s | 0.7171639 s | 8.64×10⁻¹³ | ≤ 1.00×10⁻⁸ | passed |
| Impact speed | 12.69843 m/s | 12.69843 m/s | 2.70×10⁻¹⁴ | ≤ 1.00×10⁻⁸ | passed |
| Energy lost in the impact | 128.5969 J | 128.5969 J | 5.41×10⁻¹⁴ | ≤ 1.00×10⁻⁸ | passed |
| Mechanical energy after the impact | 303.4031 J | 303.4031 J | 6.00×10⁻¹⁵ | ≤ 1.00×10⁻⁸ | passed |

### A.6 Closure of the energy ledger

Damping, drive and stops act together ($`c = 0.55`$ N·s/m, $`F_0 = 12`$ N, $`\omega = 3.5`$ rad/s; 27 impacts in 60 s). The largest relative deviation of $`E_k + E_p + Q_c + Q_e - W`$ from the initial energy is measured.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| RK4, 1000 Hz | 1.27×10⁻¹² | — | — | ≤ 1.00×10⁻⁸ | passed |
| RK4, 300 Hz | 1.49×10⁻¹⁰ | — | — | ≤ 1.00×10⁻⁶ | passed |

### A.7 Period of the finite-amplitude pendulum

The measured period of a single pendulum of length $`L = 1`$ m is compared with the elliptic-integral solution $`T = 4\sqrt{L/g}\,K(\sin(\theta_0/2))`$ [[3](#ref-3), [4](#ref-4)]. The last row is a pendulum that goes over the top and rotates continuously: $`T = (2/\kappa)\sqrt{L/g}\,K(1/\kappa)`$.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`\theta_0 = 10^\circ`$ | 2.010236 s | 2.010236 s | 3.61×10⁻¹¹ | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 45^\circ`$ | 2.086612 s | 2.086612 s | 3.74×10⁻¹² | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 90^\circ`$ | 2.368246 s | 2.368246 s | 1.03×10⁻¹⁰ | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 135^\circ`$ | 3.065688 s | 3.065688 s | 1.85×10⁻¹¹ | ≤ 1.00×10⁻⁷ | passed |
| $`\theta_0 = 170^\circ`$ | 4.89436 s | 4.89436 s | 7.25×10⁻¹² | ≤ 1.00×10⁻⁷ | passed |
| Rotation, $`\kappa = 1.2`$ | 1.100227 s | 1.100227 s | 2.33×10⁻¹⁰ | ≤ 1.00×10⁻⁷ | passed |

### A.8 Energy drift of the frictionless chain

The chain with the default masses and lengths is released from large angles and followed for 60 s; the table gives the largest relative deviation of the energy ledger. The explicit-Euler row is there to show the inadequacy of that method and is a lower-bound criterion. The last two rows are the hardest corner of the admissible parameter range (three heavy, long links driving three light, short ones): the error of the fixed-step method is visible there, that of the error-controlled method is not.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 1`$, RK4, 1000 Hz | 4.67×10⁻¹³ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 2`$, RK4, 1000 Hz | 2.04×10⁻⁹ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 3`$, RK4, 1000 Hz | 2.41×10⁻⁸ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 6`$, RK4, 1000 Hz | 3.34×10⁻⁷ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 2`$, RK4, 300 Hz | 5.34×10⁻⁷ | — | — | ≤ 1.00×10⁻⁴ | passed |
| $`N = 2`$, Dormand–Prince 5 | 6.53×10⁻¹² | — | — | ≤ 1.00×10⁻⁷ | passed |
| $`N = 2`$, viscous joint friction ($`b = 0.3`$) | 5.54×10⁻¹¹ | — | — | ≤ 1.00×10⁻⁶ | passed |
| $`N = 2`$, explicit Euler, 1000 Hz (lower bound) | 0.2415891 | — | — | ≥ 0.01 | passed |
| $`N = 6`$, extreme mass ratio, RK4, 1000 Hz | 0.00154048 | — | — | ≤ 0.01 | passed |
| $`N = 6`$, extreme mass ratio, Dormand–Prince 5 | 4.21×10⁻⁹ | — | — | ≤ 1.00×10⁻⁷ | passed |

### A.9 Small-oscillation spectrum

The numerical eigenfrequencies of a chain with equal masses and equal lengths are compared with the Laguerre zeros in $`\omega_k^2 = (g/\ell)\,x_k`$ [[5](#ref-5), [6](#ref-6)]; those of the double pendulum with the closed-form result $`(2 \mp \sqrt2)\,g/\ell`$ [[7](#ref-7)]; and the fundamental of the six-link chain with the value given by the Bessel zero of the hanging rope [[8](#ref-8)]. The last row checks that the non-linear simulation reproduces the period of the first mode at small amplitude.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$: eigenfrequencies against Laguerre zeros | 1.31×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 3`$: eigenfrequencies against Laguerre zeros | 2.65×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 6`$: eigenfrequencies against Laguerre zeros | 8.50×10⁻¹⁶ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 2`$: $`\omega_1`$ | 3.389573 rad/s | 3.389573 rad/s | 0 | ≤ 1.00×10⁻¹² | passed |
| $`N = 2`$: $`\omega_2`$ | 8.183153 rad/s | 8.183153 rad/s | 2.17×10⁻¹⁶ | ≤ 1.00×10⁻¹² | passed |
| $`N = 6`$: fundamental against the hanging-rope limit | 2.090636 rad/s | 2.173969 rad/s | 0.03833225 | ≤ 0.05 | passed |
| $`N = 2`$: period of mode 1 measured in the simulation | 2.736786 s | 2.736775 s | 4.04×10⁻⁶ | ≤ 1.00×10⁻⁴ | passed |

### A.10 Agreement of the Lagrangian and Newtonian derivations

The equations of motion are derived with Lagrange's method. The rod forces are computed separately from Newton's second law for every mass; an ideal rod carries force only along its own direction, so the transverse component must vanish if the two derivations are consistent. The criterion is the ratio of the transverse component to the tension over 200 randomly chosen states. The last row is the known tension of the single pendulum: $`T = m(g\cos\theta + L\dot\theta^2)`$.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$: transverse force / tension | 3.62×10⁻¹⁵ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 6`$: transverse force / tension | 5.29×10⁻¹⁵ | — | — | ≤ 1.00×10⁻¹⁰ | passed |
| $`N = 1`$: rod tension | 18.36231 N | 18.36231 N | 0 | ≤ 1.00×10⁻¹³ | passed |

### A.11 Largest Lyapunov exponent

The exponent estimated with Benettin's method [[9](#ref-9)] over 400 s must be close to zero for regular motion and clearly positive for the chaotic double pendulum. The last two rows measure the sensitivity of the estimate to the numerical parameters: the step is halved and the initial separation is made ten times larger.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 1`$, $`\theta_0 = 120^\circ`$ (regular) | 0.01664401 1/s | — | — | ≤ 0.05 | passed |
| $`N = 2`$, small angles (regular) | 0.003477017 1/s | — | — | ≤ 0.05 | passed |
| $`N = 2`$, $`\theta = (2.15,\ 1.65)`$ rad (chaotic) | 1.040591 1/s | — | — | ≥ 0.5 | passed |
| Same experiment, step halved | 0.96936 1/s | 1.040591 1/s | 0.06845228 | ≤ 0.25 | passed |
| Same experiment, $`d_0 = 10^{-7}`$ | 1.040513 1/s | 1.040591 1/s | 7.50×10⁻⁵ | ≤ 0.25 | passed |

### A.12 Time reversibility

The frictionless equations of motion are reversible in time. The chain is integrated forwards, the signs of the velocities are changed and it is integrated again for the same time; the table gives the largest error in returning to the initial state. On a chaotic trajectory the error grows exponentially, so the time is short and the tolerance wide.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| $`N = 2`$, regular; 20 s out and back | 4.57×10⁻¹² rad | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`N = 3`$, regular; 20 s out and back | 3.14×10⁻¹² rad | — | — | ≤ 1.00×10⁻⁹ | passed |
| $`N = 2`$, chaotic; 5 s out and back | 3.92×10⁻¹⁰ rad | — | — | ≤ 1.00×10⁻⁶ | passed |

### A.13 Agreement of two independent methods

The three-link chain is integrated for 5 s with fixed-step RK4 and with the error-controlled Dormand–Prince method. When the step is made four times smaller, the difference between RK4 and the reference solution must shrink by a factor of about $`4^4 = 256`$, as expected of a fourth-order method.

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Difference between RK4 (1000 Hz) and DP5 | 8.43×10⁻⁸ rad | — | — | ≤ 1.00×10⁻⁶ | passed |
| Difference between RK4 (4000 Hz) and DP5 | 3.28×10⁻¹⁰ rad | — | — | ≤ 1.00×10⁻⁸ | passed |
| Error ratio (expected: about 256) | 256.6497 | 256 | 0.002537926 | ≤ 0.25 | passed |

### A.14 Spectrum analyser

A sine of frequency 1.2345 Hz and amplitude 0.7 with a constant offset is sampled at 100 Hz (4096 samples). The frequency does not coincide with any FFT bin; the peak frequency and amplitude are recovered with a Hann window [[10](#ref-10)] and two-bin interpolation [[11](#ref-11)].

| Quantity | Measured | Reference value | Error | Tolerance | Result |
| --- | ---: | ---: | ---: | ---: | :---: |
| Peak frequency | 1.2345 Hz | 1.2345 Hz | 4.62×10⁻⁹ | ≤ 1.00×10⁻⁴ | passed |
| Peak amplitude | 0.7 | 0.7 | 1.02×10⁻⁸ | ≤ 0.001 | passed |

<a id="references"></a>

## Kaynakça / References

2026-11-10

<a id="ref-1"></a>1. Roache, P. J. (1998). *Verification and Validation in Computational Science and Engineering*. Hermosa Publishers, Albuquerque, NM. <https://openlibrary.org/books/OL400789M>

<a id="ref-2"></a>2. Oberkampf, W. L.; Roy, C. J. (2010). *Verification and Validation in Scientific Computing* (1st ed.). Cambridge University Press, Cambridge. [doi:10.1017/CBO9780511760396](https://doi.org/10.1017/CBO9780511760396)

<a id="ref-3"></a>3. Beléndez, A.; Pascual, C.; Méndez, D. I.; Beléndez, T.; Neipp, C. (2007). Exact solution for the nonlinear pendulum. *Revista Brasileira de Ensino de Física* 29(4), 645-648. Sociedade Brasileira de Física (SciELO). [doi:10.1590/S1806-11172007000400024](https://doi.org/10.1590/S1806-11172007000400024)

<a id="ref-4"></a>4. Carlson, B. C. (2026). Chapter 19: Elliptic Integrals. *NIST Digital Library of Mathematical Functions, https://dlmf.nist.gov/, Release 1.2.8 of 2026-09-15 (F. W. J. Olver, A. B. Olde Daalhuis, D. W. Lozier, B. I. Schneider, R. F. Boisvert, C. W. Clark, B. R. Miller, B. V. Saunders, H. S. Cohl, M. A. McClain, eds.)*. National Institute of Standards and Technology. <https://dlmf.nist.gov/19>

<a id="ref-5"></a>5. Müller, P. C. (2007). On Natural Frequencies of Conservative Multi-Degree-of-Freedom Mass-Spring Vibration Systems. *Proceedings of the XII International Symposium on Dynamic Problems of Mechanics (DINAME 2007), P. S. Varoto and M. A. Trindade (eds.), Ilhabela, SP, Brazil, 26 February - 2 March 2007*, paper DIN07-0055, 7 pp.. ABCM (Brazilian Society of Mechanical Sciences and Engineering). <https://www.abcm.org.br/anais/diname/2007/PDF/DIN07-0055.pdf>

<a id="ref-6"></a>6. Braun, M. (2003). On some properties of the multiple pendulum. *Archive of Applied Mechanics* 72(11), 899-910. Springer. [doi:10.1007/s00419-002-0263-4](https://doi.org/10.1007/s00419-002-0263-4)

<a id="ref-7"></a>7. Taylor, J. R. (2005). *Classical Mechanics*. University Science Books, Sausalito, CA. <https://lccn.loc.gov/2004054971>

<a id="ref-8"></a>8. Verbin, Y. (2015). Boundary conditions and modes of the vertically hanging chain. *European Journal of Physics* 36(1), 015005. IOP Publishing. [doi:10.1088/0143-0807/36/1/015005](https://doi.org/10.1088/0143-0807/36/1/015005)

<a id="ref-9"></a>9. Benettin, G.; Galgani, L.; Strelcyn, J.-M. (1976). Kolmogorov entropy and numerical experiments. *Physical Review A* 14(6), 2338-2345. American Physical Society. [doi:10.1103/PhysRevA.14.2338](https://doi.org/10.1103/PhysRevA.14.2338)

<a id="ref-10"></a>10. Harris, F. J. (1978). On the use of windows for harmonic analysis with the discrete Fourier transform. *Proceedings of the IEEE* 66(1), 51-83. IEEE. [doi:10.1109/PROC.1978.10837](https://doi.org/10.1109/PROC.1978.10837)

<a id="ref-11"></a>11. Grandke, T. (1983). Interpolation Algorithms for Discrete Fourier Transforms of Weighted Signals. *IEEE Transactions on Instrumentation and Measurement* 32(2), 350-355. IEEE. [doi:10.1109/TIM.1983.4315077](https://doi.org/10.1109/TIM.1983.4315077)
