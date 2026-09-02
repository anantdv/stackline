import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { formatINR } from "@contracts/types";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import { SplitWords } from "@/components/SplitText";
import PortalChrome, { type PortalBrand } from "@/components/portal/PortalChrome";
import ErpPriceBadge from "@/components/portal/ErpPriceBadge";
import { DEMO_CUSTOMERS, DEMO_DASHBOARDS, type DemoFeedRow } from "@/components/portal/demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* Compact lakh/crore readout for the big KPI (₹86.4L). */
function lakhCompact(paise: number): { value: number; suffix: string } {
  const rupees = paise / 100;
  if (rupees >= 1e7) return { value: rupees / 1e7, suffix: "Cr" };
  return { value: rupees / 1e5, suffix: "L" };
}

function WarehouseShare({ rows }: { rows: { warehouse: string; share: number; cbm: number }[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-page/60 p-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        Inventory by warehouse
      </span>
      <div className="flex h-3 w-full overflow-hidden rounded-full border border-line">
        {rows.map((r, i) => (
          <motion.div
            key={r.warehouse}
            initial={{ width: 0 }}
            whileInView={{ width: `${r.share}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
            className={cn("h-full", i === 0 ? "bg-[var(--pa,#f97316)]" : "bg-data")}
          />
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        {rows.map((r, i) => (
          <div key={r.warehouse} className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em]">
            <span className={cn("h-2 w-2 rounded-sm", i === 0 ? "bg-[var(--pa,#f97316)]" : "bg-data")} />
            <span className="text-ink1">{r.warehouse}</span>
            <span className="ml-auto text-ink2">
              {r.share}% · {r.cbm.toLocaleString("en-IN")} CBM
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderFunnel({ rows }: { rows: { stage: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-page/60 p-4">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        Order status funnel
      </span>
      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.stage} className="flex items-center gap-3">
            <span className="w-20 shrink-0 font-mono text-[9px] tracking-[0.14em] text-ink2">{r.stage}</span>
            <div className="h-5 flex-1 overflow-hidden rounded-sm bg-raised">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(r.count / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
                className="flex h-full items-center justify-end rounded-sm bg-data/80 pr-1.5"
              >
                <span className="font-mono text-[9px] font-semibold text-void">{r.count}</span>
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed({ rows, live }: { rows: DemoFeedRow[]; live: boolean }) {
  const [visible, setVisible] = useState(3);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let interval: number | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setVisible(3);
        interval = window.setInterval(
          () => setVisible((v) => (v >= rows.length ? rows.length : v + 1)),
          1400
        );
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [rows.length]);

  return (
    <div ref={ref} className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
          Live activity
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-data">
          {live ? "● LIVE FEED" : "● DEMO FEED"}
        </span>
      </div>
      <div className="flex flex-col">
        {rows.slice(0, visible).map((r, i) => (
          <motion.div
            key={`${r.time}-${i}`}
            initial={{ opacity: 0, x: -10, backgroundColor: "var(--data-soft)" }}
            animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
            transition={{ duration: 0.5, ease: EASE }}
            className="flex items-baseline gap-3 border-b border-line/60 py-1.5 last:border-0"
          >
            <span className="shrink-0 font-mono text-[10px] text-ink2">{r.time}</span>
            <span
              className={cn(
                "font-mono text-[10px] tracking-[0.08em]",
                r.tone === "data" ? "text-data" : r.tone === "warn" ? "text-warn" : "text-ink1"
              )}
            >
              {r.text}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const [code, setCode] = useState<string>("ACME");

  const customersQuery = trpc.portal.listCustomers.useQuery(undefined, { retry: 1 });
  const liveCustomers = customersQuery.data ?? [];

  // Resolve the selected tenant: prefer a live customer matching the code.
  const brand: PortalBrand = useMemo(() => {
    const demo = DEMO_CUSTOMERS.find((c) => c.code === code) ?? DEMO_CUSTOMERS[0]!;
    const live = liveCustomers.find((c) => c.code === code);
    return {
      code: demo.code,
      name: live?.name ?? demo.name,
      color: live?.brandColor ?? demo.brandColor,
      url: demo.url,
    };
  }, [code, liveCustomers]);

  const customerId = useMemo(() => {
    const live = liveCustomers.find((c) => c.code === code);
    return live?.id ?? DEMO_CUSTOMERS.find((c) => c.code === code)!.id;
  }, [code, liveCustomers]);

  const dashQuery = trpc.portal.customerDashboard.useQuery(
    { customerId },
    { retry: 1 }
  );
  const movementsQuery = trpc.portal.customerMovements.useQuery(
    { customerId, limit: 8 },
    { retry: 1 }
  );

  const demo = DEMO_DASHBOARDS[code] ?? DEMO_DASHBOARDS.ACME!;
  const live = dashQuery.data && !dashQuery.isError ? dashQuery.data : null;
  const liveOk = !!live && live.kpis.skusLive > 0;
  const loading = dashQuery.isLoading || customersQuery.isLoading;

  // KPIs: live when the DB has data, else baked demo (v2 convention).
  const kpis = liveOk
    ? {
        skusLive: live.kpis.skusLive,
        orderAccuracy: live.kpis.completionRate != null ? live.kpis.completionRate * 100 : demo.kpis.orderAccuracy,
        avgDispatchHrs: live.kpis.avgTurnaroundHours ?? demo.kpis.avgDispatchHrs,
        stockValuePaise: Math.round(live.kpis.stockValueInr * 100),
      }
    : demo.kpis;

  const warehouses = liveOk && live.stock.length > 0
    ? (() => {
        const total = live.stock.reduce((s, r) => s + r.qty, 0) || 1;
        const half = Math.ceil(live.stock.length / 2);
        const a = live.stock.slice(0, half).reduce((s, r) => s + r.qty, 0);
        return [
          { warehouse: "WH-MUM-01", share: Math.round((a / total) * 100), cbm: Math.round(a * 2.4) },
          { warehouse: "WH-MUM-02", share: Math.round(((total - a) / total) * 100), cbm: Math.round((total - a) * 2.4) },
        ];
      })()
    : demo.warehouses;

  const funnel = liveOk
    ? [
        { stage: "PLACED", count: live.pipeline.placed },
        { stage: "PICKING", count: live.pipeline.inProgress },
        { stage: "PACKED", count: Math.max(0, Math.round(live.pipeline.inProgress / 2)) },
        { stage: "DISPATCHED", count: live.pipeline.completed },
      ]
    : demo.funnel;

  const liveFeed: DemoFeedRow[] = (movementsQuery.data ?? [])
    .slice(0, 5)
    .map((m) => ({
      time: new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
      text: `${m.type.toUpperCase()} #MV-${m.id} · ${m.qty} UNITS · ${m.status.toUpperCase()}${m.erpnextStockEntry ? ` · ${m.erpnextStockEntry}` : ""}`,
      tone: m.status === "completed" ? "data" : m.status === "cancelled" ? "warn" : "plain",
    }));
  const feed = liveFeed.length > 0 ? liveFeed : demo.feed;

  const stockCompact = lakhCompact(kpis.stockValuePaise);

  return (
    <section data-tour="portal-dashboard" className="bg-page px-6 py-24 md:py-40">
      <div className="mx-auto max-w-[1280px]">
        <SectionKicker>CUSTOMER.VIEW</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
          <SplitWords text="What your customer sees at 9 AM." />
        </h2>

        {/* customer switcher */}
        <div data-tour="portal-switcher" className="mt-8 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
            Viewing as tenant:
          </span>
          {DEMO_CUSTOMERS.map((c) => {
            const active = c.code === code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setCode(c.code)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] tracking-[0.14em] transition-all duration-300",
                  active
                    ? "border-brand bg-brand-soft text-ink0"
                    : "border-line bg-surface text-ink1 hover:border-linestrong hover:text-ink0"
                )}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white"
                  style={{ background: c.brandColor }}
                >
                  {c.code.slice(0, 1)}
                </span>
                {c.name.toUpperCase()}
              </button>
            );
          })}
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
            {loading ? "SYNCING TENANT DATA…" : liveOk ? "● TENANT DATA: LIVE" : "● TENANT DATA: DEMO"}
          </span>
        </div>

        {/* browser-chrome portal mock */}
        <motion.div
          initial={{ opacity: 0, rotateX: 6, y: 40 }}
          whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          style={{ transformPerspective: 1200 }}
          className="mt-8"
        >
          <PortalChrome
            brand={brand}
            brandVars={{ "--pa": brand.color } as CSSProperties}
            className="mx-auto max-w-[1150px]"
          >
            {/* Row 1 — KPIs */}
            <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-4">
              <ErpPriceBadge source={liveOk ? "live" : "demo"} className="absolute -top-2 right-0" />
              <MetricStat value={kpis.skusLive} caption="SKUs live" className="[&>span:first-child]:md:text-4xl" />
              <MetricStat value={kpis.orderAccuracy} decimals={1} suffix="%" caption="Order accuracy" className="[&>span:first-child]:md:text-4xl" />
              <MetricStat value={kpis.avgDispatchHrs} suffix="H" caption="Avg dispatch" className="[&>span:first-child]:md:text-4xl" />
              <MetricStat
                value={stockCompact.value}
                decimals={1}
                prefix="₹"
                suffix={stockCompact.suffix}
                caption="Stock value"
                className="[&>span:first-child]:md:text-4xl"
              />
            </div>

            {/* Row 2 — warehouse share + funnel */}
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <WarehouseShare rows={warehouses} />
              <OrderFunnel rows={funnel} />
            </div>

            {/* Row 3 — live activity */}
            <div className="mt-6 rounded-lg border border-line bg-page/60 p-4">
              <ActivityFeed rows={feed} live={liveFeed.length > 0} />
            </div>

            {/* stock value footnote (INR grouping) */}
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
              Exact value: {formatINR(kpis.stockValuePaise)} · priced from ERPNext item price · isolated to tenant {brand.code}
            </p>
          </PortalChrome>
        </motion.div>
      </div>
    </section>
  );
}
