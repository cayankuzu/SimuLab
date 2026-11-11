"use client";

import { Fragment, type ReactNode } from "react";
import { CITATION_PATTERN, citationKeys } from "@/content/citations";
import { Tex } from "./core";

/**
 * Renders the inline markup of the content files:
 *   $...$     inline LaTeX
 *   **...**   strong emphasis
 *   *...*     emphasis
 *   [@key]    citation; several keys: [@a; @b]
 * Citations are handed to `cite`, so the reader can number them and the task
 * sheets can print author and year.
 */

type Token =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "em"; value: string }
  | { kind: "cite"; keys: string[] };

const MARKUP = new RegExp(
  [String.raw`\$([^$]+)\$`, String.raw`\*\*([^*]+)\*\*`, String.raw`\*([^*]+)\*`, CITATION_PATTERN.source].join("|"),
  "g",
);

const cache = new Map<string, Token[]>();

function tokenise(text: string): Token[] {
  const known = cache.get(text);
  if (known) return known;
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of text.matchAll(MARKUP)) {
    const start = match.index;
    if (start > cursor) tokens.push({ kind: "text", value: text.slice(cursor, start) });
    if (match[1] !== undefined) tokens.push({ kind: "math", value: match[1] });
    else if (match[2] !== undefined) tokens.push({ kind: "strong", value: match[2] });
    else if (match[3] !== undefined) tokens.push({ kind: "em", value: match[3] });
    else tokens.push({ kind: "cite", keys: citationKeys(match[4]) });
    cursor = start + match[0].length;
  }
  if (cursor < text.length) tokens.push({ kind: "text", value: text.slice(cursor) });
  if (cache.size > 4000) cache.clear();
  cache.set(text, tokens);
  return tokens;
}

/** Strong and emphasised runs may themselves contain mathematics. */
function nested(value: string): ReactNode {
  if (!value.includes("$")) return value;
  return tokenise(value).map((token, index) =>
    token.kind === "math" ? <Tex key={index}>{token.value}</Tex> : <Fragment key={index}>{"value" in token ? token.value : null}</Fragment>,
  );
}

interface RichTextProps {
  children: string;
  /** Renders one citation bracket; without it citations are dropped. */
  cite?: (keys: string[]) => ReactNode;
}

export function RichText({ children, cite }: RichTextProps) {
  return (
    <>
      {tokenise(children).map((token, index) => {
        switch (token.kind) {
          case "text":
            return <Fragment key={index}>{token.value}</Fragment>;
          case "math":
            return <Tex key={index}>{token.value}</Tex>;
          case "strong":
            return (
              <strong key={index} className="font-semibold text-ink">
                {nested(token.value)}
              </strong>
            );
          case "em":
            return <em key={index}>{nested(token.value)}</em>;
          case "cite":
            return cite ? <Fragment key={index}>{cite(token.keys)}</Fragment> : null;
        }
      })}
    </>
  );
}
