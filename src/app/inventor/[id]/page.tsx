import { Suspense } from "react";
import { InventorView } from "@/components/detail/inventor-view";
import { LoadingDetail } from "@/components/states";

export default function InventorPage() {
  return (
    <Suspense fallback={<LoadingDetail />}>
      <InventorView />
    </Suspense>
  );
}
