/**
 * Dashboard §4 — Exception Center: ranked triage table with severity bars,
 * live age timers, ACK interaction (session-only), and deep links into the
 * owning modules. Criticals pulse until acknowledged individually; warnings
 * can be ACK'd in bulk.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import type { ExceptionRow } from "./demo";
import type { DashboardData } from "./useDashboardData";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function formatAge(min: number): string {
  if (min < 60) return `${min}M`;
  if (min < 1440) return `${Math.floor(min / 60)}H ${min % 60}M`;
  return `${Math.floor(min / 1440)}D ${Math.floor((min % 1440) / 60)}H`;
}

function SeverityGlyph({ sev }: { sev: "CRIT" | "WARN" }) {
  return sev === "CRIT" ? (
    <span
      aria-label="Critical"
      className="block h-2.5 w-2.5 rotate-45 bg-crit"
    />
  ) : (
    <span aria-label="Warning" className="block h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent border-b-warn" />
  );
}

function Row({
  row,
  acked,
  onAck,
  index,
}: {
  row: ExceptionRow;
  acked: boolean;
  onAck: () => void;
  index: number;
}) {
  const crit = row.sev === "CRIT";
  return (
    <motion.tr
      layout="position"
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: EASE }}
      className={cn(
        "group h-14 border-b border-line/60 transition-all duration-300 hover:-translate-y-0.5",
        crit ? "bg-crit/5" : "bg-transparent",
        acked && "opacity-60 saturate-[0.6]"
      )}
    >
      {/* severity bar + glyph */}
      <td className="relative w-12 pl-4">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-0 left-0 w-[3px]",
            crit ? "bg-crit" : "bg-warn",
            crit && !acked && "motion-safe:animate-[pulse-dot_2s_ease-in-out_infinite]"
          )}
        />
        <SeverityGlyph sev={row.sev} />
      </td>
      <td className="w-36">
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.12em]",
            crit ? "border-crit/40 bg-crit/10 text-crit" : "border-warn/40 bg-warn/10 text-warn"
          )}
        >
          {row.type}
        </span>
      </td>
      <td className="max-w-[420px] pr-4">
        <span className="block truncate text-sm text-ink1 transition-colors group-hover:text-ink0">
          {row.description}
        </span>
      </td>
      <td className="w-24 font-mono text-[11px] tracking-[0.1em] text-ink2">{row.location}</td>
      <td className="w-24 font-mono text-[12px] text-ink1 font-tnum">
        <AgeTimer base={row.ageMinutes} />
      </td>
      <td className="w-32">
        <span className="rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-ink2">
          {row.owner}
        </span>
      </td>
      <td className="w-56 pr-4">
        <span className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onAck}
            aria-pressed={acked}
            className={cn(
              "flex items-center gap-1 rounded border px-2 py-1 font-mono text-[10px] tracking-[0.12em] transition-colors duration-200",
              acked
                ? "border-data/40 bg-data-soft text-data"
                : "border-line text-ink2 hover:border-data hover:text-data"
            )}
          >
            <Check className="h-3 w-3" /> {acked ? "ACK'D" : "ACK"}
          </button>
          <Link
            to={row.href}
            className="group/jump flex items-center gap-1 rounded border border-brand/50 px-2 py-1 font-mono text-[10px] tracking-[0.12em] text-brand transition-colors duration-200 hover:bg-brand hover:text-onbrand"
          >
            OPEN {row.owner}
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover/jump:translate-x-1" />
          </Link>
        </span>
      </td>
    </motion.tr>
  );
}

/** Age timer — counts up live, ticking every 30s (mono). */
function AgeTimer({ base }: { base: number }) {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setExtra((v) => v + 1), 30_000);
    return () => window.clearInterval(t);
  }, []);
  return <>{formatAge(base + extra * 0.5)}</>;
}

export default function ExceptionCenter({ data }: { data: DashboardData }) {
  const [ackedIds, setAckedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const critCount = data.exceptions.filter((e) => e.sev === "CRIT" && !ackedIds.has(e.id)).length;
  const warnCount = data.exceptions.filter((e) => e.sev === "WARN" && !ackedIds.has(e.id)).length;

  const ack = (id: string) => {
    setAckedIds((prev) => new Set(prev).add(id));
    setToast(null);
  };
  const ackAllWarnings = () => {
    setAckedIds((prev) => {
      const n = new Set(prev);
      data.exceptions.filter((e) => e.sev === "WARN").forEach((e) => n.add(e.id));
      return n;
    });
    setToast("✓ ALL WARNINGS ACKNOWLEDGED — CRITICALS NEED INDIVIDUAL ACK");
    window.setTimeout(() => setToast(null), 4000);
  };

  /* Acknowledged rows drop below the fold-line (session-only). */
  const active = data.exceptions.filter((e) => !ackedIds.has(e.id));
  const acked = data.exceptions.filter((e) => ackedIds.has(e.id));

  return (
    <section className="bg-page py-[72px]" data-tour="exception-center">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>EXCEPTION.CENTER</SectionKicker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-2xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[40px]">
            <SplitWords text="Everything that needs a human, ranked." />
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-crit/40 bg-crit/10 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-crit font-tnum">
              {critCount} CRITICAL
            </span>
            <span className="rounded border border-warn/40 bg-warn/10 px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-warn font-tnum">
              {warnCount} WARNING
            </span>
            <span className="rounded border border-line px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink2">
              SLA WATCH 1
            </span>
            <span className="rounded border border-line px-2 py-1 font-mono text-[10px] tracking-[0.14em] text-ink2">
              ✓ 1 EWB HEALTHY
            </span>
          </div>
        </div>

        <BlueprintCard className="mt-8 overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink1">
              <span className="text-brand">{"//"}</span> TRIAGE.QUEUE
            </span>
            <button
              type="button"
              onClick={ackAllWarnings}
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2 transition-colors hover:text-data"
            >
              ACK ALL WARNINGS
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <caption className="sr-only">
                Open operational exceptions ranked by severity and age
              </caption>
              <thead>
                <tr className="border-b border-line text-left font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
                  <th className="py-2 pl-4 font-medium">SEV</th>
                  <th className="font-medium">TYPE</th>
                  <th className="font-medium">DESCRIPTION</th>
                  <th className="font-medium">LOC</th>
                  <th className="font-medium">AGE</th>
                  <th className="font-medium">OWNER MODULE</th>
                  <th className="pr-4 text-right font-medium">ACTION</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {active.map((r, i) => (
                    <Row key={r.id} row={r} acked={false} onAck={() => ack(r.id)} index={i} />
                  ))}
                </AnimatePresence>
              </tbody>
              {acked.length > 0 && (
                <tbody>
                  <tr>
                    <td colSpan={7} className="px-4 py-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
                      ── ACKNOWLEDGED (SESSION) ──
                    </td>
                  </tr>
                  {acked.map((r, i) => (
                    <Row key={r.id} row={r} acked onAck={() => {}} index={i} />
                  ))}
                </tbody>
              )}
            </table>
          </div>
        </BlueprintCard>
      </div>

      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-linestrong bg-raised px-4 py-3 font-mono text-[11px] tracking-[0.12em] text-ink0 shadow-2xl"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
