import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Database, WifiOff } from "lucide-react";
import { allocateCartons, type AllocatableBin, type AllocationStrategy } from "@contracts/wms";
import { trpc } from "@/providers/trpc";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RULES = [
  "FEFO / FIFO / LIFO",
  "ABC velocity zoning",
  "Same-lot consolidation",
  "Weight & crush limits",
  "Hazmat segregation",
  "Replenishment thresholds",
];

const STRATEGIES: { key: AllocationStrategy; label: string }[] = [
  { key: "fefo", label: "FEFO" },
  { key: "velocity", label: "VELOCITY" },
  { key: "balanced", label: "BALANCED" },
];

/* Inbound carton under allocation */
const INBOUND = { sku: "SKU-0417", qty: 12, batch: "B-2211", kg: 14, dims: { lengthM: 0.4, widthM: 0.3, heightM: 0.3 } };

/* Demo floor — used when the WMS database is unreachable */
const DEMO_BINS: AllocatableBin[] = [
  {
    // Nearly full consolidation bin: fits 3 more of SKU-0417 (weight-capped).
    id: 101, code: "B-02-03-01", status: "active", level: 2,
    widthM: 2.0, depthM: 1.2, heightM: 1.8, maxWeightKg: 400,
    usedQty: 25, currentPlacements: [{ sku: "SKU-0417", qty: 25 }],
  },
  {
    id: 102, code: "C-04-01-02", status: "active", level: 1,
    widthM: 2.4, depthM: 1.6, heightM: 2.2, maxWeightKg: 800,
    usedQty: 0, currentPlacements: [],
  },
  {
    id: 103, code: "A-01-05-03", status: "active", level: 5,
    widthM: 1.2, depthM: 1.0, heightM: 1.0, maxWeightKg: 250,
    usedQty: 3, currentPlacements: [{ sku: "SKU-1090", qty: 3 }],
  },
];

