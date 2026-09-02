import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileCheck2, Truck } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import { SplitWords } from "@/components/SplitText";
import ErpPriceBadge from "@/components/valuation/ErpPriceBadge";
import { inrCompact, num, type DemoTransfer } from "./demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function statusClass(s: DemoTransfer["status"]) {
  if (s === "IN TRANSIT") return "text-data border-data/40 bg-data-soft";
  if (s === "DOCKED") return "text-warn border-warn/40 bg-warn/10";
  return "text-ink1 border-line bg-raised";
}

/** One animated transfer lane: origin node → traveling cartons → destination. */
function Lane({ t, dimmed }: { t: DemoTransfer; dimmed: boolean }) {
  /* carton speed ∝ ETA: shorter ETA → faster loop */
  const etaH = parseFloat(t.eta) || 4;
  const dur = Math.max(3.5, Math.min(9, etaH * 0.8));
  return (
    <div
      className={cn(
        "relative rounded-lg border border-line bg-raised/50 px-4 py-3 transition-opacity duration-300",
        dimmed && "opacity-40"
      )}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-ink1">
        <span className="text-ink0">{t.id}</span>
        <span>{num(t.qty)} CARTONS</span>
        <span className="flex items-center gap-1">
          <Truck className="h-3 w-3 text-brand" /> {t.truck}
        </span>
        <span>ETA {t.eta}</span>
        <span className="ml-auto flex items-center gap-1 rounded border border-data/40 bg-data-soft px-1.5 py-0.5 text-data">
          <FileCheck2 className="h-3 w-3" /> TRANSFER ORDER ✓
        </span>
      </div>
      <div className="relative mt-3 h-8">
        {/* rail */}
        <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 bg-linestrong" />
        <div className="absolute inset-x-10 top-1/2 h-px -translate-y-1/2 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-transparent via-data/40 to-transparent" />
        </div>
        {/* endpoints */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 rounded border border-line bg-surface px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-ink0">
          {t.fromCode}
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 rounded border border-data/50 bg-data-soft px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-data">
          {t.toCode}
        </div>
        {/* traveling cartons */}
        {t.status === "IN TRANSIT" &&
          [0, 1, 2].map((i) => (
            <span
              key={`${t.id}-${i}`}
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-[3px] border border-brand bg-brand-soft"
              style={{
                animation: `packet-right ${dur}s linear infinite`,
                animationDelay: `${(dur / 3) * i}s`,
              }}
            />
          ))}
      </div>
    </div>
  );
}

export default function TransferBoard({
  transfers,
  live,
}: {
  transfers: DemoTransfer[];
  live: boolean;
}) {
  const [rows, setRows] = useState<DemoTransfer[]>(transfers);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [laneHover, setLaneHover] = useState<string | null>(null);

  /* adopt new live data */
  useEffect(() => setRows(transfers), [transfers]);

  /* stream a demo row every ~8s */
  useEffect(() => {
    const t = window.setInterval(() => {
      setRows((prev) => {
        const n = 118 + Math.floor(Math.random() * 40);
        const next: DemoTransfer = {
          id: `STO-2025-0${n}`,
          erpDoc: `STE-0${n}`,
          fromCode: "MAIN-DC",
          toCode: "DEL-01",
          fromLoc: "MUM-BHIWANDI",
          toLoc: "DEL-NCR",
          skus: 3 + Math.floor(Math.random() * 10),
          qty: 40 + Math.floor(Math.random() * 240),
          valueInr: 1_00_000 + Math.floor(Math.random() * 20_00_000),
          status: "IN TRANSIT",
          truck: `TRK-${String(1 + Math.floor(Math.random() * 20)).padStart(2, "0")}`,
          eta: `${2 + Math.floor(Math.random() * 10)}H ${String(Math.floor(Math.random() * 60)).padStart(2, "0")}M`,
        };
        setFreshId(next.id);
        return [next, ...prev.slice(0, 7)];
      });
    }, 8000);
    return () => window.clearInterval(t);
  }, []);

  const lanes = useMemo(() => rows.slice(0, 3), [rows]);
  const inTransitValue = rows
    .filter((r) => r.status === "IN TRANSIT")
    .reduce((s, r) => s + r.valueInr, 0);

  return (
    <section id="network-transfers" className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>STOCK.IN.MOTION</SectionKicker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="Transfers you can watch." />
          </h2>
          <ErpPriceBadge live={live} />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_260px]">
          <div data-tour="transfer-board">
          <BlueprintCard className="p-6">
            {/* lane view */}
            <div className="flex flex-col gap-3" data-tour="transfer-lanes">
              {lanes.map((t) => (
                <div
                  key={`lane-${t.id}`}
                  onMouseEnter={() => setLaneHover(t.id)}
                  onMouseLeave={() => setLaneHover(null)}
                >
                  <Lane t={t} dimmed={laneHover != null && laneHover !== t.id} />
                </div>
              ))}
            </div>

            {/* table */}
            <div className="mt-8 overflow-x-auto border-t border-line pt-5">
              <table className="w-full min-w-[720px] font-mono text-xs">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.16em] text-ink2">
                    <th className="pb-3 pr-4 font-medium">TRANSFER ID</th>
                    <th className="pb-3 pr-4 font-medium">FROM → TO</th>
                    <th className="pb-3 pr-4 font-medium text-right">SKUS</th>
                    <th className="pb-3 pr-4 font-medium text-right">QTY</th>
                    <th className="pb-3 pr-4 font-medium text-right">VALUE ₹</th>
                    <th className="pb-3 pr-4 font-medium">STATUS</th>
                    <th className="pb-3 font-medium">ERPNEXT DOC</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {rows.map((r) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, backgroundColor: "rgba(45,212,191,0.18)" }}
                        animate={{
                          opacity: 1,
                          backgroundColor:
                            freshId === r.id
                              ? ["rgba(45,212,191,0.18)", "rgba(45,212,191,0)"]
                              : "rgba(45,212,191,0)",
                        }}
                        transition={{ duration: freshId === r.id ? 1.6 : 0.3, ease: EASE }}
                        className="border-t border-line/60"
                      >
                        <td className="py-2.5 pr-4 text-ink0">{r.id}</td>
                        <td className="py-2.5 pr-4 text-ink1">
                          {r.fromLoc} <span className="text-brand">→</span> {r.toLoc}
                        </td>
                        <td className="py-2.5 pr-4 text-right text-ink1 font-tnum">{r.skus}</td>
                        <td className="py-2.5 pr-4 text-right text-ink1 font-tnum">{num(r.qty)}</td>
                        <td className="py-2.5 pr-4 text-right text-ink0 font-tnum">
                          {inrCompact(r.valueInr)}
                        </td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={cn(
                              "inline-block rounded border px-1.5 py-0.5 text-[9px] tracking-[0.1em]",
                              statusClass(r.status)
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-data underline decoration-dotted underline-offset-4">
                          Stock Transfer {r.erpDoc}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </BlueprintCard>
          </div>

          {/* right rail */}
          <div className="flex flex-col gap-6 lg:pt-2">
            <MetricStat
              value={Math.round(inTransitValue / 100000)}
              caption="IN TRANSIT"
              prefix="₹"
              suffix="L"
            />
            <MetricStat value={4.2} decimals={1} caption="AVG LANE TIME" suffix="D" />
            <MetricStat value={99.4} decimals={1} caption="RECEIPT MATCH" suffix="%" />
          </div>
        </div>
      </div>
    </section>
  );
}
