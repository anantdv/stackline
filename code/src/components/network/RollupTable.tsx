import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import {
  DEMO_NETWORK,
  hash01,
  inrCompact,
  num,
  type NetLocation,
} from "./demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function utilColor(u: number) {
  return u < 70 ? "var(--data)" : u < 90 ? "var(--warn)" : "var(--crit)";
}

/** 30d sparkline, deterministic per key. */
function Spark({ seed, w = 72, h = 20 }: { seed: string; w?: number; h?: number }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const x = (i / 11) * w;
    const y = h - 3 - hash01(`${seed}:${i}`) * (h - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <motion.polyline
        points={pts}
        fill="none"
        className="stroke-data"
        strokeWidth={1.4}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: EASE }}
      />
    </svg>
  );
}

function UtilBar({ util }: { util: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-raised">
        <motion.div
          className="h-full rounded-full"
          style={{ background: utilColor(util) }}
          initial={{ width: 0 }}
          whileInView={{ width: `${util}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
        />
      </div>
      <span className="font-tnum text-ink1">{util}%</span>
    </div>
  );
}

type Row = {
  key: string;
  depth: 0 | 1 | 2;
  label: string;
  bins: number;
  util: number;
  skus: number;
  valueInr: number;
  expandable: boolean;
  parentKey?: string;
};

export default function RollupTable({
  locations,
  live,
}: {
  locations: NetLocation[];
  live: boolean;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({ [locations[0]?.code ?? ""]: true });

  /* Build flat row list: location → warehouse → zone (zones from demo detail). */
  const rows: Row[] = [];
  for (const loc of locations) {
    const demoLoc = DEMO_NETWORK.find((d) => d.code === loc.code);
    rows.push({
      key: loc.code,
      depth: 0,
      label: loc.code,
      bins: loc.totals.bins,
      util: Math.round(
        loc.warehouses.reduce((s, w) => s + w.util, 0) /
          Math.max(1, loc.warehouses.length)
      ),
      skus: loc.warehouses.reduce((s, w) => s + w.skus, 0),
      valueInr: loc.totals.valueInr,
      expandable: true,
    });
    for (const w of loc.warehouses) {
      const demoWh = demoLoc?.warehouses.find((d) => d.code === w.code);
      const wKey = `${loc.code}/${w.code}`;
      rows.push({
        key: wKey,
        depth: 1,
        label: `${w.code} — ${w.name}`,
        bins: w.bins,
        util: w.util,
        skus: w.skus,
        valueInr: w.valueInr,
        expandable: (demoWh?.zones.length ?? 0) > 0,
        parentKey: loc.code,
      });
      for (const z of demoWh?.zones ?? []) {
        rows.push({
          key: `${wKey}/${z.code}`,
          depth: 2,
          label: `ZONE-${z.code} · ${z.name}`,
          bins: z.bins,
          util: z.util,
          skus: z.skus,
          valueInr: z.valueInr,
          expandable: false,
          parentKey: wKey,
        });
      }
    }
  }

  const totals = {
    bins: locations.reduce((s, l) => s + l.totals.bins, 0),
    valueInr: locations.reduce((s, l) => s + l.totals.valueInr, 0),
    skus: locations.reduce((s, l) => s + l.warehouses.reduce((a, w) => a + w.skus, 0), 0),
  };

  const visible = (r: Row) =>
    r.depth === 0 ||
    (r.depth === 1 && open[r.parentKey!]) ||
    (r.depth === 2 && open[r.parentKey!] && open[r.parentKey!.split("/")[0]]);

  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>ROLLUP</SectionKicker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="The network, as one table." />
          </h2>
          <ErpPriceBadge live={live} />
        </div>

        <div data-tour="rollup-table">
        <BlueprintCard className="mt-14 overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] font-mono text-xs">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.16em] text-ink2">
                  <th className="px-5 py-3 font-medium">NODE</th>
                  <th className="px-4 py-3 text-right font-medium">BINS</th>
                  <th className="px-4 py-3 font-medium">UTIL %</th>
                  <th className="px-4 py-3 text-right font-medium">SKUS</th>
                  <th className="px-4 py-3 text-right font-medium">VALUE ₹</th>
                  <th className="px-5 py-3 font-medium">30D TREND</th>
                </tr>
              </thead>
              <tbody>
                {/* network totals row */}
                <tr className="border-b border-line bg-brand-soft/40">
                  <td className="px-5 py-3 font-semibold text-ink0" colSpan={1}>
                    <span className="border-l-2 border-brand pl-2">NETWORK TOTAL</span>
                  </td>
                  <td className="px-4 py-3 text-right text-ink0 font-tnum">{num(totals.bins)}</td>
                  <td className="px-4 py-3 text-ink2">—</td>
                  <td className="px-4 py-3 text-right text-ink0 font-tnum">{num(totals.skus)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-brand font-tnum">
                    {inrCompact(totals.valueInr)}
                  </td>
                  <td className="px-5 py-3"><Spark seed="network-total" /></td>
                </tr>
                <AnimatePresence initial={false}>
                  {rows.filter(visible).map((r) => (
                    <motion.tr
                      key={r.key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className={cn(
                        "border-b border-line/50",
                        r.depth === 0 && "bg-raised/40",
                        r.expandable && "cursor-pointer hover:bg-raised/60"
                      )}
                      onClick={
                        r.expandable
                          ? () => setOpen((o) => ({ ...o, [r.key]: !o[r.key] }))
                          : undefined
                      }
                    >
                      <td className="px-5 py-2.5 text-ink0">
                        <span
                          className="flex items-center gap-1.5"
                          style={{ paddingLeft: r.depth * 18 }}
                        >
                          {r.expandable ? (
                            <ChevronRight
                              className={cn(
                                "h-3.5 w-3.5 text-ink2 transition-transform duration-300",
                                open[r.key] && "rotate-90 text-brand"
                              )}
                            />
                          ) : (
                            <span className="w-3.5" />
                          )}
                          <span className={r.depth === 0 ? "font-semibold" : undefined}>
                            {r.label}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink1 font-tnum">{num(r.bins)}</td>
                      <td className="px-4 py-2.5"><UtilBar util={r.util} /></td>
                      <td className="px-4 py-2.5 text-right text-ink1 font-tnum">{num(r.skus)}</td>
                      <td className="px-4 py-2.5 text-right text-ink0 font-tnum">
                        {inrCompact(r.valueInr)}
                      </td>
                      <td className="px-5 py-2.5"><Spark seed={r.key} /></td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </BlueprintCard>
        </div>
      </div>
    </section>
  );
}
