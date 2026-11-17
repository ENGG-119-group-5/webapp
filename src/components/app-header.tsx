"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { FlaskConicalIcon } from "lucide-react";
import { isUsingMock } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { AnalystInput } from "./analyst-input";
import { ThemeToggle } from "./theme-toggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Chat, Review, Patent and Inventor pages still exist but are out of the MVP, so not in the nav.
const NAV = [
  { href: "/", label: "Match", match: (p: string) => p === "/" || p.startsWith("/technology/") },
  { href: "/search", label: "Search", match: (p: string) => p.startsWith("/search") },
];

function ActiveNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {NAV.map((item) => {
        const active = pathname !== null && item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2 py-1 text-muted-foreground sm:px-2.5 transition-colors hover:bg-muted hover:text-foreground",
              active && "bg-muted font-medium text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * The bar at the top of every page: the app name, the Match and Search links, the
 * light/dark switch, and a "Sample data" badge when the app is not connected to the
 * real backend (so nobody mistakes placeholder data for real results).
 */
export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-4 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground">
            DD
          </span>
          <span className="hidden sm:inline">Due Diligence Scout</span>
        </Link>
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks />
        </Suspense>
        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          {isUsingMock() && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <span
                    className="hidden items-center gap-1 rounded-full border border-warning/50 bg-warning/10 px-2 py-0.5 text-xs font-medium text-foreground md:inline-flex"
                    data-testid="sample-data-badge"
                  />
                }
              >
                <FlaskConicalIcon className="size-3" aria-hidden /> Sample data
              </TooltipTrigger>
              <TooltipContent>
                Using the built-in mock API. Set NEXT_PUBLIC_API_BASE_URL to connect the real backend.
              </TooltipContent>
            </Tooltip>
          )}
          <AnalystInput />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
