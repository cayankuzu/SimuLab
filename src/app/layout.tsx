import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimuLab — RK4 Physics Sandbox & Inspector",
  description:
    "Interactive Computational Physics Laboratory with 4th-Order Runge-Kutta (RK4) Differential Equation Solver, Phase Space Telemetry, and Direct Manipulation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="antialiased bg-[#0f0f0e] text-zinc-100">
        {children}
      </body>
    </html>
  );
}
