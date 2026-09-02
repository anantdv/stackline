import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function capColor(v: number) {
  if (v >= 90) return "#F4504E";
  if (v >= 70) return "#FFB020";
  return "#2DD4BF";
}

/* Utilization donut: 68% ok / 22% warn / 10% crit */
function Donut() {
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setOn(true), io.disconnect()),
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const R = 52;
  const C = 2 * Math.PI * R;
  const segs = [
    { v: 68, c: "#2DD4BF" },
    { v: 22, c: "#FFB020" },
    { v: 10, c: "#F4504E" },
  ];
  let acc = 0;
  return (
    <div ref={ref}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
        Utilization
      </div>
      <div className="mt-3 flex items-center gap-4">
        <svg viewBox="0 0 128 128" className="h-28 w-28 -rotate-90">
          <circle cx="64" cy="64" r={R} fill="none" stroke="#1A2029" strokeWidth="12" />
          {segs.map((s, i) => {
            const off = acc;
            acc += s.v;
            return (
              <circle
                key={i}
                cx="64"
                cy="64"
                r={R}
                fill="none"
                stroke={s.c}
                strokeWidth="12"
                strokeDasharray={`${on ? (s.v / 100) * C : 0} ${C}`}
                strokeDashoffset={-(off / 100) * C}
                style={{ transition: `stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s` }}
              />
            );
          })}
        </svg>
        <div className="flex flex-col gap-1.5">
          {segs.map((s, i) => (
            <span key={i} className="flex items-center gap-2 font-mono text-[11px] text-ink1">
              <span className="h-2 w-2 rounded-sm" style={{ background: s.c }} />
              {s.v}%{" "}
              <span className="text-ink2">
                {i === 0 ? "HEALTHY" : i === 1 ? "HIGH" : "CRITICAL"}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* 24h throughput sparkline */
function Sparkline() {
  const pts = useMemo(() => {
    const rand = (i: number) => 40 + 30 * Math.sin(i / 3.2) + ((i * 37) % 17);
    return Array.from({ length: 24 }, (_, i) => rand(i));
  }, []);
  const max = Math.max(...pts);
  const path = pts
    .map((v, i) => `${(i / (pts.length - 1)) * 200},${60 - (v / max) * 52}`)
    .join(" L ");
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
        Throughput / 24H
      </div>
      <svg viewBox="0 0 200 64" className="mt-3 h-20 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M ${path} L 200,64 L 0,64 Z`} fill="url(#sparkfill)" />
        <path d={`M ${path}`} fill="none" stroke="#2DD4BF" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

/* 12x6 rack heatmap with hover tooltip */
function Heatmap() {
  const cells = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const v = 35 + ((i * 53 + 17) % 65);
        return v;
      }),
    []
  );
  const [tip, setTip] = useState<number | null>(null);
  return (
    <div className="relative">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
        Rack Heatmap — Zone B
      </div>
      <div className="mt-3 grid grid-cols-12 gap-1">
        {cells.map((v, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setTip(i)}
            onMouseLeave={() => setTip(null)}
            className="aspect-square rounded-[2px] transition-transform duration-150 hover:scale-110"
            style={{ background: capColor(v), opacity: 0.25 + (v / 100) * 0.75 }}
            aria-label={`Bin ${i} capacity ${v}%`}
          />
        ))}
      </div>
      {tip !== null && (
        <div className="pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border border-linestrong bg-void/95 px-2.5 py-1.5 font-mono text-[10px] tracking-[0.06em] text-ink0">
          B-0{1 + (tip % 6)}-0{1 + Math.floor(tip / 12)}-0{1 + (tip % 4)} ·{" "}
          <span style={{ color: capColor(cells[tip]) }}>{cells[tip]}%</span> ·{" "}
          {Math.round((cells[tip] / 100) * 17)}/17 CARTONS · SKU-0417
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 font-mono text-[9px] tracking-[0.12em] text-ink2">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-data" />&lt;70%</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warn" />70–89%</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-crit" />≥90%</span>
      </div>
    </div>
  );
}

/* Streaming movement log */
const SKUS = ["SKU-1188", "SKU-0417", "SKU-2207", "SKU-0932", "SKU-3351", "SKU-7742"];
function randomEntry(id: number): { id: number; time: string; text: string } {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);
  const sku = SKUS[id % SKUS.length];
  const a = `A-0${1 + (id % 6)}-0${1 + (id % 8)}-0${1 + (id % 4)}`;
  const b = `B-0${1 + ((id * 3) % 6)}-0${1 + ((id * 5) % 8)}-0${1 + ((id * 7) % 4)}`;
  const kind = id % 3 === 0 ? "PUTAWAY" : id % 3 === 1 ? "MOVE" : "PICK";
  return { id, time, text: `${kind} ${sku} ${a} → ${b} ✓ POSTED` };
}

function MovementLog() {
  const [rows, setRows] = useState(() =>
    Array.from({ length: 6 }, (_, i) => randomEntry(i))
  );
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setInView(e.isIntersecting),
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!inView) return;
    const iv = setInterval(() => {
      setRows((r) => [...r.slice(-6), randomEntry(r[r.length - 1].id + 1)]);
    }, 2400);
    return () => clearInterval(iv);
  }, [inView]);
  return (
    <div ref={ref}>
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink2">
        Movement Log
      </div>
      <div className="mt-3 flex h-[204px] flex-col justify-end gap-1.5 overflow-hidden">
        {rows.map((r, i) => (
          <div
            key={r.id}
            className={cn(
              "rounded px-2 py-1.5 font-mono text-[10px] leading-relaxed tracking-[0.04em]",
              i === rows.length - 1
                ? "text-ink0 [animation:ticker-flash_1.2s_ease-out]"
                : "text-ink2"
            )}
            style={{ opacity: 0.35 + (i / rows.length) * 0.65 }}
          >
            <span className="text-data">{r.time}</span> ▸ {r.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OpsConsole() {
  return (
    <section data-tour="ops-console" className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="text-center">
          <SectionKicker className="justify-center">MISSION.CONTROL</SectionKicker>
          <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="The floor, on one screen." />
          </h2>
        </div>

        <div className="mt-14 [perspective:1200px]">
          <motion.div
            initial={{ opacity: 0, rotateX: 8, scale: 0.96 }}
            whileInView={{ opacity: 1, rotateX: 0, scale: 1 }}
            viewport={{ once: true, margin: "-20% 0px" }}
            transition={{ duration: 0.9, ease: EASE }}
          >
            <BlueprintCard className="mx-auto max-w-[1100px] p-5 md:p-8">
              {/* Top bar */}
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <span className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-crit/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-data/70" />
                  </span>
                  <span className="font-mono text-[11px] tracking-[0.14em] text-ink1">
                    STACKLINE / OPS — WH-EAST-01
                  </span>
                </div>
                <span className="hidden items-center gap-2 rounded-full border border-data/40 bg-data-soft px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-data sm:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-data animate-pulse-dot" />
                  ERPNext Synced
                </span>
              </div>

              {/* Grid */}
              <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr_280px]">
                <div className="flex flex-col gap-8">
                  <Donut />
                  <Sparkline />
                </div>
                <Heatmap />
                <MovementLog />
              </div>

              {/* Bottom stats */}
              <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6 md:grid-cols-4">
                <MetricStat value={1152} caption="Bins" />
                <MetricStat value={82} suffix="%" caption="Avg Utilization" />
                <MetricStat value={12} suffix="ms" caption="Sync" />
                <MetricStat value={99.98} decimals={2} suffix="%" caption="Ledger Match" />
              </div>
            </BlueprintCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
