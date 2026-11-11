import katex from "katex";

/**
 * KaTeX markup of a LaTeX expression. The default output is kept on purpose:
 * next to the visual HTML (which KaTeX marks aria-hidden) it contains the
 * MathML that assistive technology reads. With output "html" alone every
 * formula would be removed from the accessibility tree without a text
 * alternative.
 */
export function renderTex(tex: string, block: boolean): string {
  return katex.renderToString(tex, { displayMode: block, throwOnError: false, strict: "ignore" });
}
