import Link from "next/link";
import type { EntityType } from "@/lib/api/types";
import { EntityIcon } from "./badges";

export interface EntityListItem {
  id: string;
  title: string;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode;
}

/** Compact list of linked records, each linking to its detail page. */
export function EntityList({ type, items, empty }: { type: EntityType; items: EntityListItem[]; empty: string }) {
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty}</p>;
  return (
    <ul className="-mx-2 flex flex-col">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/${type}/${encodeURIComponent(item.id)}`}
            className="flex items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-muted"
          >
            <EntityIcon type={type} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{item.title}</span>
              {item.subtitle && <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>}
            </span>
            {item.aside}
          </Link>
        </li>
      ))}
    </ul>
  );
}
