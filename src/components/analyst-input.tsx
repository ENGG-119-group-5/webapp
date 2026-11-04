"use client";

import { UserIcon } from "lucide-react";
import { useAnalyst } from "@/lib/analyst";

export function AnalystInput() {
  const [name, setName] = useAnalyst();
  return (
    <label className="flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs focus-within:ring-2 focus-within:ring-ring/50">
      <UserIcon className="hidden size-3.5 text-muted-foreground sm:block" aria-hidden />
      <span className="sr-only">Analyst name</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Analyst"
        className="w-16 min-w-0 bg-transparent sm:w-24 outline-none placeholder:text-muted-foreground"
        data-testid="analyst-name"
      />
    </label>
  );
}
