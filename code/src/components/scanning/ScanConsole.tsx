import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import {
  CONSOLE_PARCELS,
  DEMO_SCANS,
  billingFor,
  type ScanRecordView,
} from "@/components/scanning/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const WAREHOUSE_ID = 1;

type Phase = "scan" | "dims" | "weigh" | "verdict";
const PHASE_MS: Record<Phase, number> = { scan: 2200, dims: 2000, weigh: 1400, verdict: 1400 };
const PHASE_ORDER: Phase[] = ["scan", "dims", "weigh", "verdict"];

/** Slowly-rotating wireframe box with mono dimension edge labels. */
function DimBox({ l, w, h, locked }: { l: number; w: number; h: number; locked: boolean }) {
  const [angle, setAngle] = useState(0.6);
  useEffect(() => {
    const t = window.setInterval(() => setAngle((a) => a + 0.045), 50);
    return () => window.clearInterval(t);
  }, []);

  const scale = 1.1;
  const hl = (l * scale) / 2;
  const hw = (w * scale) / 2;
  const hh = h * scale;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);

  // 8 corners of the box, rotated around vertical axis, oblique-projected.
  const pt = (x: number, y: number, z: number): [number, number] => {
    const rx = x * ca - z * sa;
    const rz = x * sa + z * ca;
    return [160 + rx - rz * 0.45, 170 - y - rz * 0.3];
  };
  const c = [
    pt(-hl, 0, -hw), pt(hl, 0, -hw), pt(hl, 0, hw), pt(-hl, 0, hw),
    pt(-hl, hh, -hw), pt(hl, hh, -hw), pt(hl, hh, hw), pt(-hl, hh, hw),
  ];
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const mid = (a: number, b: number): [number, number] => [
    (c[a][0] + c[b][0]) / 2,
    (c[a][1] + c[b][1]) / 2,
  ];
  const [lm, wm, hm] = [mid(0, 1), mid(1, 2), mid(1, 5)];

  return (
    <svg viewBox="0 0 320 300" className="h-auto w-full">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={c[a][0]} y1={c[a][1]} x2={c[b][0]} y2={c[b][1]}
          className={cn("transition-colors duration-300", locked ? "stroke-data" : "stroke-linestrong")}
          strokeWidth={locked ? 1.5 : 1}
        />
      ))}
      {([
        [lm, `L ${l}`, 0, 14],
        [wm, `W ${w}`, 12, 6],
        [hm, `H ${h}`, 12, 0],
      ] as const).map(([m, label, dx, dy], i) => (
        <text
          key={i}
          x={m[0] + dx} y={m[1] + dy}
          className={cn("font-mono transition-colors duration-300", locked ? "fill-data" : "fill-ink2")}
          fontSize="11" letterSpacing="1.5"
        >
          {label}
          {locked ? " ✓" : ""}
        </text>
      ))}
      <text x="160" y="286" textAnchor="middle" className="fill-ink2 font-mono" fontSize="9" letterSpacing="2">
        {locked ? "CAPTURE LOCKED · ±2MM" : "MEASURING…"}
      </text>
    </svg>
  );
}

