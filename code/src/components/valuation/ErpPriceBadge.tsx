import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * ErpPriceBadge (design-delta §4.5) — mono chip pinned on any value-bearing
 * panel: `₹ PRICE SOURCE: ERPNEXT ● LIVE` (teal pulse) or `● DEMO` (amber).
 * Click cycles LIVE → DEMO with a 300ms shimmer. Tooltip explains provenance.
 */
export default function ErpPriceBadge({
  live = false,
  onToggle,
  className,
  size = "md",
}: {
  /** true when values come from a live ERPNext Item Price fetch. */
  live?: boolean;
  onToggle?: (live: boolean) => void;
  className?: string;
  size?: "md" | "sm";
}) {
  const [shimmer, setShimmer] = useState(false);
  const [tip, setTip] = useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setTip(true)}
      onMouseLeave={() => setTip(false)}
    >
      <button
        type="button"
        onClick={() => {
          setShimmer(true);
          window.setTimeout(() => setShimmer(false), 300);
          onToggle?.(!live);
        }}
        aria-pressed={live}
        title="Toggle price source"
        className={cn(
          "relative inline-flex items-center gap-1.5 overflow-hidden rounded border font-mono uppercase transition-colors",
          size === "md"
            ? "px-2.5 py-1 text-[10px] tracking-[0.14em]"
            : "px-1.5 py-0.5 text-[9px] tracking-[0.1em]",
          live
            ? "border-data/40 bg-data-soft text-data"
            : "border-warn/40 bg-warn/10 text-warn"
        )}
      >
        {shimmer && (
          <motion.span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.3 }}
          />
        )}
        <span className="font-semibold">₹</span> PRICE SOURCE: ERPNEXT
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute h-full w-full animate-ping rounded-full opacity-60",
              live ? "bg-data" : "bg-warn"
            )}
          />
          <span
            className={cn(
              "relative h-1.5 w-1.5 rounded-full",
              live ? "bg-data" : "bg-warn"
            )}
          />
        </span>
        {live ? "LIVE" : "DEMO"}
      </button>
      {tip && (
        <span className="pointer-events-none absolute right-0 top-full z-40 mt-2 w-64 rounded-lg border border-line bg-raised p-3 font-mono text-[10px] normal-case leading-relaxed tracking-normal text-ink1 shadow-lg">
          Item prices &amp; valuation rates fetched live from ERPNext Item
          Price / Stock Ledger. DEMO falls back to baked seed rates.
        </span>
      )}
    </span>
  );
}
