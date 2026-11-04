import type { EntityRef, EntityType } from "@/lib/api/types";

export function entityHref(ref: Pick<EntityRef, "type" | "id">): string {
  return `/${ref.type}/${encodeURIComponent(ref.id)}`;
}

export const ENTITY_LABEL: Record<EntityType, string> = {
  technology: "Technology",
  patent: "Patent",
  inventor: "Inventor",
};
