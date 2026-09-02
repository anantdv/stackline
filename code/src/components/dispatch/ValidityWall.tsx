import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router";
import { Plane, Ship, Truck } from "lucide-react";
import { docStatusFromValidity, ewayBillValidityHours, formatINR } from "@contracts/types";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import DocBadge from "./DocBadge";
import ErpPriceBadge from "./ErpPriceBadge";
import type { DemoDoc } from "./data";
import { DEMO_DOCS } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface Shipment {
  key: string;
  invoice: string;
  dest: string;
  method: "road" | "sea" | "air";
  docKey: string;
  /** Initial validity left (minutes) at page mount; ticks down live. */
  minutesLeft: number;
  totalMinutes: number;
  distanceKm: number;
  amountPaise: number;
  blocked?: boolean;
}

const SHIPMENTS: Shipment[] = [
  {
    key: "s-valid",
    invoice: "INV/2025/0117",
    dest: "DEL-NCR",
    method: "road",
    docKey: "ewb-valid",
    minutesLeft: 22 * 60 + 14,
    totalMinutes: ewayBillValidityHours(440) * 60,
    distanceKm: 440,
    amountPaise: 57374000,
  },
  {
    key: "s-expiring",
    invoice: "INV/2025/0119",
    dest: "PUNE",
    method: "road",
    docKey: "ewb-expiring",
    minutesLeft: 112,
    totalMinutes: ewayBillValidityHours(120) * 60,
    distanceKm: 120,
    amountPaise: 24118000,
  },
  {
    key: "s-blocked",
    invoice: "INV/2025/0108",
    dest: "JAIPUR",
    method: "road",
    docKey: "ewb-expired",
    minutesLeft: 0,
    totalMinutes: ewayBillValidityHours(280) * 60,
    distanceKm: 280,
    amountPaise: 18423000,
    blocked: true,
  },
];

const METHOD_ICON = { road: Truck, sea: Ship, air: Plane } as const;

/** One live shipment card: EWB validity bar drains in real time. */
function ShipmentCard({
  s,
  index,
  doc,
  onOpenDoc,
  onExtend,
  extending,
}: {
  s: Shipment;
  index: number;
  doc: DemoDoc;
  onOpenDoc: (d: DemoDoc) => void;
  onExtend: (key: string) => void;
  extending: boolean;
}) {
  // Tick every minute; demo-speed drain (~1% / 13min) via real elapsed minutes.
  const [elapsedMin, setElapsedMin] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setElapsedMin((m) => m + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const left = Math.max(0, s.minutesLeft - elapsedMin);
  const status = docStatusFromValidity(
    left > 0 ? new Date(Date.now() + left * 60_000) : new Date(Date.now() - 1000),
    new Date()
  );
  const pct = Math.max(0, Math.min(100, (left / s.totalMinutes) * 100));
  const barTone = status === "expired" ? "bg-crit" : status === "expiring" ? "bg-warn" : "bg-data";
  const h = Math.floor(left / 60);
  const m = left % 60;
  const Icon = METHOD_ICON[s.method];
  const validDays = Math.round(ewayBillValidityHours(s.distanceKm) / 24);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ delay: index * 0.12, duration: 0.6, ease: EASE }}
      className={cn(
        "group relative rounded-xl border border-line bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-linestrong",
        status === "expiring" && "ring-1 ring-warn/60 [animation:ewb-pulse_2s_ease-in-out_infinite]"
      )}
      data-tour={index === 0 ? "ewb-card" : undefined}
    >
      <style>{`@keyframes ewb-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(255,176,32,0.25);} 50% { box-shadow: 0 0 0 6px rgba(255,176,32,0);} }`}</style>
      {/* header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] text-ink0">
          <Icon className="h-4 w-4 text-brand" />
          {s.invoice} <span className="text-ink2">→</span> {s.dest}
        </div>
        <ErpPriceBadge />
      </div>

      {/* EWB validity bar */}
      <div className="mt-5">
        <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
          <span className="text-ink2">
            EWB <span className="text-ink1">{doc.docNo}</span>
          </span>
          <span
            className={cn(
              "font-tnum",
              status === "expired" ? "text-crit" : status === "expiring" ? "text-warn" : "text-data"
            )}
          >
            {status === "expired" ? "EXPIRED" : `VALID ${h}H ${String(m).padStart(2, "0")}M`}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-raised">
          <motion.div
            className={cn("h-full origin-left rounded-full group-hover:scale-x-[1.02]", barTone)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: EASE }}
          />
        </div>
        <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">
          {s.distanceKm} KM → {validDays} DAYS VALIDITY · 1 DAY / 100 KM + 1
        </div>
      </div>

      {/* doc row */}
      <div className="mt-4 flex flex-wrap gap-2">
        <DocBadge doc={{ ...doc, validMinutesLeft: left, status }} onOpen={onOpenDoc} />
        <DocBadge
          doc={{ key: `${s.key}-inv`, docType: "IRN", docNo: s.invoice, status: "valid", validMinutesLeft: null, validMinutesTotal: null }}
          onOpen={onOpenDoc}
        />
      </div>

      {/* footer: value + state action */}
      <div className="mt-4 flex items-center justify-between border-t border-dashed border-line pt-3">
        <span className="font-mono text-[11px] tracking-[0.06em] text-ink1 font-tnum">
          {formatINR(s.amountPaise)}
        </span>
        {status === "expired" ? (
          <Link
            to="/gate"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-crit transition-colors hover:text-brand"
          >
            EWB EXPIRED — VEHICLE HELD AT GATE →
          </Link>
        ) : status === "expiring" ? (
          <button
            type="button"
            onClick={() => onExtend(s.key)}
            disabled={extending}
            className="rounded-md border border-linestrong px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink0 transition-colors hover:border-warn hover:text-warn disabled:opacity-50"
          >
            {extending ? "RE-GENERATING…" : "EXTEND / RE-GENERATE"}
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">ON SCHEDULE</span>
        )}
      </div>
    </motion.div>
  );
}

