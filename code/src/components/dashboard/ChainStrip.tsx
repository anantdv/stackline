/**
 * Dashboard §5f — Module Chain Strip: SCAN → LOAD → DISPATCH → GATE → FLEET.
 * Each node chip is colored by that module's current worst status; the
 * connector fills teal where the chain is flowing and breaks dashed-crit at
 * the worst module. A carton glyph travels the connector on a 4s loop.
 */
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { healthVar, type ChainNode } from "./demo";

export default function ChainStrip({ chain }: { chain: ChainNode[] }) {
  const clear = chain.filter((c) => c.status !== "crit").length;
  return (
    <div className="flex h-full flex-col justify-between gap-4">
      <div className="relative py-2">
        {/* connector track */}
        <div className="absolute left-6 right-6 top-1/2 flex -translate-y-1/2" aria-hidden>
          {chain.slice(0, -1).map((c, i) => {
            const next = chain[i + 1];
            const broken = c.status === "crit" || next.status === "crit";
            return (
              <span
                key={c.key}
                className="h-px flex-1"
                style={{
                  background: broken
                    ? "repeating-linear-gradient(90deg, var(--crit) 0 5px, transparent 5px 10px)"
                    : "var(--data)",
                  opacity: broken ? 0.9 : 0.5,
                }}
              />
            );
          })}
        </div>
        {/* travelling carton glyph */}
        <motion.span
          aria-hidden
          className="absolute top-1/2 -translate-y-1/2 text-data"
          animate={{ left: ["6%", "92%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear", times: [0, 0.08, 0.92, 1] }}
        >
          <Package className="h-3 w-3" />
        </motion.span>

        <div className="relative flex items-center justify-between">
          {chain.map((c, i) => (
            <motion.div
              key={c.key}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
            >
              <Link
                to={c.href}
                title={`Open ${c.label}`}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border bg-surface px-2 py-1.5 font-mono text-[10px] font-semibold tracking-[0.12em] transition-transform duration-200 hover:-translate-y-0.5",
                  c.status === "crit"
                    ? "border-crit/60 text-crit"
                    : c.status === "warn"
                      ? "border-warn/50 text-warn"
                      : "border-data/40 text-data"
                )}
              >
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", c.status === "crit" && "motion-safe:animate-[pulse-dot_2s_ease-in-out_infinite]")}
                  style={{ background: healthVar(c.status) }}
                />
                {c.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="font-mono text-[10px] tracking-[0.14em] text-ink2">
        CHAIN HEALTH <span className="text-ink0 font-tnum">{clear}/{chain.length}</span> CLEAR
        {chain.some((c) => c.status === "crit") && (
          <span className="ml-2 text-crit">
            ▲ BREAK AT {chain.find((c) => c.status === "crit")?.label}
          </span>
        )}
      </div>
    </div>
  );
}
