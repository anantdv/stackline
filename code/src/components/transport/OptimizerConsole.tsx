import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Lock } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import type { LoadPlanMode } from "@/components/three/LoadPlanScene";
import LazyLoadPlanScene from "./LazyLoadPlanScene";
import { OPTIMIZER_CARGO, OPTIMIZER_RAIL_ROWS, OPTIMIZER_VEHICLE } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const MODES: LoadPlanMode[] = ["solid", "wireframe", "layers", "sequence"];

/** Section 3 — the 3D load optimizer console (centerpiece). */
export default function OptimizerConsole() {
  const [runKey, setRunKey] = useState(0);
  const [mode, setMode] = useState<LoadPlanMode>("solid");
  const [locked, setLocked] = useState(false);
  const [planLabel, setPlanLabel] = useState<string | null>(null);
  const runAt = useRef(0);

  // Live vehicle suggestion (falls back to the baked TRK-07 story offline).
  const suggest = trpc.transport.suggestVehicle.useQuery(
    { items: OPTIMIZER_CARGO },
    { retry: 1, refetchOnWindowFocus: false }
  );
  const createPlan = trpc.transport.createPlan.useMutation();
  const lockPlan = trpc.transport.lockPlan.useMutation();

  const suggestedName = useMemo(() => {
    const v = suggest.data?.vehicle;
    if (!v) return "TRK-07 · TRUCK 32FT MXL (DEMO)";
    return `${v.regNo} · ${v.type.toUpperCase()} (LIVE)`;
  }, [suggest.data]);

  const onOptimize = () => {
    setLocked(false);
    runAt.current = Date.now();
    setRunKey((k) => k + 1);
    setPlanLabel(null);
    // Persist a real plan when the backend is reachable; ignore failures.
    const vehicleId = suggest.data?.vehicle?.id;
    if (vehicleId != null) {
      createPlan.mutate(
        { vehicleId, warehouseId: 1, items: OPTIMIZER_CARGO },
        { onSuccess: (r) => r.plan && setPlanLabel(r.plan.planNo) }
      );
    }
  };

  const onLock = () => {
    setLocked(true);
    const id = createPlan.data?.plan?.id;
    if (id != null) {
      lockPlan.mutate({ id }, { onError: () => undefined });
    }
  };

  return (
    <section id="optimizer" data-tour="optimizer" className="bg-void py-[160px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <SectionKicker className="mb-4">OPTIMIZER</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="Watch the load build itself." />
        </h2>

        {/* console: tilt-up reveal */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotateX: 6 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, margin: "-12% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          style={{ transformPerspective: 1200 }}
          className="mt-12 overflow-hidden rounded-xl border border-line bg-surface"
        >
          {/* console header: mode bar + meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="flex items-center gap-1" data-tour="mode-bar">
              {MODES.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                    mode === m ? "bg-brand-soft text-brand" : "text-ink2 hover:text-ink0"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              SUGGESTED: <span className="text-data">{suggestedName}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[240px_1fr]">
            {/* pending cargo rail */}
            <div className="border-b border-line p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">
                PENDING CARGO
              </div>
              <div className="space-y-2">
                {OPTIMIZER_RAIL_ROWS.map((r) => (
                  <div
                    key={r.label}
                    className={cn(
                      "rounded-md border border-line bg-raised px-3 py-2 font-mono text-[10px] tracking-[0.06em]",
                      r.tone === "data" ? "text-data" : r.tone === "warn" ? "text-warn" : "text-ink1"
                    )}
                  >
                    {r.label}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={onOptimize}
                data-tour="optimize-btn"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 font-display text-[14px] font-semibold text-onbrand transition-all hover:bg-brand-hover active:scale-[0.98]"
              >
                <Play className="h-4 w-4" />
                {runKey === 0 ? "OPTIMIZE" : "RE-RUN"}
              </button>
              <button
                type="button"
                onClick={onLock}
                disabled={runKey === 0 || locked}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-linestrong px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink0 transition-colors hover:border-data hover:text-data disabled:opacity-40"
              >
                <Lock className="h-3.5 w-3.5" />
                {locked ? "PLAN LOCKED ✓" : "LOCK PLAN"}
              </button>
              <div className="mt-3 font-mono text-[9px] uppercase leading-4 tracking-[0.12em] text-ink2">
                {locked
                  ? `${planLabel ?? "LP-0417"} ✓ LOCKED · READY FOR /dispatch`
                  : "HEAVY-FIRST · FLOOR-UP · AXLE-LEGAL"}
              </div>
            </div>

            {/* canvas 16:9 */}
            <div className="relative aspect-[16/9] min-h-[320px]">
              <LazyLoadPlanScene
                className="absolute inset-0"
                cargo={OPTIMIZER_VEHICLE}
                items={OPTIMIZER_CARGO}
                runKey={runKey}
                runSec={3.2}
                detail="full"
                mode={mode}
                stops={5}
                leftoverNote="6 CTNS → NEXT VEHICLE TRK-12"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
