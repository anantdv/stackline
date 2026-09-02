import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PortalBrand = {
  code: string;
  name: string;
  color: string;
  url: string;
};

const TABS = ["INVENTORY", "ORDERS", "ASN", "SLA", "INVOICES"] as const;

/**
 * Browser-chrome card hosting the live React portal mock (portal3pl.md §2):
 * chrome dots + mono URL bar + portal topbar (logo chip, nav tabs, avatar).
 * `brandVars` lets the branding engine re-skin the mock via CSS custom
 * properties (`--pa` = portal accent) — the same token mechanism as theme.md.
 */
export default function PortalChrome({
  brand,
  brandVars,
  watermark = true,
  compact = false,
  className,
  children,
}: {
  brand: PortalBrand;
  brandVars?: CSSProperties;
  watermark?: boolean;
  compact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={brandVars}
      className={cn(
        "relative overflow-hidden rounded-xl border border-line bg-surface shadow-[var(--card-shadow)]",
        className
      )}
    >
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-raised px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-crit/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-data/70" />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" aria-hidden />
          <span className="truncate font-mono text-[10px] tracking-[0.12em] text-ink2">
            {brand.url}
          </span>
        </div>
      </div>

      {/* portal topbar */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-display text-[11px] font-bold text-white"
          style={{ background: "var(--pa, " + brand.color + ")" }}
          aria-hidden
        >
          {brand.code.slice(0, 1)}
        </span>
        <span className="font-display text-sm font-semibold tracking-tight text-ink0">
          {brand.name}
        </span>
        <nav className="ml-auto hidden items-center gap-3 sm:flex" aria-label="Portal sections">
          {TABS.map((t, i) => (
            <span
              key={t}
              className={cn(
                "group relative cursor-default pb-0.5 font-mono text-[9px] tracking-[0.16em] transition-colors duration-200",
                i === 0 ? "text-ink0" : "text-ink2 hover:text-ink1"
              )}
            >
              {t}
              <span
                className="absolute -bottom-0.5 left-0 h-px w-0 transition-all duration-300 group-hover:w-full"
                style={{ background: "var(--pa, " + brand.color + ")" }}
                aria-hidden
              />
            </span>
          ))}
        </nav>
        <span
          className="ml-auto flex h-6 w-6 items-center justify-center rounded-full border border-linestrong font-mono text-[9px] text-ink1 sm:ml-0"
          aria-hidden
        >
          {brand.code.slice(0, 2)}
        </span>
      </div>

      {/* tenant watermark ribbon */}
      {watermark && (
        <div
          className="pointer-events-none absolute right-0 top-[104px] z-10 origin-right rotate-90"
          aria-hidden
        >
          <span className="font-mono text-[8px] uppercase tracking-[0.22em] text-ink2/70">
            TENANT: {brand.code} · ISOLATED VIEW
          </span>
        </div>
      )}

      <div className={cn(compact ? "p-3" : "p-4 md:p-6")}>{children}</div>

      {watermark && (
        <div className="border-t border-line px-4 py-2 text-center">
          <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-ink2/60">
            Powered by Stackline
          </span>
        </div>
      )}
    </div>
  );
}
