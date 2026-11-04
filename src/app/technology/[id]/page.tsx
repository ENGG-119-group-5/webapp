import { Suspense } from "react";
import { TechnologyView } from "@/components/detail/technology-view";
import { LoadingDetail } from "@/components/states";

export default function TechnologyPage() {
  return (
    <Suspense fallback={<LoadingDetail />}>
      <TechnologyView />
    </Suspense>
  );
}
