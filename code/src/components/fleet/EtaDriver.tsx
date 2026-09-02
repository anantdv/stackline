import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical, UserRound } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { DEMO_DRIVERS, DEMO_ETAS, DEMO_VEHICLES, type EtaItem } from "@/components/fleet/data";
import { useLiveVehicles } from "@/components/fleet/useFleetData";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface EtaState extends EtaItem {
  slip: number; // minutes added by traffic events
  flash: boolean;
}

function etaTone(e: EtaState): "data" | "warn" | "crit" {
  if (e.slip >= 10) return "crit";
  if (e.slip > 0) return "warn";
  return "data";
}

function EtaTicker() {
  const [etas, setEtas] = useState<EtaState[]>(() =>
    DEMO_ETAS.map((e) => ({ ...e, slip: 0, flash: false }))
  );
  const [, setTick] = useState(0);

  // countdown
  useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  // traffic event demo every ~12s: slip one ETA, warn sweep flash
  useEffect(() => {
    const t = window.setInterval(() => {
      setEtas((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        return prev.map((e, i) =>
          i === idx ? { ...e, slip: e.slip + 5, flash: true } : { ...e, flash: false }
        );
      });
    }, 12000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <BlueprintCard className="h-full p-5 hover:-translate-y-0">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink0">
          ETA TICKER
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">
          DRIFT <span className="text-data">±6 MIN AVG</span>
        </span>
      </div>
      <ul className="mt-4 flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {etas.map((e) => {
            const tone = etaTone(e);
            const eta = e.etaMin + e.slip;
            return (
              <motion.li
                key={e.id}
                layout="position"
                animate={e.flash ? { backgroundColor: ["rgba(255,176,32,0.12)", "rgba(255,176,32,0)"] } : {}}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 rounded-lg border border-line bg-page/50 px-3 py-2.5"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 shrink-0 rounded-full",
                    tone === "data" && "bg-data animate-pulse-dot",
                    tone === "warn" && "bg-warn animate-pulse",
                    tone === "crit" && "bg-crit animate-pulse"
                  )}
                />
                <span className="font-mono text-[11px] tracking-[0.06em] text-ink0">
                  {e.stop} {e.place}
                </span>
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink2">
                  {e.vehicle}
                </span>
                <span
                  className={cn(
                    "font-mono text-[11px] font-semibold tracking-[0.06em] font-tnum",
                    tone === "data" && "text-data",
                    tone === "warn" && "text-warn",
                    tone === "crit" && "text-crit"
                  )}
                >
                  ETA {eta}M
                </span>
                <span className={cn("font-mono text-[9px] uppercase tracking-[0.1em]",
                  tone === "data" ? "text-data" : tone === "warn" ? "text-warn" : "text-crit"
                )}>
                  {tone === "data" ? "ON TIME" : tone === "warn" ? `+${e.slip}M SLIP` : "DELAYED"}
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
        TRAFFIC EVENTS RECOMPUTE ETAS LIVE (DEMO EVERY 12S)
      </p>
    </BlueprintCard>
  );
}

function DriverCards() {
  const { vehicles } = useLiveVehicles();
  const assignDriver = trpc.fleet.assignDriver.useMutation();
  const [assigned, setAssigned] = useState<string | null>(null);
  const [gliding, setGliding] = useState(false);
  const [ghostDriver, setGhostDriver] = useState("S. YADAV");
  const stripRef = useRef<HTMLDivElement>(null);

  // drag demo loop: every 10s a ghost card glides to the vehicle row → stamp
  useEffect(() => {
    const t = window.setInterval(() => {
      setGhostDriver((d) => (d === "S. YADAV" ? "R. PATIL" : "S. YADAV"));
      setGliding(true);
      window.setTimeout(() => setGliding(false), 2600);
    }, 10000);
    return () => window.clearInterval(t);
  }, []);

  const targetVehicle = vehicles.find((v) => v.code === "TRK-05") ?? DEMO_VEHICLES[3];

  function assign(name: string) {
    assignDriver.mutate(
      { vehicleId: targetVehicle.id, driverName: name },
      {
        onSuccess: () => setAssigned(name),
        onError: () => setAssigned(name), // offline demo: stamp locally
      }
    );
  }

  return (
    <div className="relative">
      {/* driver-cab.jpg accent panel behind cards at 20% */}
      <div aria-hidden className="pointer-events-none absolute -inset-4 overflow-hidden rounded-2xl">
        <img src="/driver-cab.jpg" alt="" className="h-full w-full rounded-2xl object-cover opacity-20" />
        <div className="absolute inset-0 bg-void/40" />
      </div>

      <div className="relative flex flex-col gap-3" ref={stripRef}>
        {DEMO_DRIVERS.map((d, i) => {
          const pct = (d.drivenH / d.maxH) * 100;
          const tone = pct >= 90 ? "crit" : pct >= 70 ? "warn" : "data";
          return (
            <motion.div
              key={d.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: EASE }}
            >
              <BlueprintCard className="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-linestrong bg-raised text-ink1">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <GripVertical className="h-4 w-4 text-ink2" aria-label="Drag to assign" />
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[12px] font-semibold tracking-[0.08em] text-ink0">
                      {d.name}
                    </div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                      {d.phone} · {d.trip ?? "AVAILABLE"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => assign(d.name)}
                    disabled={assignDriver.isPending}
                    className="rounded-lg border border-linestrong px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink1 transition-colors duration-200 hover:border-brand hover:text-brand disabled:opacity-40"
                  >
                    Assign
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-raised">
                    <motion.div
                      className={cn("h-full rounded-full",
                        tone === "data" && "bg-data", tone === "warn" && "bg-warn", tone === "crit" && "bg-crit")}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${pct}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink2 font-tnum">
                    DRIVEN {d.drivenH.toFixed(1)}H / {d.maxH}H
                  </span>
                </div>
              </BlueprintCard>
            </motion.div>
          );
        })}

        {/* drop target row */}
        <div
          className={cn(
            "relative rounded-xl border border-dashed px-4 py-3 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors duration-300",
            assigned ? "border-data/60 bg-data-soft text-data" : "border-linestrong text-ink1"
          )}
        >
          TRIP-0420 · TRK-05 · {assigned ? `DRIVER ${assigned}` : "UNASSIGNED"}
          <AnimatePresence>
            {(assigned || gliding) && (
              <motion.span
                key={assigned ?? "glide"}
                initial={{ scale: 1.3, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: -4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE, delay: gliding && !assigned ? 1.6 : 0 }}
                className="absolute -top-3 right-3 rounded border-2 border-data bg-void px-2 py-0.5 text-[9px] font-semibold tracking-[0.16em] text-data"
              >
                TRIP-0420 → {assigned ?? ghostDriver} ✓ NOTIFIED (APP)
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* gliding ghost card (drag demo) */}
        <AnimatePresence>
          {gliding && !assigned && (
            <motion.div
              key="ghost"
              initial={{ x: 0, y: -210, opacity: 0.9, scale: 0.9 }}
              animate={{ x: 40, y: -6, opacity: [0.9, 0.9, 0], scale: [0.9, 0.95, 0.85] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: EASE }}
              className="pointer-events-none absolute left-6 top-6 z-10 w-[220px] rounded-xl border border-brand/60 bg-raised px-4 py-3 shadow-2xl"
            >
              <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-brand">
                {ghostDriver}
              </span>
              <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                DRAG TO ASSIGN…
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function EtaDriver() {
  return (
    <section className="bg-void py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>ETA.DRIVERS</SectionKicker>
        <h2 className="mt-6 max-w-[760px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Arrivals tick. Drivers drop in.
        </h2>
        <div data-tour="eta-driver" className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <EtaTicker />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <DriverCards />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
