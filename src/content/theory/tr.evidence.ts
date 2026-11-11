import type { TheoryDocument } from "./types";

const r = String.raw;

/**
 * Bölüm 7-9: doğrulama sonuçları, kaynak gösterilerek düzeltilen yaygın
 * yanılgılar, varsayımlar ve sınırlılıklar. Çizelge 7.1'deki sayılar
 * src/physics/validation.ts deneylerinin varsayılan çözücüyle (RK4, h = 1 ms)
 * verdiği değerlerdir; "npm run docs" tam çizelgeleri yeniden üretir.
 */
export const evidenceTr: TheoryDocument = [
  {
    id: "dogrulama",
    number: "7",
    title: "Doğrulama",
    summary:
      "Çözücünün, yanıtı bağımsız olarak bilinen on dört problemde ölçülen hataları ve bu sonuçların neyi gösterip neyi göstermediği.",
    sections: [
      {
        id: "dogrulama-yontem",
        title: "Doğrulama ve geçerleme ayrımı",
        blocks: [
          {
            kind: "p",
            text: r`Hesaplamalı bilimde iki ayrı soru sorulur [@oberkampf2010; @roache1998]. **Doğrulama** (verification) “denklemler doğru çözülüyor mu?” sorusudur ve matematiksel bir iştir: kodun yöntemi doğru uyguladığı ve sayısal hatanın bilinen sınırlar içinde kaldığı gösterilir. **Geçerleme** (validation) “doğru denklemler mi çözülüyor?” sorusudur ve ancak fiziksel bir deneyle karşılaştırılarak yanıtlanır.`,
          },
          {
            kind: "p",
            text: r`Bu çalışma birincisini yapar. Kod doğrulaması için gözlenen yakınsama mertebesi ölçülür ve kapalı biçimli çözümlerle karşılaştırma yapılır [@salari2000; @roy2005]; çözüm doğrulaması için korunum yasaları, adım küçültme, zamanda tersinirlik ve bağımsız iki yöntemin uyumu denetlenir. Deneyler tek bir kaynaktan (src/physics/validation.ts) üç yerde çalışır: otomatik sınama paketinde, bu okuyucunun Doğrulama sekmesinde ve teknik raporun ekinde.`,
          },
          {
            kind: "note",
            tone: "warning",
            title: "Geçerleme yapılmamıştır",
            text: r`Model, gerçek bir yay–kütle düzeneği ya da gerçek bir çoklu sarkaçla karşılaştırılmamıştır. Dolayısıyla “doğrulanmış” sözü denklemlerin doğru çözüldüğünü anlatır; denklemlerin belirli bir fiziksel düzeneği ne kadar iyi temsil ettiğini anlatmaz (Bölüm 9).`,
          },
        ],
      },
      {
        id: "dogrulama-sonuclar",
        title: "Sonuçların özeti",
        blocks: [
          {
            kind: "table",
            caption:
              "Çizelge 7.1. Doğrulama deneylerinin özeti (klasik RK4, h = 1 ms). Her deneyin bütün satırları Doğrulama sekmesinde ve raporun ekinde verilir.",
            head: ["Deney", "Ölçülen büyüklük", "Sonuç", "Tolerans"],
            rows: [
              ["Yakınsama mertebesi", r`Gözlenen $p$ (RK4 için beklenen 4)`, "4,005", r`$\pm 0{,}1$`],
              ["Serbest yanıt, dört rejim, 20 s", "En büyük konum hatası", r`$1{,}6 \times 10^{-10}$ m`, r`$10^{-9}$ m`],
              ["Kararlı durum, beş frekans", "Genliğin bağıl hatası", r`$3{,}3 \times 10^{-8}$`, r`$10^{-5}$`],
              ["Kararlı durum, beş frekans", "Faz gecikmesinin hatası", r`$3{,}3 \times 10^{-8}$ rad`, r`$10^{-3}$ rad`],
              ["Kritik sönüm", "%2 yerleşme süresinin bağıl hatası", r`$3{,}3 \times 10^{-4}$`, r`$2 \times 10^{-3}$`],
              ["Durdurucuya çarpma", "Çarpma anının hatası", r`$8{,}6 \times 10^{-13}$ s`, r`$10^{-8}$ s`],
              ["Enerji defteri, 27 çarpma, 60 s", "En büyük bağıl artık", r`$1{,}3 \times 10^{-12}$`, r`$10^{-8}$`],
              ["Sarkaç periyodu, 10°–170° ve dönme", "Bağıl hata", r`$2{,}3 \times 10^{-10}$`, r`$10^{-7}$`],
              ["Enerji sapması, 60 s", r`$N = 1;\ 2;\ 3;\ 6$`, r`$4{,}7 \times 10^{-13}$; $2{,}0 \times 10^{-9}$; $2{,}4 \times 10^{-8}$; $3{,}3 \times 10^{-7}$`, r`$10^{-6}$`],
              ["Özfrekanslar", "Laguerre sıfırlarından bağıl sapma", r`$8{,}5 \times 10^{-16}$`, r`$10^{-10}$`],
              ["Lagrange ve Newton türetimleri", "Enine kuvvet / gerilme", r`$5{,}3 \times 10^{-15}$`, r`$10^{-10}$`],
              ["Lyapunov üsteli, 400 s", "Düzenli; kaotik", r`$\le 0{,}017$; $1{,}04\ \mathrm{s^{-1}}$`, r`$\le 0{,}05$; $\ge 0{,}5\ \mathrm{s^{-1}}$`],
              ["Zamanda tersinirlik, 20 s", "Başlangıç durumuna dönüş hatası", r`$4{,}6 \times 10^{-12}$ rad`, r`$10^{-9}$ rad`],
              ["RK4 ile Dormand–Prince", "Adım dört kat küçülünce hata oranı", "256,6", r`$256 \pm \%25$`],
              ["Spektrum çözümleyici", "Tepe frekansının hatası", r`$4{,}6 \times 10^{-9}$ Hz`, r`$10^{-4}$ Hz`],
            ],
          },
          {
            kind: "p",
            text: r`Bu değerler geliştirme makinesinde ölçülmüştür. Doğrulama sekmesindeki düğme aynı deneyleri okuyucunun kendi tarayıcısında, o anda yüklü olan kodla yeniden çalıştırır; sonuçların burada verilenlerle aynı büyüklük mertebesinde çıkması beklenir.`,
          },
        ],
      },
      {
        id: "dogrulama-yorum",
        title: "Sonuçların yorumu",
        blocks: [
          {
            kind: "list",
            items: [
              r`**Toleranslar bilerek geniştir.** Ölçülen hatalar toleransların birkaç büyüklük mertebesi altındadır. Toleranslar, deneylerin farklı çalışma ortamlarında da geçmesi ve gerçek bir kod hatasını (mertebenin düşmesi, yanlış bir katsayı) yine de yakalaması için seçilmiştir.`,
              r`**Enerji sapması bağlantı sayısıyla büyür.** Daha çok bağlantı daha yüksek açısal hızlar ve daha sert bir doğrusal olmayan bağlaşım demektir; aynı adımla altı bağlantılı zincirin sapması çift sarkacınkinin yaklaşık 160 katıdır, ama hâlâ $10^{-6}$ değerinin altındadır.`,
              r`**Adım büyüklüğü belirleyicidir.** Çift sarkaçta adım 1 ms yerine 3,3 ms seçildiğinde sapma $2{,}0 \times 10^{-9}$ değerinden $5{,}3 \times 10^{-7}$ değerine çıkar. Açık Euler aynı deneyde, aynı adımla enerji defterinde %24'lük bir sapma üretir; bu satır pakette bilerek bir **alt sınır** ölçütü olarak durur.`,
              r`**Yöntemin mertebesi kaotik yörüngede de gözlenir.** Üç bağlantılı zincirde RK4 ile hata denetimli başvuru çözümü arasındaki fark, adım dört kat küçültüldüğünde 256,6 kat küçülür; dördüncü mertebe bir yöntem için beklenen değer $4^4 = 256$ olur.`,
              r`**İki bağımsız türetim örtüşür.** Hareket denklemleri Lagrange yöntemiyle, çubuk kuvvetleri Newton yasalarıyla hesaplanır; aralarındaki tutarsızlık makine duyarlığı düzeyindedir. Bu, modelin kodlanmasındaki bir işaret ya da indis hatasına karşı en güçlü denetimdir.`,
            ],
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "yanilgilar",
    number: "8",
    title: "Yaygın yanılgılar ve düzeltmeleri",
    summary:
      "Salınım ve kaos anlatılırken sık yinelenen, ama kaynaklara bakıldığında doğru çıkmayan ya da eksik kalan ifadeler.",
    sections: [
      {
        id: "yanilgilar-rezonans",
        title: "Rezonans üzerine",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“Tacoma Narrows köprüsü rezonans yüzünden yıkıldı”",
            text: r`7 Kasım 1940'ta köprü yaklaşık 19 m/s hızındaki sabit bir rüzgârda 0,2 Hz frekanslı burulma hareketiyle yıkılmıştır. Girdap kopması açıklaması tutmaz: o rüzgâr hızında kopma frekansı yaklaşık 1 Hz, yani gözlenen frekansın beş katıdır ve ortada periyodik bir dış kuvvet yoktur. Olay, yapının kendi hareketine bağlı aerodinamik momentin burulma sönümünü negatif yaptığı, kendi kendini besleyen bir aeroelastik çırpınmadır [@billah1991; @green2006]. Zorlanmış rezonansta denklemin sağ yanında dış bir kuvvet vardır ve genliği sönüm sınırlar; çırpınmada sönüm katsayısının kendisi işaret değiştirir. Uygulamadaki sürülen osilatör birincisinin modelidir.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Rezonans tam doğal frekansta olur”",
            text: r`Soğurulan güç ve hız genliği için doğrudur. Yer değiştirme genliği ise $\omega_0\sqrt{1-2\zeta^2}$ değerinde, yani doğal frekansın altında en büyüktür ve $\zeta \ge 1/\sqrt{2}$ için hiç tepe yapmaz (Bölüm 2). Zayıf sönümde fark küçüktür, ama ölçülebilir: “Rezonans tepesini bul” föyü tam olarak bunu ölçtürür.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Köprüler uygun adım yürüyen askerler yüzünden yıkılır”",
            text: r`Belgelenmiş olay 12 Nisan 1831'de Manchester yakınındaki Broughton asma köprüsüdür: uygun adım yürüyen 74 askerin altında köprü çökmüş, ölen olmamıştır; dönemin raporu çöküşü bir askı zinciri bağlantısındaki kusurlu cıvataya bağlar [@broughton1831]. Londra'daki Millennium Köprüsü'nün 10 Haziran 2000'deki yanal sallantısı ise uygun adım yürüyüş değildir: yayalar adımlarını köprünün hareketine uydurdukça sallantı büyümüş, denetimli deneyde yanıt 166 yayaya kadar küçük kalıp sonra hızla artmıştır [@dallard2001; @strogatz2005]. Sonraki çalışmalar kararsızlığın eşzamanlanma olmadan da ortaya çıkabildiğini gösterir [@belykh2021].`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Opera sanatçıları sesleriyle kadeh kırar”",
            text: r`Sahnede bunu yaptığı doğrulanmış bir opera sanatçısı yoktur. Olay fiziksel olarak olanaklıdır ve denetimli koşullarda, yükseltici kullanılmadan bir kez belgelenmiştir [@schrock2007]; laboratuvar gösterileri ise kadehin doğal frekansına kilitlenen, yükseltilmiş ses kullanır [@skeldon1998].`,
          },
        ],
      },
      {
        id: "yanilgilar-sonum",
        title: "Sönüm üzerine",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“Otomobil amortisörleri kritik sönümlüdür”",
            text: r`Binek araçların süspansiyonunda sönüm oranı tipik olarak 0,2–0,4 arasındadır, yani belirgin biçimde zayıf sönümlüdür; yarış araçlarında değer 1'e yaklaşır [@gillespie1992; @dixon2007]. Kritik sönüm sürüş konforu için fazla serttir.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Sönüm ne kadar büyükse sistem o kadar çabuk durur”",
            text: r`Kritik değerin üstünde sönümü artırmak dönüşü yavaşlatır, çünkü yavaş sönen üstel terim baskın olur. Aşımsız en hızlı dönüş $\zeta = 1$ değerindedir; küçük bir aşıma izin verilirse en kısa yerleşme $\zeta \approx 0{,}78$ dolayındadır (Bölüm 2).`,
          },
        ],
      },
      {
        id: "yanilgilar-sarkac",
        title: "Sarkaç üzerine",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“Sarkacın periyodu genlikten bağımsızdır”",
            text: r`Galileo'nun eşzamanlılık gözlemi [@galilei1638; @galilei1914] yalnızca küçük açılar için yaklaşık olarak doğrudur: periyot 10° genlikte %0,19, 30° genlikte %1,7, 90° genlikte %18 uzar. Huygens tam eşzamanlı eğrinin sikloit olduğunu 1659'da bulmuş ve *Horologium Oscillatorium* (1673) içinde yayımlamıştır [@huygens1673; @huygens1986].`,
          },
          {
            kind: "note",
            tone: "info",
            title: "Saniye sarkacı ve metre",
            text: r`Periyodu 2 s olan sarkacın boyu standart yerçekiminde $g/\pi^2 = 0{,}9936$ m'dir. Bu yakınlık rastlantı değildir: 1790'da uzunluk birimi olarak saniye sarkacının boyu önerilmiş, Akademi komisyonu 19 Mart 1791 tarihli raporunda çeyrek meridyenin on milyonda birini yeğlemiştir [@borda1791].`,
          },
        ],
      },
      {
        id: "yanilgilar-kaos",
        title: "Kaos üzerine",
        blocks: [
          {
            kind: "note",
            tone: "correction",
            title: "“Kaos rastgeleliktir”",
            text: r`Kaotik bir sistem bütünüyle deterministiktir; aynı başlangıç koşulları aynı yörüngeyi verir ve uygulamada her deney aynen yinelenebilir. Öngörülemezlik, başlangıç koşullarının sonlu duyarlıkla bilinmesinden ve hatanın üstel büyümesinden doğar [@strogatz2015].`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Çift sarkaç kaotiktir”",
            text: r`Kaos sistemin değil, yörüngenin özelliğidir. Aynı çift sarkaç küçük enerjide düzenli, ara enerjilerde büyük ölçüde kaotik, çok yüksek enerjide yeniden düzenlidir [@rafat2009; @stachowiak2006]. “Düzenli ada” föyü bunu ölçtürür.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Tek sarkaç büyük açılarda kaotik olur”",
            text: r`Sürücüsüz tek sarkacın faz uzayı iki boyutludur ve Poincaré–Bendixson teoremi kaosu dışlar [@strogatz2015]. Büyük açıda değişen şey periyottur, öngörülebilirlik değil. Tek sarkaçta kaos ancak periyodik bir sürücüyle, yani üçüncü bir faz uzayı boyutuyla ortaya çıkar [@baker1996]; bu model burada yoktur.`,
          },
          {
            kind: "note",
            tone: "correction",
            title: "“Kırbacın ucu ses duvarını aşar ve şaklar”",
            text: r`Çok bağlantılı zincirlerde uca doğru hızlanma sık sık kırbaçla açıklanır. Şaklama gerçekten bir şok dalgasıdır, ama onu kırbacın ucu değil, kırbaç boyunca ilerleyen ilmek üretir: incelen kırbaçta hızlanan ilmek ses hızına ulaştığında şaklama oluşur; o anda uç ilmeğin yaklaşık iki katı hızla hareket etmektedir [@goriely2002]. Havada ses hızı 20 °C'de yaklaşık 343 m/s'dir [@cramer1993].`,
          },
        ],
      },
    ],
  },

  /* ================================================================== */
  {
    id: "sinirlar",
    number: "9",
    title: "Varsayımlar ve sınırlılıklar",
    summary: "Modelin neyi içermediği, sayısal sonuçların nereye kadar güvenilir olduğu ve yapılmamış olan çalışmalar.",
    sections: [
      {
        id: "sinirlar-model",
        title: "Fiziksel model",
        blocks: [
          {
            kind: "list",
            items: [
              r`**Noktasal kütleler, kütlesiz rijit çubuklar.** Çubukların eylemsizlik momenti ve esnekliği yoktur. Gerçek çift sarkaçlar bileşik sarkaçlardır [@shinbrot1992; @rafat2009]; buradaki sayısal değerler (periyotlar, eşikler, Lyapunov üsteli) böyle bir düzenekle doğrudan karşılaştırılamaz.`,
              r`**Düzlemsel hareket.** Zincir düşey bir düzlemde hareket eder. Çubuklar ve kütleler ardışık paralel düzlemlere yerleştirilmiştir; tam dönme serbestliği ile parçaların birbirinin içinden geçmemesi koşulu böyle birlikte sağlanır. Düzlemler arasındaki küçük uzaklığın dinamiğe etkisi modellenmemiştir.`,
              r`**Yalnızca viskoz sürtünme.** Kuru sürtünme ve hava direnci yoktur; sönüm kuvveti her hızda hızla doğru orantılıdır. Girdap akımı freni için bu, yalnızca düşük hızlarda geçerli bir yaklaşıklıktır [@wiederick1987; @heald1988].`,
              r`**Doğrusal, kütlesiz yay.** Yay kuvveti katı boya kadar tam doğrusaldır ve yayın kendi kütlesi yoktur. Çizilen yay ölçekli bir tasarım değildir: aynı geometri çelik telden yapılsaydı $k = Gd^4/(8D^3N_a)$ bağıntısı yaklaşık $10^5$ N/m verirdi [@budynas2015; @budynas2020]. Düzeneğin metre ölçeğindeki boyutları görünürlük için seçilmiştir.`,
              r`**Rijit durdurucular, sabit geri sıçrama katsayısı.** Çarpma anlıktır; temas süresi, hıza bağlı geri sıçrama ve tamponun biçim değiştirmesi modellenmemiştir.`,
              r`**İdeal sürücü.** Sürücü, taşıyıcının hareketinden etkilenmeyen ideal bir kuvvet kaynağıdır.`,
            ],
          },
        ],
      },
      {
        id: "sinirlar-sayisal",
        title: "Sayısal sonuçlar",
        blocks: [
          {
            kind: "list",
            items: [
              r`**Enerji sapması birikir.** RK4 simplektik değildir; sapma zamanla büyür. Verilen değerler 60 saniyelik deneylere aittir; saatler süren bir çalıştırmada artık izlenmeli, gerekirse adım küçültülmeli ya da uyarlamalı yönteme geçilmelidir.`,
              r`**Kaotik yörüngeler ufkun ötesinde tek tek anlamlı değildir.** Bölüm 5'te açıklandığı gibi, birkaç on saniyeden sonra gösterilen durum tam çözümün durumu değildir; anlamlı olan istatistiksel ve geometrik özelliklerdir.`,
              r`**Lyapunov üsteli sonlu süreli bir kestirimdir** ve yörüngeye bağlıdır; bir düzeneğin “üsteli” olarak tek bir sayı verilemez.`,
              r`**Gerçek zaman güvencesi yoktur.** Yavaş bir aygıtta ya da çok yüksek adım frekansında benzetim zamanı duvar saatinin gerisinde kalabilir; durum çubuğu bunu bildirir. Fiziksel sonuç etkilenmez.`,
              r`**Çalışma ortamları arası yinelenebilirlik sınanmamıştır** (Bölüm 4).`,
            ],
          },
        ],
      },
      {
        id: "sinirlar-gecerleme",
        title: "Geçerleme ve eğitsel etki",
        blocks: [
          {
            kind: "p",
            text: r`İki önemli çalışma yapılmamıştır. Birincisi, model fiziksel bir düzenekle karşılaştırılmamıştır. İkincisi, aracın kullanılabilirliği ve öğrenmeye etkisi kullanıcılarla ölçülmemiştir. Arayüz ve föy tasarımında dayanılan ilkeler yayımlanmış araştırmalardan gelir (Bölüm 11 ve 12), ama bu ilkelerin burada da aynı sonucu verdiği bir varsayımdır. Sanal laboratuvarlar üzerine kanıtın karışık olduğu Bölüm 1'de belirtilmiştir; benzetimin gerçek ölçümün yerini değil yanını tutması amaçlanmıştır.`,
          },
        ],
      },
      {
        id: "sinirlar-gelecek",
        title: "Gelecek çalışma",
        blocks: [
          {
            kind: "list",
            items: [
              r`Kütlesi dağılmış çubuklarla bileşik sarkaç modeli ve gerçek bir çift sarkacın video çözümlemesiyle [@brown2009] karşılaştırılması.`,
              r`Kuru sürtünme ve hıza bağlı geri sıçrama içeren temas modelleri [@hunt1975; @stronge2000].`,
              r`Periyodik olarak sürülen tek sarkaç: en az serbestlik dereceli kaotik mekanik sistem [@baker1996; @baker2005].`,
              r`Uzun süreli çalıştırmalar için simplektik ya da varyasyonel integratörler [@hairer2006].`,
              r`Bütün Lyapunov spektrumunun hesaplanması [@benettin1980b].`,
              r`Öğrencilerle yapılacak, ön ve son ölçümlü bir kullanıcı çalışması.`,
            ],
          },
        ],
      },
    ],
  },
];
