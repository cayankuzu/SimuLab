import katex from "katex";
import { describe, expect, it } from "vitest";
import { CITATION_PATTERN, citationKeys, formatReference, shortCitation } from "@/content/citations";
import { REFERENCES } from "@/content/references";
import { TASK_CONTENT } from "@/content/tasks";
import { blockTexts, citationIndexOf, FRONT_MATTER, THEORY, type TheoryLanguage } from "@/content/theory";
import type { TheoryDocument } from "@/content/theory/types";
import { DICTIONARIES } from "@/i18n";
import { VALIDATION_SUITE } from "@/physics/validation";
import { Simulation } from "@/sim/Simulation";
import { TASKS } from "@/sim/tasks";
import { buildReport, type ReportLabels } from "../scripts/report";

const LANGUAGES: TheoryLanguage[] = ["tr", "en"];

/** Every string of a document that goes through the inline-markup renderer. */
function documentTexts(document: TheoryDocument): string[] {
  const texts: string[] = [];
  for (const chapter of document) {
    texts.push(chapter.summary);
    for (const section of chapter.sections) {
      for (const block of section.blocks) texts.push(...blockTexts(block));
    }
  }
  return texts;
}

function citedKeys(texts: string[]): string[] {
  const keys: string[] = [];
  for (const text of texts) {
    for (const match of text.matchAll(CITATION_PATTERN)) keys.push(...citationKeys(match[1]));
  }
  return keys;
}

function inlineMath(text: string): string[] {
  return Array.from(text.matchAll(/\$([^$]+)\$/g), (match) => match[1]);
}

const renders = (tex: string, displayMode: boolean): string | null => {
  try {
    katex.renderToString(tex, { displayMode, throwOnError: true, strict: "ignore" });
    return null;
  } catch (error) {
    return `${tex} -> ${(error as Error).message}`;
  }
};

/** Texts of the interface dictionaries that carry inline markup. */
function dictionaryTexts(language: TheoryLanguage): string[] {
  const t = DICTIONARIES[language];
  const texts: string[] = [];
  for (const item of Object.values(t.tasks.items)) texts.push(item.goal, item.note, item.explain, ...item.criteria);
  for (const item of Object.values(t.verification.cases)) texts.push(item.description, ...item.rows);
  return texts;
}

