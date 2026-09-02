import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mono chip pinned top-right of any value-bearing panel (design-delta §4.5).
 * `₹ PRICE SOURCE: ERPNEXT ● LIVE` (teal pulse) or `● DEMO` (amber).
 * Click cycles LIVE → DEMO → LIVE with a shimmer on the chip.
 */
export default function ErpPriceBadge({
  source = "demo",
  className,
}: {
  source?: "live" | "demo";
  className?: string;
}) {
  const [live, setLive] = useState(source === "live");
  const [shimmer, setShimmer] = useState(false);

  const toggle = () => {
    setLive((v) => !v);
    setShimmer(true);
    window.setTimeout(() => setShimmer(false), 300);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title="Item prices & valuation rates fetched live from ERPNext Item Price / Stock Ledger."
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-line bg-raised px-2 py-1",
        "font-mono text-[9px] uppercase tracking-[0.14em] text-ink2 transition-colors duration-300",
        "hover:border-linestrong hover:text-ink1",
        shimmer && "opacity-60",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          live ? "bg-data animate-pulse-dot" : "bg-warn"
        )}
      />
      ₹ Price source: ERPNext <span className={live ? "text-data" : "text-warn"}>{live ? "Live" : "Demo"}</span>
    </button>
  );
}
