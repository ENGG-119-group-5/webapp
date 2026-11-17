import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/search/search-view";
import { LoadingRows } from "@/components/states";

export const metadata: Metadata = { title: "Search" };

/** Search page: type keywords to find inventions, patents or inventors. See components/search/search-view.tsx. */
export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingRows />}>
      <SearchView />
    </Suspense>
  );
}
