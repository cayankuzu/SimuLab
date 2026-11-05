import { Language } from "./translations";

export interface LessonLevel {
  level: number;
  badge: string;
  title: string;
  subtitle: string;
  presetKey: string;
  thoughtExperiment: string;
  childExplanation: string;
  whatWhyHow: {
    what: string;
    why: string;
    how: string;
  };
  realLifeExamples: string[];
  tryItTask: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ModuleCurriculum {
  overviewTitle: string;
  overviewIntro: string;
  coreIdea: string;
  levels: LessonLevel[];
  faqs: FAQItem[];
}

export const curriculumData: Record<
  Language,
  {
    oscillator: ModuleCurriculum;
    pendulum: ModuleCurriculum;
  }
> = {
  tr: {
    oscillator: {
      overviewTitle: "Yay ve Salınım Deneyi: Temelden İleri Seviyeye Rehber",
      overviewIntro:
        "Bir yayın ucuna bağlı kutuyu çekip bıraktığınızda neden ileri-geri sallanır? Neden tam ortada duramaz da diğer tarafa geçer? Peki bir köprü sadece rüzgarla veya adımlarla nasıl yıkılabilir? Bu deneyde doğadaki tüm titreşimlerin sırrını adım adım keşfedeceksiniz.",
      coreIdea:
        "Evrendeki temel kural basittir: Yay her zaman rahat olduğu 'Denge Noktasına (x = 0)' dönmek ister. Siz onu sağa çekerseniz sola çeker; sola sıkıştırırsanız sağa iter!",
      levels: [
        {
          level: 1,
          badge: "SEVİYE 1 · TEMEL MANTIK",
          title: "Yay Neden Sallanır? (İtme, Çekme ve Eylemsizlik)",
          subtitle: "Sürtünmesiz ortamda sonsuz salınım ve enerji takası",
          presetKey: "undamped",
          thoughtExperiment:
            "Düşünce Deneyi: Buz pistinde (hiç sürtünme olmayan bir yerde) duvara bağlı bir yayın ucundaki kutuyu kendinize doğru çekip bıraktığınızı hayal edin. Kutu merkeze gelince durur mu, yoksa yoluna devam mı eder?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Yay, evini özleyen bir lastik gibidir. Evinin adresi tam ortadaki '0 noktasıdır'. Kutuyu sağa çektiğinizde yay gerilir ve 'Beni evime geri götür!' diyerek kutuyu sola çeker. Kutu tam eve (0 noktasına) ulaştığında yay rahatlar ama kutu o kadar hızlanmıştır ki fren yapamaz ve evi geçip sol tarafa dalar! Bu kez de yay sıkışır ve 'Çok sıkıştım!' diyerek kutuyu tekrar sağa iter. Sürtünme yoksa bu oyun sonsuza kadar sürer.",
          whatWhyHow: {
            what: "NE OLUYOR? Kütle, denge noktasının (x=0) sağında ve solunda eşit mesafelerde hiç durmadan gidip geliyor. Buna 'Basit Harmonik Hareket' denir.",
            why: "NEDEN DURMUYOR? Çünkü kütle tam ortadan (x=0) geçerken hızı en yüksek seviyededir. Tıpkı yokuş aşağı hızla inen bir bisikletin düzlüğe gelince aniden duramaması (Eylemsizlik) gibi, kütle de merkezi geçip yayı diğer yönde sıkıştırır.",
            how: "NASIL ÇALIŞIYOR? Siz kutuyu çektiğinizde yayda 'Potansiyel Enerji' birikir. Bıraktığınızda bu enerji 'Hareket Enerjisine (Kinetik)' dönüşür. Uç noktalarda hız sıfırdır ama yay gergindir; tam ortada ise yay rahattır ama hız maksimumdur.",
          },
          realLifeExamples: [
            "Parktaki salıncağın ileri-geri sallanması",
            "Gitar telini çekip bıraktığınızda ses çıkarması",
            "Duvar saatlerinin sarkacı ve kuvars kol saatlerinin içindeki kristaller",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: Üstteki 'Bu Seviyeyi Sahneye Uygula' butonuna basın. Sürtünme sıfırlanacak. Yeşil (Hız) ve Turuncu (Kuvvet) okların nasıl birbirinin tersine çalıştığını izleyin!",
        },
        {
          level: 2,
          badge: "SEVİYE 2 · ORTA SEVİYE",
          title: "Sürtünme ve Amortisör: Hareket Neden Durur?",
          subtitle: "Eksik sönüm, kritik sönüm (amortisör) ve aşırı sönüm farkı",
          presetKey: "underdamped",
          thoughtExperiment:
            "Düşünce Deneyi: Gerçek hayatta hiçbir salıncak veya yay sonsuza kadar sallanmaz; bir süre sonra durur. Peki içindeki o enerji nereye kaybolur? Yok mu olur?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Ellerinizi birbirine hızlıca sürttüğünüzde ellerinizin ısındığını hissedersiniz. İşte sürtünme tam olarak budur! Yay sallanırken hava direnci veya amortisör pistonu harekete karşı koyar ve kutunun hareket enerjisini yavaş yavaş 'Isı Enerjisine' dönüştürür. Enerji yok olmaz, sadece ısıya dönüşüp ortamı ısıtır; enerjisi biten kutu da sonunda tam ortada durur.",
          whatWhyHow: {
            what: "NE OLUYOR? Her salınımda kutunun gittiği mesafe (genlik) biraz daha küçülüyor ve sonunda x=0 noktasında tamamen duruyor.",
            why: "NEDEN 3 FARKLI DURUŞ ŞEKLİ VAR? Sürtünme azsa (ζ < 1) sallana sallana durur. Sürtünme tam kararındaysa (ζ = 1, Kritik Sönüm) hiç sallanmadan şak diye en hızlı şekilde durur. Sürtünme çok fazlaysa (ζ > 1, bal içindeymiş gibi) çok ağır çekimde süzülerek durur.",
            how: "NASIL KULLANILIR? Otomobil mühendisleri araba çukura girdiğinde yayların zıplayıp yolcuları sarsmaması için amortisörleri tam 'Kritik Sönüm (ζ = 1)' değerine ayarlar!",
          },
          realLifeExamples: [
            "Araba ve motosiklet amortisörleri (Çukurdan sonra zıplamayı önler)",
            "Apartman kapılarının çarpmadan yavaşça kapanmasını sağlayan hidrolik yaylar",
            "Deprem sönümleyici bina izolatörleri",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: Sağ panelden sırasıyla 'Normal Yay Salınımı', 'Araba Amortisörü' ve 'Bal İçinde Hareket' butonlarına tıklayarak kutunun merkeze dönüş farkını gözlemleyin!",
        },
        {
          level: 3,
          badge: "SEVİYE 3 · İLERİ SEVİYE",
          title: "Rezonans Felaketi: Küçük Bir Kuvvet Dev Salınım Yaratır!",
          subtitle: "Salıncağı tam zamanında itmek ve yıkılan köprülerin sırrı",
          presetKey: "resonance",
          thoughtExperiment:
            "Düşünce Deneyi: Parkta salıncakta oturan bir çocuğu çok küçük dokunuşlarla gökyüzüne kadar yükseltebilir misiniz? Evet, ama sadece doğru zamanda iterseniz! Peki yanlış zamanda iterseniz ne olur?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Her yayın kendi sevdiği bir sallanma ritmi (Doğal Hızı - ω₀) vardır. Eğer dışarıdaki bir motor kutuyu rastgele zamanlarda iterse bazen kutuya engel olur, bazen yardım eder. Ama motorun itme ritmini yayın kendi doğal ritmiyle BİREBİR AYNI yaparsanız, her itiş tam kutunun gideceği yönde olur! Tıpkı salıncağı her gelişinde tam arkasından itmek gibi, salınım her saniye büyür ve devleşir. Buna 'Rezonans' denir!",
          whatWhyHow: {
            what: "NE OLUYOR? Dış motor kuvveti (F₀) küçük olmasına rağmen, itme frekansı yayın doğal frekansına (ω_dış = ω₀) eşitlendiğinde kütle çok büyük mesafelere savruluyor!",
            why: "NEDEN TEHLİKELİ OLABİLİR? Çünkü sistem dış motordan sürekli enerji emer. 1940 yılında ABD'deki Tacoma Narrows Köprüsü, rüzgarın oluşturduğu girdapların köprünün doğal sallanma ritmiyle eşleşmesi (Rezonans) yüzünden kağıt gibi kıvrılarak yıkılmıştır!",
            how: "NASIL KONTROL EDİLİR? Rezonansı engellemek için ya sistemin sertliği/kütlesi değiştirilir (doğal frekans kaydırılır) ya da güçlü amortisörler (sönüm) eklenir.",
          },
          realLifeExamples: [
            "Askerlerin köprülerden geçerken 'uygun adım' yürümelerinin yasak olması (Köprü rezonansa girip çökmesin diye)",
            "Opera sanatçısının tiz sesiyle kristal bardağı kırması (Ses dalgası bardağın doğal frekansıyla eşleşir)",
            "Radyo frekansı ayarlama (İstasyonun frekansıyla alıcıyı rezonansa getirme)",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: 'Bu Seviyeyi Sahneye Uygula' butonuna basın ve salınımın nasıl her saniye büyüdüğünü izleyin. Sonra sağ panelden 'Dış Motorun İtme Hızını' değiştirip rezonansın nasıl bozulduğunu görün!",
        },
        {
          level: 4,
          badge: "SEVİYE 4 · MATEMATİK & FAZ UZAYI",
          title: "Faz Uzayı Haritası ve RK4 Diferansiyel Çözücü",
          subtitle: "Fizikçiler hareketin geleceğini tek bir şekille nasıl okur?",
          presetKey: "underdamped",
          thoughtExperiment:
            "Düşünce Deneyi: Bir cismin hem nerede olduğunu (Konum) hem de ne kadar hızlı gittiğini (Hız) tek bir noktayla aynı resimde gösterebilseydik, ortaya nasıl bir şekil çıkardı?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Sağ paneldeki 'Faz Uzayı Grafiğine' bakın. Yatay çizgi kutunun nerede olduğunu, dikey çizgi ise ne kadar hızlı gittiğini gösterir. Eğer sürtünme yoksa kutu hep aynı hareketi tekrarladığı için ekranda kusursuz bir 'Çember / Elips' çizer. Ama sürtünme varsa kutu her turda biraz yavaşlar ve çizgi tıpkı bir 'Salyangoz Kabuğu' gibi döne döne tam merkeze (durma noktasına) kıvrılır!",
          whatWhyHow: {
            what: "NE OLUYOR? Faz uzayı grafiği, sistemin tüm geçmişini ve geleceğini tek bir geometrik iz olarak özetler: Kapalı halka = Sonsuz döngü; İçe kıvrılan sarmal = Sönümlenip durma.",
            why: "NEDEN RK4 ALGORİTMASI KULLANILIR? Bilgisayarlar zamanı küçük adımlarla hesaplar. Basit yöntemler (Euler) her adımda virajı biraz dıştan alır ve enerjinin yoktan var olmasına (hataya) sebep olur.",
            how: "RK4 NASIL ÇÖZER? 4. Dereceden Runge-Kutta (RK4), saniyede 240 kez şu anki eğime, adımın ortasındaki iki tahmini eğime ve adım sonundaki eğime bakıp ağırlıklı ortalamasını alır; böylece gerçek fiziği hatasız simüle eder.",
          },
          realLifeExamples: [
            "Uzay ajanslarının (NASA/ESA) roket ve uydu yörüngelerini hesaplarken RK4 ailesi çözücüler kullanması",
            "Kalp atışı (EKG) ve beyin dalgalarının faz uzayında analiz edilmesi",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: Sürtünmeyi (c) 0 yapıp Faz Uzayı grafiğinde kapalı halkayı görün; ardından sürtünmeyi artırıp salyangoz sarmalına dönüşmesini izleyin!",
        },
      ],
      faqs: [
        {
          question:
            "Kütle tam ortadaki Denge Noktasına (x = 0) geldiğinde yay artık çekmiyor, peki neden orada durmuyor?",
          answer:
            "Çünkü kütle merkeze gelene kadar yay tarafından hızlandırıldı ve büyük bir 'Hız (Kinetik Enerji)' kazandı. Fizikte hareket eden bir cisim, onu durduracak ters bir kuvvet uygulanmadıkça hızını korur (Eylemsizlik Yasası). Merkezde yay kuvveti sıfırdır ama hız maksimumdur; bu yüzden merkezi hızla geçer!",
        },
        {
          question:
            "Kütleyi 1 metre yerine 2 metre çekip bırakırsam salınım süresi (periyot) değişir mi?",
          answer:
            "Çok şaşırtıcı ama HAYIR! İdeal bir yayda kütleyi 2 kat uzağa çekerseniz gideceği yol 2 kat uzar ama yay da onu 2 kat daha güçlü çekip hızlandırır. Bu yüzden 1 tur gidip gelme süresi (Periyot T = 2π√(m/k)) çektiğiniz mesafeye bağlı değildir; sadece kütleye (m) ve yay sertliğine (k) bağlıdır!",
        },
        {
          question:
            "Yeşil ok (v) ile Turuncu ok (F) neden bazen aynı yöne, bazen zıt yöne bakıyor?",
          answer:
            "Yeşil ok (Hız) ile Turuncu ok (Kuvvet) AYNI yöne bakıyorsa kuvvet cisme yardım ediyor demektir ve cisim HIZLANIR (merkeze yaklaşırken). Eğer ZIT yöne bakıyorlarsa kuvvet cisme fren yaptırıyor demektir ve cisim YAVAŞLAR (merkezden uzaklaşıp yayı gererken).",
        },
      ],
    },

    pendulum: {
      overviewTitle: "1'den 6'ya Çoklu Sarkaç & Kaos Teorisi Ders Rehberi",
      overviewIntro:
        "Tek bir sarkaç (1 kütle) evrendeki en düzenli saattir. Peki ucuna 2., 4. veya 6. kütleyi bağladığınızda ne olur? Bu laboratuvarda 1 kütleden 6 kütleye kadar kendi sarkaç zincirinizi kurabilir ve Kaos Teorisini (Kelebek Etkisini) canlı deneyimleyebilirsiniz!",
      coreIdea:
        "Kütle sayısı 1 iken hareket %100 düzenli ve tahmin edilebilirdir. Ancak kütle sayısını 2, 4 veya 6 yaptığınızda kütleler birbirini savurmaya başlar ve başlangıçtaki 0.05° fark bile saniyeler içinde çığ gibi büyür!",
      levels: [
        {
          level: 1,
          badge: "SEVİYE 1 · TEK SARKAÇ (1 KÜTLE)",
          title: "Tek Sarkaç: Neden Tek Kütlede Kaos Asla Oluşmaz?",
          subtitle: "Dede saatlerinin ve Galileo'nun keşfettiği kusursuz düzen",
          presetKey: "single",
          thoughtExperiment:
            "Düşünce Deneyi: Tavana tek bir ip ve ucuna tek bir mavi top bağlayıp bıraktığımızda, bu top hiç sürpriz bir hareket veya rastgele takla atabilir mi?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Tek bir sarkaçta sadece tek bir top vardır ve onu çeken tek şey yerçekimidir. Onu şaşırtacak, arkadan çekiştirecek ikinci bir top yoktur! Bu yüzden sağa ne kadar gittiyse sola da tam o kadar gider. Pembe İkiz Sarkaç bile ana sarkaçtan asla kopmaz; sonsuza kadar bir saat gibi düzenli sallanırlar.",
          whatWhyHow: {
            what: "NE OLUYOR? Sahnede sadece 1 kütle (m₁) var. Hareket tamamen periyodiktir ve Faz Uzayı grafiğinde kusursuz kapalı bir halka çizer.",
            why: "NEDEN KAOS YOK? Çünkü sistemde sadece 1 serbestlik derecesi (θ₁ açısı) vardır. Enerjiyi paylaşacağı başka bir kütle olmadığı için yörüngesi asla şaşmaz.",
            how: "GALİLEO'NUN SIRRI: Sarkacın ucundaki kütleyi 1 kg'dan 6 kg'a çıkarsanız bile sallanma hızı (periyodu) DEĞİŞMEZ! Sadece ipin boyuna (L₁) ve yerçekimine (g) bağlıdır.",
          },
          realLifeExamples: [
            "Antika sarkaçlı duvar saatleri (Saniyeleri şaşmadan sayar)",
            "Müzisyenlerin ritim tutmak için kullandığı metronomlar",
            "Lunaparktaki tek kollu salıncaklar",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: 'Bu Seviyeyi Sahneye Uygula' butonuna basarak Tek Sarkacı (1 Kütle) izleyin. Ardından sağ panelden kütleyi (m₁) değiştirip hızın değişmediğini, ama kol boyunu (L₁) kısaltınca hızlandığını görün!",
        },
        {
          level: 2,
          badge: "SEVİYE 2 · ÇİFT SARKAÇ (2 KÜTLE)",
          title: "Çift Sarkaç ve Kelebek Etkisi: Kaosun Doğuşu!",
          subtitle: "İkinci kütleyi bağladığımız anda düzen neden bozulur?",
          presetKey: "double",
          thoughtExperiment:
            "Düşünce Deneyi: Düzenli sallanan mavi topun altına sarı bir top daha bağlayalım. İki özdeş çift sarkacı sadece 0.05 derece (gözle görülmez bir farkla) aynı anda bırakırsak ne olur?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Artık iki top var ve ikisi birbirine bağlı! Üstteki mavi top sağa gitmek isterken alttaki sarı top sola çekiyor; sürekli birbirlerini çekiştirip şaşırtıyorlar. İlk 3-4 saniye boyunca Mavi/Sarı sarkaç ile Pembe İkiz Sarkaç üst üste gider. Ama 5. saniyede o minicik 0.05° fark çığ gibi büyür ve iki sarkaç tamamen farklı yönlere savrulur! İşte 'Kelebek Etkisi' budur!",
          whatWhyHow: {
            what: "NE OLUYOR? 2. kütle eklendiği anda hareket doğrusal olmayan (non-linear) kaotik bir dansa dönüşüyor.",
            why: "NEDEN BİRBİRİNDEN KOPUYORLAR? Üst ve alt kol arasındaki açı farkı her salınımda hataları üstel olarak (katlanarak) büyütür. Tam tepe noktasında binde bir milimetre geride kalan sarkaç takla atmak yerine geri düşer!",
            how: "HAVA DURUMUYLA İLGİSİ NEDİR? Atmosfer de tıpkı bu çift sarkaç gibidir. Bugünkü ölçümdeki 0.001 derecelik fark yüzünden 15 gün sonrasının hava durumu asla %100 kesin bilinemez!",
          },
          realLifeExamples: [
            "Hava durumu tahminlerinin 1 haftadan sonra yanılması (Lorenz'in Kelebek Etkisi)",
            "İnsan kolunun omuz ve dirsek eklemiyle top fırlatması",
            "Üç cisimli yıldız ve gezegen sistemlerinin kaotik yörüngeleri",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: 'Bu Seviyeyi Sahneye Uygula' butonuna basın. İlk 4 saniye beraber giden Pembe İkiz Sarkaç ile Ana Sarkacın 5. saniyede nasıl koptuğunu izleyin!",
        },
        {
          level: 3,
          badge: "SEVİYE 3 · DÖRTLÜ SARKAÇ (4 KÜTLE)",
          title: "Dörtlü Sarkaç: Kamçı Etkisi ve Enerji Dalgası!",
          subtitle: "4 kütle uç uca bağlandığında enerji en uca nasıl şimşek gibi akar?",
          presetKey: "quad",
          thoughtExperiment:
            "Düşünce Deneyi: Uç uca 4 sarkaç bağlayıp bıraktığımızda, neden en alttaki 4. top (mor top) üstteki toplardan çok daha çılgınca ve hızlı döner?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Bir havluyu veya kamçıyı salladığınızda eliniz yavaş hareket etse bile havlunun en ucu şimşek gibi hızlanıp 'Şak!' diye ses çıkarır. Dörtlü sarkaçta da aynısı olur! Üstteki 1., 2. ve 3. toplar aşağı inerken yavaşladıkları anda tüm hareket enerjilerini bir dalga gibi en uçtaki 4. topa devrederler. En uçtaki top bir anda fırıldak gibi taklalar atar!",
          whatWhyHow: {
            what: "NE OLUYOR? 4 bağlı kütle (m₁, m₂, m₃, m₄) arasında yukarıdan aşağıya doğru sürekli bir enerji ve momentum dalgası akıyor.",
            why: "NEDEN KAMÇI GİBİ DAVRANIYOR? Üstteki çubuklar aniden duraksadığında açısal momentum korunumu gereği en uçtaki halka çok yüksek açısal hıza (ω₄) ulaşır.",
            how: "FARE İLE ETKİLEŞİM: Sahnedeki 4 toptan istediğiniz herhangi birini fareyle tutup çekerek zinciri istediğiniz şekilden bırakabilirsiniz!",
          },
          realLifeExamples: [
            "Kamçının ucunun ses duvarını aşarak şaklaması",
            "Ritmik jimnastikte kurdelenin dalgalanması",
            "Omurgalı canlıların kuyruk ve omurga hareketleri",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: 'Bu Seviyeyi Sahneye Uygula' butonuna basarak 4'lü Sarkacı başlatın ve en uçtaki 4. topun (Mor) çizdiği karmaşık izi gözlemleyin!",
        },
        {
          level: 4,
          badge: "SEVİYE 4 · ALTILI ZİNCİR (MAKS 6 KÜTLE)",
          title: "6 Kütleli Zincir Sarkaç: Katı Çubuklardan Esnek İpe Geçiş!",
          subtitle: "Kütle sayısı 6'ya çıktığında sarkaç nasıl esnek bir halat gibi davranır?",
          presetKey: "six",
          thoughtExperiment:
            "Düşünce Deneyi: Uç uca 2 değil, 4 değil, tam 6 tane sarkaç bağlarsak ne olur? Sert çubuklardan oluşan bir sistem nasıl yumuşak bir ip veya zincir gibi kıvrılabilir?",
          childExplanation:
            "Çocuğa Anlatır Gibi: Bisiklet zincirini düşünün: Her bir baklası sert metaldir ama birçok bakla uç uca eklendiğinde yumuşak bir ip gibi kıvrılır! İşte 6 kütleyi uç uca bağladığımızda, sarkaçlarımız artık esnek bir zincire dönüşür. Arka plandaki RK4 fizik motoru saniyede 300 kez 6×6 boyutunda dev bir matris denklemi çözerek her bir halkayı gerçek zamanlı hesaplar!",
          whatWhyHow: {
            what: "NE OLUYOR? 6 serbestlik dereceli (θ₁...θ₆) tam doğrusal olmayan Euler-Lagrange matris sistemi canlı çözülüyor.",
            why: "FİZİKTE BUNUN ÖNEMİ NEDİR? Doğadaki esnek ipler, halatlar, saç telleri ve köprü kabloları bilgisayarda modellenirken tam olarak böyle çoklu sarkaç zincirlerine (N-bağlı kütlelere) bölünerek simüle edilir!",
            how: "KENDİ ZİNCİRİNİZİ KURUN: Sağ panelden kütle sayısını 1 ile 6 arasında istediğiniz gibi artırıp azaltabilir, her bir kütlenin ağırlığını ve çubuk boyunu ayrı ayrı değiştirebilirsiniz!",
          },
          realLifeExamples: [
            "Gemilerin ağır demir zincirlerinin salınımı",
            "Film ve oyun animasyonlarında saç, halat ve kumaş fiziği motorları",
            "Çok eklemli yılan robotlar (Snake Robots)",
          ],
          tryItTask:
            "👉 ŞİMDİ DENEYİN: 'Bu Seviyeyi Sahneye Uygula' butonuna basarak 6'lı Zincir Sarkacı izleyin; ardından en uçtaki 6. topu fareyle tutup yukarı çekerek bırakın!",
        },
      ],
      faqs: [
        {
          question:
            "Tek sarkaç (1 kütle) ile Çift sarkaç (2 kütle) arasındaki en temel fark nedir?",
          answer:
            "Tek sarkaçta kaos yoktur; hareketi saat gibi düzenlidir ve başlangıç açısını 0.05° değiştirseniz bile iki sarkaç hep yan yana gider. Ancak 2. kütleyi bağladığınız anda iki kütle birbirini savurmaya başlar ve Kelebek Etkisi (Kaos) doğar!",
        },
        {
          question:
            "6 kütle birbirine bağlıyken sürtünme 0 ise toplam enerji yine korunuyor mu?",
          answer:
            "Evet! İster 1 kütle olsun ister 6 kütle, sürtünme (c = 0) kapalıyken 6 topun Kinetik ve Potansiyel enerjilerinin toplamı sabit kalır. Enerji sadece 6 top arasında sürekli yukarı-aşağı el değiştirir.",
        },
        {
          question:
            "Sahnedeki 6 toptan istediğim herhangi birini fareyle tutup çekebilir miyim?",
          answer:
            "Kesinlikle! 1. toptan 6. topa kadar herhangi birinin üzerine farenizle gelip basılı tutarak istediğiniz açıya çekip bırakabilirsiniz.",
        },
      ],
    },
  },

  en: {
    oscillator: {
      overviewTitle: "Spring & Oscillation Lab: Beginner to Advanced Course",
      overviewIntro:
        "When you pull and release a box attached to a spring, why does it bounce back and forth? Why doesn't it just stop at the center? Discover the secrets of oscillations step by step.",
      coreIdea:
        "The golden rule is simple: The spring always wants to return to its relaxed 'Equilibrium Point (x = 0)'. Pull it right, and it pulls left; compress it left, and it pushes right!",
      levels: [
        {
          level: 1,
          badge: "LEVEL 1 · CORE LOGIC",
          title: "Why Does a Spring Oscillate? (Pull, Push & Inertia)",
          subtitle: "Endless oscillation and energy exchange without friction",
          presetKey: "undamped",
          thoughtExperiment:
            "Thought Experiment: Imagine pulling a box attached to a spring on frictionless ice and letting go. When the box reaches the middle, does it stop or keep going?",
          childExplanation:
            "In Plain Words: A spring is like a rubber band that misses home (x = 0). When you pull the box right, the spring stretches and pulls it back toward home. By the time the box reaches home, it is moving so fast that it shoots right past home into the left zone!",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? The mass bounces symmetrically left and right of equilibrium (x=0).",
            why: "WHY DOESN'T IT STOP AT THE CENTER? Because as it crosses x=0, its speed is at its maximum! Inertia carries it past the center.",
            how: "HOW DOES ENERGY MOVE? Pulling the box stores Potential Energy; releasing it converts that into Kinetic Energy.",
          },
          realLifeExamples: [
            "A playground swing moving back and forth",
            "A plucked guitar string vibrating to make sound",
          ],
          tryItTask:
            "👉 TRY IT NOW: Click 'Apply Level to Scene' above to watch frictionless harmonic motion!",
        },
        {
          level: 2,
          badge: "LEVEL 2 · INTERMEDIATE",
          title: "Friction & Shock Absorbers: Why Motion Stops",
          subtitle: "Underdamped bounce vs Critical shock absorber vs Overdamped honey",
          presetKey: "underdamped",
          thoughtExperiment:
            "Thought Experiment: In real life, no spring bounces forever—where does the energy go?",
          childExplanation:
            "In Plain Words: Friction turns motion energy into heat! Car shock absorbers are tuned to Critical Damping (ζ = 1) so the car stops bouncing immediately after a bump.",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? Each bounce gets smaller as mechanical energy turns into thermal heat.",
            why: "3 WAYS TO STOP: ζ < 1 bounces before stopping; ζ = 1 stops fastest without bouncing; ζ > 1 creeps slowly.",
            how: "ENGINEERING USE: Used in vehicle suspensions and hydraulic door closers.",
          },
          realLifeExamples: [
            "Car suspension shock absorbers",
            "Hydraulic door closers",
          ],
          tryItTask:
            "👉 TRY IT NOW: Compare the preset cards on the right panel!",
        },
        {
          level: 3,
          badge: "LEVEL 3 · ADVANCED",
          title: "Resonance Disaster: Small Pushes Create Giant Waves!",
          subtitle: "Pushing a swing in rhythm and why bridges collapse",
          presetKey: "resonance",
          thoughtExperiment:
            "Thought Experiment: Can gentle pushes create giant oscillations if timed with the spring's natural rhythm?",
          childExplanation:
            "In Plain Words: When an external motor pushes at the exact natural rhythm (ω_ext = ω₀) of the spring, every push adds energy in the direction of motion—building massive oscillations!",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? Matching driving frequency to natural frequency triggers Resonance.",
            why: "WHY DANGEROUS? Resonance collapsed the Tacoma Narrows Bridge in 1940.",
            how: "PREVENTION: Engineers add damping or shift natural frequencies.",
          },
          realLifeExamples: [
            "Soldiers breaking step on bridges",
            "Shattering a crystal glass with sound",
          ],
          tryItTask:
            "👉 TRY IT NOW: Click 'Apply Level to Scene' to witness Resonance!",
        },
        {
          level: 4,
          badge: "LEVEL 4 · MATH & PHASE SPACE",
          title: "Phase Space Maps & The RK4 Solver",
          subtitle: "How physicists read the entire future of motion in one shape",
          presetKey: "underdamped",
          thoughtExperiment:
            "Thought Experiment: What shape appears when we plot Position vs Velocity?",
          childExplanation:
            "In Plain Words: Without friction, it draws a closed loop. With friction, it winds inward like a snail shell toward rest!",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? Phase space maps (x, v) as a geometric trajectory.",
            why: "WHY RK4? Simple Euler methods explode energy; RK4 preserves physical truth.",
            how: "240 Hz PRECISION: Solves 4 slopes per substep.",
          },
          realLifeExamples: ["Spacecraft trajectory integration"],
          tryItTask: "👉 TRY IT NOW: Watch the Phase Space spiral on the right!",
        },
      ],
      faqs: [
        {
          question: "Why doesn't the mass stop at x = 0?",
          answer:
            "Because its speed is maximum at x = 0, so inertia carries it past the equilibrium point!",
        },
      ],
    },

    pendulum: {
      overviewTitle: "1-to-6 Multi-Pendulum & Chaos Theory Course",
      overviewIntro:
        "A single pendulum (1 mass) is a symbol of clockwork order. What happens when you connect 2, 4, or up to 6 masses in a chain? Build your own pendulum chain from 1 to 6 masses and watch Chaos Theory come alive!",
      coreIdea:
        "With 1 mass, motion is 100% regular. With 2, 4, or 6 masses, nonlinear coupling amplifies a 0.05° difference into completely different futures!",
      levels: [
        {
          level: 1,
          badge: "LEVEL 1 · SINGLE PENDULUM (1 MASS)",
          title: "Single Pendulum: Why 1 Mass Never Becomes Chaotic",
          subtitle: "Clockwork regularity discovered by Galileo",
          presetKey: "single",
          thoughtExperiment:
            "Thought Experiment: Can a single bob on a single rod ever flip randomly or become chaotic?",
          childExplanation:
            "In Plain Words: With only 1 bob, nothing pulls it from below! It swings left and right like a grandfather clock, and the Pink Twin never diverges from it.",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? A 1-mass pendulum swings periodically and draws a closed loop in phase space.",
            why: "WHY NO CHAOS? Only 1 degree of freedom (θ₁) exists.",
            how: "GALILEO'S SECRET: Changing the mass doesn't change the swing period—only rod length (L₁) and gravity (g) do!",
          },
          realLifeExamples: ["Grandfather clocks", "Metronomes"],
          tryItTask:
            "👉 TRY IT NOW: Click 'Apply Level to Scene' to test the 1-Mass Single Pendulum!",
        },
        {
          level: 2,
          badge: "LEVEL 2 · DOUBLE PENDULUM (2 MASSES)",
          title: "Double Pendulum & The Butterfly Effect",
          subtitle: "How adding a 2nd mass gives birth to Chaos",
          presetKey: "double",
          thoughtExperiment:
            "Thought Experiment: Attach a 2nd bob below the first and release two twin pendulums just 0.05° apart.",
          childExplanation:
            "In Plain Words: For 4 seconds they swing together—then that tiny 0.05° difference snowballs until one flips left and the other flips right!",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? Two coupled masses create chaotic trajectories.",
            why: "WHY DO THEY DIVERGE? Exponential sensitivity to initial conditions (Butterfly Effect).",
            how: "WEATHER CONNECTION: Why weather forecasts cannot be exact beyond ~10 days.",
          },
          realLifeExamples: ["Weather forecasting limits"],
          tryItTask:
            "👉 TRY IT NOW: Click 'Apply Level to Scene' to watch the 2-Mass Butterfly Effect!",
        },
        {
          level: 3,
          badge: "LEVEL 3 · QUADRUPLE PENDULUM (4 MASSES)",
          title: "Quadruple Pendulum (4 Masses): The Whip Effect!",
          subtitle: "Watch energy cascade down 4 linked masses like a whip",
          presetKey: "quad",
          thoughtExperiment:
            "Thought Experiment: When 4 masses are linked in a chain, why does the 4th tip mass whip around so fast?",
          childExplanation:
            "In Plain Words: Like flicking a towel or whip, as the upper masses slow down, their momentum cascades down into the 4th tip bob!",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? 4 coupled Euler-Lagrange equations transfer momentum down the chain.",
            why: "WHIP DYNAMICS: Angular velocity amplifies toward the lighter/free tip.",
            how: "INTERACTIVE: Grab any of the 4 bobs with your mouse and pull!",
          },
          realLifeExamples: ["Cracking a whip", "Rhythmic gymnastics ribbons"],
          tryItTask:
            "👉 TRY IT NOW: Click 'Apply Level to Scene' to launch the 4-Mass Quadruple Pendulum!",
        },
        {
          level: 4,
          badge: "LEVEL 4 · 6-MASS CHAIN (MAX 6)",
          title: "6-Mass Pendulum Chain: From Rigid Rods to Flexible Rope!",
          subtitle: "How 6 linked masses behave like a continuous flexible chain",
          presetKey: "six",
          thoughtExperiment:
            "Thought Experiment: How do rigid metal links form a flexible bicycle chain or rope?",
          childExplanation:
            "In Plain Words: Connecting 6 pendulum links creates a flexible chain! Our RK4 engine solves a 6×6 coupled matrix 300 times per second.",
          whatWhyHow: {
            what: "WHAT IS HAPPENING? 6-link nonlinear Lagrangian chain dynamics.",
            why: "PHYSICS IMPORTANCE: How ropes, cables, and hair are simulated in physics engines.",
            how: "CUSTOMIZE: Add or remove masses (1 to 6) anytime on the right panel!",
          },
          realLifeExamples: ["Anchor chains", "Rope & hair physics engines"],
          tryItTask:
            "👉 TRY IT NOW: Click 'Apply Level to Scene' to see all 6 masses in action!",
        },
      ],
      faqs: [
        {
          question: "How many masses can I connect?",
          answer:
            "Between 1 (Single Pendulum) and 6 (6-Link Chain)! Use the quick buttons (1, 2, 4, 6) or + / - buttons on the right panel.",
        },
      ],
    },
  },
};
