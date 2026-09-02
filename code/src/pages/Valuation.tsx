import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileDown } from "lucide-react";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import { trpc } from "@/providers/trpc";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import ControlBar from "@/components/valuation/ControlBar";
import ValueTreemap from "@/components/valuation/ValueTreemap";
import Lenses from "@/components/valuation/Lenses";
import ValueTimeline from "@/components/valuation/ValueTimeline";
import AgingSection, { type AgingBucketView } from "@/components/valuation/AgingSection";
import {
  DEMO_AGING,
  buildHierarchy,
  type Breakdown,
  type Scope,
  type TMNode,
} from "@/components/valuation/demo";
import { hash01, inrCompact } from "@/components/network/demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const QUERY_OPTS = { retry: false, refetchOnWindowFocus: false, staleTime: 30_000 } as const;

const DEMO_TOTAL_VALUE = 18_42_00_000;

/* ------------------------------------------------------------------ */
/* §1 — Hero                                                           */
/* ------------------------------------------------------------------ */

function HeroStat({ target, live }: { target: number; live: boolean }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1600);
      setV(target * (1 - Math.pow(1 - t, 4)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <div className="mt-12 flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <span className="font-display text-5xl font-bold tracking-tight text-ink0 font-tnum md:text-6xl">
          {inrCompact(v)}
        </span>
        <ErpPriceBadge live={live} />
      </div>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
        TOTAL NETWORK VALUE · FIFO · AS OF 09:41 IST · SYNC 12MS
      </span>
    </div>
  );
}

function ValuationHero({ totalValue, live }: { totalValue: number; live: boolean }) {
  return (
    <section
      data-tour="hero"
      className="relative flex min-h-[calc(100dvh-72px)] items-center justify-center overflow-hidden bg-void"
    >
      {/* slow-rotating sunburst backdrop */}
      <motion.svg
        aria-hidden
        viewBox="0 0 600 600"
        className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[90, 150, 210, 270].map((r, i) => (
          <circle
            key={r}
            cx={300}
            cy={300}
            r={r}
            fill="none"
            className={i % 2 === 0 ? "stroke-data" : "stroke-brand"}
            strokeWidth={28}
            strokeDasharray={`${40 + i * 22} ${26 + i * 14}`}
          />
        ))}
      </motion.svg>

      <div className="relative mx-auto max-w-[1280px] px-6 py-24 text-center">
        <SectionKicker className="justify-center">ASSET.VALUATION</SectionKicker>
        <h1 className="mx-auto mt-8 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.03em] text-ink0 md:text-[76px]">
          <SplitWords text="Every bin has a balance sheet." stagger={0.08} />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
          className="mx-auto mt-8 max-w-[600px] text-lg leading-relaxed text-ink1"
        >
          Stackline prices the physical warehouse in real time. Drill from the
          whole network down to a single bin; slice by item, item group or
          variant. Rates come straight from your ERPNext Item Price and Stock
          Ledger — not from a spreadsheet someone forgot to update.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.8, ease: EASE }}
          className="mt-10 flex flex-wrap justify-center gap-4"
        >
          <PrimaryButton to="/contact">See my stock value</PrimaryButton>
          <a
            href="#treemap"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            Explore the treemap ↓
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.8 }}
        >
          <HeroStat target={totalValue} live={live} />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* §7 — Reports & CTA                                                  */
/* ------------------------------------------------------------------ */

