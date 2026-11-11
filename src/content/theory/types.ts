/**
 * Structure of the in-application theory text.
 *
 * Inline markup understood by the renderer inside every `text` / `items` /
 * table cell string:
 *   $...$            inline LaTeX (KaTeX)
 *   **...**          strong emphasis
 *   *...*            emphasis
 *   [@key]           citation of REFERENCES[key]; several: [@key1; @key2]
 * Display equations use the `eq` block; `tex` is LaTeX without delimiters.
 */

export type TheoryBlock =
  | { kind: "p"; text: string }
  | { kind: "eq"; tex: string; /** Short identifier shown as the equation number, e.g. "2.4". */ label?: string }
  | { kind: "list"; items: string[]; ordered?: boolean }
  | {
      kind: "note";
      /** info: remark; warning: limitation or caveat; correction: a common misconception set right. */
      tone: "info" | "warning" | "correction";
      title: string;
      text: string;
    }
  | { kind: "table"; caption: string; head: string[]; rows: string[][] };

export interface TheorySection {
  /** Stable anchor, unique within the document (kebab-case, ASCII). */
  id: string;
  title: string;
  blocks: TheoryBlock[];
}

export interface TheoryChapter {
  id: string;
  /** Chapter number as displayed, e.g. "3". */
  number: string;
  title: string;
  /** One or two sentences shown in the table of contents. */
  summary: string;
  sections: TheorySection[];
}

export type TheoryDocument = TheoryChapter[];
