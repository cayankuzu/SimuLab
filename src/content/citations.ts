/**
 * Citation handling shared by the in-application reader, the task sheets and
 * the report generator: parsing of the [@key] markup, numbering in order of
 * first appearance, and one consistent bibliography style.
 */

import { REFERENCES, type Reference } from "./references";

export type CitationLanguage = "tr" | "en";

/** Matches "[@key]" and "[@key1; @key2]". */
export const CITATION_PATTERN = /\[@([^\]]+)\]/g;

/** Keys named by the inside of one citation bracket ("@a; @b" -> ["a", "b"]). */
export function citationKeys(group: string): string[] {
  return group
    .split(";")
    .map((part) => part.trim().replace(/^@/, ""))
    .filter(Boolean);
}

/** Collects citation keys in order of first appearance and numbers them from 1. */
export class CitationIndex {
  private readonly order: string[] = [];
  private readonly position = new Map<string, number>();
  readonly unknown = new Set<string>();

  number(key: string): number {
    let index = this.position.get(key);
    if (index === undefined) {
      index = this.order.length;
      this.order.push(key);
      this.position.set(key, index);
      if (!REFERENCES[key]) this.unknown.add(key);
    }
    return index + 1;
  }

  /** Registers every citation that occurs in `text`. */
  scan(text: string): void {
    for (const match of text.matchAll(CITATION_PATTERN)) {
      for (const key of citationKeys(match[1])) this.number(key);
    }
  }

  get keys(): readonly string[] {
    return this.order;
  }
}

function surnames(reference: Reference): string[] {
  return reference.authors.split(";").map((author) => author.trim().split(",")[0].trim());
}

/** Author-year form for running text: "Billah & Scanlan (1991)", "Benettin et al. (1976)". */
export function shortCitation(reference: Reference, language: CitationLanguage): string {
  const names = surnames(reference);
  const year = reference.year.replace(/^n\.d\..*$/, language === "tr" ? "t.y." : "n.d.");
  const who =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} ${language === "tr" ? "ve" : "&"} ${names[1]}`
        : `${names[0]} ${language === "tr" ? "vd." : "et al."}`;
  return `${who} (${year})`;
}

export interface ReferenceParts {
  /** "Authors (year)." */
  lead: string;
  title: string;
  /** Books, standards and reports carry an italic title; articles an italic container. */
  italicTitle: boolean;
  edition?: string;
  container?: string;
  /** Volume(issue), pages - the part that follows the container. */
  locator?: string;
  publisher?: string;
  link?: { label: string; href: string };
}

/** Splits a reference into the pieces of a bibliography entry. */
export function referenceParts(reference: Reference): ReferenceParts {
  const italicTitle = reference.type === "book" || reference.type === "standard" || reference.type === "report";
  let locator = "";
  if (reference.container) {
    if (reference.volume) locator += ` ${reference.volume}`;
    if (reference.issue) locator += `(${reference.issue})`;
    if (reference.pages) locator += `, ${reference.pages}`;
  } else if (reference.pages && reference.type !== "book") {
    locator = reference.pages;
  }
  return {
    lead: `${reference.authors} (${reference.year}).`,
    title: reference.title,
    italicTitle,
    edition: italicTitle ? reference.edition : undefined,
    container: reference.container,
    locator: locator.trim() ? locator : undefined,
    publisher: reference.publisher,
    link: reference.doi
      ? { label: `doi:${reference.doi}`, href: `https://doi.org/${reference.doi}` }
      : reference.url
        ? { label: reference.url, href: reference.url }
        : undefined,
  };
}

/** One bibliography entry as Markdown. */
export function formatReference(reference: Reference): string {
  const parts = referenceParts(reference);
  const out: string[] = [parts.lead];
  out.push(parts.italicTitle ? `*${parts.title}*${parts.edition ? ` (${parts.edition})` : ""}.` : `${parts.title}.`);
  if (parts.container) out.push(`*${parts.container}*${parts.locator ?? ""}.`);
  else if (parts.locator) out.push(`${parts.locator}.`);
  if (parts.publisher) out.push(`${parts.publisher}.`);
  if (parts.link) out.push(reference.doi ? `[${parts.link.label}](${parts.link.href})` : `<${parts.link.href}>`);
  return out.join(" ");
}
