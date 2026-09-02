import { useState } from "react";
import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import ErpPriceBadge from "./ErpPriceBadge";
import { DEMO_DEAD_STOCK } from "./demo";
import { inrCompact, num } from "@/components/network/demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export type AgingBucketView = { label: string; valueInr: number; qty: number; skus: number };

const BUCKET_CLASSES = [
  "bg-data/70",
  "bg-warn/70",
  "bg-warn",
  "bg-crit/80",
];

function AgingBars({ buckets }: { buckets: AgingBucketView[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...buckets.map((b) => b.valueInr), 1);
  return (
    <div className="flex h-64 items-end gap-4">
      {buckets.map((b, i) => (
        <div
          key={b.label}
          className="flex flex-1 flex-col items-center gap-2"
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
        >
          <span className="font-mono text-[11px] font-semibold text-ink0 font-tnum">
            {inrCompact(b.valueInr)}
          </span>
          <motion.div
            className={cn("w-full rounded-t-md transition-opacity duration-300", BUCKET_CLASSES[i % BUCKET_CLASSES.length])}
            initial={{ height: 0 }}
            whileInView={{ height: `${(b.valueInr / max) * 170}px` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.12, ease: EASE }}
            style={{ opacity: hover == null || hover === i ? 1 : 0.4 }}
          />
          <span className="font-mono text-[10px] tracking-[0.14em] text-ink2">{b.label}</span>
          <span className="font-mono text-[9px] text-ink2 font-tnum">
            {num(b.qty)} UNITS · {b.skus} SKUS
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AgingSection({
  buckets,
  live,
}: {
  buckets: AgingBucketView[];
  live: boolean;
}) {
  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>RISK</SectionKicker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="Money that stopped moving." />
          </h2>
          <ErpPriceBadge live={live} />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[55fr_45fr]">
          {/* aging buckets */}
          <div data-tour="aging">
          <BlueprintCard className="p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
              AGING BUCKETS · VALUE LOCKED
            </span>
            <div className="mt-6">
              <AgingBars buckets={buckets} />
            </div>
            <p className="mt-6 border-t border-line pt-4 font-mono text-[10px] leading-relaxed tracking-[0.1em] text-ink2">
              AGING BASIS: ERPNEXT STOCK LEDGER ENTRIES · FEFO LOTS
            </p>
          </BlueprintCard>
          </div>

          {/* dead-stock table */}
          <BlueprintCard className="p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
              DEAD STOCK · TOP {DEMO_DEAD_STOCK.length} BY VALUE
            </span>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full font-mono text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-[0.16em] text-ink2">
                    <th className="pb-2 pr-3 font-medium">SKU</th>
                    <th className="pb-2 pr-3 text-right font-medium">QTY</th>
                    <th className="pb-2 pr-3 text-right font-medium">VALUE ₹</th>
                    <th className="pb-2 pr-3 text-right font-medium">DAYS IDLE</th>
                    <th className="pb-2 font-medium">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {DEMO_DEAD_STOCK.map((d, i) => (
                    <motion.tr
                      key={d.sku}
                      initial={{ opacity: 0, y: 8 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                      className="border-b border-line/50"
                    >
                      <td className="py-2.5 pr-3">
                        <span className="text-data">{d.sku}</span>
                        <span className="block text-[10px] text-ink2">{d.name} · {d.group}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-ink1 font-tnum">{num(d.qty)}</td>
                      <td className="py-2.5 pr-3 text-right text-ink0 font-tnum">{inrCompact(d.valueInr)}</td>
                      <td className={cn("py-2.5 pr-3 text-right font-tnum", d.daysIdle >= 90 ? "text-crit" : "text-warn")}>
                        {d.daysIdle}
                      </td>
                      <td className="py-2.5">
                        <motion.span
                          initial={{ opacity: 0, x: -6 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                          className="inline-block whitespace-nowrap rounded border border-brand/40 bg-brand-soft px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-brand"
                        >
                          {d.action}
                        </motion.span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </BlueprintCard>
        </div>
      </div>
    </section>
  );
}
