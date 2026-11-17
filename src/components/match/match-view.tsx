"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { api } from "@/lib/api/client";
import type { MatchResponse } from "@/lib/api/types";
import { useApi } from "@/lib/use-api";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/states";
import { MatchResults } from "./match-results";
import { ThesisDropzone } from "./thesis-dropzone";

type State =
  | { step: "idle" }
  | { step: "matching"; name: string }
  | { step: "done"; result: MatchResponse }
  | { step: "error"; error: Error };

// Kept outside React so the results are still there after opening a technology and coming back.
let lastResult: MatchResponse | null = null;

/** Home page: upload a thesis PDF (or pick a sample) and see the ranked matches. */
export function MatchView() {
  const [state, setState] = useState<State>(() => (lastResult ? { step: "done", result: lastResult } : { step: "idle" }));
  const samples = useApi("samples", (signal) => api.listSamples(signal));

  async function run(name: string, getFile: () => Promise<Blob>) {
    setState({ step: "matching", name });
    try {
      const result = await api.match(await getFile(), name);
      lastResult = result;
      setState({ step: "done", result });
    } catch (error) {
      setState({ step: "error", error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  const busy = state.step === "matching";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Match your investment thesis to university inventions</h1>
        <p className="text-sm text-muted-foreground">
          Upload your thesis as a PDF. Claude reads it against every Dartmouth tech-transfer listing and its linked USPTO
          patents, labels each one strong, potential or no relevance, and quotes the record behind every score.
        </p>
      </div>

      <ThesisDropzone disabled={busy} onFile={(file) => run(file.name, async () => file)} />

      {!!samples.data?.length && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">No thesis handy? Try a sample:</span>
          {samples.data.map((s) => (
            <Button key={s.name} variant="outline" size="sm" disabled={busy} onClick={() => run(s.name, () => api.getSample(s.name))}>
              {s.title.replace(/^Sample: /, "")}
            </Button>
          ))}
        </div>
      )}

      {state.step === "matching" && (
        <div className="flex items-center gap-3 rounded-xl border p-4 text-sm" aria-live="polite">
          <Loader2Icon className="size-4 animate-spin text-primary" aria-hidden />
          <span>
            Reading <b>{state.name}</b> and scoring every invention. A new thesis takes one to three minutes.
          </span>
        </div>
      )}
      {state.step === "error" && <ErrorState error={state.error} onRetry={() => setState({ step: "idle" })} />}
      {state.step === "done" && <MatchResults result={state.result} />}
    </div>
  );
}
