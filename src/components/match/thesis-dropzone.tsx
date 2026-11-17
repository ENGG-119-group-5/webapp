"use client";

import { useRef, useState } from "react";
import { FileUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Drop a PDF here or click to choose one. Calls onFile with the chosen PDF. */
export function ThesisDropzone({ onFile, disabled }: { onFile: (file: File) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    onFile(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) pick(e.dataTransfer.files);
        }}
        className={cn(
          "flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          "hover:border-primary/60 hover:bg-primary/5 disabled:pointer-events-none disabled:opacity-50",
          dragging && "border-primary bg-primary/10",
        )}
        data-testid="thesis-dropzone"
      >
        <FileUpIcon className="size-7 text-primary" aria-hidden />
        <span className="font-medium">Drop your investment thesis PDF here</span>
        <span className="text-sm text-muted-foreground">or click to choose a file (PDF, up to 10 MB)</span>
      </button>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        aria-label="Thesis PDF"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
