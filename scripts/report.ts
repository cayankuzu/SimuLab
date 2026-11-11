/**
 * Converts the in-application theory text (src/content/theory) into a
 * stand-alone Markdown report with numbered citations, a bibliography and the
 * verification tables.
 *
 * Mathematics: with `math: "github"` (the default) inline formulas are written
 * as $`...`$ and display formulas as fenced "math" blocks, the two forms that
 * GitHub passes to the typesetter without Markdown interfering with
 * backslashes, underscores or asterisks. `math: "standard"` writes $...$ and
 * $$...$$ for tool-chains such as pandoc.
 */

import { CITATION_PATTERN, CitationIndex, citationKeys, formatReference } from "@/content/citations";
import { ACCESS_DATE, REFERENCES } from "@/content/references";
import type { FrontMatter } from "@/content/theory/frontmatter";
import type { TheoryBlock, TheoryDocument } from "@/content/theory/types";
import type { ValidationCaseId, ValidationRow } from "@/physics/validation";

export type MathStyle = "github" | "standard";

export interface ReportLabels {
  contents: string;
  references: string;
  referencesNote: (date: string) => string;
  verificationAppendix: string;
  verificationIntro: (environment: string) => string;
  columns: { quantity: string; measured: string; reference: string; error: string; tolerance: string; result: string };
  passed: string;
  failed: string;
  notes: Record<"info" | "warning" | "correction", string>;
  generated: (date: string) => string;
}

export interface ValidationSection {
  id: ValidationCaseId;
  title: string;
  /** May contain inline mathematics and [@key] citations. */
  description: string;
  /** Localised row labels, in the order of `rows`. */
  labels: string[];
  rows: ValidationRow[];
}

const INLINE_MATH = /\$([^$]+)\$/g;

/** Inline markup of the content files -> Markdown. */
function inline(text: string, citations: CitationIndex, math: MathStyle): string {
  const withMath = math === "github" ? text.replace(INLINE_MATH, (_match, tex: string) => `$\`${tex}\`$`) : text;
  return withMath.replace(CITATION_PATTERN, (_match, group: string) => {
    const numbers = citationKeys(group).map((key) => citations.number(key));
    return `[${numbers.map((n) => `[${n}](#ref-${n})`).join(", ")}]`;
  });
}

function display(tex: string, label: string | undefined, math: MathStyle): string {
  const body = `${tex}${label ? ` \\tag{${label}}` : ""}`;
  return math === "github" ? `\`\`\`math\n${body}\n\`\`\`` : `$$\n${body}\n$$`;
}

function block(item: TheoryBlock, citations: CitationIndex, labels: ReportLabels, math: MathStyle): string {
  switch (item.kind) {
    case "p":
      return inline(item.text, citations, math);
    case "eq":
      return display(item.tex, item.label, math);
    case "list":
      return item.items
        .map((entry, index) => `${item.ordered ? `${index + 1}.` : "-"} ${inline(entry, citations, math)}`)
        .join("\n");
    case "note":
      return `> **${labels.notes[item.tone]} — ${inline(item.title, citations, math)}**\n>\n> ${inline(item.text, citations, math)}`;
    case "table": {
      const cell = (value: string) => inline(value, citations, math).replace(/\|/g, "\\|");
      const head = `| ${item.head.map(cell).join(" | ")} |`;
      const rule = `| ${item.head.map(() => "---").join(" | ")} |`;
      const rows = item.rows.map((row) => `| ${row.map(cell).join(" | ")} |`);
      return [`*${inline(item.caption, citations, math)}*`, "", head, rule, ...rows].join("\n");
    }
  }
}

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

function scientific(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e-3 && magnitude < 1e5) return String(Number(value.toPrecision(7)));
  const [mantissa, exponent] = value.toExponential(2).split("e");
  const power = String(Number(exponent)).replace(/-/, "⁻").replace(/\d/g, (digit) => SUPERSCRIPT[Number(digit)]);
  return `${mantissa}×10${power}`;
}

/** One verification case as a Markdown section (heading, description, table of criteria). */
export function validationTable(
  section: ValidationSection,
  labels: ReportLabels,
  citations: CitationIndex,
  math: MathStyle = "github",
  heading = "###",
): string {
  const c = labels.columns;
  const lines = [
    `${heading} ${section.title}`,
    "",
    inline(section.description, citations, math),
    "",
    `| ${c.quantity} | ${c.measured} | ${c.reference} | ${c.error} | ${c.tolerance} | ${c.result} |`,
    "| --- | ---: | ---: | ---: | ---: | :---: |",
  ];
  section.rows.forEach((row, index) => {
    const label = inline(section.labels[index] ?? row.label.trim(), citations, math).replace(/\|/g, "\\|");
    const unit = row.unit ? ` ${row.unit}` : "";
    const comparator = row.metric === "atLeast" ? "≥ " : "≤ ";
    const bound = row.metric === "atMost" || row.metric === "atLeast";
    lines.push(
      `| ${label} | ${scientific(row.measured)}${unit} | ${row.reference === null ? "—" : scientific(row.reference) + unit} | ${
        bound ? "—" : scientific(row.error)
      } | ${comparator}${scientific(row.tolerance)} | ${row.pass ? labels.passed : labels.failed} |`,
    );
  });
  return lines.join("\n");
}

/** Numbered bibliography of the keys collected by `citations`. */
export function bibliography(citations: CitationIndex): string[] {
  const out: string[] = [];
  citations.keys.forEach((key, index) => {
    const reference = REFERENCES[key];
    out.push(`<a id="ref-${index + 1}"></a>${index + 1}. ${reference ? formatReference(reference) : `**[${key}]**`}`, "");
  });
  return out;
}

export interface ReportInput {
  front: FrontMatter;
  document: TheoryDocument;
  labels: ReportLabels;
  validation: ValidationSection[];
  environment: string;
  date: string;
  math?: MathStyle;
}

export function buildReport({ front, document, labels, validation, environment, date, math = "github" }: ReportInput): {
  markdown: string;
  citations: CitationIndex;
} {
  const citations = new CitationIndex();
  const out: string[] = [];

  out.push(`# ${front.title}`, "", `**${front.subtitle}**`, "", `*${labels.generated(date)}*`, "");
  out.push(`## ${front.abstractHeading}`, "", front.abstract, "", `**${front.keywordsHeading}:** ${front.keywords.join("; ")}.`, "");

  out.push(`## ${labels.contents}`, "");
  for (const chapter of document) {
    out.push(`- [${chapter.number}. ${chapter.title}](#${chapter.id})`);
    for (const section of chapter.sections) out.push(`  - [${section.title}](#${section.id})`);
  }
  out.push(`- [${labels.verificationAppendix}](#verification)`, `- [${labels.references}](#references)`, "");

  for (const chapter of document) {
    out.push(
      `<a id="${chapter.id}"></a>`,
      "",
      `## ${chapter.number}. ${chapter.title}`,
      "",
      `*${inline(chapter.summary, citations, math)}*`,
      "",
    );
    for (const section of chapter.sections) {
      out.push(`<a id="${section.id}"></a>`, "", `### ${section.title}`, "");
      for (const item of section.blocks) out.push(block(item, citations, labels, math), "");
    }
  }

  out.push(`<a id="verification"></a>`, "", `## ${labels.verificationAppendix}`, "", labels.verificationIntro(environment), "");
  for (const section of validation) out.push(validationTable(section, labels, citations, math), "");

  out.push(`<a id="references"></a>`, "", `## ${labels.references}`, "", labels.referencesNote(ACCESS_DATE), "");
  out.push(...bibliography(citations));

  return { markdown: `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`, citations };
}
