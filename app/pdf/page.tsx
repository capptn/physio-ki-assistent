"use client";

import { Suspense } from "react";
import PdfContent from "./pdfContent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PdfContent />
    </Suspense>
  );
}
