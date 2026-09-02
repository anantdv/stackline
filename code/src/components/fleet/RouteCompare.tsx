import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import { optimizeRoute, haversineKm } from "@contracts/types";
import type { GeoPoint, RouteStop } from "@contracts/types";
import { useRouteBoard } from "@/components/fleet/useFleetData";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Deliberately zig-zagging stop order (as received). */
const DEPOT: GeoPoint = { lat: 19.292, lng: 73.062 };
const NAIVE_STOPS: RouteStop[] = [
  { id: 1, lat: 19.3, lng: 73.18, label: "BADLAPUR" },
  { id: 2, lat: 19.06, lng: 72.89, label: "ANDHERI" },
  { id: 3, lat: 19.25, lng: 73.13, label: "AMBERNATH" },
  { id: 4, lat: 19.11, lng: 72.91, label: "GOREGAON" },
  { id: 5, lat: 19.19, lng: 73.06, label: "DOMBIVLI" },
  { id: 6, lat: 19.21, lng: 73.0, label: "KALYAN" },
];

function routeKm(order: RouteStop[], depot: GeoPoint): number {
  if (order.length === 0) return 0;
  let km = haversineKm(depot, order[0]);
  for (let i = 1; i < order.length; i++) km += haversineKm(order[i - 1], order[i]);
  return km + haversineKm(order[order.length - 1], depot);
}

function fmtDuration(km: number): string {
  const min = Math.round((km / 38) * 60);
  return `${Math.floor(min / 60)}H ${String(min % 60).padStart(2, "0")}M`;
}

