"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import type { FrontMatter } from "@/content/theory/frontmatter";
import type { TheoryBlock, TheoryDocument } from "@/content/theory/types";
import { useT, type Dictionary } from "@/i18n";
import { cn, scrollWithin, Tex } from "../kit/core";
import { RichText } from "../kit/RichText";

const FRONT_ID = "front";
const anchor = (id: string) => `th-${id}`;

type Cite = (keys: string[]) => ReactNode;

const NOTE_TONE: Record<"info" | "warning" | "correction", string> = {
  info: "border-oi-sky/60",
  warning: "border-warn/70",
  correction: "border-oi-purple/70",
};

function Block({ block, cite, notes }: { block: TheoryBlock; cite: Cite; notes: Dictionary["theory"]["notes"] }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="my-3">
          <RichText cite={cite}>{block.text}</RichText>
        </p>
      );
    case "eq":
      return (
        <div className="my-4 flex items-center gap-3 rounded-sm bg-raised px-4 py-3 text-ink">
          <div className="min-w-0 flex-1 overflow-x-auto">
            <Tex block>{block.tex}</Tex>
          </div>
          {block.label ? <span className="num shrink-0 text-[12px] text-ink-3">({block.label})</span> : null}
        </div>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={cn("my-3 space-y-1.5 pl-5", block.ordered ? "list-decimal" : "list-disc", "marker:text-ink-4")}>
          {block.items.map((item, index) => (
            <li key={index} className="pl-1">
              <RichText cite={cite}>{item}</RichText>
            </li>
          ))}
        </List>
      );
    }
    case "note":
      return (
        <aside className={cn("my-4 border-l-2 py-1 pl-4", NOTE_TONE[block.tone])}>
          <p className="label-caps">{notes[block.tone]}</p>
          <p className="mt-1 font-medium text-ink">
            <RichText cite={cite}>{block.title}</RichText>
          </p>
          <p className="mt-1 text-[13.5px]">
            <RichText cite={cite}>{block.text}</RichText>
          </p>
        </aside>
      );
    case "table":
      return (
        <figure className="my-5">
          <figcaption className="mb-2 text-[12.5px] leading-snug text-ink-3">
            <RichText cite={cite}>{block.caption}</RichText>
          </figcaption>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px] leading-snug">
              <thead>
                <tr className="border-b border-line-strong text-left text-ink-3">
                  {block.head.map((cell, index) => (
                    <th key={index} scope="col" className="py-1.5 pr-4 font-medium last:pr-0">
                      <RichText cite={cite}>{cell}</RichText>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-line align-top last:border-b-0">
                    {row.map((cell, index) => (
                      <td key={index} className={cn("py-1.5 pr-4 last:pr-0", index === 0 ? "text-ink" : "text-ink-2")}>
                        <RichText cite={cite}>{cell}</RichText>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </figure>
      );
  }
}

interface ArticleProps {
  document: TheoryDocument;
  front: FrontMatter;
  cite: Cite;
  notes: Dictionary["theory"]["notes"];
  footer: string;
}

/** The typeset document. Memoised: scrolling only changes the highlighted entry of the contents list. */
const Article = memo(function Article({ document, front, cite, notes, footer }: ArticleProps) {
  return (
    <article className="mx-auto max-w-[720px] px-5 pb-16 pt-7 text-[14px] leading-[1.65] text-ink-2 sm:px-8">
      <header id={anchor(FRONT_ID)} data-chapter={FRONT_ID} className="scroll-mt-4">
        <h2 className="text-[22px] font-semibold leading-tight text-ink">{front.title}</h2>
        <p className="mt-2 text-[14px] text-ink-3">{front.subtitle}</p>
        <h3 className="label-caps mt-6">{front.abstractHeading}</h3>
        <p className="mt-2">{front.abstract}</p>
        <p className="mt-3 text-[13px] text-ink-3">
          <span className="font-medium text-ink-2">{front.keywordsHeading}:</span> {front.keywords.join(" · ")}
        </p>
      </header>

      {document.map((chapter) => (
        <section key={chapter.id} id={anchor(chapter.id)} data-chapter={chapter.id} className="mt-12 scroll-mt-4 border-t border-line pt-8">
          <h2 className="flex items-baseline gap-3 text-[20px] font-semibold leading-tight text-ink">
            <span className="num text-[15px] font-medium text-accent">{chapter.number}</span>
            {chapter.title}
          </h2>
          <p className="mt-2 text-[13.5px] italic text-ink-3">
            <RichText cite={cite}>{chapter.summary}</RichText>
          </p>
          {chapter.sections.map((section) => (
            <section key={section.id} id={anchor(section.id)} className="scroll-mt-4">
              <h3 className="mt-8 text-[15.5px] font-semibold text-ink">{section.title}</h3>
              {section.blocks.map((block, index) => (
                <Block key={index} block={block} cite={cite} notes={notes} />
              ))}
            </section>
          ))}
        </section>
      ))}

      <p className="mt-14 border-t border-line pt-4 text-[12.5px] text-ink-3">{footer}</p>
    </article>
  );
});

interface TheoryViewProps {
  document: TheoryDocument;
  front: FrontMatter;
  cite: Cite;
}

/** Contents list with scroll tracking next to the typeset document. */
export function TheoryView({ document, front, cite }: TheoryViewProps) {
  const t = useT();
  const text = t.theory;
  const scroller = useRef<HTMLDivElement>(null);
  const selector = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(FRONT_ID);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = element.getBoundingClientRect().top;
      let current = FRONT_ID;
      for (const node of element.querySelectorAll<HTMLElement>("[data-chapter]")) {
        if (node.getBoundingClientRect().top - top > 96) break;
        current = node.dataset.chapter ?? current;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      element.removeEventListener("scroll", onScroll);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [document]);

  const jump = (id: string) => {
    const container = scroller.current;
    const target = container?.querySelector(`#${CSS.escape(anchor(id))}`);
    if (!container || !target) return;
    // On narrow screens the chapter selector sticks to the top of the scrolling area.
    const sticky = selector.current && selector.current.offsetParent !== null ? selector.current.offsetHeight : 0;
    scrollWithin(container, target, "start", 12 + sticky);
  };

  const entry = (id: string, number: string | null, title: string) => {
    const current = active === id;
    return (
      <button
        type="button"
        onClick={() => jump(id)}
        aria-current={current ? "location" : undefined}
        className={cn(
          "flex w-full items-baseline gap-2.5 rounded-sm px-2 py-1.5 text-left text-[13px] leading-snug transition-colors duration-100",
          // The current entry carries an accent bar at its leading edge: fill and text colour alone differ
          // from the other entries by less than 3:1, and the abstract has no opened section list either.
          current ? "bg-active text-ink shadow-[inset_2px_0_0_var(--color-accent)]" : "text-ink-3 hover:bg-hover hover:text-ink",
        )}
      >
        <span className={cn("num w-5 shrink-0 text-right text-[11.5px]", current ? "text-accent" : "text-ink-4")}>{number ?? ""}</span>
        <span className="min-w-0 flex-1">{title}</span>
      </button>
    );
  };

  return (
    <div className="flex h-full min-h-0">
      <nav aria-label={text.contents} className="relative hidden w-64 shrink-0 overflow-y-auto border-r border-line px-2.5 py-4 lg:block">
        <p className="label-caps px-2">{text.contents}</p>
        <ol className="mt-2 space-y-px">
          <li>{entry(FRONT_ID, null, text.frontMatter)}</li>
          {document.map((chapter) => (
            <li key={chapter.id}>
              {entry(chapter.id, chapter.number, chapter.title)}
              {active === chapter.id ? (
                <ol className="mb-1.5 ml-[38px] mt-0.5 space-y-px border-l border-line">
                  {chapter.sections.map((section) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        onClick={() => jump(section.id)}
                        className="block w-full rounded-r-sm px-2.5 py-1 text-left text-[12px] leading-snug text-ink-3 transition-colors duration-100 hover:bg-hover hover:text-ink"
                      >
                        {section.title}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : null}
            </li>
          ))}
        </ol>
      </nav>

      {/*
        Below lg the chapter selector sticks to the top of this scroller: 49 px (8 + 32 + 8 px and a
        1 px border). The scroll padding keeps an element that receives the keyboard focus, and its
        focus ring, clear of that bar (WCAG 2.4.11).
      */}
      <div ref={scroller} className="relative min-w-0 flex-1 scroll-pt-14 overflow-y-auto lg:scroll-pt-0">
        <div ref={selector} className="sticky top-0 z-10 border-b border-line bg-panel px-5 py-2 lg:hidden">
          <select
            aria-label={text.chapterSelect}
            value={active}
            onChange={(event) => jump(event.target.value)}
            // The outline is the only boundary of the control: at least 3:1 against the bar (WCAG 1.4.11).
            className="h-8 w-full rounded-sm border border-edge bg-raised px-2 text-[13px] text-ink"
          >
            <option value={FRONT_ID}>{text.frontMatter}</option>
            {document.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.number}. {chapter.title}
              </option>
            ))}
          </select>
        </div>
        <Article document={document} front={front} cite={cite} notes={text.notes} footer={text.report} />
      </div>
    </div>
  );
}
