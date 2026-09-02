/**
 * Dashboard §5d — Gate Lane Summary: 2×2 dock chips; the active lane edge
 * runs a marching-ants dash loop; the scheduled chip counts down to its slot
 * live. §5e — Load Plan Utilization Rings with the inverted "high is good"
 * scale. Both exported from this file (gate + transport panels).
 */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ringVar, type DashPlan, type DockChip } from "./demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/* Gate lanes                                                          */
/* ------------------------------------------------------------------ */

const DOCK_TONE: Record<DockChip["state"], string> = {
  LOADING: "border-brand/60 text-brand",
  IDLE: "border-line text-ink2",
  "GATE IN": "border-data/50 text-data",
  SCHEDULED: "border-line text-ink1",
};

/** Live countdown to a 14:30 IST slot. */
function useSlotCountdown(): string {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const slot = new Date(ist);
      slot.setHours(14, 30, 0, 0);
      let diff = slot.getTime() - ist.getTime();
      if (diff < 0) diff += 86_400_000;
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(`T-${h}H ${String(m).padStart(2, "0")}M`);
    };
    tick();
    const t = window.setInterval(tick, 30_000);
    return () => window.clearInterval(t);
  }, []);
  return label;
}

export function GateLanes({ docks }: { docks: DockChip[] }) {
  const countdown = useSlotCountdown();
  return (
    <div className="grid grid-cols-2 gap-3">
      {docks.map((d, i) => {
        const active = d.state === "LOADING";
        return (
          <motion.div
            key={d.dock}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-5% 0px" }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}
            className={cn(
              "relative overflow-hidden rounded-lg border bg-raised/40 p-3",
              DOCK_TONE[d.state],
              d.state === "SCHEDULED" && "border-dashed"
            )}
          >
            {active && (
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-0.5"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, var(--accent) 0 8px, transparent 8px 16px)",
                }}
                animate={{ backgroundPosition: ["0px 0px", "16px 0px"] }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            )}
            <div className="font-mono text-[9px] tracking-[0.16em] text-ink2">{d.dock}</div>
            <div className="mt-1.5 font-mono text-[11px] font-semibold tracking-[0.08em]">
              {d.state}
            </div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-ink1">
              {d.detail}
              {d.state === "SCHEDULED" && countdown && (
                <span className="ml-1 text-data font-tnum">{countdown}</span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Load-plan rings                                                     */
/* ------------------------------------------------------------------ */

function Ring({ plan, index }: { plan: DashPlan; index: number }) {
  const reduced = useReducedMotion();
  const R = 44;
  const C = 2 * Math.PI * R;
  const [sweep, setSweep] = useState(0);

  useEffect(() => {
    if (reduced) {
      setSweep(plan.utilPct);
      return;
    }
    let raf = 0;
    const start = performance.now() + index * 150;
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - start) / 1200));
      setSweep(plan.utilPct * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [plan.utilPct, index, reduced]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg viewBox="0 0 108 108" className="h-[108px] w-[108px] -rotate-90">
          <circle cx="54" cy="54" r={R} fill="none" className="stroke-raised" strokeWidth={10} />
          <circle
            cx="54" cy="54" r={R} fill="none"
            stroke={ringVar(plan.utilPct)}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${(sweep / 100) * C} ${C}`}
            style={{ transition: "stroke-dasharray 0.6s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-semibold text-ink0 font-tnum">
          {sweep.toFixed(1)}%
        </span>
      </div>
      <div className="text-center">
        <div className="font-mono text-[11px] font-semibold tracking-[0.1em] text-ink0">
          {plan.planNo} · {plan.vehicle}
        </div>
        <div className="font-mono text-[9px] tracking-[0.12em] text-ink2">
          VOL {plan.volValue}
        </div>
      </div>
    </div>
  );
}

export function LoadPlanRings({ plans }: { plans: DashPlan[] }) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-center gap-5 sm:justify-between">
        {plans.map((p, i) => (
          <Ring key={p.planNo} plan={p} index={i} />
        ))}
      </div>
      <p className="mt-4 border-t border-line pt-3 font-mono text-[9px] leading-relaxed tracking-[0.1em] text-ink2">
        RING SCALE IS INVERTED HERE ON PURPOSE: ≥85% TEAL = OPTIMAL · 60–85%
        AMBER = UNDER-PACKED · &lt;60% CRIT = WASTING A TRUCK
      </p>
    </div>
  );
}