/** Mini stylized map of one route order. */
function MiniMap({
  order,
  optimized,
  drawKey,
}: {
  order: RouteStop[];
  optimized: boolean;
  drawKey: string | number;
}) {
  const pts = useMemo(() => {
    const all = [DEPOT, ...order];
    const lngs = all.map((p) => p.lng);
    const lats = all.map((p) => p.lat);
    const x0 = Math.min(...lngs) - 0.02;
    const x1 = Math.max(...lngs) + 0.02;
    const y0 = Math.min(...lats) - 0.02;
    const y1 = Math.max(...lats) + 0.02;
    const px = (p: GeoPoint) => 20 + ((p.lng - x0) / (x1 - x0)) * 280;
    const py = (p: GeoPoint) => 190 - ((p.lat - y0) / (y1 - y0)) * 160;
    return { depot: [px(DEPOT), py(DEPOT)] as [number, number], stops: order.map((s) => [px(s), py(s)] as [number, number]) };
  }, [order]);

  const path = [pts.depot, ...pts.stops, pts.depot]
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");

  return (
    <svg viewBox="0 0 320 220" className="h-auto w-full">
      {/* graticule */}
      {[40, 90, 140, 190, 240, 290].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="220" className="stroke-line" strokeWidth="0.5" />
      ))}
      {[44, 88, 132, 176].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} className="stroke-line" strokeWidth="0.5" />
      ))}
      <motion.path
        key={String(drawKey)}
        d={path}
        fill="none"
        className={optimized ? "stroke-data" : "stroke-warn"}
        strokeWidth="1.6"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: optimized ? 1.4 : 1, ease: EASE }}
      />
      <rect x={pts.depot[0] - 5} y={pts.depot[1] - 5} width="10" height="10" className="fill-brand" />
      <text x={pts.depot[0] + 9} y={pts.depot[1] + 3} className="fill-ink2 font-mono" fontSize="8" letterSpacing="1">
        DEPOT
      </text>
      {pts.stops.map(([x, y], i) => (
        <motion.g
          key={`${i}-${order[i].id}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15 + i * 0.08, type: "spring", stiffness: 320, damping: 20 }}
        >
          <circle cx={x} cy={y} r="8" className={optimized ? "fill-data/20 stroke-data" : "fill-warn/20 stroke-warn"} strokeWidth="1" />
          <text x={x} y={y + 3} textAnchor="middle" className="fill-ink0 font-mono" fontSize="8">
            {i + 1}
          </text>
          <text x={x + 11} y={y + 3} className="fill-ink2 font-mono" fontSize="7" letterSpacing="0.5">
            {order[i].label}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

export default function RouteCompare() {
  const { routes } = useRouteBoard();
  const [mode, setMode] = useState<"naive" | "optimized">("naive");
  const [scrub, setScrub] = useState(0); // 0 = naive, 1 = optimized
  const [result, setResult] = useState<{ savedKm: number; savedPct: number } | null>(null);
  const [ran, setRan] = useState(false);

  const naiveKm = useMemo(() => routeKm(NAIVE_STOPS, DEPOT), []);
  const optimized = useMemo(() => optimizeRoute(NAIVE_STOPS, DEPOT), []);
  const savedKm = Math.max(0, naiveKm - optimized.totalKm);
  const savedPct = naiveKm > 0 ? (savedKm / naiveKm) * 100 : 0;

  const optimizeMut = trpc.fleet.optimizeRoute.useMutation();

  function runOptimizer() {
    const routeId = routes[0]?.id ?? 1;
    optimizeMut.mutate(
      { routeId },
      {
        onSuccess: (r) => {
          setResult({ savedKm: r.savedKm, savedPct: r.savedPct });
          setRan(true);
          setMode("optimized");
        },
        onError: () => {
          // offline demo: compute the identical result from the pure contract fn
          setResult({ savedKm: Math.round(savedKm * 10) / 10, savedPct: Math.round(savedPct * 10) / 10 });
          setRan(true);
          setMode("optimized");
        },
      }
    );
  }

  return (
    <section className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>OPTIMIZE</SectionKicker>
        <h2 className="mt-6 max-w-[760px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Same stops. {Math.round(savedPct)}% less road.
        </h2>

        <div data-tour="route-optimizer" className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* naive */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12% 0px" }}
                transition={{ duration: 0.7, ease: EASE }}
                className={cn(
                  "rounded-xl border bg-surface p-4 transition-opacity duration-300",
                  mode === "optimized" && "opacity-45"
                )}
                style={{ borderColor: "var(--line)" }}
              >
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                  <span className="text-warn">PLANNED NAIVE</span>
                  <span className="text-ink2 font-tnum">{naiveKm.toFixed(0)} KM · {fmtDuration(naiveKm)}</span>
                </div>
                <MiniMap order={NAIVE_STOPS} optimized={false} drawKey="naive" />
              </motion.div>
              {/* optimized */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12% 0px" }}
                transition={{ delay: 0.12, duration: 0.7, ease: EASE }}
                className={cn(
                  "rounded-xl border bg-surface p-4 transition-opacity duration-300",
                  mode === "naive" && "opacity-45"
                )}
                style={{ borderColor: "var(--line)" }}
              >
                <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em]">
                  <span className="text-data">STACKLINE OPTIMIZED</span>
                  <span className="text-ink2 font-tnum">
                    {optimized.totalKm.toFixed(0)} KM · {fmtDuration(optimized.totalKm)} ·{" "}
                    <span className="text-data">−{Math.round(savedPct)}%</span>
                  </span>
                </div>
                <MiniMap order={optimized.orderedStops} optimized drawKey={mode} />
              </motion.div>
            </div>

            {/* toggle + scrub */}
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex overflow-hidden rounded-lg border border-line">
                {(["naive", "optimized"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMode(m);
                      setScrub(m === "optimized" ? 1 : 0);
                    }}
                    className={cn(
                      "px-4 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-200",
                      mode === m ? "bg-brand text-onbrand" : "bg-surface text-ink2 hover:text-ink1"
                    )}
                  >
                    {m === "naive" ? "SHOW NAIVE" : "OPTIMIZED"}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scrub * 100}
                aria-label="Scrub between naive and optimized"
                onChange={(e) => {
                  const v = Number(e.target.value) / 100;
                  setScrub(v);
                  setMode(v > 0.5 ? "optimized" : "naive");
                }}
                className="h-1 w-44 cursor-ew-resize appearance-none rounded-full bg-raised accent-[var(--accent)]"
              />
              <button
                type="button"
                onClick={runOptimizer}
                disabled={optimizeMut.isPending}
                className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 font-display text-[13px] font-semibold text-onbrand transition-colors hover:bg-brand-hover disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                {optimizeMut.isPending ? "Optimizing…" : "Run optimizer"}
              </button>
              <AnimatePresence>
                {ran && result && (
                  <motion.span
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-md border border-data/50 bg-data-soft px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-data"
                  >
                    SAVED {result.savedKm.toFixed(1)} KM · −{result.savedPct.toFixed(0)}% ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">
              CONSTRAINTS: TIME WINDOWS · VEHICLE CAPACITY (FROM /TRANSPORT) · DRIVER HOURS
              {mode === "optimized"
                ? ` · SHOWING ${optimized.totalKm.toFixed(0)} KM`
                : ` · SHOWING ${naiveKm.toFixed(0)} KM`}
            </p>
          </div>

          {/* right rail stats */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.7, ease: EASE }}
            className="flex flex-col justify-center gap-8 rounded-xl border border-line bg-surface p-6"
          >
            <MetricStat value={Math.round(savedPct)} suffix="%" caption="KM SAVED PER RUN" />
            <MetricStat value={2} caption="EXTRA STOPS / VEHICLE / DAY" />
            <MetricStat value={4.1} decimals={1} prefix="−₹" suffix="L" caption="FUEL / MONTH / 8 TRUCKS" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
