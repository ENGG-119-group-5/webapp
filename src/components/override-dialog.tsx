"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import type { IpScore, ScoreOverrideResponse } from "@/lib/api/types";
import { useAnalyst } from "@/lib/analyst";
import { formatScore } from "@/lib/format";
import { type OverrideErrors, validateOverride } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Pop-up form that lets an analyst replace a computed IP score with their own number,
 * with a required written reason. (Turned off in the MVP; see technology-view.tsx.)
 */
export function OverrideDialog({
  technologyId,
  technologyTitle,
  ipScore,
  onOverridden,
}: {
  technologyId: string;
  technologyTitle: string;
  ipScore: IpScore;
  onOverridden: (res: ScoreOverrideResponse) => void;
}) {
  const [analyst, setAnalyst] = useAnalyst();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<OverrideErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function openDialog() {
    setScore(formatScore(ipScore.effective));
    setReason("");
    setErrors({});
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found = validateOverride({ score, reason, analyst });
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      const res = await api.overrideScore(technologyId, {
        score: Number(score),
        reason: reason.trim(),
        analyst: analyst.trim(),
      });
      onOverridden(res);
      toast.success(`Score for ${technologyTitle} set to ${formatScore(res.ipScore.effective)}`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Override failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openDialog}>
        <PencilIcon /> Override
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <DialogHeader>
              <DialogTitle>Override IP-potential score</DialogTitle>
              <DialogDescription>
                {technologyTitle} is currently scored {formatScore(ipScore.effective)} (computed{" "}
                {formatScore(ipScore.computed)}). Your change and reason are recorded in the audit log.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-1.5">
              <Label htmlFor="override-score">New score (0–100)</Label>
              <Input
                id="override-score"
                inputMode="decimal"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                aria-invalid={!!errors.score}
              />
              {errors.score && <p className="text-xs text-destructive">{errors.score}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="override-reason">Reason</Label>
              <Textarea
                id="override-reason"
                rows={3}
                value={reason}
                placeholder="e.g. Spoke with the TTO: an exclusive licence is already under negotiation."
                onChange={(e) => setReason(e.target.value)}
                aria-invalid={!!errors.reason}
              />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason}</p>}
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="override-analyst">Analyst</Label>
              <Input
                id="override-analyst"
                value={analyst}
                onChange={(e) => setAnalyst(e.target.value)}
                placeholder="Your name"
                aria-invalid={!!errors.analyst}
              />
              {errors.analyst && <p className="text-xs text-destructive">{errors.analyst}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save override"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