/** Animated mono number that springs to its target. */
function TweenNumber({ value, className }: { value: number; className?: string }) {
  const [v, setV] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const e = 1 - Math.pow(1 - t, 3);
      setV(from + (value - from) * e);
      if (t < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className={cn("font-tnum", className)}>{v.toFixed(2)}</span>;
}

export default function ScanConsole() {
  const utils = trpc.useUtils();
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>("scan");
  const parcel = CONSOLE_PARCELS[cycle % CONSOLE_PARCELS.length];
  const billing = billingFor(parcel);

  // phase machine: scan → dims → weigh → verdict → next parcel (~7s cycle)
  useEffect(() => {
    let alive = true;
    let timer = 0;
    const advance = (p: Phase) => {
      if (!alive) return;
      setPhase(p);
      timer = window.setTimeout(() => {
        const next = PHASE_ORDER[PHASE_ORDER.indexOf(p) + 1];
        if (next) advance(next);
        else setCycle((c) => c + 1);
      }, PHASE_MS[p]);
    };
    advance("scan");
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cycle]);

  // Fire-and-forget: persist the demo capture when the verdict stamps.
  const recordScan = trpc.scanning.recordScan.useMutation({
    onSuccess: () => void utils.scanning.listRecords.invalidate(),
  });
  const recordedRef = useRef(-1);
  useEffect(() => {
    if (phase !== "verdict" || recordedRef.current === cycle) return;
    recordedRef.current = cycle;
    recordScan.mutate(
      {
        parcelId: parcel.parcelId,
        warehouseId: WAREHOUSE_ID,
        lengthM: parcel.l / 100,
        widthM: parcel.w / 100,
        heightM: parcel.h / 100,
        actualWeightKg: parcel.actualKg,
        contentsGuess: parcel.detected,
        xrayFlag: parcel.mismatch ? "blocked" : "clear",
      },
      { onError: () => undefined /* offline demo — baked records below */ }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, cycle]);

  /* -------- recent captures strip (live w/ baked fallback) -------- */
  const listQ = trpc.scanning.listRecords.useQuery(
    { warehouseId: WAREHOUSE_ID, limit: 12 },
    { retry: 1, refetchOnWindowFocus: false }
  );
  const [localOverride, setLocalOverride] = useState<ScanRecordView[] | null>(null);
  const records: ScanRecordView[] = useMemo(() => {
    if (localOverride) return localOverride;
    const d = listQ.data;
    if (listQ.isError || !d || d.length === 0) return DEMO_SCANS;
    return d.map((r) => ({
      id: r.id,
      parcelId: r.parcelId,
      l: Math.round(r.lengthM * 100),
      w: Math.round(r.widthM * 100),
      h: Math.round(r.heightM * 100),
      actualKg: r.actualWeightKg,
      volKg: r.volumetricWeightKg,
      flag: (r.xrayFlag as ScanRecordView["flag"]) ?? "clear",
      contents: r.contentsGuess,
      dock: null,
    }));
  }, [listQ.data, listQ.isError, localOverride]);

  const flagReview = trpc.scanning.flagReview.useMutation({
    onSuccess: () => void utils.scanning.listRecords.invalidate(),
  });
  const setFlag = (r: ScanRecordView, flag: ScanRecordView["flag"]) => {
    flagReview.mutate(
      { id: r.id, flag },
      {
        onError: () => {
          // offline demo: apply locally
          setLocalOverride(records.map((x) => (x.id === r.id ? { ...x, flag } : x)));
        },
      }
    );
  };

  const maxKg = Math.max(billing.volKg, parcel.actualKg) * 1.15;

  return (
    <section id="scan-console" className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>LIVE.CONSOLE</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          One parcel, full truth.
        </h2>

        <motion.div
          data-tour="live-console"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="group relative mt-12 rounded-xl border border-line bg-surface transition-colors duration-300 hover:border-linestrong"
        >
          <span aria-hidden className="pointer-events-none absolute left-0 top-0 h-[14px] w-[14px] border-l border-t border-brand" />
          <span aria-hidden className="pointer-events-none absolute bottom-0 right-0 h-[14px] w-[14px] border-b border-r border-brand" />

          {/* console header */}
          <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink0">
              BAY-01 · <span className="text-data font-tnum">{parcel.parcelId}</span>
            </span>
            <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              {PHASE_ORDER.map((p) => (
                <span
                  key={p}
                  className={cn(
                    "rounded border px-1.5 py-0.5 transition-colors duration-300",
                    phase === p ? "border-brand text-brand" : "border-line"
                  )}
                >
                  {p}
                </span>
              ))}
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-line lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {/* LEFT — x-ray view */}
            <motion.div
              animate={parcel.mismatch && phase === "verdict" ? { x: [0, -6, 6, -3, 0] } : { x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-5"
            >
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                <span className="text-ink1">X-RAY VIEW</span>
                <span className="text-ink2">DENSITY MAP · DUAL-ENERGY</span>
              </div>
              <div
                className={cn(
                  "relative overflow-hidden rounded-lg border transition-colors duration-300",
                  parcel.mismatch && phase === "verdict" ? "border-crit/70" : "border-line"
                )}
              >
                <img
                  src="/xray-parcel.png"
                  alt="Simulated x-ray density scan of a parcel"
                  className="aspect-[9/7] w-full object-cover"
                  loading="lazy"
                />
                {/* HUD corners */}
                {["left-2 top-2 border-l border-t", "right-2 top-2 border-r border-t", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map((pos) => (
                  <span key={pos} aria-hidden className={cn("pointer-events-none absolute h-3.5 w-3.5 border-data/80", pos)} />
                ))}
                {/* scanline sweep */}
                {phase === "scan" && (
                  <motion.div
                    key={`scanline-${cycle}`}
                    aria-hidden
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, ease: "linear" }}
                    className="absolute inset-y-0 w-full"
                    style={{
                      background:
                        "linear-gradient(90deg, transparent 42%, var(--data) 50%, transparent 58%)",
                      opacity: 0.5,
                    }}
                  />
                )}
                <AnimatePresence>
                  {phase !== "scan" && (
                    <motion.div
                      key={`chip-${cycle}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className={cn(
                        "absolute bottom-3 left-3 right-3 rounded-md border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] backdrop-blur",
                        parcel.mismatch
                          ? "border-crit/60 bg-void/80 text-crit"
                          : "border-data/50 bg-void/80 text-data"
                      )}
                    >
                      {parcel.mismatch
                        ? `✕ MISMATCH: ${parcel.detected}`
                        : `${parcel.detected} ✓ MATCHES DECL.`}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                DECLARED: {parcel.declared}
              </p>
            </motion.div>

            {/* CENTER — dimensions */}
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                <span className="text-ink1">DIMENSIONS</span>
                <span className="text-ink2">LASER/IR ARRAY</span>
              </div>
              <DimBox l={parcel.l} w={parcel.w} h={parcel.h} locked={phase !== "scan"} />
            </div>

            {/* RIGHT — weight & billing */}
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                <span className="text-ink1">WEIGHT &amp; BILLING</span>
                <span className="text-ink2">÷5000 AIR</span>
              </div>

              <div className="flex flex-col gap-4">
                {(
                  [
                    ["ACTUAL", parcel.actualKg, "text-ink0"],
                    ["VOL", billing.volKg, "text-data"],
                  ] as const
                ).map(([label, val, cls]) => {
                  const isChargeable =
                    (billing.basis === "volumetric" && label === "VOL") ||
                    (billing.basis === "actual" && label === "ACTUAL");
                  return (
                    <div key={label}>
                      <div className="flex items-baseline justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                          {label}
                        </span>
                        <span className={cn("font-display text-[26px] font-semibold", isChargeable ? "text-brand" : cls)}>
                          {phase === "scan" || phase === "dims" ? (
                            "——.——"
                          ) : (
                            <TweenNumber value={val} />
                          )}
                          <span className="ml-1 font-mono text-[10px] text-ink2">KG</span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised">
                        <motion.div
                          className={cn("h-full rounded-full", isChargeable ? "bg-brand" : label === "VOL" ? "bg-data" : "bg-ink2")}
                          initial={false}
                          animate={{
                            width:
                              phase === "scan" || phase === "dims"
                                ? "0%"
                                : `${(val / maxKg) * 100}%`,
                          }}
                          transition={{ duration: 0.7, ease: EASE }}
                        />
                      </div>
                    </div>
                  );
                })}

                <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink2">
                  VOL = {(parcel.l / 100).toFixed(2)}×{(parcel.w / 100).toFixed(2)}×
                  {(parcel.h / 100).toFixed(2)} M ÷ 5000 ={" "}
                  <span className="text-data">{billing.volKg.toFixed(2)} KG</span>
                </p>

                <AnimatePresence mode="wait">
                  {phase === "verdict" && (
                    <motion.div
                      key={`verdict-${cycle}`}
                      initial={{ scale: 1.15, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className={cn(
                        "rounded-lg border px-3 py-2.5",
                        parcel.mismatch ? "border-crit/60 bg-crit/10" : "border-brand/50 bg-brand-soft"
                      )}
                    >
                      <div className={cn("font-mono text-[11px] font-semibold uppercase tracking-[0.14em]", parcel.mismatch ? "text-crit" : "text-brand")}>
                        {parcel.mismatch
                          ? "HELD — EXCEPTION LANE"
                          : `BILLABLE: ${billing.basis.toUpperCase()} ${billing.chargeableKg.toFixed(2)} KG`}
                      </div>
                      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                        DWS CAPTURED ✓ · 0.8S
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* recent captures strip */}
          <div className="border-t border-line px-5 py-4">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              <span>RECENT CAPTURES · {listQ.isError || localOverride ? "● DEMO" : "● LIVE"}</span>
              <span>{records.filter((r) => r.flag === "clear").length} CLEAR · {records.filter((r) => r.flag === "review").length} REVIEW · {records.filter((r) => r.flag === "blocked").length} BLOCKED</span>
            </div>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {records.slice(0, 9).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-md border border-line bg-page/50 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.08em]"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      r.flag === "clear" && "bg-data",
                      r.flag === "review" && "bg-warn",
                      r.flag === "blocked" && "bg-crit animate-pulse"
                    )}
                  />
                  <span className="text-ink0">{r.parcelId}</span>
                  <span className="text-ink2 font-tnum">
                    {r.l}×{r.w}×{r.h}
                  </span>
                  <span className="ml-auto text-ink1 font-tnum">{r.actualKg.toFixed(1)}KG</span>
                  {r.flag !== "clear" && (
                    <button
                      type="button"
                      onClick={() => setFlag(r, r.flag === "blocked" ? "review" : "clear")}
                      className="rounded border border-linestrong px-1.5 py-0.5 text-[9px] uppercase text-ink1 transition-colors hover:border-brand hover:text-brand"
                    >
                      {r.flag === "blocked" ? "Review" : "Clear"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
