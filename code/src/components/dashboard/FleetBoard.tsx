/**
 * Dashboard §5c — Fleet Status Board: compact 8-vehicle rows with status
 * chips, origin→destination progress bars and ETAs. OVERDUE rows pulse a
 * crit left bar.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashVehicle } from "./demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATUS_STYLE: Record<DashVehicle["status"], string> = {
  ENROUTE: "border-data/40 bg-data-soft text-data",
  "AT GATE": "border-brand/40 bg-brand-soft text-brand",
  OVERDUE: "border-crit/40 bg-crit/10 text-crit",
  IDLE: "border-line bg-raised text-ink2",
};

export default function FleetBoard({ vehicles }: { vehicles: DashVehicle[] }) {
  return (
    <div className="flex flex-col">
      {vehicles.map((v, i) => (
        <motion.div
          key={v.code}
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-5% 0px" }}
          transition={{ duration: 0.4, delay: i * 0.04, ease: EASE }}
          className={cn(
            "relative flex h-8 items-center gap-2 border-b border-line/50 pl-3 pr-1 font-mono text-[11px] last:border-b-0",
            v.status === "OVERDUE" && "bg-crit/5"
          )}
        >
          {v.status === "OVERDUE" && (
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-[3px] bg-crit motion-safe:animate-[pulse-dot_2s_ease-in-out_infinite]"
            />
          )}
          <span className="w-14 shrink-0 font-semibold text-ink0">{v.code}</span>
          <span
            className={cn(
              "shrink-0 rounded border px-1 py-px text-[8px] font-semibold tracking-[0.1em]",
              STATUS_STYLE[v.status]
            )}
          >
            {v.status}
          </span>
          <span className="w-20 shrink-0 truncate text-[10px] tracking-[0.08em] text-ink2">
            {v.route}
          </span>
          <span className="relative h-1 min-w-8 flex-1 overflow-hidden rounded-full bg-raised">
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ background: v.status === "OVERDUE" ? "var(--crit)" : "var(--data)" }}
              initial={{ width: 0 }}
              whileInView={{ width: `${v.progress}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.04, ease: EASE }}
            />
          </span>
          <span className="w-16 shrink-0 text-right text-[9px] tracking-[0.06em] text-ink2 font-tnum">
            {v.eta}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
