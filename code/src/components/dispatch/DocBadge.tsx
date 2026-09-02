import { motion } from "framer-motion";
import type { DocStatus } from "@contracts/types";
import { cn } from "@/lib/utils";
import type { DemoDoc } from "./data";

const DOT: Record<DocStatus, string> = {
  valid: "bg-data",
  expiring: "bg-warn",
  expired: "bg-crit",
  draft: "bg-ink2",
};

const TEXT: Record<DocStatus, string> = {
  valid: "text-data",
  expiring: "text-warn",
  expired: "text-crit",
  draft: "text-ink2",
};

export function statusLabel(doc: Pick<DemoDoc, "status" | "validMinutesLeft">): string {
  if (doc.status === "draft") return "DRAFT";
  if (doc.status === "expired") return "✕ EXPIRED";
  if (doc.validMinutesLeft != null) {
    const h = Math.floor(doc.validMinutesLeft / 60);
    const m = doc.validMinutesLeft % 60;
    if (doc.status === "expiring") return `⏳ ${h}H ${String(m).padStart(2, "0")}M LEFT`;
    return `✓ VALID ${h}H${m > 0 ? ` ${String(m).padStart(2, "0")}M` : ""}`;
  }
  return "✓ VALID";
}

/**
 * Compliance document chip (design-delta §4.6): mono doc code + status dot.
 * Click opens the DocPreviewDrawer. 1px `--line` border in both themes.
 */
export default function DocBadge({
  doc,
  onOpen,
  layout = false,
  className,
}: {
  doc: DemoDoc;
  onOpen?: (doc: DemoDoc) => void;
  layout?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      layout={layout ? "position" : false}
      onClick={() => onOpen?.(doc)}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-md border border-line bg-raised px-2.5 py-1.5",
        "font-mono text-[10px] uppercase tracking-[0.12em] transition-colors duration-200 hover:border-linestrong",
        className
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT[doc.status], doc.status === "expiring" && "animate-pulse-dot")}
        aria-hidden
      />
      <span className="text-ink1">
        {doc.docType === "BOL" ? "B/L" : doc.docType}
        {doc.docNo ? <span className="text-ink0"> {doc.docNo}</span> : null}
      </span>
      <span className={cn("font-tnum", TEXT[doc.status])}>{statusLabel(doc)}</span>
    </motion.button>
  );
}
