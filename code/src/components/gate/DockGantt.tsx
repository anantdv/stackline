import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MoveHorizontal, Truck } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import { DEMO_DOCKS, DEMO_SLOTS, type DemoDock, type DockSlot } from "@/components/gate/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const WAREHOUSE_ID = 1;
const WINDOW_MIN = 720; // 08:00 → 20:00

function minToClock(min: number): string {
  const h = 8 + Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const SLOT_CLS: Record<DockSlot["state"], string> = {
  booked: "border-data/60 bg-transparent",
  occupied: "border-data bg-data/15",
  overrun: "border-warn bg-warn/15 animate-pulse",
  free: "border-dashed border-line text-ink2",
};

export default function DockGantt() {
  const schedQ = trpc.gate.dockSchedule.useQuery(
    { warehouseId: WAREHOUSE_ID },
    { retry: 1, refetchOnWindowFocus: false }
  );

  const docks: DemoDock[] = useMemo(() => {
    const d = schedQ.data;
    if (schedQ.isError || !d || d.length === 0) return DEMO_DOCKS;
    return d.map((x) => ({
      id: x.id,
      code: x.code,
      type: (x.type as DemoDock["type"]) ?? "both",
    }));
  }, [schedQ.data, schedQ.isError]);

  const [selected, setSelected] = useState<DockSlot | null>(null);

  // NOW line: sweep in on mount, then sit at live time (clamped to window).
  const nowMin = () => {
    const d = new Date();
    return Math.min(WINDOW_MIN, Math.max(0, (d.getHours() - 8) * 60 + d.getMinutes()));
  };
  const [now, setNow] = useState(nowMin);
  useEffect(() => {
    const t = window.setInterval(() => setNow(nowMin()), 30000);
    return () => window.clearInterval(t);
  }, []);

  // Drag demo: one booked slot auto-glides ±60min on a loop.
  const [dragShift, setDragShift] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setDragShift((v) => (v === 0 ? 60 : 0)), 4000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>DOCK.SCHEDULE</SectionKicker>
        <h2 className="mt-6 max-w-[760px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Docks are a calendar, not a queue of honking.
        </h2>

        <motion.div
          data-tour="dock-schedule"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="group relative mt-12 rounded-xl border border-line bg-surface p-4 transition-colors duration-300 hover:border-linestrong md:p-6"
        >
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-[14px] w-[14px] border-l border-t border-brand" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[14px] w-[14px] border-b border-r border-brand" />

          {/* time header */}
          <div className="ml-14 flex justify-between border-b border-line pb-2 md:ml-16">
            {Array.from({ length: 13 }, (_, i) => (
              <span key={i} className="font-mono text-[9px] tracking-[0.08em] text-ink2">
                {String(8 + i).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          <div className="relative mt-2">
            {/* NOW line (transform-only sweep across the track area) */}
            <div aria-hidden className="pointer-events-none absolute bottom-0 left-14 right-0 top-0 z-10 md:left-16">
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                whileInView={{ scaleX: Math.max(0.005, now / WINDOW_MIN), opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: EASE }}
                className="absolute bottom-0 left-0 top-0 w-full origin-left"
              >
                <span className="absolute bottom-0 left-0 top-0 w-px bg-brand" />
                <span className="absolute -top-1 left-1 font-mono text-[8px] tracking-[0.12em] text-brand">
                  NOW
                </span>
              </motion.div>
            </div>

            {docks.map((dock, ri) => (
              <div key={dock.code} className="flex items-center gap-0 border-b border-line/60 py-1.5 last:border-0">
                <span className="w-14 shrink-0 font-mono text-[11px] font-semibold tracking-[0.1em] text-ink1 md:w-16">
                  {dock.code}
                </span>
                <div className="relative h-9 flex-1">
                  {DEMO_SLOTS.filter((s) => s.dock === dock.code).map((slot, si) => {
                    const isDragDemo = slot.id === "s6";
                    const width = (slot.end - slot.start) / WINDOW_MIN;
                    const shiftPct = isDragDemo
                      ? (dragShift / (slot.end - slot.start)) * 100
                      : 0;
                    return (
                      <motion.button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelected(selected?.id === slot.id ? null : slot)}
                        initial={{ opacity: 0, scaleX: 0.6 }}
                        whileInView={{ opacity: 1, scaleX: 1 }}
                        viewport={{ once: true }}
                        animate={{ x: `${shiftPct}%` }}
                        transition={{
                          opacity: { delay: ri * 0.06 + si * 0.04, duration: 0.4 },
                          scaleX: { delay: ri * 0.06 + si * 0.04, duration: 0.4 },
                          x: { duration: 1.2, ease: EASE },
                        }}
                        style={{ left: `${(slot.start / WINDOW_MIN) * 100}%`, width: `${width * 100}%` }}
                        className={cn(
                          "absolute top-1 flex h-7 origin-left items-center gap-1.5 overflow-hidden rounded-md border px-2",
                          "font-mono text-[9px] uppercase tracking-[0.08em] transition-shadow duration-200",
                          SLOT_CLS[slot.state],
                          slot.state === "free" ? "text-ink2" : "text-ink0",
                          selected?.id === slot.id && "ring-2 ring-brand/50"
                        )}
                      >
                        {slot.state === "occupied" && <Truck className="h-3 w-3 shrink-0 text-data" />}
                        {isDragDemo && <MoveHorizontal className="h-3 w-3 shrink-0 text-brand" />}
                        <span className="truncate">{slot.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* popover */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="absolute right-2 top-2 z-20 w-[240px] rounded-xl border border-linestrong bg-raised p-4 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-data">
                      {selected.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="font-mono text-[10px] text-ink2 hover:text-ink0"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink1">
                    <span>{selected.dock} · {minToClock(selected.start)} → {minToClock(selected.end)}</span>
                    {selected.crew > 0 && <span>{selected.crew} DOCK CREW · {selected.estMin} MIN EST</span>}
                    {selected.vehicle && <span>VEHICLE {selected.vehicle}</span>}
                    <span className={cn(
                      selected.state === "overrun" ? "text-warn" : "text-data"
                    )}>
                      STATUS: {selected.state.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
                    <MoveHorizontal className="h-3 w-3" /> Resequence ↔ drag
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* legend */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-line pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm border border-data/60" /> BOOKED</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm border border-data bg-data/20" /> OCCUPIED</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm border border-warn bg-warn/20" /> OVERRUN</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-4 rounded-sm border border-dashed border-line" /> FREE</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
