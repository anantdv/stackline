import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { CheckCircle2, FileCheck2, Truck } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  { id: "RECEIVE", screen: "Dock receipt list", twin: "Truck at dock door 3", copy: "Advance Shipping Note matched to Purchase Receipt." },
  { id: "SCAN", screen: "Barcode gate · SCAN CARTON", twin: "Carton at staging", copy: "Every carton scanned; batch and expiry captured." },
  { id: "QC", screen: "Decision · PASS 96% / HOLD 4%", twin: "Held cartons → quarantine", copy: "Exceptions branch automatically." },
  { id: "ALLOCATE", screen: "Engine panel · scores cascade", twin: "Path to C-04-01-02", copy: "The engine picks the bin — FEFO, velocity, weight." },
  { id: "PUTAWAY", screen: "Handheld route view", twin: "Carton rides the aisle path", copy: "The picker follows the twin, not a paper slip." },
  { id: "CONFIRM", screen: "ERPNext doc card", twin: "Bin fill 41% → 82%", copy: "Ledger, twin and floor agree — always." },
] as const;

/* ------------------------- stage visuals ------------------------- */

function StageReceive() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6 sm:p-10">
      <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        <Truck className="h-4 w-4 text-brand" /> Dock door 03 · ASN-9921
      </div>
      {[
        { l: "ASN-9921", r: "PR-2025-0311", ok: true },
        { l: "24 cartons expected", r: "24 matched", ok: true },
        { l: "Supplier ACME-04", r: "verified", ok: true },
      ].map((row, i) => (
        <motion.div
          key={row.l}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 + i * 0.15, duration: 0.5, ease: EASE }}
          className="flex items-center justify-between rounded-md border border-line bg-surface px-4 py-3 font-mono text-[11px] tracking-[0.08em]"
        >
          <span className="text-ink1">{row.l}</span>
          <span className="flex items-center gap-2 text-data">
            {row.r} <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
        </motion.div>
      ))}
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        Twin: <span className="text-brand">truck docked · bay D-03</span>
      </div>
    </div>
  );
}

function StageScan() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <div className="relative flex h-36 w-56 items-center justify-center rounded-lg border-2 border-dashed border-data/60 bg-void/60">
        {/* carton */}
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
          className="h-14 w-16 rounded-[3px] border border-[#8a6b4a] bg-[#C8A27A]"
        />
        {/* scan line sweep */}
        <span className="absolute inset-x-2 top-2 h-0.5 bg-data shadow-glow-data [animation:scan-sweep_1.8s_ease-in-out_infinite]" />
        <style>{`@keyframes scan-sweep { 0%,100% { top: 8px; } 50% { top: calc(100% - 10px); } }`}</style>
        <span className="absolute -top-3 left-3 bg-surface px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-data">
          Scan carton
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 font-mono text-[10px] uppercase tracking-[0.12em]">
        {["SKU-0417 ✓", "BATCH B-2211 ✓", "EXP 2026-04 ✓"].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.18, duration: 0.4, ease: EASE }}
            className="rounded-md border border-data/30 bg-data-soft px-2.5 py-1.5 text-center text-data"
          >
            {t}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function StageQc() {
  return (
    <div className="flex h-full flex-col justify-center gap-5 p-6 sm:p-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">QC decision · 24 cartons</div>
      {[
        { label: "PASS", pct: 96, count: 23, color: "#2DD4BF", note: "→ putaway lane" },
        { label: "HOLD", pct: 4, count: 1, color: "#F4504E", note: "→ quarantine zone Q-01" },
      ].map((b, i) => (
        <div key={b.label}>
          <div className="mb-1.5 flex justify-between font-mono text-[11px] tracking-[0.1em]">
            <span style={{ color: b.color }}>{b.label} · {b.count} CTN</span>
            <span className="text-ink2 font-tnum">{b.pct}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-raised">
            <motion.div
              className="h-full rounded-full"
              style={{ background: b.color }}
              initial={{ width: 0 }}
              animate={{ width: `${b.pct}%` }}
              transition={{ delay: 0.25 + i * 0.2, duration: 0.7, ease: EASE }}
            />
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">{b.note}</div>
        </div>
      ))}
      <div className="mt-2 rounded-md border border-crit/40 bg-crit/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-crit">
        1 carton held · seal broken · supervisor notified
      </div>
    </div>
  );
}

function StageAllocate() {
  const bins = [
    { code: "C-04-01-02", score: 91, win: true },
    { code: "B-02-03-01", score: 78, win: false },
    { code: "A-01-05-03", score: 54, win: false },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-4 p-6 sm:p-10">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        Engine · FEFO + velocity + weight headroom
      </div>
      {bins.map((b, i) => (
        <motion.div
          key={b.code}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.16, duration: 0.45, ease: EASE }}
          className={cn(
            "rounded-md border px-4 py-3",
            b.win ? "border-data bg-data-soft" : "border-line bg-surface opacity-70"
          )}
        >
          <div className="mb-1.5 flex justify-between font-mono text-[11px] tracking-[0.1em]">
            <span className={b.win ? "text-data" : "text-ink1"}>{b.code}{b.win && " ◈ selected"}</span>
            <span className="text-ink2 font-tnum">{b.score}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-raised">
            <motion.div
              className={cn("h-full rounded-full", b.win ? "bg-data" : "bg-ink2")}
              initial={{ width: 0 }}
              animate={{ width: `${b.score}%` }}
              transition={{ delay: 0.35 + i * 0.16, duration: 0.6, ease: EASE }}
            />
          </div>
        </motion.div>
      ))}
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
        Twin: <span className="text-data">teal path drawn staging → C-04-01-02</span>
      </div>
    </div>
  );
}

