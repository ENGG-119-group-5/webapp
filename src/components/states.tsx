import { AlertTriangleIcon, InboxIcon, RotateCwIcon } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const notFound = error instanceof ApiError && error.isNotFound;
  const offline = error instanceof ApiError && error.status === 0;
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <AlertTriangleIcon className="size-4 text-destructive" aria-hidden />
        {notFound ? "Not found" : offline ? "Can't reach the API" : "Something went wrong"}
      </div>
      <p className="text-muted-foreground">
        {offline
          ? "The backend server did not respond. Check that it is running and that NEXT_PUBLIC_API_BASE_URL is correct."
          : error.message}
      </p>
      {onRetry && !notFound && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCwIcon /> Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed p-6 text-center text-sm">
      <InboxIcon className="mb-1 size-5 text-muted-foreground" aria-hidden />
      <p className="font-medium">{title}</p>
      {children && <div className="text-muted-foreground">{children}</div>}
    </div>
  );
}

export function LoadingRows({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function LoadingDetail() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
