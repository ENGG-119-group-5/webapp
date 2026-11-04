import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A titled card used for each block on the detail pages. */
export function Section({
  title,
  action,
  count,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card size="sm" className={cn("gap-3", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-muted px-1.5 text-xs font-normal text-muted-foreground tabular-nums">
              {count}
            </span>
          )}
        </CardTitle>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
