/**
 * Dashboard §2 — KPI Command Strip: six BlueprintCard tiles with count-up
 * values, d3-scale sparklines over the selected window, and delta chips.
 * The compliance-exceptions tile inverts the palette while count > 0.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { scaleLinear } from "d3-scale";
import BlueprintCard from "@/components/BlueprintCard";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import { formatINR } from "@contracts/types";
import { inrCompact, num } from "@/components/network/demo";
import { cn } from "@/lib/utils";
import { KPI_DEMO, capVar, sparkSeries, type DashWindow } from "./demo";
import type { DashboardData } from "./useDashboardData";
import { istTime } from "./CommandBar";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** rAF count-up: tweens toward target on mount and on change (1.4s). */
function useTweenNumber(target: number, duration = 1400): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    if (reduced) {
      setValue(target);
      return;
    }
    const from = fromRef.current;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 4);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Sparkline (hand-rolled SVG, d3-scale linear)                       */
/* ------------------------------------------------------------------ */

function Sparkline({
  points,
  tone,
  delay,
}: {
  points: number[];
  tone: string; // CSS var color
  delay: number;
}) {
  const W = 96;
  const H = 28;
  const d = useMemo(() => {
    const x = scaleLinear().domain([0, points.length - 1]).range([1, W - 1]);
    const y = scaleLinear()
      .domain([Math.min(...points), Math.max(...points)])
      .range([H - 2, 2]);
    return points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  }, [points]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-24" aria-hidden>
      <motion.path
        key={d}
        d={d}
        fill="none"
        stroke={tone}
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.9, delay, ease: EASE }}
        className="opacity-70 transition-opacity duration-300 group-hover:opacity-100"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Tile                                                               */
/* ------------------------------------------------------------------ */

type TileSpec = {
  key: string;
  label: string;
  render: (v: number) => string;
  target: number;
  sparkKey: string;
  trend: "up" | "down" | "flat";
  delta: string;
  deltaTone: "data" | "crit";
  tooltip: (v: number) => string;
  crit?: boolean;
  badge?: boolean;
  capacityBar?: boolean;
};

