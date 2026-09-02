import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { formatINR } from "@contracts/types";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import ErpPriceBadge from "@/components/portal/ErpPriceBadge";
import { DEMO_CUSTOMERS, DEMO_DASHBOARDS, DEMO_SLAS } from "@/components/portal/demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Radial SLA gauge: SVG arc + orange target tick; teal/warn/crit by breach. */
function SlaGauge({
  label,
  value,
  target,
  suffix,
  decimals,
  caption,
  invert,
  delay,
}: {
  label: string;
  value: number;
  target: number;
  suffix: string;
  decimals: number;
  caption: string;
  invert?: boolean;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const R = 52;
  const CIRC = 2 * Math.PI * R;
  // gauge sweeps 270° from 135° to 405°
  const ARC = CIRC * 0.75;
  const pct = invert
    ? Math.min(1, value / (target * 2)) // lower is better; scale = 2× target
    : Math.min(1, value / 100);
  const breached = invert ? value > target : value < target;
  const nearBreach = invert ? value > target * 0.8 : value < target + 2;
  const color = breached ? "var(--crit)" : nearBreach ? "var(--warn)" : "var(--data)";
  const targetPct = invert ? 0.5 : target / 100;
  const targetAngle = 135 + targetPct * 270;

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative h-[132px] w-[132px]">
        <svg viewBox="0 0 132 132" className="h-full w-full -rotate-0">
          <circle
            cx="66" cy="66" r={R} fill="none"
            stroke="var(--line)" strokeWidth="8"
            strokeDasharray={`${ARC} ${CIRC}`}
            strokeLinecap="round"
            transform="rotate(135 66 66)"
          />
          <motion.circle
            cx="66" cy="66" r={R} fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${ARC} ${CIRC}`}
            transform="rotate(135 66 66)"
            initial={{ strokeDashoffset: ARC }}
            animate={inView ? { strokeDashoffset: ARC * (1 - pct) } : {}}
            transition={{ duration: 1.4, delay, ease: EASE }}
            className={cn(breached && inView && "animate-pulse")}
          />
          {/* target tick */}
          <g transform={`rotate(${targetAngle} 66 66)`}>
            <line x1="66" y1="6" x2="66" y2="16" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-semibold text-ink0 font-tnum">
            {value.toFixed(decimals)}
            <span style={{ color }}>{suffix}</span>
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">{caption}</span>
        </div>
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink1">{label}</span>
    </div>
  );
}

export default function SlaBilling() {
  const demo = DEMO_DASHBOARDS.ACME!;
  const invoicesQuery = trpc.compliance.listInvoices.useQuery({ limit: 3 }, { retry: 1 });
  const liveInvoices = invoicesQuery.data ?? [];
  const liveOk = liveInvoices.length > 0 && !invoicesQuery.isError;

  const billingRows = liveOk
    ? liveInvoices.slice(0, 3).map((inv, i) => ({
        label: inv.invoiceNo,
        detail: `CUSTOMER #${inv.customerId ?? "—"} · WH #${inv.warehouseId}`,
        amountPaise: inv.amountPaise + inv.taxPaise,
        key: inv.id ?? i,
      }))
    : demo.billing.map((b, i) => ({ ...b, key: i }));

  const totalPaise = liveOk
    ? billingRows.reduce((s, r) => s + r.amountPaise, 0)
    : demo.invoicePaise;

  const invoiceNo = liveOk ? (liveInvoices[0]?.invoiceNo ?? demo.invoiceNo) : demo.invoiceNo;

  // rotating notifications strip
  const [alertIdx, setAlertIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setAlertIdx((i) => (i + 1) % (demo.alerts.length + 2)), 7000);
    return () => window.clearInterval(t);
  }, [demo.alerts.length]);
  const visibleAlerts = Array.from({ length: Math.min(3, demo.alerts.length) }, (_, i) =>
    demo.alerts[(alertIdx + i) % demo.alerts.length]!
  );

  return (
    <section data-tour="portal-sla" className="bg-void px-6 py-24 md:py-36">
      <div className="mx-auto max-w-[1280px]">
        <SectionKicker>ACCOUNTABILITY</SectionKicker>
        <h2 className="mt-6 max-w-[820px] font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
          <SplitWords text="SLAs you don't have to report — they're just visible." />
        </h2>

        {/* gauges */}
        <div className="mt-12 grid gap-8 rounded-xl border border-line bg-surface p-8 sm:grid-cols-3">
          {DEMO_SLAS.map((s, i) => (
            <SlaGauge key={s.label} {...s} delay={i * 0.15} />
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[3fr_2fr]">
          {/* billing panel */}
          <BlueprintCard className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
                  Billing · Tenant {DEMO_CUSTOMERS[0]!.code}
                </span>
                <h3 className="mt-2 font-display text-xl font-semibold text-ink0">
                  This cycle&rsquo;s charges
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-data/40 bg-data-soft px-2 py-1 font-mono text-[9px] tracking-[0.12em] text-data">
                  INV ✓
                </span>
                <ErpPriceBadge source={liveOk ? "live" : "demo"} />
              </div>
            </div>
            <div className="mt-6 flex flex-col">
              {billingRows.map((r, i) => (
                <motion.div
                  key={r.key}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                  className="flex items-baseline gap-4 border-b border-line/60 py-3 last:border-0"
                >
                  <span className="w-28 shrink-0 font-mono text-[10px] tracking-[0.12em] text-ink1">
                    {r.label}
                  </span>
                  <span className="flex-1 truncate font-mono text-[10px] tracking-[0.08em] text-ink2">
                    {r.detail}
                  </span>
                  <span className="font-mono text-xs font-semibold text-ink0 font-tnum">
                    {formatINR(r.amountPaise)}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-linestrong bg-raised px-4 py-3">
              <span className="font-mono text-[11px] tracking-[0.12em] text-ink0">
                INVOICE {invoiceNo} · <span className="text-data">POSTED TO ERPNext</span>
              </span>
              <span className="font-display text-xl font-semibold text-brand font-tnum">
                {formatINR(totalPaise)}
              </span>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
              Rates from ERPNext pricing rules · {liveOk ? "live invoice rows" : "demo rows"}
            </p>
          </BlueprintCard>

          {/* notifications strip */}
          <BlueprintCard className="flex flex-col p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              Auto-alerts your customer receives
            </span>
            <div className="mt-5 flex flex-1 flex-col gap-2">
              {visibleAlerts.map((a, i) => (
                <motion.div
                  key={`${a}-${alertIdx}-${i}`}
                  initial={i === 0 ? { opacity: 0, x: -14, backgroundColor: "var(--data-soft)" } : false}
                  animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="flex items-center gap-3 rounded-lg border border-line bg-page/60 px-3 py-2.5"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-data" aria-hidden />
                  <span className="font-mono text-[10px] tracking-[0.12em] text-ink1">{a}</span>
                  <span className="ml-auto font-mono text-[8px] tracking-[0.12em] text-ink2">PUSH+EMAIL</span>
                </motion.div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
              Thresholds per tenant · quiet hours supported
            </p>
          </BlueprintCard>
        </div>
      </div>
    </section>
  );
}
