import type { theory as source } from "../tr/theory";

/** Theory reader: theory text, verification experiments and references. */
export const theory: typeof source = {
  title: "Theory, verification and references",
  description: "The equations of the model, the numerical methods, measured verification results and the sources relied on.",
  close: "Close",
  tabs: {
    label: "Document parts",
    theory: "Theory",
    verification: "Verification",
    references: "References",
  },
  contents: "Contents",
  frontMatter: "Abstract",
  chapter: (number: string) => `Chapter ${number}`,
  chapterSelect: "Go to chapter",
  notes: {
    info: "Note",
    warning: "Limitation",
    correction: "Common misconception",
  },
  citation: (numbers: string) => `Reference ${numbers}`,
  references: {
    intro: (cited: number, total: number, date: string) =>
      `The ${cited} sources cited in the text are numbered in order of first appearance. Each of the ${total} entries of the reference database was checked against a primary source (publisher page, DOI resolver, Crossref, library catalogue or the institution's own page) on ${date}; fields that could not be confirmed are left out rather than guessed.`,
    openSource: "Open the source",
    backToText: "Back to the text",
  },
  report:
    "The complete text, together with the verification tables, is also available in the repository as docs/TECHNICAL_REPORT.md; the report is regenerated with “npm run docs”.",
};