describe("theory text", () => {
  it("has the same structure in both languages", () => {
    const shape = (document: TheoryDocument) =>
      document.map((chapter) => ({
        id: chapter.id,
        number: chapter.number,
        sections: chapter.sections.map((section) => ({
          id: section.id,
          blocks: section.blocks.map((block) => (block.kind === "eq" ? `eq:${block.label ?? ""}:${block.tex}` : block.kind)),
        })),
      }));
    expect(shape(THEORY.en)).toEqual(shape(THEORY.tr));
  });

  it("numbers chapters consecutively and uses unique anchors", () => {
    for (const language of LANGUAGES) {
      const document = THEORY[language];
      expect(document.map((chapter) => chapter.number)).toEqual(document.map((_, index) => String(index + 1)));
      const anchors = document.flatMap((chapter) => [chapter.id, ...chapter.sections.map((section) => section.id)]);
      expect(new Set(anchors).size).toBe(anchors.length);
      for (const anchor of anchors) expect(anchor).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("cites only references that exist, and the same ones in both languages", () => {
    for (const language of LANGUAGES) {
      const index = citationIndexOf(THEORY[language]);
      expect([...index.unknown]).toEqual([]);
      expect(index.keys.length).toBeGreaterThan(80);
    }
    const keys = (language: TheoryLanguage) => [...citationIndexOf(THEORY[language]).keys].sort();
    expect(keys("en")).toEqual(keys("tr"));
  });

  it("has balanced inline markup", () => {
    for (const language of LANGUAGES) {
      for (const text of [...documentTexts(THEORY[language]), ...dictionaryTexts(language)]) {
        expect((text.match(/\$/g) ?? []).length % 2, text).toBe(0);
        const withoutMath = text.replace(/\$[^$]+\$/g, "");
        expect((withoutMath.match(/\*\*/g) ?? []).length % 2, text).toBe(0);
      }
    }
  });

  it("contains only mathematics that KaTeX can typeset", () => {
    const failures: string[] = [];
    const check = (tex: string, display: boolean) => {
      const failure = renders(tex, display);
      if (failure) failures.push(failure);
    };
    for (const language of LANGUAGES) {
      for (const chapter of THEORY[language]) {
        for (const section of chapter.sections) {
          for (const block of section.blocks) if (block.kind === "eq") check(block.tex, true);
        }
      }
      for (const text of [...documentTexts(THEORY[language]), ...dictionaryTexts(language)]) {
        for (const tex of inlineMath(text)) check(tex, false);
      }
    }
    for (const content of Object.values(TASK_CONTENT)) check(content.formula, true);
    expect(failures).toEqual([]);
  });

  it("contains no TeX command that has lost its backslash", () => {
    // "\frac" written as "frac" still typesets (as four italic letters), so the KaTeX check above cannot see it.
    const bare =
      /(^|[^\\A-Za-z])(frac|tfrac|dfrac|sqrt|mathrm|mathbf|mathsf|boldsymbol|omega|zeta|theta|gamma|lambda|delta|kappa|varphi|approx|times|cdot|qquad|quad|left|right|lVert|rVert|underbrace|partial|infty|circ|Lambda|Delta)(?![A-Za-z])/;
    const offenders: string[] = [];
    const check = (tex: string) => {
      if (bare.test(tex)) offenders.push(tex);
    };
    for (const language of LANGUAGES) {
      for (const chapter of THEORY[language]) {
        for (const section of chapter.sections) {
          for (const block of section.blocks) if (block.kind === "eq") check(block.tex);
        }
      }
      for (const text of [...documentTexts(THEORY[language]), ...dictionaryTexts(language)]) {
        for (const tex of inlineMath(text)) check(tex);
      }
    }
    for (const content of Object.values(TASK_CONTENT)) check(content.formula);
    expect(offenders).toEqual([]);
  });

  it("has a complete front matter", () => {
    for (const language of LANGUAGES) {
      const front = FRONT_MATTER[language];
      expect(front.title.length).toBeGreaterThan(20);
      expect(front.abstract.length).toBeGreaterThan(400);
      expect(front.keywords.length).toBeGreaterThanOrEqual(5);
    }
  });
});

describe("task sheets", () => {
  it("have texts that match the task definitions", () => {
    for (const language of LANGUAGES) {
      const text = DICTIONARIES[language].tasks;
      for (const task of TASKS) {
        const item = text.items[task.id];
        const content = TASK_CONTENT[task.id];
        expect(item.criteria.length, `${language}/${task.id}`).toBe(task.criteria);
        expect(item.options.length, `${language}/${task.id}`).toBeGreaterThanOrEqual(2);
        expect(content.answer).toBeGreaterThanOrEqual(0);
        expect(content.answer).toBeLessThan(item.options.length);
        for (const key of content.references) expect(REFERENCES[key], key).toBeDefined();
        for (const key of citedKeys([item.explain])) {
          expect(REFERENCES[key], key).toBeDefined();
          expect(content.references, `${task.id} cites ${key}`).toContain(key);
        }
      }
    }
    for (const task of TASKS) {
      expect(DICTIONARIES.en.tasks.items[task.id].options.length).toBe(DICTIONARIES.tr.tasks.items[task.id].options.length);
    }
  });

  it("label every read-out a task produces", () => {
    for (const task of TASKS) {
      const sim = new Simulation();
      task.setup(sim);
      for (const readout of task.evaluate(sim, {}).readouts) {
        for (const language of LANGUAGES) {
          expect(DICTIONARIES[language].tasks.readouts[readout.key], `${language}/${readout.key}`).toBeTruthy();
        }
      }
    }
  });
});

describe("verification panel", () => {
  it("labels every row of every case and cites existing references", () => {
    for (const validationCase of VALIDATION_SUITE) {
      const rows = validationCase.run();
      for (const language of LANGUAGES) {
        const text = DICTIONARIES[language].verification.cases[validationCase.id];
        expect(text.rows.length, `${language}/${validationCase.id}`).toBe(rows.length);
        for (const key of citedKeys([text.description])) expect(REFERENCES[key], key).toBeDefined();
      }
    }
  });
});

describe("bibliography", () => {
  it("stores every entry under its own key with the mandatory fields", () => {
    const entries = Object.entries(REFERENCES);
    expect(entries.length).toBeGreaterThan(150);
    for (const [key, reference] of entries) {
      expect(reference.key).toBe(key);
      expect(reference.authors.length).toBeGreaterThan(0);
      expect(reference.title.length).toBeGreaterThan(0);
      expect(reference.year.length).toBeGreaterThan(0);
      if (reference.doi) expect(reference.doi).toMatch(/^10\.\d{4,9}\//);
      if (reference.url) expect(reference.url).toMatch(/^https?:\/\//);
    }
  });

  it("formats citations", () => {
    expect(shortCitation(REFERENCES.billah1991, "en")).toBe("Billah & Scanlan (1991)");
    expect(shortCitation(REFERENCES.billah1991, "tr")).toBe("Billah ve Scanlan (1991)");
    expect(shortCitation(REFERENCES.benettin1976, "en")).toBe("Benettin et al. (1976)");
    expect(shortCitation(REFERENCES.benettin1976, "tr")).toBe("Benettin vd. (1976)");
    expect(shortCitation(REFERENCES.strogatz2015, "en")).toBe("Strogatz (2015)");
    const formatted = formatReference(REFERENCES.billah1991);
    expect(formatted).toContain("*American Journal of Physics* 59(2), 118-124.");
    expect(formatted).toContain("https://doi.org/10.1119/1.16590");
  });
});

describe("report generator", () => {
  const labels: ReportLabels = {
    contents: "Contents",
    references: "References",
    referencesNote: (date) => `Checked on ${date}.`,
    verificationAppendix: "Appendix",
    verificationIntro: (environment) => `Measured on ${environment}.`,
    columns: { quantity: "Quantity", measured: "Measured", reference: "Reference", error: "Error", tolerance: "Tolerance", result: "Result" },
    passed: "passed",
    failed: "failed",
    notes: { info: "Note", warning: "Limitation", correction: "Misconception" },
    generated: (date) => `Generated on ${date}.`,
  };
  const document: TheoryDocument = [
    {
      id: "one",
      number: "1",
      title: "First",
      summary: "Summary [@taylor2005].",
      sections: [
        {
          id: "one-a",
          title: "Section",
          blocks: [
            { kind: "p", text: "Energy $E = mc^2$ is **bold** [@french1971; @taylor2005]." },
            { kind: "eq", tex: "a = b", label: "1.1" },
            { kind: "table", caption: "Caption", head: ["A", "B"], rows: [["|x|", "$y$"]] },
          ],
        },
      ],
    },
  ];
  const validation = [
    {
      id: "impact" as const,
      title: "Impact",
      description: "Described with $v$ [@stronge2000].",
      labels: ["Instant of impact"],
      rows: [{ label: "impact time", measured: 0.5, reference: 0.5, error: 8.6e-13, metric: "absolute" as const, tolerance: 1e-8, unit: "s", pass: true }],
    },
  ];

  it("numbers citations by first appearance and writes GitHub-safe mathematics", () => {
    const { markdown, citations } = buildReport({ front: FRONT_MATTER.en, document, labels, validation, environment: "test", date: "2026-01-01" });
    expect(citations.keys).toEqual(["taylor2005", "french1971", "stronge2000"]);
    expect([...citations.unknown]).toEqual([]);
    expect(markdown).toContain("Energy $`E = mc^2`$ is **bold** [[2](#ref-2), [1](#ref-1)].");
    expect(markdown).toContain("```math\na = b \\tag{1.1}\n```");
    expect(markdown).toContain("| \\|x\\| | $`y`$ |");
    expect(markdown).toContain("| Instant of impact | 0.5 s | 0.5 s | 8.60×10⁻¹³ | ≤ 1.00×10⁻⁸ | passed |");
    expect(markdown).toContain('<a id="ref-3"></a>3. Stronge, W. J. (2000).');
    expect(markdown).toContain("- [1. First](#one)");
  });

  it("writes standard delimiters on request and reports unknown keys", () => {
    const broken: TheoryDocument = [{ ...document[0], summary: "Cites [@nosuchkey]." }];
    const { markdown, citations } = buildReport({
      front: FRONT_MATTER.en,
      document: broken,
      labels,
      validation: [],
      environment: "test",
      date: "2026-01-01",
      math: "standard",
    });
    expect([...citations.unknown]).toEqual(["nosuchkey"]);
    expect(markdown).toContain("Energy $E = mc^2$ is");
    expect(markdown).toContain("$$\na = b \\tag{1.1}\n$$");
  });
});
