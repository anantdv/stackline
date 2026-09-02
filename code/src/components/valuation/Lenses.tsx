import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { hierarchy, partition } from "d3-hierarchy";
import { scaleLinear } from "d3-scale";
import ErpPriceBadge from "./ErpPriceBadge";
import { ageClass } from "./ValueTreemap";
import { DEMO_ITEMS, DEMO_RACKS, binValueDensity, value, type DemoItem, type TMNode } from "./demo";
import { inrCompact, num } from "@/components/network/demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Lens = "SUNBURST" | "HEATMAP" | "PARETO / ABC" | "GRID";
const LENSES: Lens[] = ["SUNBURST", "HEATMAP", "PARETO / ABC", "GRID"];

/* ------------------------------------------------------------------ */
/* Sunburst                                                            */
/* ------------------------------------------------------------------ */

function arcPath(x0: number, x1: number, y0: number, y1: number, r: number, pad = 0.004) {
  const cx = 260;
  const cy = 260;
  const a0 = x0 - Math.PI / 2 + pad;
  const a1 = x1 - Math.PI / 2 - pad;
  const r0 = (y0 / 1) * r;
  const r1 = (y1 / 1) * r;
  const p = (rr: number, a: number) => `${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  if (r0 < 1) {
    return `M ${cx} ${cy} L ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} Z`;
  }
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
}

function Sunburst({ root }: { root: TMNode }) {
  const [hovered, setHovered] = useState<TMNode | null>(null);
  const nodes = useMemo(() => {
    const h = hierarchy<TMNode>(root, (d) => d.children)
      .sum((d) => (d.children ? 0 : d.value ?? 0))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    const layout = partition<TMNode>().size([2 * Math.PI, 3]).padding(0.002);
    return layout(h).descendants().filter((d) => d.depth > 0);
  }, [root]);

  const center = hovered ?? root;
  const centerValue = useMemo(() => {
    const s = (n: TMNode): number =>
      n.children ? n.children.reduce((a, c) => a + s(c), 0) : n.value ?? 0;
    return s(center);
  }, [center]);

  return (
    <div className="relative mx-auto max-w-[560px]">
      <svg viewBox="0 0 520 520" className="w-full">
        {nodes.map((n, i) => {
          const c = ageClass(n.data.ageDays);
          const isHover = hovered === n.data;
          return (
            <motion.path
              key={`${n.data.name}-${n.depth}-${i}`}
              d={arcPath(n.x0, n.x1, n.y0, n.y1, 170)}
              className={cn(c.fill, c.stroke)}
              strokeWidth={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: hovered == null || isHover ? 1 : 0.45 }}
              transition={{ duration: 0.6, delay: Math.min(i * 0.012, 1), ease: EASE }}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(n.data)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* center readout */}
        <text
          x={260}
          y={252}
          textAnchor="middle"
          fontSize={15}
          fontFamily="'JetBrains Mono', monospace"
          className="fill-ink0"
          fontWeight={600}
        >
          {inrCompact(centerValue)}
        </text>
        <text
          x={260}
          y={272}
          textAnchor="middle"
          fontSize={9}
          fontFamily="'JetBrains Mono', monospace"
          letterSpacing={1.4}
          className="fill-ink2"
        >
          {(hovered?.name ?? "TOTAL").slice(0, 22)}
        </text>
      </svg>
      <div className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        RINGS: LOCATION ▸ WAREHOUSE ▸ GROUP ▸ ITEM
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Heatmap — physical rack grid, cell = value density                  */
/* ------------------------------------------------------------------ */

function Heatmap({ warehouse }: { warehouse: string }) {
  const [tip, setTip] = useState<{ rack: string; level: number; v: number } | null>(null);
  const scale = scaleLinear<string>().domain([0, 0.55, 0.9, 1]).range([
    "var(--bg-raised)",
    "var(--data)",
    "var(--data)",
    "var(--accent)",
  ]);
  return (
    <div className="relative">
      <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1.5">
        {DEMO_RACKS.map((rack, ri) =>
          [1, 2, 3, 4].map((level) => {
            const v = binValueDensity(`${warehouse}:${rack}`, level);
            const top = v >= 0.9;
            return (
              <motion.button
                key={`${rack}-${level}`}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: ri * 0.02 + level * 0.01, duration: 0.35, ease: EASE }}
                className="aspect-[4/3] rounded-[4px] border border-line/60 transition-transform hover:scale-110 hover:border-linestrong"
                style={{
                  background: scale(v),
                  opacity: undefined,
                  boxShadow: top ? "0 0 10px rgba(255,107,26,0.35)" : undefined,
                }}
                onMouseEnter={() => setTip({ rack, level, v })}
                onMouseLeave={() => setTip(null)}
                aria-label={`${rack} level ${level}`}
              />
            );
          })
        )}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-ink2">
        <span>ROWS: RACKS A-01…A-12 · COLS: LEVELS L1–L4 · {warehouse}</span>
        <span className="flex items-center gap-2">
          LOW <span className="inline-block h-2 w-16 rounded bg-gradient-to-r from-raised via-data to-brand" /> HIGH
        </span>
      </div>
      <AnimatePresence>
        {tip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2 rounded-lg border border-linestrong bg-raised px-3 py-2 font-mono text-[10px] tracking-[0.1em] text-ink0 shadow-lg"
          >
            {tip.rack}-02-0{tip.level} · {inrCompact(Math.round(tip.v * 1_20_000))} ·{" "}
            {Math.round(2 + tip.v * 14)} CARTONS
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pareto / ABC                                                        */
/* ------------------------------------------------------------------ */

function Pareto({ items }: { items: DemoItem[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const sorted = useMemo(() => [...items].sort((a, b) => value(b) - value(a)), [items]);
  const total = sorted.reduce((s, i) => s + value(i), 0);
  const W = 920;
  const H = 300;
  const PAD = 36;

  let cum = 0;
  const pts = sorted.map((it, i) => {
    cum += value(it);
    return {
      i,
      it,
      cumPct: (cum / total) * 100,
      x: PAD + (i / Math.max(1, sorted.length - 1)) * (W - PAD * 2),
      y: H - PAD - (cum / total) * (H - PAD * 2),
    };
  });

  const a80 = pts.findIndex((p) => p.cumPct >= 80);
  const a95 = pts.findIndex((p) => p.cumPct >= 95);
  const area = `M ${PAD} ${H - PAD} ` + pts.map((p) => `L ${p.x} ${p.y}`).join(" ") + ` L ${W - PAD} ${H - PAD} Z`;
  const line = "M " + pts.map((p) => `${p.x} ${p.y}`).join(" L ");

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {/* gridlines */}
        {[25, 50, 75, 100].map((p) => {
          const y = H - PAD - (p / 100) * (H - PAD * 2);
          return (
            <g key={p}>
              <line x1={PAD} x2={W - PAD} y1={y} y2={y} className="stroke-line" strokeWidth={1} />
              <text x={8} y={y + 3} fontSize={9} className="fill-ink2" fontFamily="'JetBrains Mono', monospace">
                {p}%
              </text>
            </g>
          );
        })}
        {/* ABC zone shading */}
        <rect x={PAD} y={PAD} width={a80 >= 0 ? pts[a80].x - PAD : 0} height={H - PAD * 2} className="fill-data/10" />
        {a80 >= 0 && a95 >= 0 && (
          <rect x={pts[a80].x} y={PAD} width={pts[a95].x - pts[a80].x} height={H - PAD * 2} className="fill-warn/10" />
        )}
        {a95 >= 0 && (
          <rect x={pts[a95].x} y={PAD} width={W - PAD - pts[a95].x} height={H - PAD * 2} className="fill-crit/10" />
        )}
        {/* area + line */}
        <motion.path d={area} className="fill-data/15" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} />
        <motion.path
          d={line}
          fill="none"
          className="stroke-data"
          strokeWidth={2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: EASE }}
        />
        {/* 80/95 markers */}
        {[a80, a95].map((idx, k) =>
          idx >= 0 ? (
            <g key={k}>
              <line x1={pts[idx].x} x2={pts[idx].x} y1={PAD} y2={H - PAD} className={k === 0 ? "stroke-warn" : "stroke-crit"} strokeWidth={1} strokeDasharray="4 4" />
              <text x={pts[idx].x + 4} y={PAD + 12} fontSize={9} fontFamily="'JetBrains Mono', monospace" className={k === 0 ? "fill-warn" : "fill-crit"}>
                {k === 0 ? "80%" : "95%"}
              </text>
            </g>
          ) : null
        )}
        {/* hover points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hover === i ? 5 : 3}
            className={cn("cursor-pointer", hover === i ? "fill-brand" : "fill-data")}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] tracking-[0.14em] text-ink2">
        <span>
          {a80 >= 0 ? a80 + 1 : sorted.length} SKUS = 80% OF VALUE
          {hover != null && pts[hover] && (
            <span className="ml-4 text-ink0">
              {pts[hover].it.sku} · {inrCompact(value(pts[hover].it))} · CUM {pts[hover].cumPct.toFixed(1)}%
            </span>
          )}
        </span>
        <span>
          <span className="text-data">A</span> / <span className="text-warn">B</span> / <span className="text-crit">C</span> CLASSES
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Grid — dense item-wise table                                        */
/* ------------------------------------------------------------------ */

type SortKey = "sku" | "group" | "qty" | "rate" | "value" | "ageDays";

function GridTable({ items }: { items: DemoItem[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [dir, setDir] = useState<1 | -1>(-1);
  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const va = sortKey === "value" ? value(a) : a[sortKey];
      const vb = sortKey === "value" ? value(b) : b[sortKey];
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [items, sortKey, dir]);

  const cols: { key: SortKey; label: string; right?: boolean }[] = [
    { key: "sku", label: "SKU" },
    { key: "group", label: "GROUP" },
    { key: "qty", label: "QTY", right: true },
    { key: "rate", label: "RATE ₹", right: true },
    { key: "value", label: "VALUE ₹", right: true },
    { key: "ageDays", label: "AGE", right: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] font-mono text-xs">
        <thead>
          <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.16em] text-ink2">
            {cols.map((c) => (
              <th
                key={c.key}
                onClick={() => {
                  if (sortKey === c.key) setDir((d) => (d === 1 ? -1 : 1));
                  else {
                    setSortKey(c.key);
                    setDir(-1);
                  }
                }}
                className={cn(
                  "cursor-pointer select-none pb-3 pr-4 font-medium transition-colors hover:text-ink0",
                  c.right && "text-right",
                  sortKey === c.key && "text-brand"
                )}
              >
                {c.label} {sortKey === c.key ? (dir === -1 ? "↓" : "↑") : ""}
              </th>
            ))}
            <th className="pb-3 pr-4 font-medium">VARIANT</th>
            <th className="pb-3 font-medium">WH ▸ RACK</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((i, idx) => (
            <motion.tr
              key={i.sku + i.rack}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(idx * 0.03, 0.6) }}
              className="border-b border-line/50 hover:bg-raised/40"
            >
              <td className="py-2 pr-4 text-data">{i.sku}</td>
              <td className="py-2 pr-4 text-ink1">{i.group}</td>
              <td className="py-2 pr-4 text-right text-ink1 font-tnum">{num(i.qty)}</td>
              <td className="py-2 pr-4 text-right text-ink1 font-tnum">{num(i.rate)}</td>
              <td className="py-2 pr-4 text-right text-ink0 font-tnum">{inrCompact(value(i))}</td>
              <td className={cn("py-2 pr-4 text-right font-tnum", ageClass(i.ageDays).text)}>
                {i.ageDays}D
              </td>
              <td className="py-2 pr-4 text-ink2">{i.variant}</td>
              <td className="py-2 text-ink2">{i.warehouse} ▸ {i.rack}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabbed lenses                                                       */
/* ------------------------------------------------------------------ */

export default function Lenses({
  root,
  warehouse,
  live,
}: {
  root: TMNode;
  warehouse: string;
  live: boolean;
}) {
  const [lens, setLens] = useState<Lens>("SUNBURST");
  const items = useMemo(
    () => (warehouse === "ALL" ? DEMO_ITEMS : DEMO_ITEMS.filter((i) => i.warehouse === warehouse)),
    [warehouse]
  );

  return (
    <div data-tour="lenses">
      <div className="flex flex-wrap items-center gap-2">
        {LENSES.map((l) => (
          <button
            key={l}
            onClick={() => setLens(l)}
            className={cn(
              "relative rounded-lg px-4 py-2 font-mono text-[11px] tracking-[0.14em] transition-colors",
              lens === l ? "text-onbrand" : "text-ink1 hover:text-ink0"
            )}
          >
            {lens === l && (
              <motion.span
                layoutId="lens-pill"
                className="absolute inset-0 rounded-lg bg-brand"
                transition={{ duration: 0.25, ease: EASE }}
              />
            )}
            <span className="relative">{l}</span>
          </button>
        ))}
        <span className="ml-auto"><ErpPriceBadge live={live} size="sm" /></span>
      </div>

      <div className="mt-8 min-h-[380px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={lens}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {lens === "SUNBURST" && <Sunburst root={root} />}
            {lens === "HEATMAP" && <Heatmap warehouse={warehouse} />}
            {lens === "PARETO / ABC" && <Pareto items={items} />}
            {lens === "GRID" && <GridTable items={items} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
