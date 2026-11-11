import type { Language } from "@/ui/prefs";

export interface FrontMatter {
  title: string;
  subtitle: string;
  abstractHeading: string;
  abstract: string;
  keywordsHeading: string;
  keywords: string[];
}

/**
 * Title page and abstract of the technical report. The figures quoted here are
 * those of the verification suite (src/physics/validation.ts) with the default
 * solver, classical RK4 at h = 1 ms; regenerate the report with "npm run docs"
 * to see the values measured on your own machine.
 */
export const FRONT_MATTER: Readonly<Record<Language, FrontMatter>> = {
  tr: {
    title: "SimuLab: Salınım ve Deterministik Kaos için Doğrulanmış, Etkileşimli Bir Hesaplamalı Fizik Laboratuvarı",
    subtitle: "Teknik rapor: kuram, sayısal yöntemler ve doğrulama",
    abstractHeading: "Özet",
    abstract:
      "Bu rapor, tarayıcıda çalışan üç boyutlu bir fizik laboratuvarı olan SimuLab'ın kuramsal temelini, sayısal yöntemlerini ve doğrulama sonuçlarını belgeler. Laboratuvar iki deney düzeneği içerir: rijit durdurucuları olan, sönümlü ve harmonik olarak sürülen bir yay–kütle osilatörü ile N = 1…6 bağlantılı düzlemsel bir sarkaç zinciri. Hareket denklemleri sabit adımlı açık Runge–Kutta yöntemleriyle çözülür (varsayılan: klasik dördüncü mertebe yöntem, h = 1 ms). Adım dizisi ekran yenileme hızından bağımsızdır; bu nedenle kaotik yörüngeler de aynı başlangıç koşullarından aynen yeniden üretilir. Her terimi ayrı ayrı integre edilen bir enerji defteri (kinetik ve potansiyel enerji, sönüm ısısı, çarpışma ısısı, sürücünün yaptığı iş) sayısal hatayı çalışma sırasında sürekli görünür kılar. On dört doğrulama deneyi, çözücüyü kapalı biçimli çözümlerle, korunum yasalarıyla ve bağımsız türetimlerle karşılaştırır: klasik Runge–Kutta yöntemi için gözlenen yakınsama mertebesi 4,005'tir; serbest yanıtta, dört sönüm rejiminde 20 s boyunca en büyük konum hatası 1,6×10⁻¹⁰ m'dir; sonlu genlikli sarkacın ölçülen periyodu eliptik integral çözümünden bağıl olarak 3×10⁻¹⁰'dan az sapar; sürtünmesiz çift sarkaçta 60 s'lik bağıl enerji sapması 2×10⁻⁹'dur. Kaos nicel olarak incelenir: Benettin yöntemiyle kestirilen en büyük Lyapunov üsteli, ikiz yörüngenin ayrılması, Poincaré kesiti ve genlik spektrumu birlikte sunulur. Ölçüme dayalı dokuz deney föyü; periyot, sönüm oranı, rezonans genliği gibi büyüklüklerin sanal cihazlarla ölçülmesini ve kuramsal değerle karşılaştırılmasını ister. Rapor, ders kitaplarında sık rastlanan bazı yanılgıları kaynak göstererek düzeltir ve modelin varsayımlarını ve sınırlılıklarını açıkça belirtir.",
    keywordsHeading: "Anahtar sözcükler",
    keywords: [
      "hesaplamalı fizik",
      "harmonik osilatör",
      "rezonans",
      "çoklu sarkaç",
      "deterministik kaos",
      "Lyapunov üsteli",
      "Runge–Kutta yöntemleri",
      "doğrulama ve geçerleme",
      "fizik eğitimi",
    ],
  },
  en: {
    title: "SimuLab: A Verified, Interactive Computational-Physics Laboratory for Oscillations and Deterministic Chaos",
    subtitle: "Technical report: theory, numerical methods and verification",
    abstractHeading: "Abstract",
    abstract:
      "This report documents the theoretical basis, the numerical methods and the verification results of SimuLab, a three-dimensional physics laboratory that runs in the browser. The laboratory contains two experiments: a damped, harmonically driven spring–mass oscillator with rigid end stops, and a planar pendulum chain of N = 1…6 links. The equations of motion are integrated with fixed-step explicit Runge–Kutta methods (default: the classical fourth-order method, h = 1 ms). The sequence of steps does not depend on the display refresh rate, so even chaotic trajectories are reproduced exactly from the same initial conditions. An energy ledger in which every term is integrated separately (kinetic and potential energy, damping heat, impact heat, work done by the drive) keeps the numerical error visible throughout a run. Fourteen verification experiments compare the solver with closed-form solutions, conservation laws and independent derivations: the observed order of accuracy of the classical Runge–Kutta method is 4.005; the largest position error of the free response over 20 s, in four damping regimes, is 1.6×10⁻¹⁰ m; the measured period of the finite-amplitude pendulum deviates from the elliptic-integral solution by less than 3×10⁻¹⁰ in relative terms; the relative energy drift of the frictionless double pendulum over 60 s is 2×10⁻⁹. Chaos is examined quantitatively: the largest Lyapunov exponent estimated by Benettin's method, the separation of a twin trajectory, a Poincaré section and the amplitude spectrum are presented together. Nine measurement-based task sheets require quantities such as period, damping ratio and resonance amplitude to be measured with virtual instruments and compared with theory. The report also corrects, with sources, several misconceptions common in textbooks and states the assumptions and limitations of the model explicitly.",
    keywordsHeading: "Keywords",
    keywords: [
      "computational physics",
      "harmonic oscillator",
      "resonance",
      "multiple pendulum",
      "deterministic chaos",
      "Lyapunov exponent",
      "Runge–Kutta methods",
      "verification and validation",
      "physics education",
    ],
  },
};