/** Deterministic pseudo-score for the explainability breakdown (55–98). */
function factorScore(code: string, factor: string, strategy: string, salt: number) {
  let h = salt;
  const s = `${code}:${factor}:${strategy}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 55 + (h % 44);
}

type Phase = "scoring" | "decided";

function usePaused(ref: React.RefObject<HTMLElement | null>) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setPaused(!e.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(el);
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref]);
  return paused;
}

function DecisionBoard({ strategy }: { strategy: AllocationStrategy }) {
  const boardRef = useRef<HTMLDivElement>(null);
  const paused = usePaused(boardRef);
  const [phase, setPhase] = useState<Phase>("scoring");
  const [cycle, setCycle] = useState(0);

  /* Live engine probe — degrades gracefully to the client-side engine. */
  const suggest = trpc.wms.allocation.suggest.useQuery(
    { warehouseId: 1, itemId: 1, qty: INBOUND.qty, strategy },
    { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 }
  );
  const live = !!suggest.data && suggest.data.allocations.length > 0;

  /* The displayed decision is always reproducible client-side. */
  const decision = useMemo(
    () =>
      allocateCartons({
        bins: DEMO_BINS,
        carton: INBOUND.dims,
        cartonWeightKg: INBOUND.kg,
        sku: INBOUND.sku,
        qty: INBOUND.qty,
        strategy,
      }),
    [strategy]
  );
  /* Winner = the bin receiving the largest share of the inbound qty. */
  const winner = decision.allocations.reduce<
    { binId: number; code: string; qty: number } | null
  >((best, a) => (best && best.qty >= a.qty ? best : a), null);
  const winnerCode = winner?.code ?? null;

  /* Loop: scoring (bars fill) → decided (winner + path) → reset. */
  useEffect(() => {
    if (paused) return;
    const t1 = window.setTimeout(() => setPhase("decided"), 1500);
    const t2 = window.setTimeout(() => {
      setPhase("scoring");
      setCycle((c) => c + 1);
    }, 5000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [paused, cycle, strategy]);

  // reset to scoring when strategy changes
  useEffect(() => {
    setPhase("scoring");
  }, [strategy]);

  const reasonFor = (code: string) => {
    if (code === winnerCode) return null;
    const bin = DEMO_BINS.find((b) => b.code === code)!;
    if (bin.status !== "active") return "BLOCKED";
    const holds = (bin.currentPlacements ?? []).some((p) => p.sku === INBOUND.sku && p.qty > 0);
    if (!holds && strategy === "fefo") return "LOT MISMATCH";
    if ((bin.usedQty ?? 0) > 0 && !holds) return "SPACE < MIN";
    return strategy === "velocity" ? "LEVEL > TARGET" : "OUTSCORED";
  };

  return (
    <div ref={boardRef} style={{ perspective: "1200px" }}>
      <motion.div
        initial={{ opacity: 0, rotateX: 6, y: 40 }}
        whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        <BlueprintCard className="relative overflow-hidden p-5 sm:p-8">
          <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden />

          {/* engine status */}
          <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              Decision board · {STRATEGIES.find((s) => s.key === strategy)?.label}
            </span>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em]",
                live ? "border-data/40 bg-data-soft text-data" : "border-warn/40 bg-warn/10 text-warn"
              )}
            >
              {live ? <Database className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {suggest.isLoading ? "Probing engine…" : live ? "Live · WMS DB" : "Demo · client-side engine"}
            </span>
          </div>

          <div className="relative grid items-center gap-6 lg:grid-cols-[220px_1fr] lg:gap-10">
            {/* inbound card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`in-${cycle}`}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="rounded-lg border border-brand/50 bg-brand-soft p-4"
              >
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-brand">Inbound</div>
                <div className="mt-2 font-mono text-sm font-semibold text-ink0">
                  {INBOUND.sku} <span className="text-brand">×{INBOUND.qty}</span>
                </div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.1em] text-ink1">
                  BATCH {INBOUND.batch} · {INBOUND.kg} KG
                </div>
                <div className="mt-3 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
                  Score every bin <ArrowRight className="h-3 w-3 text-brand" />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* candidates */}
            <div className="grid gap-3 sm:grid-cols-3">
              {DEMO_BINS.map((bin, i) => {
                const isWinner = phase === "decided" && bin.code === winnerCode;
                const split = decision.allocations.find((a) => a.code === bin.code);
                const reason =
                  phase === "decided" && !isWinner && !split ? reasonFor(bin.code) : null;
                const scores = [
                  { label: "VELOCITY", v: factorScore(bin.code, "vel", strategy, 7) },
                  { label: "FEFO", v: factorScore(bin.code, "fefo", strategy, 13) },
                  { label: "SPACE", v: factorScore(bin.code, "space", strategy, 29) },
                ];
                const total = (scores.reduce((s, x) => s + x.v, 0) / 3).toFixed(1);
                return (
                  <motion.div
                    key={`${bin.code}-${cycle}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.5, ease: EASE }}
                    className={cn(
                      "relative rounded-lg border p-4 transition-all duration-500",
                      isWinner
                        ? "border-data bg-data-soft shadow-glow-data"
                        : phase === "decided"
                          ? split
                            ? "border-warn/50 bg-surface"
                            : "border-line bg-surface opacity-55"
                          : "border-line bg-surface"
                    )}
                  >
                    {isWinner && (
                      <span className="absolute -inset-px rounded-lg border border-data [animation:ripple_1.6s_ease-out_infinite]" aria-hidden />
                    )}
                    <div className="flex items-center justify-between">
                      <span className={cn("font-mono text-xs font-semibold tracking-[0.08em]", isWinner ? "text-data" : "text-ink0")}>
                        {bin.code}
                      </span>
                      <span className="font-mono text-[10px] text-ink2 font-tnum">{total}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {scores.map((s, j) => (
                        <div key={s.label}>
                          <div className="mb-0.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">
                            <span>{s.label}</span>
                            <span className="font-tnum">{s.v}</span>
                          </div>
                          <div className="h-1 overflow-hidden rounded-full bg-raised">
                            <div
                              className="h-full rounded-full bg-data/70 transition-all duration-700"
                              style={{
                                width: phase === "decided" || cycle > 0 ? `${s.v}%` : "0%",
                                transitionDelay: `${j * 0.12}s`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 h-4 font-mono text-[9px] uppercase tracking-[0.12em]">
                      {isWinner ? (
                        <span className="text-data">◈ Selected · {winner?.qty} cartons</span>
                      ) : phase === "decided" && split ? (
                        <span className="text-warn">Split · {split.qty} cartons (consolidation)</span>
                      ) : reason ? (
                        <span className="text-crit/90">{reason}</span>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* live engine response (when DB reachable) */}
          {live && suggest.data && (
            <div className="relative mt-5 rounded-md border border-data/30 bg-void/60 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink1">
              <span className="text-data">Live engine ▸ </span>
              {suggest.data.allocations.map((a) => `${a.qty}× → ${a.code}`).join(" · ")}
              {suggest.data.unallocated > 0 && (
                <span className="text-warn"> · {suggest.data.unallocated} unallocated</span>
              )}
            </div>
          )}
        </BlueprintCard>
      </motion.div>
    </div>
  );
}

export default function EngineAllocation() {
  const [strategy, setStrategy] = useState<AllocationStrategy>("balanced");

  return (
    <section id="engine-allocation" className="scroll-mt-32 bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center">
            <SectionKicker>ENGINE.03</SectionKicker>
          </div>
          <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="Every carton, routed by rules." />
          </h2>
          <p className="mx-auto mt-5 max-w-[620px] leading-relaxed text-ink1">
            Inbound cartons are scored against every eligible bin — velocity
            zone, FEFO/FIFO, same-lot grouping, weight headroom, pick-face
            proximity. The engine allocates instantly and shows its work: every
            score, every reason.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 text-left sm:grid-cols-3">
            {RULES.map((r, i) => (
              <motion.span
                key={r}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: EASE }}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink1"
              >
                <span className="mr-2 text-brand">▸</span>{r}
              </motion.span>
            ))}
          </div>

          {/* strategy switch */}
          <div className="mt-8 inline-flex gap-1 rounded-full border border-line bg-surface p-1">
            {STRATEGIES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setStrategy(s.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-300",
                  strategy === s.key ? "bg-brand text-page" : "text-ink2 hover:text-ink0"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <DecisionBoard strategy={strategy} />
        </div>
      </div>
    </section>
  );
}
