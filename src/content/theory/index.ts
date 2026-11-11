import { CitationIndex } from "../citations";
import { designEn } from "./design.en";
import { designTr } from "./design.tr";
import { theoryEn } from "./en";
import { FRONT_MATTER } from "./frontmatter";
import { theoryTr } from "./tr";
import type { TheoryBlock, TheoryDocument } from "./types";

export type TheoryLanguage = "tr" | "en";

/** Complete document per language: physics and numerics chapters followed by the design chapters. */
export const THEORY: Readonly<Record<TheoryLanguage, TheoryDocument>> = {
  tr: [...theoryTr, ...designTr],
  en: [...theoryEn, ...designEn],
};

export { FRONT_MATTER };

/** Every string of a block that may carry inline markup. */
export function blockTexts(block: TheoryBlock): string[] {
  switch (block.kind) {
    case "p":
      return [block.text];
    case "eq":
      return [];
    case "list":
      return block.items;
    case "note":
      return [block.title, block.text];
    case "table":
      return [block.caption, ...block.head, ...block.rows.flat()];
  }
}

/**
 * Citation numbering of a document in reading order (chapter summary, then
 * the blocks of each section). The reader and the generated report use the
 * same order, so reference numbers agree between the two.
 */
export function citationIndexOf(document: TheoryDocument): CitationIndex {
  const index = new CitationIndex();
  for (const chapter of document) {
    index.scan(chapter.summary);
    for (const section of chapter.sections) {
      for (const block of section.blocks) {
        for (const text of blockTexts(block)) index.scan(text);
      }
    }
  }
  return index;
}
