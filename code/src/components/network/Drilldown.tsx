import { useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import { inrCompact, num, type DemoLocation, type DemoZone } from "./demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Zone tint palette (theme tokens) — multi-category zones cycle through. */
const ZONE_TINTS = [
  { fill: "var(--data)", soft: "rgba(45,212,191,0.14)" },
  { fill: "var(--accent)", soft: "var(--accent-soft)" },
  { fill: "var(--warn)", soft: "rgba(255,176,32,0.12)" },
  { fill: "var(--text-2)", soft: "rgba(148,163,184,0.10)" },
];

function utilColor(u: number) {
  return u < 70 ? "var(--data)" : u < 90 ? "var(--warn)" : "var(--crit)";
}

/** Top-down 2D floor plan: zones as tinted blocks, width ∝ bin count. */
function ZoningMap({
  location,
  warehouseCode,
  hovered,
  onHover,
  singleCategory,
}: {
  location: DemoLocation;
  warehouseCode: string;
  hovered: string | null;
  onHover: (code: string | null) => void;
  singleCategory: boolean;
}) {
  const wh = location.warehouses.find((w) => w.code === warehouseCode)!;
  const totalBins = wh.zones.reduce((s, z) => s + z.bins, 0);
  const W = 640;
  const H = 400;
  const PAD = 18;
  let x = PAD;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      role="img"
      aria-label={`Floor plan of ${wh.name}`}
    >
      {/* floor outline + dimension ticks */}
      <rect
        x={PAD / 2}
        y={PAD / 2}
        width={W - PAD}
        height={H - PAD}
        fill="none"
        className="stroke-linestrong"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text
        x={W / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize={9}
        fontFamily="'JetBrains Mono', monospace"
        className="fill-ink2"
        letterSpacing={1.5}
      >
        {wh.code} FLOOR PLAN · {num(totalBins)} BINS
      </text>

      {wh.zones.map((z, i) => {
        const w = ((W - PAD * 2) * z.bins) / totalBins;
        const zx = x;
        x += w;
        const tint = singleCategory
          ? ZONE_TINTS[0]
          : ZONE_TINTS[i % ZONE_TINTS.length];
        const isHover = hovered === z.code;
        const dim = hovered != null && !isHover;
        return (
          <motion.g
            key={`${warehouseCode}-${z.code}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: dim ? 0.4 : 1, scale: 1, y: isHover ? -4 : 0 }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: EASE }}
            style={{ transformOrigin: `${zx + w / 2}px ${H / 2}px`, cursor: "pointer" }}
            onMouseEnter={() => onHover(z.code)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onHover(z.code)}
          >
            <rect
              x={zx + 3}
              y={PAD + 6}
              width={Math.max(w - 6, 8)}
              height={H - PAD * 2 - 26}
              rx={8}
              fill={tint.soft}
              stroke={tint.fill}
              strokeWidth={isHover ? 1.8 : 1}
            />
            {/* rack rows inside the zone */}
            {Array.from({ length: 5 }, (_, r) => (
              <line
                key={r}
                x1={zx + 14}
                x2={zx + w - 14}
                y1={PAD + 40 + r * 52}
                y2={PAD + 40 + r * 52}
                stroke={tint.fill}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.35}
                strokeDasharray="10 6"
              />
            ))}
            <text
              x={zx + 14}
              y={PAD + 26}
              fontSize={11}
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing={1.4}
              className="fill-ink0"
            >
              {z.name}
            </text>
            <text
              x={zx + 14}
              y={H - PAD - 14}
              fontSize={9}
              fontFamily="'JetBrains Mono', monospace"
              letterSpacing={1.2}
              className="fill-ink2"
            >
              {z.rule} · UTIL {z.util}%
            </text>
          </motion.g>
        );
      })}
    </svg>
  );
}

export default function Drilldown({
  location,
  warehouseCode,
  onWarehouseChange,
  live,
}: {
  location: DemoLocation;
  warehouseCode: string;
  onWarehouseChange: (code: string) => void;
  live: boolean;
}) {
  const wh =
    location.warehouses.find((w) => w.code === warehouseCode) ??
    location.warehouses[0];
  const [hoverZone, setHoverZone] = useState<string | null>(null);
  const [rackTip, setRackTip] = useState<string | null>(null);

  const zone: DemoZone =
    wh.zones.find((z) => z.code === hoverZone) ?? wh.zones[0];

  /* breadcrumb drill depth: 1 location, 2 warehouse, 3 zone */
  const depth = hoverZone != null ? 3 : 2;
  const crumbs = ["NETWORK", location.code, wh.code, hoverZone ? `ZONE-${zone.code}` : null].filter(
    Boolean
  ) as string[];

  const singleCategory = wh.categoryMode === "single-category";

  const stats = useMemo(
    () => [
      { label: "BINS", value: num(zone.bins) },
      { label: "UTIL", value: `${zone.util}%` },
      { label: "SKUS", value: num(zone.skus) },
      { label: "VALUE", value: inrCompact(zone.valueInr), money: true },
    ],
    [zone]
  );

  return (
    <section id="network-drilldown" className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>LOCATION.DRILLDOWN</SectionKicker>
        <h2 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
          <SplitWords text="Inside one pin: a campus of warehouses." />
        </h2>

        {/* breadcrumb rail */}
        <div className="sticky top-[76px] z-30 mt-10" data-tour="drilldown-rail">
          <div className="rounded-lg border border-line bg-raised/90 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] tracking-[0.14em]">
              {crumbs.map((c, i) => (
                <span key={`${c}-${i}`} className="flex items-center gap-2">
                  {i > 0 && <span className="text-ink2">▸</span>}
                  <span className={i === crumbs.length - 1 ? "text-brand" : "text-ink1"}>
                    {c}
                  </span>
                </span>
              ))}
              <span className="ml-auto hidden font-mono text-[10px] tracking-[0.14em] text-ink2 sm:block">
                DRILL {depth}/3
              </span>
            </div>
            <div className="mt-2 h-px w-full bg-line">
              <motion.div
                className="h-px bg-brand"
                animate={{ width: `${(depth / 3) * 100}%` }}
                transition={{ duration: 0.4, ease: EASE }}
              />
            </div>
          </div>
        </div>

        {/* warehouse tabs */}
        <div className="mt-8 flex flex-wrap gap-2" data-tour="warehouse-tabs">
          {location.warehouses.map((w) => (
            <button
              key={w.code}
              onClick={() => {
                onWarehouseChange(w.code);
                setHoverZone(null);
              }}
              className={cn(
                "rounded-lg border px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                wh.code === w.code
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-ink1 hover:border-linestrong hover:text-ink0"
              )}
            >
              {w.code}
              <span className="ml-2 text-[9px] text-ink2">{w.category}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[58fr_42fr]">
          {/* zoning map */}
          <div data-tour="zoning-map">
          <BlueprintCard className="aspect-[16/10] min-h-[340px] p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={wh.code}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="h-full w-full"
              >
                <ZoningMap
                  location={location}
                  warehouseCode={wh.code}
                  hovered={hoverZone}
                  onHover={setHoverZone}
                  singleCategory={singleCategory}
                />
              </motion.div>
            </AnimatePresence>
          </BlueprintCard>
          </div>

          {/* zone stats */}
          <BlueprintCard className="p-6">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
                ZONE ▸ <span className="text-brand">{zone.name}</span>
              </span>
              <ErpPriceBadge live={live} size="sm" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${wh.code}-${zone.code}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <div className="mt-5 grid grid-cols-2 gap-4">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-lg border border-line bg-raised/60 px-4 py-3">
                      <div className="font-display text-xl font-semibold text-ink0 font-tnum">
                        {s.value}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* capacity bar */}
                <div className="mt-5">
                  <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                    <span>CAPACITY</span>
                    <span>{zone.util}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-raised">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: utilColor(zone.util) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${zone.util}%` }}
                      transition={{ duration: 0.9, ease: EASE }}
                    />
                  </div>
                </div>

                {/* top SKUs */}
                <div className="mt-5 border-t border-line pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
                    TOP SKUS
                  </span>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {zone.topSkus.map((s) => (
                      <div
                        key={s.sku}
                        className="flex items-center justify-between font-mono text-xs"
                      >
                        <span className="text-ink1">
                          <span className="text-data">{s.sku}</span> · {s.name}
                        </span>
                        <span className="text-ink0 font-tnum">{num(s.qty)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </BlueprintCard>
        </div>

        {/* rack strip */}
        <div className="relative mt-8" data-tour="rack-strip">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
            ZONE-{zone.code} RACKS · CLICK FOR TWIN
          </span>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
            {zone.racks.map((r) => (
              <button
                key={r.code}
                onClick={() => setRackTip(rackTip === r.code ? null : r.code)}
                className="group flex w-14 shrink-0 flex-col items-center gap-1.5 rounded-lg border border-line bg-surface px-1 py-2 transition-colors hover:border-linestrong"
              >
                <span className="font-mono text-[9px] tracking-wide text-ink1">{r.code}</span>
                <span className="h-10 w-2 overflow-hidden rounded-sm bg-raised">
                  <span
                    className="block w-full translate-y-[calc(100%-var(--fill))]"
                    style={{
                      ["--fill" as string]: `${r.util}%`,
                      height: "100%",
                      background: utilColor(r.util),
                    }}
                  />
                </span>
                <span className="font-mono text-[9px] text-ink2 font-tnum">{r.util}%</span>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {rackTip && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-full left-0 mb-2 flex items-center gap-3 rounded-lg border border-linestrong bg-raised px-4 py-2 font-mono text-[11px] tracking-[0.1em] text-ink0 shadow-lg"
              >
                {rackTip} · {zone.racks.find((r) => r.code === rackTip)?.util}%
                <Link
                  to="/warehouse-3d"
                  className="flex items-center gap-1 text-brand hover:text-brand-hover"
                >
                  OPEN IN 3D TWIN <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
