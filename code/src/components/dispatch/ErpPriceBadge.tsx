import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * ErpPriceBadge (design-delta §4.5): mono chip pinned top-right of any
 * value-bearing panel. Cycles LIVE → DEMO on click; shimmer is the
 * parent's concern (300ms re-render pulse).
 */
export default function ErpPriceBadge({ className }: { className?: string }) {
  const [live, setLive] = useState(false); // demo default: baked data
  return (
    <button
      type="button"
      onClick={() => setLive((v) => !v)}
      title="Item prices & valuation rates fetched live from ERPNext Item Price / Stock Ledger."
      className={cn(
        "group/badge relative inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1",
        "font-mono text-[9px] uppercase tracking-[0.14em] transition-colors hover:border-linestrong",
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full animate-pulse-dot", live ? "bg-data" : "bg-warn")}
        aria-hidden
      />
      <span className="text-ink2">
        ₹ PRICE SOURCE: ERPNEXT{" "}
        <span className={live ? "text-data" : "text-warn"}>{live ? "● LIVE" : "● DEMO"}</span>
      </span>
    </button>
  );
}
