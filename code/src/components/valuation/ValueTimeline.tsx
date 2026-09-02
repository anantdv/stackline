import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";
import { TIMELINE_EVENTS, buildTimeline, type TimelineEvent } from "./demo";
import { hash01, inrCompact } from "@/components/network/demo";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const W = 920;
const H = 300;
const PAD = 34;

function flagStyle(kind: TimelineEvent["kind"]) {
  if (kind === "receipt") return "text-data border-data/40 bg-data-soft";
  if (kind === "dispatch") return "text-brand border-brand/40 bg-brand-soft";
  return "text-warn border-warn/40 bg-warn/10";
}
function flagGlyph(kind: TimelineEvent["kind"]) {
  if (kind === "receipt") return "▼";
  if (kind === "dispatch") return "▲";
  return "◆";
}

export default function ValueTimeline({ baseValue, live }: { baseValue: number; live: boolean }) {
  const [range, setRange] = useState<"24H" | "30D">("24H");
  const [series, setSeries] = useState<number[]>(() => buildTimeline(baseValue));
  const [hoverEvent, setHoverEvent] = useState<TimelineEvent | null>(null);
  const [log, setLog] = useState(() =>
    TIMELINE_EVENTS.map((e) => ({
      time: e.label.split(" ")[0],
      doc: e.label.split(" ").slice(1).join(" "),
      delta: e.delta,
      kind: e.kind,
    }))
  );
  const seq = useRef(122);

  /* rebuild when base changes */
  useEffect(() => setSeries(buildTimeline(baseValue)), [baseValue]);

  /* live mode: append a demo tick every 6s */
  useEffect(() => {
    if (!live) return;
    const t = window.setInterval(() => {
      setSeries((prev) => {
        const next = [...prev.slice(1), prev[prev.length - 1] + (hash01(`tick:${seq.current}`) - 0.4) * 80_000];
        return next;
      });
      seq.current += 1;
      const delta = Math.round((hash01(`lg:${seq.current}`) - 0.35) * 3_00_000);
      setLog((prev) => [
        {
          time: new Date().toTimeString().slice(0, 5),
          doc: delta >= 0 ? `RECEIPT GRN-0${seq.current}` : `DISPATCH INV-0${seq.current}`,
          delta,
          kind: delta >= 0 ? ("receipt" as const) : ("dispatch" as const),
        },
        ...prev.slice(0, 6),
      ]);
    }, 6000);
    return () => window.clearInterval(t);
  }, [live]);

  const display = useMemo(() => {
    if (range === "24H") return series;
    /* stretch to 30d by resampling with drift */
    return Array.from({ length: 61 }, (_, i) => {
      const src = series[Math.floor((i / 60) * (series.length - 1))];
      return src * (0.92 + hash01(`d30:${i}`) * 0.16);
    });
  }, [series, range]);

  const min = Math.min(...display);
  const max = Math.max(...display);
  const x = (i: number) => PAD + (i / (display.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - ((v - min) / Math.max(1, max - min)) * (H - PAD * 2);
  const line = "M " + display.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" L ");
  const area = `${line} L ${x(display.length - 1)} ${H - PAD} L ${PAD} ${H - PAD} Z`;

  const netDelta = display[display.length - 1] - display[0];

  return (
    <section className="bg-void py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>OVER.TIME</SectionKicker>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <h2 className="max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="Watch value move with the floor." />
          </h2>
          <div className="flex gap-2" data-tour="timeline">
            {(["24H", "30D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] transition-colors",
                  range === r
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line text-ink1 hover:text-ink0"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_280px]">
          <BlueprintCard className="relative p-6">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
              {[0.25, 0.5, 0.75].map((p) => (
                <line
                  key={p}
                  x1={PAD}
                  x2={W - PAD}
                  y1={PAD + p * (H - PAD * 2)}
                  y2={PAD + p * (H - PAD * 2)}
                  className="stroke-line"
                  strokeWidth={1}
                />
              ))}
              <motion.path d={area} className="fill-data/10" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.7 }} />
              <motion.path
                key={range}
                d={line}
                fill="none"
                className="stroke-data"
                strokeWidth={2}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: EASE }}
              />
              {/* event flags (24h only) */}
              {range === "24H" &&
                TIMELINE_EVENTS.map((e, i) => {
                  const idx = Math.round((e.hour / 24) * (series.length - 1));
                  const ex = x((idx / (series.length - 1)) * (display.length - 1));
                  const ey = y(display[Math.min(idx, display.length - 1)]);
                  const below = e.kind === "dispatch";
                  return (
                    <motion.g
                      key={e.label}
                      initial={{ opacity: 0, scale: 0.6 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 1 + i * 0.1, duration: 0.4, ease: EASE }}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() => setHoverEvent(e)}
                      onMouseLeave={() => setHoverEvent(null)}
                    >
                      <line x1={ex} x2={ex} y1={below ? ey : ey - 26} y2={below ? ey + 26 : ey} className="stroke-linestrong" strokeWidth={1} />
                      <text
                        x={ex}
                        y={below ? ey + 38 : ey - 32}
                        textAnchor="middle"
                        fontSize={11}
                        className={e.kind === "receipt" ? "fill-data" : e.kind === "dispatch" ? "fill-brand" : "fill-warn"}
                      >
                        {flagGlyph(e.kind)}
                      </text>
                    </motion.g>
                  );
                })}
            </svg>

            {/* event popover */}
            {hoverEvent && (
              <div
                className={cn(
                  "pointer-events-none absolute left-6 top-6 z-20 max-w-xs rounded-lg border p-3 font-mono text-[10px] leading-relaxed tracking-[0.06em]",
                  flagStyle(hoverEvent.kind)
                )}
              >
                <div className="font-semibold">{hoverEvent.label} {hoverEvent.delta !== 0 && (hoverEvent.delta > 0 ? `+${inrCompact(hoverEvent.delta)}` : `−${inrCompact(-hoverEvent.delta)}`)}</div>
                {hoverEvent.detail && <div className="mt-1 text-ink1">{hoverEvent.detail}</div>}
              </div>
            )}
          </BlueprintCard>

          {/* right rail: today's movements */}
          <div className="flex flex-col gap-6">
            <BlueprintCard className="flex-1 p-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
                TODAY'S MOVEMENTS
              </span>
              <div className="mt-3 flex flex-col">
                {log.map((l, i) => (
                  <motion.div
                    key={`${l.doc}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between border-b border-line/50 py-2 font-mono text-[11px] last:border-0"
                  >
                    <span className={l.delta >= 0 ? "text-data" : "text-brand"}>
                      {l.delta >= 0 ? "▲" : "▼"}
                    </span>
                    <span className="text-ink2">{l.time}</span>
                    <span className="flex-1 truncate px-2 text-ink1">{l.doc}</span>
                    <span className={cn("font-tnum", l.delta >= 0 ? "text-data" : "text-brand")}>
                      {l.delta >= 0 ? "+" : "−"}{inrCompact(Math.abs(l.delta))}
                    </span>
                  </motion.div>
                ))}
              </div>
            </BlueprintCard>
            <MetricStat value={Math.abs(netDelta) / 100000} decimals={1} prefix={netDelta >= 0 ? "+₹" : "−₹"} suffix="L" caption="NET Δ TODAY" />
            <MetricStat value={8.4} decimals={1} suffix="×" caption="TURNS" />
            <MetricStat value={12} suffix="MS" caption="SYNC" />
          </div>
        </div>
      </div>
    </section>
  );
}