function StagePutaway() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      <svg viewBox="0 0 320 120" className="w-full max-w-[420px]">
        {/* aisle path */}
        <path
          d="M16 96 H120 V40 H220 V96 H304"
          fill="none" stroke="#2DD4BF" strokeOpacity="0.7" strokeWidth="2"
          strokeDasharray="6 5" className="animate-dash-flow"
        />
        {[
          { x: 16, y: 96, l: "STG" }, { x: 120, y: 40, l: "A-02" },
          { x: 220, y: 96, l: "C-04" }, { x: 304, y: 96, l: "BIN" },
        ].map((p) => (
          <g key={p.l}>
            <circle cx={p.x} cy={p.y} r="5" fill="#0B0E12" stroke="#2DD4BF" strokeWidth="1.5" />
            <text x={p.x} y={p.y + (p.y > 60 ? 20 : -14)} textAnchor="middle" fontSize="8" fontFamily="JetBrains Mono, monospace" fill="#5C6773">{p.l}</text>
          </g>
        ))}
        {/* traveling carton */}
        <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#C8A27A">
          <animateMotion dur="2.8s" repeatCount="indefinite" path="M16 96 H120 V40 H220 V96 H304" />
        </rect>
      </svg>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
        <span className="rounded border border-line px-2 py-1">1. Leave staging</span>→
        <span className="rounded border border-line px-2 py-1">2. Aisle A-02</span>→
        <span className="rounded border border-data/50 bg-data-soft px-2 py-1 text-data">3. Bin C-04-01-02</span>
      </div>
    </div>
  );
}

function StageConfirm() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 sm:p-10">
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: EASE }}
        className="w-full max-w-sm rounded-lg border border-data/40 bg-surface p-5"
      >
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
          <FileCheck2 className="h-4 w-4 text-data" /> ERPNext · Stock Entry
        </div>
        <div className="mt-3 font-mono text-sm font-semibold text-ink0">
          STE-2025-0119 <span className="text-data">SUBMITTED ✓</span>
        </div>
        <div className="mt-2 space-y-1 font-mono text-[10px] tracking-[0.08em] text-ink1">
          <div>TYPE: MATERIAL TRANSFER · QTY 23</div>
          <div>FROM: STG-D03 → TO: C-04-01-02</div>
          <div>REF: PR-2025-0311 · WF: INBOUND-RECEIVING</div>
        </div>
      </motion.div>
      <div className="w-full max-w-sm">
        <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
          <span>Bin C-04-01-02 fill</span>
          <span className="text-data font-tnum">41% → 82%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-raised">
          <motion.div
            className="h-full rounded-full bg-data"
            initial={{ width: "41%" }}
            animate={{ width: "82%" }}
            transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
          />
        </div>
      </div>
    </div>
  );
}

const STAGES = [StageReceive, StageScan, StageQc, StageAllocate, StagePutaway, StageConfirm];

/* ------------------------- pinned section ------------------------- */

export default function PinnedWalkthrough() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length)));
  });
  const railFill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const Stage = STAGES[active];

  return (
    <section ref={ref} className="relative h-[340vh] bg-page">
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-8 px-6 lg:grid-cols-[300px_1fr] lg:gap-14">
          {/* step rail */}
          <div className="relative z-10">
            <SectionKicker className="mb-6">RECEIVING.TO.PUTAWAY</SectionKicker>
            {/* horizontal chips on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 lg:hidden">
              {STEPS.map((s, i) => (
                <span
                  key={s.id}
                  className={cn(
                    "whitespace-nowrap rounded-full border px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] transition-colors duration-300",
                    active === i ? "border-brand bg-brand-soft text-brand" : "border-line text-ink2"
                  )}
                >
                  {s.id}
                </span>
              ))}
            </div>
            {/* vertical rail on desktop */}
            <div className="relative hidden lg:block">
              <span className="absolute bottom-5 left-[15px] top-5 w-px bg-line" aria-hidden />
              <motion.span
                className="absolute left-[15px] top-5 w-px origin-top bg-brand"
                aria-hidden
                style={{ height: "calc(100% - 40px)", scaleY: railScale }}
              />
              <div className="flex flex-col gap-7">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="relative flex items-center gap-4">
                    <span
                      className={cn(
                        "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-all duration-300",
                        active === i
                          ? "border-brand bg-brand text-page"
                          : i < active
                            ? "border-brand/60 bg-page text-brand"
                            : "border-line bg-page text-ink2"
                      )}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300",
                        active === i ? "text-ink0" : "text-ink2"
                      )}
                    >
                      {s.id}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ml-1 mt-8 h-1 w-24 overflow-hidden rounded bg-line">
                <motion.div className="h-full bg-brand" style={{ width: railFill }} />
              </div>
            </div>
          </div>

          {/* stage */}
          <div>
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink2">
              <span>Screen: <span className="text-ink1">{STEPS[active].screen}</span></span>
              <span className="hidden sm:inline">Twin: <span className="text-data">{STEPS[active].twin}</span></span>
            </div>
            <div className="relative aspect-[4/3] max-h-[62vh] w-full overflow-hidden rounded-xl border border-line bg-surface/60 sm:aspect-[16/9]">
              <div className="absolute inset-0 blueprint-grid opacity-40" aria-hidden />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="relative h-full w-full"
                >
                  <Stage />
                </motion.div>
              </AnimatePresence>
              <span className="absolute bottom-3 left-4 z-10 font-mono text-[10px] tracking-[0.14em] text-ink2">
                {String(active + 1).padStart(2, "0")} / 06 — {STEPS[active].id}
              </span>
            </div>
            <p className="mt-4 max-w-[56ch] text-[15px] leading-relaxed text-ink1">
              {STEPS[active].copy}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
