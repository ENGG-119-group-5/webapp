import { Suspense } from "react";
import { PatentView } from "@/components/detail/patent-view";
import { LoadingDetail } from "@/components/states";

export default function PatentPage() {
  return (
    <Suspense fallback={<LoadingDetail />}>
      <PatentView />
    </Suspense>
  );
}
