/**
 * Dashboard §5a — Per-warehouse capacity heat grid: 4 warehouses × 6 zones.
 * Cell fill = zone utilization on the capacity scale; crit cells get an inner
 * crit stroke + slow pulse. Hover shows a mono tooltip.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { capVar, zoneCellFill, type DashLocation } from "./demo";
import { num } from "@/components/network/demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ZONE_LABELS = ["A", "B", "C", "D", "E", "F"];

export default function CapacityHeatGrid({
  locations,
  className,
}: {
  locations: DashLocation[];
  className?: string;
}) {
  const [tip, setTip] = useState<string | null>(null);
  const warehouses = locations.flatMap((l) => l.warehouses);

  return (
    <div className={cn("relative", className)} onMouseLeave={() => setTip(null)}>
      <div className="flex flex-col gap-3">
        {warehouses.map((w, ri) => (
          <div key={w.code} className="flex items-center gap-3">
            {/* warehouse label + thin overall util bar */}
            <div className="w-20 shrink-0">
              <div className="font-mono text-[10px] tracking-[0.1em] text-ink1">{w.code}</div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-raised">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: capVar(w.util) }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${w.util}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: ri * 0.08, ease: EASE }}
                  />
                </span>
                <span
                  className="font-mono text-[10px] font-tnum"
                  style={{ color: capVar(w.util) }}
                >
                  {w.util}%
                </span>
              </div>
            </div>
            {/* zone cells */}
            <div className="grid flex-1 grid-cols-6 gap-1.5">
              {w.zones.map((_, zi) => {
                const fill = zoneCellFill(w, zi);
                const crit = fill >= 90;
                return (
                  <motion.button
                    key={zi}
                    type="button"
                    aria-label={`${w.code} zone ${ZONE_LABELS[zi]} at ${fill}%`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: ri * 0.08 + zi * 0.02, ease: EASE }}
                    onMouseEnter={() =>
                      setTip(
                        `${w.code} ▸ ZONE-${ZONE_LABELS[zi]} · ${fill}% · ${num(Math.round((w.bins / 6) * (fill / 100)))}/${num(Math.round(w.bins / 6))} BINS`
                      )
                    }
                    className={cn(
                      "h-10 rounded border transition-transform duration-200 hover:scale-[1.04]",
                      crit && "motion-safe:animate-[pulse-dot_3s_ease-in-out_infinite]"
                    )}
                    style={{
                      background: `color-mix(in srgb, ${capVar(fill)} ${fill > 20 ? Math.round(18 + fill * 0.5) : 12}%, transparent)`,
                      borderColor: crit ? "var(--crit)" : "rgba(148,163,184,0.18)",
                      boxShadow: crit ? "inset 0 0 0 1px var(--crit)" : "inset 0 0 0 1px rgba(148,163,184,0.06)",
                    }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* zone header */}
      <div className="mt-3 flex items-center gap-3">
        <div className="w-20 shrink-0" />
        <div className="grid flex-1 grid-cols-6 gap-1.5">
          {ZONE_LABELS.map((z) => (
            <span key={z} className="text-center font-mono text-[9px] tracking-[0.14em] text-ink2">
              ZONE-{z}
            </span>
          ))}
        </div>
      </div>

      {tip && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-30 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-linestrong bg-raised px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-ink1 shadow-xl">
          {tip}
        </div>
      )}
    </div>
  );
}
