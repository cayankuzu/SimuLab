import type { TheoryDocument } from "./types";

/**
 * Tasarım bölümleri: yazılım mimarisi, arayüz ve etkileşim, pedagojik tasarım.
 * "Önceki sürüm" sütunundaki sayılar, yeniden yazımdan önceki kodun (git
 * 0af05e0) değiştirilmeden çalıştırılmasıyla ölçülmüştür.
 */
export const designTr: TheoryDocument = [
  {
    id: "mimari",
    number: "10",
    title: "Yazılım mimarisi",
    summary:
      "Fizik çekirdeği, çalışma zamanı ve gözlemciler olarak ayrılmış üç katman; sabit adımlı döngü; ölçülebilir kalite ölçütleri ve yeniden yazımdan önceki durumla karşılaştırma.",
    sections: [
      {
        id: "mimari-katmanlar",
        title: "Katmanlar ve veri akışı",
        blocks: [
          {
            kind: "p",
            text: "Kod üç katmana ayrılmıştır ve bağımlılıklar yalnızca aşağıya doğrudur. **Fizik çekirdeği** (src/physics) hiçbir çerçeveye bağlı değildir: integratörler, iki deneyin modelleri, Lyapunov kestirimi, ölçüm cihazları, spektrum çözümleyici ve doğrulama deneyleri saf fonksiyonlar ve küçük sınıflardır; tarayıcı olmadan sınanabilirler. **Çalışma zamanı** (src/sim) durumu taşır: sabit adımlı döngüyü yürütür, telemetriyi halka tamponlara yazar, sanal cihazları besler ve deney tanımını dosyaya ya da bağlantıya dönüştürür. **Gözlemciler** çalışma zamanını yalnızca okur: üç boyutlu sahne (src/scene), grafikler (src/ui/plots) ve React bileşenleri (src/ui).",
          },
          {
            kind: "p",
            text: "Sürekli durum (konumlar, hızlar, enerji terimleri) React durumunda tutulmaz. Sahne ve grafikler her canlandırma karesinde çalışma zamanından doğrudan okuyarak çizer; sayısal göstergeler ise saniyede en çok on kez yenilenir. Böylece fizik adımı, çizim ve arayüz birbirinin maliyetinden bağımsızdır. Parametreler, çalışma durumu ve başlangıç koşulları gibi kesikli durum, değişmez (immutable) bir nesne olarak yayımlanır ve bileşenler yalnızca kullandıkları dilime abone olur.",
          },
          {
            kind: "p",
            text: "Sıcak yolda bellek ayrılmaz: integratörler çalışma dizilerini kendileri tutar, yayın sarmal geometrisi her karede aynı tamponun içinde analitik olarak güncellenir, vektör okları ve stroboskop görüntüleri önceden ayrılmış örneklerdir. Sahne yalnızca durum, kamera, katmanlar ya da görünüm boyutu değiştiğinde yeniden çizilir.",
          },
        ],
      },
      {
        id: "mimari-dongu",
        title: "Sabit adımlı döngü",
        blocks: [
          {
            kind: "p",
            text: "Her canlandırma karesinin duvar saati süresi bir bütçeye eklenir; bütçe, tam olarak $h = 1/f_s$ büyüklüğünde adımlarla harcanır ve artan kısım bir sonraki kareye devreder [@fiedler2004]. Kare başına adım sayısı sınırlıdır; sekme arka plandayken biriken süre atılır. Bu düzenle durum dizisi yalnızca başlangıç koşullarına, parametrelere, yönteme ve $h$ değerine bağlıdır. Sınama paketi bunu doğrudan denetler: aynı deney bir kez düzgün 60 Hz karelerle, bir kez rastgele kare süreleriyle yürütülür ve ortak adım sayılarında durumların bit düzeyinde eşit olduğu doğrulanır.",
          },
          {
            kind: "note",
            tone: "info",
            title: "Neden önemli",
            text: "Kaotik bir sistemde adım büyüklüğündeki en küçük fark üstel olarak büyür. Adımın kare süresinden türetildiği önceki sürümde aynı çift sarkaç deneyi 60 Hz ve 144 Hz ekranlarda 30 s sonunda 214° farklı durumdaydı; yani gözlenen yörünge fiziğe değil ekrana bağlıydı.",
          },
        ],
      },
      {
        id: "mimari-kalite",
        title: "Kalite güvencesi",
        blocks: [
          {
            kind: "list",
            items: [
              "TypeScript katı kipte derlenir; statik çözümleme (ESLint) uyarısız geçer.",
              "102 otomatik sınama vardır: doğrusal cebir, özel fonksiyonlar, integratörler, her iki model, ölçüm cihazları, çalışma zamanı, veri alışverişi ve on dört doğrulama deneyi. Deney föylerinin her biri için, föyün gerçekten ölçümle tamamlanabildiğini ve yanlış ayarla tamamlanamadığını gösteren bir sınama bulunur. İçerik de sınanır: kuram metninin iki dilde aynı yapıda olması, her atfın kaynakçada bulunması, her formülün dizilebilmesi ve föy ile doğrulama metinlerinin koddaki ölçüt ve satır sayılarıyla uyuşması.",
              "Dışarıdan gelen veri (deney dosyası, paylaşım bağlantısı) tür ve aralık bakımından doğrulanır; geçersiz girdi reddedilir, aralık dışı sayılar sınırlanır.",
              "Sürekli tümleştirme her değişiklikte tür denetimi, statik çözümleme, sınamalar ve üretim derlemesini çalıştırır.",
            ],
          },
        ],
      },
      {
        id: "mimari-karsilastirma",
        title: "Yeniden yazımdan önceki durumla karşılaştırma",
        blocks: [
          {
            kind: "p",
            text: "Aşağıdaki çizelgede soldaki sayılar önceki kodun değiştirilmeden çalıştırılmasıyla, sağdakiler bu sürümün doğrulama paketiyle ölçülmüştür. Önceki sürümün Lagrange denklemleri ve tek RK4 adımı doğruydu; eksik olan, çevresindeki ölçüm ve muhasebe düzeniydi.",
          },
          {
            kind: "table",
            caption: "Çizelge 10.1. Ölçülebilir ölçütlerde önceki sürüm ile bu sürüm.",
            head: ["Ölçüt", "Önceki sürüm", "Bu sürüm"],
            rows: [
              [
                "Zaman adımı",
                "Kare süresinden türetilir (60 Hz'te 3,33 ms; 144 Hz'te 2,31 ms)",
                "Sabit $h = 1$ ms; kare hızından bağımsız",
              ],
              [
                "Aynı çift sarkaç deneyi, 60 Hz ve 144 Hz ekranda",
                "30 s sonunda 214° durum farkı",
                "Bit düzeyinde özdeş",
              ],
              ["Çift sarkaç, 60 s bağıl enerji sapması", "$5{,}7\\times10^{-7}$", "$2{,}0\\times10^{-9}$"],
              ["Altı bağlantılı zincir, 60 s bağıl enerji sapması", "$9{,}0\\times10^{-5}$", "$3{,}3\\times10^{-7}$"],
              [
                "Durdurucuya çarpma",
                "Sekme kare hızına bağlı: $x(3\\,\\mathrm{s}) = 2{,}19$ m (60 Hz), $4{,}05$ m (120 Hz)",
                "Olay konumlama; çarpışma anındaki hata $9\\times10^{-13}$ s",
              ],
              [
                "Enerji muhasebesi (sürülen, durduruculu deney)",
                "Çarpışma kayıpları ve sürücü işi kayıt dışı; gösterilen “toplam” 60 s'de 0,49 J'den 4414 J'ye çıkar",
                "Beş terimli defter; 27 çarpışmada bağıl kalıntı $1{,}3\\times10^{-12}$",
              ],
              [
                "Sarkaçta ısı",
                "$E_0 - E_\\mathrm{mek}$ olarak tanımlı; $g$ değişince 4,78 J'den 66,63 J'ye sıçrar",
                "Ayrı durum değişkeni olarak integre edilir; parametre değişiminde defter yeniden tabanlanır",
              ],
              [
                "Dışa aktarılan CSV",
                "Satırların %99,6'sında enerji başka bir ana ait; 4,3 s'lik kayıt",
                "Her satır tek bir an; 600 s'ye kadar kayıt; tam üstveri",
              ],
              [
                "Yay geometrisi",
                "Karede yeniden oluşturulur: 1031 KiB bellek, 0,57 ms",
                "Aynı tamponda güncellenir; bellek ayrılmaz",
              ],
              ["Otomatik sınama", "Yok", "102 sınama, 14'ü doğrulama deneyi"],
              [
                "Erişilebilirlik",
                "ARIA özniteliği, klavye denetimi ve iletişim kutusu anlamı yok",
                "Bütün denetimler klavyeyle kullanılır; görünür odak; etiketli denetimler",
              ],
              ["İngilizce arayüz", "68 çeviri anahtarının 19'u kullanılıyor", "İki dil tam; anahtar eşliği derleme zamanında denetlenir"],
            ],
          },
        ],
      },
    ],
  },
  {
    id: "arayuz",
    number: "11",
    title: "Arayüz ve etkileşim tasarımı",
    summary:
      "Yerleşim, doğrudan manipülasyon, nicelik–renk eşlemesi, ölçekli vektörler, grafik ilkeleri, erişilebilirlik ve sonifikasyon kararlarının gerekçeleri.",
    sections: [
      {
        id: "arayuz-yerlesim",
        title: "Yerleşim: parametre, sahne ve grafik aynı anda",
        blocks: [
          {
            kind: "p",
            text: "Bir laboratuvar tezgâhında bir düğme çevrilirken osiloskoba bakılır. Bu nedenle üç bölge aynı anda görünür tutulur: ortada deney düzeneği, altında grafik paneli, sağında parametre paneli. Bir parametre değiştirildiğinde etkisi hem sahnede hem grafikte hem de ölçüm çizelgesinde aynı anda izlenir; birini görmek için ötekini kapatmak gerekmez. Sayısal durum, alt kenardaki durum çubuğunda sürekli görünür: çözücü, adım, enerji defteri kalıntısı ve (osilatörde) analitik çözümden sapma.",
          },
          {
            kind: "p",
            text: "Geri bildirim süreleri için yerleşik eşikler gözetilir: yaklaşık 0,1 s altındaki tepki anlık algılanır, 1 s düşünce akışını bozmadan fark edilir, 10 s dikkatin korunabildiği sınırdır [@nielsen1993; @miller1968; @card1991]. Parametre değişikliği aynı karede uygulanır; uzun süren tek işlem olan frekans taraması ve doğrulama paketi ilerleme göstererek parçalar hâlinde yürütülür ve iptal edilebilir.",
          },
        ],
      },
      {
        id: "arayuz-manipulasyon",
        title: "Doğrudan manipülasyon",
        blocks: [
          {
            kind: "p",
            text: "Cisimler işaretçiyle tutulur, sürüklenir ve bırakılır; ilgilenilen nesne sürekli görünürdür, eylem fizikseldir ve sonucu anında geri alınabilir [@shneiderman1983; @hutchins1985]. Araba tek serbestlik derecelidir: işaretçi ışınının ray eksenine en yakın noktası alınır, böylece eşleme her kamera açısında tutarlıdır. Sarkaç bağlantısı, kendi dönme düzlemiyle kesişim noktasına yöneltilir. Bırakma anındaki hız, son 90 ms'deki işaretçi hareketinden kestirilir ve cisme aktarılır; işaretçi durdurulup bırakılırsa cisim durgun bırakılır.",
          },
          {
            kind: "p",
            text: "Sürükleme tek giriş yolu değildir. Aynı başlangıç koşulları parametre panelindeki sayı alanlarından klavyeyle ve kesin değerle girilebilir; bu hem erişilebilirlik hem de yinelenebilirlik gereğidir. “Sıfırla” komutu varsayılan değerlere değil, yürütülmekte olan deneyin başlangıç koşullarına döner.",
          },
        ],
      },
      {
        id: "arayuz-renk",
        title: "Nicelik–renk eşlemesi",
        blocks: [
          {
            kind: "p",
            text: "Bir fiziksel nicelik her yerde aynı renkle gösterilir: konum ve açı gök mavisi, hız mavimsi yeşil, net kuvvet turuncu, yay kuvveti sarı, sönüm kuvveti kırmızımsı mor, sürücü kuvveti ve ağırlık kızıl turuncudur; kinetik enerji hızın, potansiyel enerji konumun rengini taşır. Renkler Okabe–Ito paletinden alınmıştır [@okabe2008; @wong2011]. Kuzey Avrupa kökenli erkeklerin %8'e varan bölümünde ve kadınların %0,5'inde yaygın kırmızı–yeşil renk görme farklılığı bulunduğundan [@wong2011] bu seçim süsleme değil okunabilirlik koşuludur; bilimsel görsellerde renk seçiminin veriyi çarpıtabildiği de belgelenmiştir [@crameri2020]. Hiçbir bilgi yalnızca renkle verilmez: her vektörün simgesi ve sayısal değeri, her eğrinin etiketi vardır.",
          },
        ],
      },
      {
        id: "arayuz-vektor",
        title: "Ölçekli vektörler ve sahne içi ölçü araçları",
        blocks: [
          {
            kind: "p",
            text: "Vektör okları ölçeklidir: uzunluk büyüklükle doğru orantılıdır ve geçerli ölçek (örneğin 1 m ≙ 20 N) sahnede yazılıdır. Ölçek, son birkaç saniyenin tipik (karekök ortalama) büyüklüğüne göre 1–2–5 dizisinden seçilir. Kısa süreli sıçramalar — örneğin savrulan zincirde çubuk kuvveti — ölçeği bozmasın diye en büyük uzunluğu aşan ok kırpılır ve çift uçla işaretlenir; etiket her zaman gerçek değeri gösterir. Serbest cisim diyagramında her kuvvet ayrı ayrı çizilir; sarkaçta çubuk kuvveti, hareket denklemlerinden bağımsız olarak Newton'un ikinci yasasından hesaplanır ve basınç durumunda yön değiştirir.",
          },
          {
            kind: "p",
            text: "Düzenekler ölçü araçlarıyla birlikte çizilir: osilatörde tezgâh kenarında 0,1 m bölmeli bir cetvel ve arabaya bağlı bir gösterge iğnesi, sarkaçta mafsalın arkasında bir açıölçer bulunur. Düzeneklerde hiçbir katı cisim bir başkasının içinden geçmez: yay telinin çapı, sarımlar tam katı boyda birbirine değecek biçimde seçilmiştir; sarkaç bağlantıları gerçek çok bağlantılı sarkaçlarda olduğu gibi ardışık paralel düzlemlerde döner; stand, zincirin en alt noktası tezgâha değmeyecek biçimde zincir boyuyla birlikte uzar.",
          },
        ],
      },
      {
        id: "arayuz-grafik",
        title: "Grafikler",
        blocks: [
          {
            kind: "p",
            text: "Her grafikte birimli ve sayısal eksenler, 1–2–5 aralıklı bölmeler ve silik bir ızgara vardır; süsleme yoktur [@tufte2001]. Nicel karşılaştırmalar, algısal olarak en doğru okunan kodlamayla, ortak bir ölçek üzerindeki konumla yapılır [@cleveland1984]. Eksen sınırları veriyi titremeden izler: veri aralığın dışına çıkınca hemen genişler, daralınca yavaşça toplanır. Açılar $(-\\pi, \\pi]$ aralığına sarılır ve eğri sarma noktasında kesilir; böylece yanıltıcı düşey çizgiler oluşmaz. Zaman ekseni kare sayısına değil benzetim zamanına bağlıdır; telemetri çözücü hızından bağımsız olarak yaklaşık 100 Hz'te örneklenir.",
          },
        ],
      },
      {
        id: "arayuz-erisilebilirlik",
        title: "Erişilebilirlik",
        blocks: [
          {
            kind: "p",
            text: "Hedef, WCAG 2.2'nin AA düzeyidir [@w3c2023wcag22]. Bu belgeden alınan ve tasarımı doğrudan belirleyen ölçütler şunlardır:",
          },
          {
            kind: "list",
            items: [
              "**1.4.3 Karşıtlık (en az):** metin için en az 4,5:1. Kullanılan en soluk metin renginin panel zeminiyle karşıtlığı 6:1'in üzerindedir.",
              "**1.4.11 Metin dışı karşıtlık:** denetim sınırları ve grafik öğeleri için en az 3:1.",
              "**1.4.1 Renk kullanımı:** bilgi yalnızca renkle iletilmez; durumlar simge ve sözcükle birlikte verilir.",
              "**2.1.1 Klavye:** bütün işlevler klavyeyle kullanılabilir; sürüklemenin karşılığı sayı alanlarıdır.",
              "**2.4.7 Görünür odak:** tek ve tutarlı bir odak göstergesi.",
              "**2.5.8 Hedef boyutu (en az):** etkileşimli hedefler en az 24×24 CSS pikseli.",
            ],
          },
          {
            kind: "p",
            text: "İletişim kutuları odağı içeride tutar, Escape ile kapanır ve odağı tetikleyen denetime geri verir. Belge dili arayüz diliyle birlikte değişir. İşletim sisteminde hareket azaltma tercihi açıksa arayüz geçişleri kapatılır; benzetimin kendisi içerik olduğu için sürer ve her an duraklatılabilir.",
          },
        ],
      },
      {
        id: "arayuz-ses",
        title: "Sonifikasyon",
        blocks: [
          {
            kind: "p",
            text: "Mekanik frekanslar (2 Hz'in altında) işitme aralığının çok altındadır; bu yüzden ses bir kayıt değil, parametre eşlemeli bir işitsel göstergedir [@hermann2011]. Osilatörde ton yüksekliği konumu (3,5 m başına bir oktav), ses şiddeti hızı izler; durdurucuya çarpma, çarpma hızıyla orantılı kısa bir vuruşla duyulur. Sarkaçta birinci bağlantının düşeyden her geçişi, yöne göre farklı perdede bir tıkla işaretlenir: tek sarkaç saat gibi düzenli, kaotik zincir düzensiz duyulur. Ses yalnızca kullanıcı açtığında, benzetim yürürken ve sekme görünürken çalar.",
          },
        ],
      },
    ],
  },
  {
    id: "pedagoji",
    number: "12",
    title: "Pedagojik tasarım",
    summary:
      "Etkileşimli benzetimlerin öğrenmeye etkisine ilişkin bulgular ve bu bulguların deney föylerinin kuruluşuna nasıl yansıtıldığı.",
    sections: [
      {
        id: "pedagoji-bulgular",
        title: "Benzetimlerle öğrenmeye ilişkin bulgular",
        blocks: [
          {
            kind: "p",
            text: "Etkileşimli benzetimlerin fizik öğretimindeki yeri iyi belgelenmiştir [@wieman2008science; @perkins2006]. 2001–2010 arasındaki 51 yayını inceleyen bir derleme, benzetimlerin geleneksel öğretimi — özellikle laboratuvar etkinliklerini — güçlendirebildiğine ilişkin sağlam kanıt bulmuş, ancak çalışmaların çoğunun öğretmen desteğini ve benzetimin ders içindeki yerini göz ardı ettiğini de saptamıştır [@rutten2012]. Benzer sonuçlara başka derlemeler de varmıştır [@smetana2012; @dejong2013]. Denetimli bir çalışmada, doğru akım devrelerini benzetimle çalışan öğrenciler gerçek donanımla çalışanlara göre hem kavramsal sorularda hem de gerçek devre kurma görevinde daha başarılı olmuştur [@finkelstein2005].",
          },
          {
            kind: "p",
            text: "Bu bulgular benzetimin kendiliğinden öğrettiği anlamına gelmez. 62 giriş dersini ve 6542 öğrenciyi kapsayan bir taramada, etkileşimli katılım yöntemleri kullanan derslerde ortalama normalize kazanım $0{,}48 \\pm 0{,}14$, geleneksel derslerde $0{,}23 \\pm 0{,}04$ bulunmuştur [@hake1998]; belirleyici olan araç değil, öğrencinin etkin biçimde düşünmeye yöneltilmesidir. Açık gözlemlere olanak veren bir benzetimin bile kavramsal anlamayı güvence altına almadığı ayrıca gösterilmiştir [@renken2013].",
          },
        ],
      },
      {
        id: "pedagoji-foyler",
        title: "Deney föylerinin kuruluşu",
        blocks: [
          {
            kind: "p",
            text: "Föyler tahmin et – gözle – açıkla düzenini izler [@white1992; @champagne1980]: öğrenci önce föyün sorusuna verilen yanıtlardan birini seçerek bir öngörüde bulunur, sonra düzeneği kurar ve ölçer; föy tamamlandığında öngörüsü gözlemiyle karşılaştırılır ve ölçümü kuramla bağdaştıran, kaynak gösteren bir açıklama açılır. Ölçütler, öğrenci parametreleri değiştirirken arka planda sürekli değerlendirilir. Bir föyün tamamlanması bir sürgünün konumuna değil ölçüme bağlıdır: periyot sıfır geçişlerinden, sönüm ardışık tepe değerlerinden, aşım ve yerleşme süresi basamak yanıtından, öngörülebilirlik ikiz yörüngenin ayrılmasından ve Lyapunov kestiriminden okunur. Örneğin “kritik sönüm” föyü, sönüm oranının 1 olarak ayarlanmasıyla değil, ölçülen aşımın %0,5'in altında ve yerleşme süresinin kritik değerin %10'u içinde olmasıyla tamamlanır; yarı değerdeki sönüm aşım ölçütünde, iki katı sönüm süre ölçütünde başarısız olur.",
          },
          {
            kind: "p",
            text: "Aynı olgu birden çok gösterimle sunulur — hareketin kendisi, zaman serisi, faz portresi, enerji defteri, spektrum — ve gösterimler renk ve simge bakımından tutarlıdır; çoklu gösterimlerin öğrenmeye katkısı, aralarındaki bağın açık kurulmasına bağlıdır [@ainsworth2006]. Bilişsel yükü sınırlamak için [@sweller1988; @mayer2009] ayrıntılı türetimler ayrı bir okuyucuya alınmış, çalışma yüzeyinde yalnızca o anda gereken denetimler ve göstergeler bırakılmıştır.",
          },
          {
            kind: "p",
            text: "Arayüz, eğitim benzetimleri için yayımlanmış tasarım yönergeleriyle uyumludur: tutulup sürüklenebilen nesneler, sezgisel denetimler, açık bir görsel model, tutarlı gösterimler ve sınırlı metin [@adams2008b]. Yönlendirme, talimat listeleriyle değil, denetimlerin ve göstergelerin kendisiyle yapılır [@podolefsky2010; @podolefsky2013].",
          },
          {
            kind: "note",
            tone: "warning",
            title: "Kapsamın sınırı",
            text: "Bu çalışmada öğrenme kazanımı ölçülmemiştir. Yukarıdaki kaynaklar tasarım kararlarının gerekçesidir; bu laboratuvarın öğrenmeye etkisi hakkında bir iddia ancak denetimli bir sınıf çalışmasıyla desteklenebilir.",
          },
        ],
      },
    ],
  },
];
