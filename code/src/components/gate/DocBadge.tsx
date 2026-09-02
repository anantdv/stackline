import { Link } from "react-router";
import { cn } from "@/lib/utils";

export type DocTone = "valid" | "expiring" | "expired" | "draft";

const TONE: Record<DocTone, { dot: string; text: string; border: string }> = {
  valid: { dot: "bg-data", text: "text-data", border: "border-data/40" },
  expiring: { dot: "bg-warn", text: "text-warn", border: "border-warn/40" },
  expired: { dot: "bg-crit", text: "text-crit", border: "border-crit/50" },
  draft: { dot: "bg-ink2", text: "text-ink2", border: "border-line" },
};

const GLYPH: Record<DocTone, string> = {
  valid: "✓",
  expiring: "⏳",
  expired: "✕",
  draft: "·",
};

/**
 * Compliance document chip (design-delta §4.6): mono doc code + status dot.
 * `EWB ✓ VALID 22H` / `⏳ 2H LEFT` / `✕ EXPIRED` / `DRAFT`.
 */
export default function DocBadge({
  code,
  tone,
  detail,
  to,
  pulse = false,
  className,
}: {
  /** e.g. "EWB", "INV", "GATE PASS", "B/L", "AWB", "LR" */
  code: string;
  tone: DocTone;
  /** e.g. "VALID 22H", "2H LEFT", "EXPIRED — HOLD" */
  detail?: string;
  to?: string;
  pulse?: boolean;
  className?: string;
}) {
  const t = TONE[tone];
  const inner = (
    <>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          t.dot,
          (pulse || tone === "valid") && "animate-pulse-dot"
        )}
      />
      <span className="text-ink1">{code}</span>
      <span className={t.text}>
        {GLYPH[tone]} {detail ?? tone.toUpperCase()}
      </span>
    </>
  );
  const cls = cn(
    "inline-flex items-center gap-1.5 rounded-md border bg-page/60 px-2 py-1",
    "font-mono text-[10px] uppercase tracking-[0.12em] whitespace-nowrap",
    t.border,
    pulse && "animate-pulse",
    to && "transition-colors duration-200 hover:border-brand",
    className
  );
  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return <span className={cls}>{inner}</span>;
}
