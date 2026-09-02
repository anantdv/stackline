/**
 * Shared dashboard panel header template (dashboard.md Density Contract):
 * mono kicker left, module jump link right (`OPEN X →` mono 11px).
 */
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export default function PanelHeader({
  kicker,
  jumpTo,
  jumpLabel,
  right,
}: {
  kicker: string;
  jumpTo?: string;
  jumpLabel?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
        <span className="text-brand">{"//"}</span> {kicker}
      </span>
      <span className="flex items-center gap-3">
        {right}
        {jumpTo && (
          <Link
            to={jumpTo}
            className="group/jump flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink2 transition-colors duration-200 hover:text-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            {jumpLabel ?? "OPEN"} 
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/jump:translate-x-1" />
          </Link>
        )}
      </span>
    </div>
  );
}