function ReportsCta() {
  return (
    <section className="bg-void py-24 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-12 px-6 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>AUDIT.READY</SectionKicker>
          <h2 className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight text-ink0 md:text-[44px]">
            <SplitWords text="One click from twin to trial balance." />
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink1">
            Export the exact view you're looking at — scope, breakdown and
            as-of date included — as a Stock Balance / Stock Ledger–aligned
            valuation report. Because rates come from ERPNext, the number your
            CFO sees is the number on the rack.
          </p>
          <ul className="mt-6 flex flex-col gap-2 font-mono text-xs tracking-[0.1em] text-ink1">
            {["EXCEL / PDF EXPORT", "SCHEDULED DAILY SNAPSHOT", "POSTS STOCK RECONCILIATION DRAFTS FOR VARIANCE"].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-data" /> {b}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <div data-tour="export">
          <BlueprintCard className="p-8 text-center">
            <div className="group mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-raised">
              <FileDown className="h-6 w-6 text-brand transition-transform duration-300 group-hover:translate-y-0.5" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-ink0">
              Value my warehouse
            </h3>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink1">
              Book a session and we'll price one of your warehouses live,
              straight from your ERPNext.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <PrimaryButton to="/contact">Value my warehouse</PrimaryButton>
              <GhostButton to="/dispatch">See dispatch &amp; compliance →</GhostButton>
            </div>
          </BlueprintCard>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Valuation() {
  const [scope, setScope] = useState<Scope>("NETWORK");
  const [breakdown, setBreakdown] = useState<Breakdown>("byGroup");
  const [warehouse, setWarehouse] = useState("MAIN-DC");
  const [rack, setRack] = useState("A-04");
  const [method, setMethod] = useState<"FIFO" | "MOVING AVERAGE">("FIFO");
  const [liveOverride, setLiveOverride] = useState<boolean | null>(null);

  const totalsQ = trpc.valuation.networkTotals.useQuery(undefined, QUERY_OPTS);
  const priceQ = trpc.valuation.priceSource.useQuery(undefined, QUERY_OPTS);
  const byWarehouseQ = trpc.valuation.byWarehouse.useQuery({ breakdown }, QUERY_OPTS);
  const warehouseId = ["MAIN-DC", "DEL-01", "DEL-02", "BLR-01"].indexOf(warehouse) + 1;
  const byClusterQ = trpc.valuation.byCluster.useQuery(
    { warehouseId, breakdown },
    { ...QUERY_OPTS, enabled: scope === "WAREHOUSE" || scope === "CLUSTER" }
  );
  const byRackQ = trpc.valuation.byRack.useQuery(
    { rackId: DEMO_RACK_ID(rack), breakdown },
    { ...QUERY_OPTS, enabled: scope === "RACK" }
  );
  const agingQ = trpc.valuation.aging.useQuery({}, QUERY_OPTS);

  const apiLive = !!priceQ.data && priceQ.data.source !== "demo";
  const live = liveOverride ?? (apiLive && totalsQ.isSuccess);

  const totalValue = totalsQ.data?.totalValueInr || DEMO_TOTAL_VALUE;

  /* Treemap root: live aggregates when available, else the baked demo tree. */
  const root = useMemo<TMNode>(() => {
    const rowsToNodes = (rows: { key: string; label: string; qty: number; valueInr: number }[]): TMNode[] =>
      rows.map((r) => ({
        name: r.key,
        value: r.valueInr,
        qty: r.qty,
        ageDays: Math.round(hash01(r.key) * 120),
        meta: `${r.label} · ${r.qty.toLocaleString("en-IN")} UNITS`,
      }));

    if (scope === "NETWORK" || scope === "LOCATION") {
      const d = byWarehouseQ.data;
      if (d && d.groups.length > 0) {
        return {
          name: "NETWORK",
          children: d.groups.map((g) => ({
            name: g.code,
            qty: g.totalQty,
            value: g.totalValueInr,
            ageDays: Math.round(hash01(g.code) * 90),
            children: rowsToNodes(g.rows),
          })),
        };
      }
    }
    if (scope === "WAREHOUSE" || scope === "CLUSTER") {
      const d = byClusterQ.data;
      if (d && d.groups.length > 0) {
        return {
          name: warehouse,
          children: d.groups.map((g) => ({
            name: g.code,
            qty: g.totalQty,
            value: g.totalValueInr,
            ageDays: Math.round(hash01(g.code) * 90),
            children: rowsToNodes(g.rows),
          })),
        };
      }
    }
    if (scope === "RACK") {
      const d = byRackQ.data;
      if (d && d.rows.length > 0) {
        return { name: `${warehouse} ▸ ${rack}`, children: rowsToNodes(d.rows) };
      }
    }
    return buildHierarchy(scope, breakdown, warehouse, rack);
  }, [scope, breakdown, warehouse, rack, byWarehouseQ.data, byClusterQ.data, byRackQ.data]);

  /* Aging buckets: adapt the API's 3 buckets to the page's 4-column view. */
  const agingBuckets: AgingBucketView[] = useMemo(() => {
    const b = agingQ.data?.buckets;
    if (!b || b.every((x) => x.qty === 0)) return DEMO_AGING;
    const mid = b[1];
    return [
      { label: "0–30D", valueInr: b[0].valueInr, qty: b[0].qty, skus: b[0].skus },
      { label: "30–60D", valueInr: mid.valueInr / 2, qty: Math.round(mid.qty / 2), skus: mid.skus },
      { label: "60–90D", valueInr: mid.valueInr / 2, qty: mid.qty - Math.round(mid.qty / 2), skus: mid.skus },
      { label: "90D+", valueInr: b[2].valueInr, qty: b[2].qty, skus: b[2].skus },
    ];
  }, [agingQ.data]);

  return (
    <>
      <ValuationHero totalValue={totalValue} live={live} />

      {/* §2 — control bar + §3 treemap + §4 lenses */}
      <section className="bg-page pb-10 pt-24 md:pt-32">
        <div className="mx-auto max-w-[1280px] px-6">
          <ControlBar
            scope={scope}
            setScope={setScope}
            breakdown={breakdown}
            setBreakdown={setBreakdown}
            warehouse={warehouse}
            setWarehouse={setWarehouse}
            rack={rack}
            setRack={setRack}
            method={method}
            setMethod={setMethod}
            live={live}
            onToggleLive={setLiveOverride}
          />
        </div>
      </section>

      <section id="treemap" className="bg-void py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <SectionKicker>DRILL.DOWN</SectionKicker>
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="Zoom from network to SKU." />
          </h2>
          <BlueprintCard className="mt-12 min-h-[640px] p-6" data-tour="treemap">
            <ValueTreemap root={root} live={live} />
          </BlueprintCard>
        </div>
      </section>

      <section className="bg-page py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-6">
          <SectionKicker>LENSES</SectionKicker>
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="Same money. Four ways to see it." />
          </h2>
          <div className="mt-12">
            <Lenses
              root={root}
              warehouse={scope === "NETWORK" ? "ALL" : warehouse}
              live={live}
            />
          </div>
        </div>
      </section>

      <ValueTimeline baseValue={totalValue} live={live} />

      <AgingSection buckets={agingBuckets} live={live} />

      <ReportsCta />
    </>
  );
}

/** Demo rack picker → numeric rack id (seed racks are per-warehouse; best effort). */
function DEMO_RACK_ID(rack: string): number {
  const n = parseInt(rack.split("-")[1] ?? "1", 10);
  return Number.isFinite(n) ? n : 1;
}