function Tile({
  spec,
  index,
  window,
  live,
  onToggleLive,
}: {
  spec: TileSpec;
  index: number;
  window: DashWindow;
  live: boolean;
  onToggleLive: (l: boolean) => void;
}) {
  const value = useTweenNumber(spec.target);
  const [tip, setTip] = useState(false);
  const points = useMemo(
    () => sparkSeries(spec.sparkKey, window, spec.trend),
    [spec.sparkKey, window, spec.trend]
  );
  const crit = spec.crit && spec.target > 0;
  const tone = crit ? "var(--crit)" : "var(--data)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: EASE }}
      className="min-w-[200px] snap-start"
    >
      <BlueprintCard
        className={cn(
          "relative h-full p-4",
          crit && "border-t-2 border-t-crit"
        )}
      >
        {crit && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-crit/40 motion-safe:animate-[pulse-dot_2s_ease-in-out_infinite]"
          />
        )}
        <div
          className="relative"
          onMouseEnter={() => setTip(true)}
          onMouseLeave={() => setTip(false)}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  crit ? "bg-crit animate-pulse-dot" : "bg-data"
                )}
              />
              {spec.label}
            </span>
            {spec.badge && <ErpPriceBadge live={live} onToggle={onToggleLive} size="sm" />}
          </div>

          <div
            className={cn(
              "mt-3 font-display text-[32px] font-semibold leading-none tracking-tight font-tnum",
              crit ? "text-crit" : "text-ink0"
            )}
          >
            {spec.render(value)}
          </div>
          {crit === false && spec.key === "exceptions" && (
            <span className="mt-1 block font-mono text-[9px] tracking-[0.14em] text-data">
              ALL CLEAR
            </span>
          )}
          {spec.capacityBar && (
            <span className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-raised" aria-hidden>
              <motion.span
                className="block h-full rounded-full"
                style={{ background: capVar(spec.target) }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, spec.target)}%` }}
                transition={{ duration: 1.2, delay: 0.3 + index * 0.07, ease: EASE }}
              />
            </span>
          )}

          <div className="mt-3 flex items-end justify-between gap-2">
            <Sparkline points={points} tone={tone} delay={index * 0.07} />
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[9px] tracking-[0.08em] font-tnum",
                spec.deltaTone === "data"
                  ? "border-data/30 bg-data-soft text-data"
                  : "border-crit/30 bg-crit/10 text-crit"
              )}
            >
              {spec.delta}
            </span>
          </div>

          {tip && (
            <span className="pointer-events-none absolute left-0 top-full z-40 mt-2 w-max max-w-[260px] rounded-lg border border-line bg-raised p-3 font-mono text-[10px] normal-case leading-relaxed tracking-normal text-ink1 shadow-lg">
              {spec.tooltip(spec.target)}
              <br />
              <span className="text-ink2">AS OF {istTime(new Date()).slice(0, 5)} IST</span>
            </span>
          )}
        </div>
      </BlueprintCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Strip                                                              */
/* ------------------------------------------------------------------ */

export default function KpiStrip({
  data,
  window,
}: {
  data: DashboardData;
  window: DashWindow;
}) {
  const k = data.kpis;
  const specs: TileSpec[] = [
    {
      key: "stock",
      label: "NETWORK STOCK VALUE",
      target: k.stockValueInr / 1e7, // crores
      render: (v) => inrCompact(v * 1e7),
      sparkKey: "stock",
      trend: "up",
      delta: `▲ ${KPI_DEMO.deltas.stockValue}%`,
      deltaTone: "data",
      tooltip: () => `${formatINR(Math.round(k.stockValueInr) * 100)} · ERPNEXT FIFO`,
      badge: true,
    },
    {
      key: "units",
      label: "UNITS ON HAND",
      target: k.unitsOnHand,
      render: (v) => num(Math.round(v)),
      sparkKey: "units",
      trend: "up",
      delta: `▲ ${KPI_DEMO.deltas.units}%`,
      deltaTone: "data",
      tooltip: () => `${num(k.unitsOnHand)} CARTONS ACROSS 4 WAREHOUSES`,
    },
    {
      key: "capacity",
      label: "CAPACITY UTIL",
      target: k.capacityUtil,
      render: (v) => `${v.toFixed(1)}%`,
      sparkKey: "capacity",
      trend: "up",
      delta: `▲ ${KPI_DEMO.deltas.capacity}PTS`,
      deltaTone: "data",
      tooltip: () => `${k.capacityUtil.toFixed(1)}% NETWORK-WIDE · BIN-WEIGHTED`,
      capacityBar: true,
    },
    {
      key: "movements",
      label: "OPEN MOVEMENTS",
      target: k.openMovements,
      render: (v) => String(Math.round(v)),
      sparkKey: "movements",
      trend: "down",
      delta: `▼ ${KPI_DEMO.deltas.movements.replace("-", "")}`,
      deltaTone: "data",
      tooltip: () =>
        `${k.movementSplit.putaway} PUTAWAY · ${k.movementSplit.pick} PICK · ${k.movementSplit.transfer} TRANSFER`,
    },
    {
      key: "vehicles",
      label: "VEHICLES ENROUTE",
      target: k.vehiclesEnroute,
      render: (v) => `${Math.round(v)} / ${k.vehiclesTotal}`,
      sparkKey: "vehicles",
      trend: "up",
      delta: `▲ ${KPI_DEMO.deltas.vehicles}`,
      deltaTone: "data",
      tooltip: () => `${k.vehiclesEnroute} OF ${k.vehiclesTotal} VEHICLES ON THE ROAD`,
    },
    {
      key: "exceptions",
      label: "COMPLIANCE EXCEPTIONS",
      target: k.exceptions,
      render: (v) => String(Math.round(v)),
      sparkKey: "exceptions",
      trend: "up",
      delta: `▲ ${KPI_DEMO.deltas.exceptions}`,
      deltaTone: "crit",
      tooltip: () =>
        k.exceptions > 0
          ? `${k.exceptions} DOCS/EWB FLAGS NEED ACTION · OPEN DISPATCH →`
          : "ALL CLEAR",
      crit: true,
    },
  ];

  return (
    <section
      data-tour="kpi-strip"
      className="border-b border-line bg-page py-6"
      aria-label="Key performance indicators"
    >
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="grid grid-cols-1 gap-4 max-lg:auto-cols-[minmax(200px,1fr)] max-lg:grid-flow-col max-lg:overflow-x-auto max-lg:snap-x max-lg:pb-2 md:grid-cols-3 lg:grid-cols-6">
          {specs.map((s, i) => (
            <Tile
              key={s.key}
              spec={s}
              index={i}
              window={window}
              live={data.live}
              onToggleLive={data.setLiveOverride}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