/** Section 4 — live compliance wall (validity countdown timers). */
export default function ValidityWall({ onOpenDoc }: { onOpenDoc: (d: DemoDoc) => void }) {
  const docsQuery = trpc.compliance.listDocs.useQuery({ docType: "EWB", limit: 20 }, { retry: 1 });
  const invoicesQuery = trpc.compliance.listInvoices.useQuery({ limit: 20 }, { retry: 1 });
  const generate = trpc.compliance.generateInvoice.useMutation();

  const [extended, setExtended] = useState<Record<string, number>>({});
  const [extending, setExtending] = useState<string | null>(null);

  // Live merge: first live EWB overrides the VALID card's doc number.
  const liveEwb = useMemo(
    () => (docsQuery.data ?? []).find((d) => d.status === "valid") ?? null,
    [docsQuery.data]
  );
  const liveInvoiceNo = invoicesQuery.data?.[0]?.invoiceNo;

  const docFor = (s: Shipment): DemoDoc => {
    const baked = DEMO_DOCS.find((d) => d.key === s.docKey)!;
    const extra = extended[s.key] ?? 0;
    if (s.key === "s-valid" && liveEwb) {
      return { ...baked, docNo: liveEwb.docNo, dbId: liveEwb.id };
    }
    if (extra > 0) {
      return { ...baked, status: "valid" };
    }
    return baked;
  };

  const onExtend = (key: string) => {
    setExtending(key);
    // Try the real mutation (idempotent per movement); fall back to a local
    // demo re-generation when the DB is unreachable.
    generate.mutate(
      { movementId: 1, shippingMethod: "road", distanceKm: 440 },
      {
        onSettled: () => {
          setExtended((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
          setExtending(null);
        },
      }
    );
    // Safety: never leave the button spinning on network failure.
    window.setTimeout(() => {
      setExtended((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
      setExtending(null);
    }, 2500);
  };

  return (
    <section className="bg-page py-[160px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker className="mb-4">VALIDITY.CLOCK</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="Compliance with a countdown." />
        </h2>
        <p className="mt-4 max-w-[560px] text-base leading-relaxed text-ink1">
          Every e-way bill carries a live validity window. Stackline counts it down,
          warns at six hours, and blocks the gate at zero.
        </p>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {SHIPMENTS.map((s, i) => {
            const doc = docFor(s);
            const extra = extended[s.key] ?? 0;
            const eff: Shipment =
              extra > 0 ? { ...s, minutesLeft: s.minutesLeft + 24 * 60, totalMinutes: Math.max(s.totalMinutes, s.minutesLeft + 24 * 60) } : s;
            return (
              <ShipmentCard
                key={`${s.key}-${extra}`}
                s={eff}
                index={i}
                doc={doc}
                onOpenDoc={onOpenDoc}
                onExtend={onExtend}
                extending={extending === s.key}
              />
            );
          })}
        </div>
        <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          {docsQuery.data || invoicesQuery.data ? "● LIVE DOCS FROM ERPNEXT" : "● DEMO DATA · DB OFFLINE"} ·{" "}
          {liveInvoiceNo ? `LATEST ${liveInvoiceNo}` : "TIMERS TICK EVERY MINUTE"}
        </div>
      </div>
    </section>
  );
}
