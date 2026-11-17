import { Suspense } from "react";
import { TechnologyView } from "@/components/detail/technology-view";
import { LoadingDetail } from "@/components/states";

/**
 * Detail page for one invention (for example /technology/2021-023), opened by clicking
 * a match or a search result. See components/detail/technology-view.tsx.
 */
export default function TechnologyPage() {
  return (
    <Suspense fallback={<LoadingDetail />}>
      <TechnologyView />
    </Suspense>
  );
}
