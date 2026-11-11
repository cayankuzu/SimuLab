/** Kuram okuyucusu: kuram metni, doğrulama deneyleri ve kaynakça. */
export const theory = {
  title: "Kuram, doğrulama ve kaynakça",
  description: "Modelin denklemleri, sayısal yöntemler, ölçülmüş doğrulama sonuçları ve dayanılan kaynaklar.",
  close: "Kapat",
  tabs: {
    label: "Belge bölümleri",
    theory: "Kuram",
    verification: "Doğrulama",
    references: "Kaynakça",
  },
  contents: "İçindekiler",
  frontMatter: "Özet",
  chapter: (number: string) => `Bölüm ${number}`,
  chapterSelect: "Bölüme git",
  notes: {
    info: "Not",
    warning: "Sınırlılık",
    correction: "Yaygın yanılgı",
  },
  citation: (numbers: string) => `Kaynak ${numbers}`,
  references: {
    intro: (cited: number, total: number, date: string) =>
      `Metinde atıf yapılan ${cited} kaynak, ilk geçtikleri sırayla numaralanmıştır. Kaynak veritabanındaki ${total} künyenin her biri ${date} tarihinde birincil kaynağından (yayıncı sayfası, DOI çözümleyici, Crossref, kütüphane kataloğu ya da kurumun kendi sayfası) denetlenmiştir; doğrulanamayan alanlar tahmin edilmek yerine boş bırakılmıştır.`,
    openSource: "Kaynağı aç",
    backToText: "Metne dön",
  },
  report:
    "Bu metnin tamamı, doğrulama çizelgeleriyle birlikte depodaki docs/TEKNIK_RAPOR.md dosyasında da yer alır; rapor “npm run docs” komutuyla yeniden üretilir.",
};
