"use client";

/**
 * Inline script that runs during HTML parsing on hard loads. On the client it
 * renders as text/plain so React doesn't warn about (or re-run) the script.
 * Pattern from Next.js docs: guides/preventing-flash-before-hydration.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
