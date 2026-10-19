"use client";

import { Printer } from "lucide-react";
import { btnSecondary } from "./ui";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={btnSecondary}>
      <Printer className="size-4" /> {label}
    </button>
  );
}
