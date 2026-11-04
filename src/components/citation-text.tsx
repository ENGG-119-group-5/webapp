import Link from "next/link";
import type { Citation } from "@/lib/api/types";
import { entityHref } from "@/lib/routes";

/** Splits text into plain strings and citation markers like "[2]". */
export function splitCitations(text: string): (string | number)[] {
  const parts: (string | number)[] = [];
  const re = /\[(\d+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(Number(m[1]));
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * Renders answer text with "[n]" markers turned into links to the cited
 * record. Markers with no matching citation are shown as-is (never invented).
 */
export function CitationText({ text, citations }: { text: string; citations: Citation[] }) {
  const byN = new Map(citations.map((c) => [c.n, c]));
  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {splitCitations(text).map((part, i) => {
        if (typeof part === "string") return part;
        const c = byN.get(part);
        if (!c) return `[${part}]`;
        return (
          <Link
            key={i}
            href={entityHref(c)}
            title={c.label}
            className="mx-0.5 inline-flex h-4 min-w-4 -translate-y-0.5 items-center justify-center rounded bg-primary/12 px-1 align-middle font-mono text-[10px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground"
          >
            {part}
          </Link>
        );
      })}
    </p>
  );
}
