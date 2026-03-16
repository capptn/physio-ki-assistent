import { Suspense } from "react";
import SuccessClient from "./success-client";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <SuccessClient />
    </Suspense>
  );
}
