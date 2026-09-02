import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router";
import { Plane, Ship, TrainFront, Truck } from "lucide-react";
import type { ShippingMethod } from "@contracts/types";
import { requiredDocsForMethod } from "@contracts/types";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { cn } from "@/lib/utils";
import DocBadge from "./DocBadge";
import type { DemoDoc } from "./data";
import { DEMO_DOCS, DOC_TYPE_LABEL, METHOD_DOC_SETS } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const METHODS: Array<{ id: ShippingMethod; label: string; icon: typeof Truck }> = [
  { id: "road", label: "ROAD", icon: Truck },
  { id: "air", label: "AIR", icon: Plane },
  { id: "sea", label: "SEA", icon: Ship },
  { id: "rail", label: "RAIL / MULTI-MODAL", icon: TrainFront },
];

/** Mono rule line that "types on" with a caret when the method changes. */
function TypedRule({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const step = Math.max(1, Math.round(text.length / 40)); // ~0.6s total
    const id = window.setInterval(() => {
      setShown((n) => {
        if (n >= text.length) {
          window.clearInterval(id);
          return n;
        }
        return n + step;
      });
    }, 16);
    return () => window.clearInterval(id);
  }, [text]);
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink1">
      {text.slice(0, shown)}
      <span className="ml-0.5 inline-block h-3.5 w-[7px] translate-y-[2px] animate-caret-blink bg-brand" aria-hidden />
    </span>
  );
}

export default function MethodRules({ onOpenDoc }: { onOpenDoc: (doc: DemoDoc) => void }) {
  const [method, setMethod] = useState<ShippingMethod>("road");

  // Live docs merge over baked fallbacks when the DB is reachable.
  const docsQuery = trpc.compliance.listDocs.useQuery({ limit: 100 }, { retry: 1 });
  const liveByType = useMemo(() => {
    const map = new Map<string, { docNo: string; status: string; id: number }>();
    for (const d of docsQuery.data ?? []) {
      if (!map.has(d.docType)) map.set(d.docType, { docNo: d.docNo, status: d.status, id: d.id });
    }
    return map;
  }, [docsQuery.data]);

  const set = METHOD_DOC_SETS.find((s) => s.method === method)!;
  const required = requiredDocsForMethod(method);

  const resolve = (refKey?: string, fallbackLabel?: string): DemoDoc => {
    const baked = DEMO_DOCS.find((d) => d.key === refKey);
    if (baked) {
      const live = liveByType.get(baked.docType);
      if (live) {
        return {
          ...baked,
          docNo: live.docNo,
          dbId: live.id,
          status: (["valid", "expiring", "expired", "draft"].includes(live.status)
            ? live.status
            : baked.status) as DemoDoc["status"],
        };
      }
      return baked;
    }
    const type = (fallbackLabel ?? "DOC").split(" ")[0];
    return {
      key: `gen-${fallbackLabel}`,
      docType: type in DOC_TYPE_LABEL ? (type as DemoDoc["docType"]) : "PL",
      docNo: "",
      status: "draft",
      validMinutesLeft: null,
      validMinutesTotal: null,
    };
  };

  return (
    <section data-tour="method-tabs" className="bg-page py-[140px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker className="mb-4">METHOD.RULES</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          The method picks the paperwork.
        </h2>

        {/* segmented control */}
        <div
          role="tablist"
          aria-label="Shipping method"
          className="mt-10 inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface p-1"
        >
          {METHODS.map((m) => {
            const Icon = m.icon;
            const active = m.id === method;
            return (
              <button
                key={m.id}
                role="tab"
                aria-selected={active}
                onClick={() => setMethod(m.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2.5 font-mono text-[13px] uppercase tracking-[0.1em] transition-colors",
                  active ? "text-onbrand" : "text-ink1 hover:text-ink0"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="method-segment"
                    className="absolute inset-0 rounded-lg bg-brand"
                    transition={{ duration: 0.3, ease: EASE }}
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" />
                <span className="relative z-10">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* document set panel */}
        <BlueprintCard className="mt-8 min-h-[300px] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
              STATUTORY SET · <span className="text-brand">{method.toUpperCase()}</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
              REQUIRED:{" "}
              <span className="text-data">
                {required.map((t) => (t === "BOL" ? "B/L" : t)).join(" · ")}
              </span>
              {docsQuery.data ? " · LIVE" : " · DEMO"}
            </div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={method}
              className="flex flex-wrap gap-3 pt-6"
              initial="hide"
              animate="show"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {set.docs.map((d) => {
                const doc = resolve(d.refKey, d.label);
                const chip = (
                  <motion.div
                    key={d.key}
                    variants={{
                      hide: { opacity: 0, scale: 0.9, y: 8 },
                      show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
                    }}
                    initial="hide"
                    animate="show"
                  >
                    <DocBadge doc={{ ...doc, key: d.key }} onOpen={d.to ? undefined : onOpenDoc} />
                    <div className="mt-1.5 pl-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                      {d.label}
                    </div>
                  </motion.div>
                );
                return d.to ? (
                  <Link key={d.key} to={d.to} className="block">
                    {chip}
                  </Link>
                ) : (
                  chip
                );
              })}
            </motion.div>
          </AnimatePresence>
          <div className="mt-8 border-t border-dashed border-line pt-4">
            <TypedRule key={method} text={set.rule} />
          </div>
        </BlueprintCard>
      </div>
    </section>
  );
}
