import { motion } from "framer-motion";
import { ArrowRight, MoveRight } from "lucide-react";
import { trpc } from "@/providers/trpc";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";
import { GhostButton } from "@/components/Buttons";
import { cn } from "@/lib/utils";
import { LOAD_SEQUENCE, ROUTE_STOPS } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Section 6 — LIFO-by-stop load sequence + dispatch handoff. */
export default function LoadSequence() {
  // Live plan (LP-0417) when the DB is reachable; baked handoff otherwise.
  const plansQuery = trpc.transport.listPlans.useQuery({}, { retry: 1, refetchOnWindowFocus: false });
  const live = plansQuery.data?.find((p) => p.planNo === "LP-0417") ?? plansQuery.data?.[0] ?? null;
  const planNo = live?.planNo ?? "LP-0417";
  const util = live?.utilizationPct ?? 91.2;
  const status = (live?.status ?? "locked").toUpperCase();

  return (
    <section data-tour="load-sequence" className="bg-page py-[140px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker className="mb-4">SEQUENCE</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="Last stop loads first." />
        </h2>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[1fr_auto_1fr]">
          {/* route strip — markers pulse in reverse-load order */}
          <div className="space-y-0">
            <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">
              ROUTE · TRIP-0417 (FROM /fleet)
            </div>
            {ROUTE_STOPS.map((s, i) => (
              <div key={s.id} className="relative flex items-center gap-4 pb-7 last:pb-0">
                {i < ROUTE_STOPS.length - 1 && (
                  <span className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-px bg-line" aria-hidden />
                )}
                <motion.span
                  className="z-10 h-[18px] w-[18px] shrink-0 rounded-full border-2"
                  style={{
                    borderColor: "var(--data)",
                    background: "var(--data-soft)",
                    // teal → orange along the route
                    filter: `hue-rotate(${i * -14}deg) saturate(${1 + i * 0.25})`,
                  }}
                  animate={{ scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    // reverse-load order: STOP-5 pulses first
                    delay: (ROUTE_STOPS.length - 1 - i) * 0.32,
                  }}
                  aria-hidden
                />
                <div>
                  <span className="font-mono text-[11px] tracking-[0.1em] text-ink0">{s.id}</span>
                  <span className="ml-3 font-mono text-[10px] tracking-[0.08em] text-ink2">{s.label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* LIFO arrow */}
          <div className="hidden flex-col items-center gap-2 self-center lg:flex" aria-hidden>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand [writing-mode:vertical-rl]">
              LIFO BY STOP
            </span>
            <MoveRight className="h-5 w-5 text-brand" />
          </div>

          {/* load order list — staggered in reverse-load order */}
          <div>
            <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">
              LOAD ORDER · REAR → DOOR
            </div>
            <div className="space-y-2">
              {LOAD_SEQUENCE.map((row, i) => (
                <motion.div
                  key={row.n}
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-8% 0px" }}
                  transition={{ delay: i * 0.12, duration: 0.5, ease: EASE }}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border border-line bg-surface px-4 py-3",
                    i === 0 && "border-brand/40"
                  )}
                >
                  <span className="font-mono text-[12px] text-brand font-tnum">{row.n}</span>
                  <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink0">
                    {row.stop} <span className="text-ink2">{row.what}</span>
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-data">{row.pos}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* handoff card */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-14"
        >
          <BlueprintCard className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.12em]">
              <span className="text-ink2">HANDOFF ·</span>{" "}
              <span className="text-ink0">LOAD PLAN {planNo}</span>{" "}
              <span className="text-data">✓ {status}</span>{" "}
              <span className="text-brand font-tnum">{util.toFixed(1)}% VOL</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-ink2 md:inline">
                DOCS GENERATE FROM THE PLAN'S CONTENTS
              </span>
              <GhostButton to="/dispatch" className="px-4 py-2 text-[13px]">
                Send to dispatch <ArrowRight className="h-3.5 w-3.5" />
              </GhostButton>
            </div>
          </BlueprintCard>
        </motion.div>
      </div>
    </section>
  );
}
