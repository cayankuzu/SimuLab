/**
 * Document generator (npm run docs).
 *
 * Runs the verification suite once and writes
 *   docs/TEKNIK_RAPOR.md       the technical report in Turkish,
 *   docs/TECHNICAL_REPORT.md   the same report in English,
 *   docs/VALIDATION.md         the verification tables on their own.
 * The reports are built from the same sources as the in-application reader
 * (src/content/theory, the verification dictionaries, src/content/references),
 * so the two cannot drift apart. The run fails if a verification criterion is
 * not met or if the text cites a key that is not in the bibliography.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CitationIndex } from "@/content/citations";
import { ACCESS_DATE } from "@/content/references";
import { FRONT_MATTER, THEORY, type TheoryLanguage } from "@/content/theory";
import { DICTIONARIES } from "@/i18n";
import { DEFAULT_SOLVER } from "@/physics/constants";
import { VALIDATION_SUITE, type ValidationCaseId, type ValidationRow } from "@/physics/validation";
import { bibliography, buildReport, validationTable, type ReportLabels, type ValidationSection } from "./report";

const OUTPUT_DIRECTORY = path.resolve(process.cwd(), "docs");
const DATE = new Date().toISOString().slice(0, 10);
const SOLVER = `RK4, h = ${1000 / DEFAULT_SOLVER.rateHz} ms`;
const ENVIRONMENT = `Node.js ${process.versions.node}, ${os.type()} ${process.arch}; ${SOLVER}`;

const FILES: Record<TheoryLanguage, string> = { tr: "TEKNIK_RAPOR.md", en: "TECHNICAL_REPORT.md" };

function labelsFor(language: TheoryLanguage): ReportLabels {
  const t = DICTIONARIES[language];
  const common = { columns: t.verification.columns, passed: t.verification.pass, failed: t.verification.fail, notes: t.theory.notes };
  if (language === "tr") {
    return {
      ...common,
      contents: "İçindekiler",
      references: "Kaynakça",
      referencesNote: (date) =>
        `Kaynaklar metinde ilk geçtikleri sırayla numaralanmıştır. Her künye ${date} tarihinde birincil kaynağından denetlenmiştir; web kaynakları için erişim tarihi de budur.`,
      verificationAppendix: "Ek A. Doğrulama çizelgeleri",
      verificationIntro: (environment) =>
        `Aşağıdaki değerler bu belge üretilirken ölçülmüştür (${environment}). ${t.verification.metricNote} Aynı deneyler uygulamanın içinden de çalıştırılabilir: Kuram ve kaynakça → Doğrulama.`,
      generated: (date) =>
        `Bu belge ${date} tarihinde “npm run docs” komutuyla kaynak koddan üretilmiştir. Metni değiştirmek için src/content/theory altındaki dosyalar düzenlenmelidir.`,
    };
  }
  return {
    ...common,
    contents: "Contents",
    references: "References",
    referencesNote: (date) =>
      `Sources are numbered in order of first appearance in the text. Every entry was checked against a primary source on ${date}, which is also the access date of the web resources.`,
    verificationAppendix: "Appendix A. Verification tables",
    verificationIntro: (environment) =>
      `The values below were measured when this document was generated (${environment}). ${t.verification.metricNote} The same experiments can be run inside the application: Theory and references → Verification.`,
    generated: (date) =>
      `This document was generated from the source code with “npm run docs” on ${date}. To change the text, edit the files under src/content/theory.`,
  };
}

function sectionsFor(language: TheoryLanguage, results: ReadonlyMap<ValidationCaseId, ValidationRow[]>): ValidationSection[] {
  const cases = DICTIONARIES[language].verification.cases;
  return VALIDATION_SUITE.map((item, index) => ({
    id: item.id,
    title: `A.${index + 1} ${cases[item.id].title}`,
    description: cases[item.id].description,
    labels: cases[item.id].rows,
    rows: results.get(item.id) ?? [],
  }));
}

describe("documents", () => {
  const results = new Map<ValidationCaseId, ValidationRow[]>();

  it("runs the verification suite", () => {
    for (const item of VALIDATION_SUITE) results.set(item.id, item.run());
    const failures = [...results.entries()].flatMap(([id, rows]) => rows.filter((row) => !row.pass).map((row) => `${id}: ${row.label}`));
    expect(failures).toEqual([]);
  });

  it("writes the technical report in both languages", () => {
    mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
    for (const language of ["tr", "en"] as const) {
      const report = buildReport({
        front: FRONT_MATTER[language],
        document: THEORY[language],
        labels: labelsFor(language),
        validation: sectionsFor(language, results),
        environment: ENVIRONMENT,
        date: DATE,
      });
      expect([...report.citations.unknown]).toEqual([]);
      writeFileSync(path.join(OUTPUT_DIRECTORY, FILES[language]), report.markdown, "utf8");
    }
  });

  it("writes the verification tables", () => {
    const total = [...results.values()].reduce((sum, rows) => sum + rows.length, 0);
    const out: string[] = [
      "# SimuLab — Doğrulama çizelgeleri / Verification tables",
      "",
      `*${DATE} · ${ENVIRONMENT}*`,
      "",
      `Bu dosya “npm run docs” komutuyla üretilir: ${VALIDATION_SUITE.length} deney, ${total} ölçüt; hepsi sağlanmadıkça dosya yazılmaz. Kuram ve kaynakça için [TEKNIK_RAPOR.md](TEKNIK_RAPOR.md).`,
      "",
      `This file is produced by “npm run docs”: ${VALIDATION_SUITE.length} experiments, ${total} criteria; it is not written unless all of them are met. For theory and references see [TECHNICAL_REPORT.md](TECHNICAL_REPORT.md).`,
      "",
    ];
    const citations = new CitationIndex();
    for (const language of ["tr", "en"] as const) {
      const labels = labelsFor(language);
      out.push(`## ${language === "tr" ? "Türkçe" : "English"}`, "", DICTIONARIES[language].verification.metricNote, "");
      for (const section of sectionsFor(language, results)) out.push(validationTable(section, labels, citations), "");
    }
    out.push(`<a id="references"></a>`, "", "## Kaynakça / References", "", `${ACCESS_DATE}`, "", ...bibliography(citations));
    expect([...citations.unknown]).toEqual([]);
    mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
    writeFileSync(path.join(OUTPUT_DIRECTORY, "VALIDATION.md"), `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`, "utf8");
  });
});
