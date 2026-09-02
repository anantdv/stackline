import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import { cn } from "@/lib/utils";
import { CAPACITY_STRIP, DEMO_VEHICLES, type DemoVehicle } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CHIP_TONE: Record<DemoVehicle["chip"]["tone"], string> = {
  reserved: "border-data/50 text-data [animation:pulse-dot_2.4s_ease-in-out_infinite]",
  free: "border-line text-ink2",
  plan: "border-brand/50 text-brand",
  maintenance: "border-crit/50 text-crit [animation:pulse-dot_1.6s_ease-in-out_infinite]",
};

/** Wireframe side-elevation of the vehicle, stroke-drawn on entry. */
function VehicleWire({ v }: { v: DemoVehicle }) {
  const isContainer = v.key.startsWith("c");
  const isFlat = v.key === "flat40";
  return (
    <svg viewBox="0 0 220 90" className="h-24 w-full text-ink1" aria-hidden>
      {/* body */}
      <motion.rect
        x="30" y="14" width="170" height={isFlat ? 10 : 52}
        fill="none" stroke="currentColor" strokeWidth="1.2"
        initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeInOut" }}
      />
      {/* container corrugation */}
      {isContainer &&
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <motion.line
            key={i} x1={44 + i * 20} y1="18" x2={44 + i * 20} y2="62"
            stroke="currentColor" strokeWidth="0.6" opacity="0.5"
            initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.06, duration: 0.4 }}
          />
        ))}
      {/* cab for trucks */}
      {!isContainer && (
        <motion.path
          d="M30 66 L30 34 L14 34 L4 52 L4 66 Z"
          fill="none" stroke="currentColor" strokeWidth="1.2"
          initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.7 }}
        />
      )}
      {/* ground + wheels */}
      <line x1="0" y1="76" x2="220" y2="76" stroke="currentColor" strokeWidth="0.8" opacity="0.5" />
      {[46, 60, 168, 182].map((x) => (
        <circle key={x} cx={x} cy="70" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      ))}
      {/* accent corner */}
      <path d="M30 14 h14 M30 14 v14" stroke="var(--accent)" strokeWidth="1.6" fill="none" />
    </svg>
  );
}

/** Section 2 — vehicle & container placeholder library. */
export default function VehicleLibrary() {
  const stripRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef(false);
  const vehiclesQuery = trpc.transport.listVehicles.useQuery(undefined, { retry: 1 });
  const liveCount = vehiclesQuery.data?.length ?? 0;

  // Strip auto-advances every 6s unless hovered.
  useEffect(() => {
    const id = window.setInterval(() => {
      const el = stripRef.current;
      if (!el || hoverRef.current) return;
      const next = el.scrollLeft + 264;
      el.scrollTo({ left: next >= el.scrollWidth - el.clientWidth - 8 ? 0 : next, behavior: "smooth" });
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section data-tour="vehicle-library" className="bg-page py-[160px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker className="mb-4">FLEET.PLACEHOLDERS</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="Reserve the space before the freight exists." />
        </h2>

        <div
          ref={stripRef}
          onMouseEnter={() => (hoverRef.current = true)}
          onMouseLeave={() => (hoverRef.current = false)}
          className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:thin]"
        >
          {DEMO_VEHICLES.map((v, i) => (
            <motion.div
              key={v.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.55, ease: EASE }}
              className="w-[248px] shrink-0 snap-start"
            >
              <BlueprintCard className="h-full p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink0">{v.name}</span>
                  <span className={cn("rounded-full border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.12em]", CHIP_TONE[v.chip.tone])}>
                    {v.chip.label}
                  </span>
                </div>
                <div className="mt-3">
                  <VehicleWire v={v} />
                </div>
                <div className="mt-3 space-y-1 font-mono text-[10px] tracking-[0.06em] text-ink2">
                  <div className="font-tnum">{v.dims} · {v.payloadT}T{v.cbm ? ` · ${v.cbm} CBM` : ""}</div>
                  {v.reg && <div className="text-ink1">{v.reg}</div>}
                </div>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>

        <p className="mt-8 max-w-[680px] text-sm leading-relaxed text-ink1">
          Vehicles exist in Stackline as <span className="font-semibold text-ink0">bookable placeholders</span>:
          a sales order can reserve 6 CBM of TRK-07 three days before dispatch; the
          placeholder hardens into a load plan at cutoff.
        </p>

        {/* utilization-by-vehicle strip */}
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {CAPACITY_STRIP.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-[0.1em] text-ink1">{c.id}</span>
              <span className="h-1.5 w-20 overflow-hidden rounded-full bg-raised">
                <motion.span
                  className={cn("block h-full rounded-full", c.pct >= 90 ? "bg-brand" : c.pct > 0 ? "bg-data" : "bg-line")}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${c.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: EASE }}
                />
              </span>
              <span className="font-mono text-[10px] text-ink2 font-tnum">{c.pct}%</span>
            </div>
          ))}
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
            {liveCount > 0 ? `● LIVE · ${liveCount} VEHICLES IN ERP` : "● DEMO FLEET · DB OFFLINE"}
          </span>
        </div>
      </div>
    </section>
  );
}
