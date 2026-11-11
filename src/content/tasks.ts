/**
 * Language-independent part of the task sheets: the governing formula, the
 * index of the correct prediction and the sources of the explanation. The
 * wording lives in the i18n dictionaries; the success criteria in
 * src/sim/tasks.ts.
 */

import type { TaskId } from "@/sim/tasks";

export interface TaskContent {
  /** LaTeX of the relation the task is built on. */
  formula: string;
  /** Index of the prediction option that agrees with theory and with the measurement. */
  answer: number;
  /** Keys of REFERENCES cited by the explanation. */
  references: readonly string[];
}

export const TASK_CONTENT: Readonly<Record<TaskId, TaskContent>> = {
  periodDesign: {
    formula: String.raw`T_0 = 2\pi\sqrt{\frac{m}{k}} \quad\Rightarrow\quad \frac{k}{m} = \frac{4\pi^2}{T_0^{\,2}}`,
    answer: 1,
    references: ["french1971", "taylor2005"],
  },
  criticalDamping: {
    formula: String.raw`\begin{gathered} c_\mathrm{kr} = 2\sqrt{k\,m},\qquad \zeta = \frac{c}{c_\mathrm{kr}} \\[6pt]x(t)\big|_{\zeta=1} = x_0\,(1+\omega_0 t)\,e^{-\omega_0 t} \end{gathered}`,
    answer: 1,
    references: ["rao2017", "gillespie1992", "dixon2007"],
  },
  resonancePeak: {
    formula: String.raw`\begin{gathered} A(\omega) = \frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2 + (c\,\omega/m)^2}} \\[6pt]\omega_r = \omega_0\sqrt{1-2\zeta^2} \end{gathered}`,
    answer: 1,
    references: ["french1971", "taylor2005", "billah1991"],
  },
  integratorError: {
    formula: String.raw`\begin{gathered} \frac{E_{n+1}}{E_n} = 1 + (h\omega_0)^2 \quad\text{(Euler)} \\[6pt]\frac{E_{n+1}}{E_n} = 1 - \frac{(h\omega_0)^6}{72} + \frac{(h\omega_0)^8}{576} \quad\text{(RK4)} \end{gathered}`,
    answer: 2,
    references: ["hairer2006", "hairer2003", "sanzserna1988"],
  },
  secondsPendulum: {
    formula: String.raw`\begin{gathered} T_0 = 2\pi\sqrt{\frac{L}{g}} \\[6pt]L = \frac{g\,T_0^{\,2}}{4\pi^2} = \frac{g}{\pi^2}\quad(T_0 = 2\ \mathrm{s}) \end{gathered}`,
    answer: 2,
    references: ["borda1791", "cgpm1901"],
  },
  anharmonic: {
    formula: String.raw`\begin{gathered} T = 4\sqrt{\frac{L}{g}}\,K\!\left(\sin\frac{\theta_0}{2}\right) \\[6pt]\frac{T}{T_0} = 1 + \frac{\theta_0^2}{16} + \frac{11\,\theta_0^4}{3072} + \cdots \end{gathered}`,
    answer: 2,
    references: ["belendez2007", "carvalhaes2008", "huygens1673"],
  },
  butterfly: {
    formula: String.raw`\begin{gathered} \delta(t) \approx \delta_0\,e^{\lambda t} \\[6pt]t_\mathrm{u} \approx \frac{1}{\lambda}\,\ln\frac{a}{\delta_0} \end{gathered}`,
    answer: 2,
    references: ["strogatz2015", "shinbrot1992"],
  },
  regularIsland: {
    formula: String.raw`\lambda = \lim_{t\to\infty}\frac{1}{t}\,\ln\frac{\lVert\delta(t)\rVert}{\lVert\delta_0\rVert}`,
    answer: 1,
    references: ["stachowiak2006", "rafat2009"],
  },
  normalMode: {
    formula: String.raw`\begin{gathered} \left(\mathbf{K} - \omega^2\mathbf{M}\right)\mathbf{a} = \mathbf{0} \\[6pt]\theta_i(t) = a_i\cos(\omega t + \varphi) \end{gathered}`,
    answer: 1,
    references: ["taylor2005", "muller2007", "braun2003"],
  },
};
