import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

const title = "SimuLab — Salınım ve Kaos Laboratuvarı";

const description =
  "Doğrulanmış sayısal çözücülerle çalışan etkileşimli 3B fizik laboratuvarı: sönümlü-sürülen osilatör, N bağlantılı sarkaç, enerji defteri, Lyapunov üsteli ve Poincaré kesiti; 14 doğrulama deneyi, 67 ölçüt. An interactive, verified computational-physics laboratory for oscillations and deterministic chaos.";

/**
 * Images of a shared link: 1200 x 630 px, the size of Open Graph previews and
 * large Twitter cards. They are screenshots of the running laboratory; the
 * first is the one most services show.
 */
const previews = [
  {
    url: "/preview-pendulum.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "SimuLab: kaotik çift sarkaç, ikiz yörüngenin ayrılması, Lyapunov üsteli kestirimi ve Poincaré kesiti",
  },
  {
    url: "/preview-oscillator.jpg",
    width: 1200,
    height: 630,
    type: "image/jpeg",
    alt: "SimuLab: rezonansta sürülen osilatör, frekans yanıtı ve genlik spektrumu",
  },
];

/**
 * Public address of the deployment, used to make the preview image of shared
 * links absolute. Set NEXT_PUBLIC_SITE_URL when hosting; Vercel supplies its
 * own variable.
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · SimuLab",
  },
  description,
  applicationName: "SimuLab",
  keywords: [
    "hesaplamalı fizik",
    "harmonik osilatör",
    "rezonans",
    "çift sarkaç",
    "kaos",
    "Lyapunov üsteli",
    "Runge-Kutta",
    "computational physics",
    "double pendulum",
  ],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "SimuLab",
    locale: "tr_TR",
    alternateLocale: ["en_US"],
    title,
    description,
    images: previews,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: previews.slice(0, 1),
  },
};

export const viewport: Viewport = {
  themeColor: "#090b0e",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
