import { useEffect, useRef, useState } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { CheckCircle2, QrCode } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { cn } from "@/lib/utils";
import DocBadge from "./DocBadge";
import type { DemoDoc } from "./data";
import { DEMO_DOCS } from "./data";

const STATIONS = [
  { id: "PICK", copy: "Pick list from the 3D twin; floor app confirms scans.", mono: "8/8 LINES PICKED ✓" },
  { id: "PACK", copy: "Cartons sealed, labels printed.", mono: "QR LABEL STAMPED ✓" },
  { id: "WEIGH & MEASURE", copy: "Dims and weight auto-captured from the scanning bay.", mono: "L600×W400×H380 · 12.4KG" },
  { id: "INVOICE", copy: "Delivery Note becomes Sales Invoice; e-invoice returns IRN + QR in one call.", mono: "IRN ACK 162515784122990 ✓" },
  { id: "COMPLIANCE DOCS", copy: "Method rules fire: EWB generated, validity timer starts.", mono: "EWB 2841 9912 4471 · 22H" },
  { id: "GATE OUT", copy: "Everything bundles into one gate pass QR.", mono: "→ /gate" },
] as const;

const ATTACH_DOCS = ["ewb-valid", "inv-0117", "lr-7782"]
  .map((k) => DEMO_DOCS.find((d) => d.key === k)!)
  .filter(Boolean);

/** Station-specific mini visual inside the stage. */
function StationVisual({ active, onOpenDoc }: { active: number; onOpenDoc: (d: DemoDoc) => void }) {
  if (active <= 1) {
    // PICK / PACK — cartons hop onto the shipment, one closes
    return (
      <div className="flex items-end gap-3">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-10 w-12 rounded-[3px] border border-[#8a6b4a]/60 bg-[#C8A27A]"
            initial={{ y: -26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.12, type: "spring", stiffness: 260, damping: 18 }}
          />
        ))}
        {active === 1 && (
          <motion.div
            className="ml-2 flex items-center gap-1.5 rounded-md border border-data/50 bg-data-soft px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-data"
            initial={{ scale: 1.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 16 }}
          >
            <QrCode className="h-3.5 w-3.5" /> LABEL ✓
          </motion.div>
        )}
      </div>
    );
  }
  if (active === 2) {
    return (
      <div className="space-y-2 font-mono text-[11px] tracking-[0.08em]">
        <div className="flex items-center gap-2 text-ink1">
          <span className="text-ink2">DIMS</span>
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-ink0 font-tnum">
            L600 × W400 × H380 MM
          </motion.span>
        </div>
        <div className="flex items-center gap-2 text-ink1">
          <span className="text-ink2">WEIGHT</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-data font-tnum"
          >
            12.4 KG ✓
          </motion.span>
        </div>
        <a href="/scanning-bay" className="inline-block rounded-full border border-line px-2.5 py-1 text-[9px] uppercase tracking-[0.14em] text-ink2 transition-colors hover:border-brand hover:text-brand">
          FROM /scanning-bay →
        </a>
      </div>
    );
  }
  if (active === 3) {
    return (
      <motion.div
        className="w-full max-w-[300px] rounded-lg border border-data/40 bg-surface p-4"
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 20 }}
      >
        <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
          <CheckCircle2 className="h-3.5 w-3.5 text-data" /> ERPNext · Sales Invoice
        </div>
        <div className="mt-2 font-mono text-sm font-semibold text-ink0">
          INV/2025/0117 <span className="text-data">SUBMITTED ✓</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[9px] tracking-[0.08em] text-ink1">
          <span>IRN: b7f9c2e1…c5d2</span>
          <span className="text-right text-data">QR ✓</span>
        </div>
      </motion.div>
    );
  }
  if (active === 4) {
    return (
      <div className="flex flex-wrap gap-2">
        {ATTACH_DOCS.map((d, i) => (
          <motion.div
            key={d.key}
            initial={{ scale: 0.4, y: -18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ delay: i * 0.2, type: "spring", stiffness: 500, damping: 22 }}
          >
            <DocBadge doc={d} onOpen={onOpenDoc} />
          </motion.div>
        ))}
      </div>
    );
  }
  // GATE OUT — collapse to a single gate pass
  return (
    <motion.div
      className="w-full max-w-[300px] rounded-lg border border-line bg-surface"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <div className="border-b border-dashed border-line px-4 py-3">
        <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink2">GATE PASS</div>
        <div className="font-mono text-sm font-semibold text-ink0">#GP-2841</div>
      </div>
      <div className="flex items-center gap-3 px-4 py-3">
        <QrCode className="h-10 w-10 text-ink0" />
        <div className="font-mono text-[9px] uppercase leading-4 tracking-[0.12em] text-ink1">
          MH-04-CD-8812 · DRIVER R. YADAV
          <br />
          <span className="text-data">5 DOCS BUNDLED ✓</span> · <span className="text-brand">→ /gate</span>
        </div>
      </div>
    </motion.div>
  );
}

/** Static fallback for prefers-reduced-motion: plain 6-step list. */
function StaticLine({ onOpenDoc }: { onOpenDoc: (d: DemoDoc) => void }) {
  return (
    <section id="dispatch-line" data-tour="pipeline" className="bg-void py-[120px]">
      <div className="mx-auto max-w-[900px] px-6">
        <SectionKicker className="mb-8">DISPATCH.LINE</SectionKicker>
        <div className="space-y-6">
          {STATIONS.map((s, i) => (
            <div key={s.id} className="flex gap-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand font-mono text-[10px] text-brand">
                {i + 1}
              </span>
              <div>
                <div className="font-mono text-[12px] uppercase tracking-[0.16em] text-ink0">{s.id}</div>
                <p className="mt-1 text-sm text-ink1">{s.copy}</p>
                <div className="mt-1 font-mono text-[10px] tracking-[0.1em] text-data">{s.mono}</div>
                {i === 4 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ATTACH_DOCS.map((d) => (
                      <DocBadge key={d.key} doc={d} onOpen={onOpenDoc} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Section 3 — pinned 6-station dispatch line (scroll-driven, 260vh). */
export default function DispatchLine({ onOpenDoc }: { onOpenDoc: (d: DemoDoc) => void }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(STATIONS.length - 1, Math.floor(v * STATIONS.length)));
  });
  // Shipment card travels the track 1:1 with scroll (ease none feel).
  const cardX = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const railScale = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [allowPin, setAllowPin] = useState(false);
  useEffect(() => {
    setAllowPin(!reduced);
  }, [reduced]);

  if (!allowPin) return <StaticLine onOpenDoc={onOpenDoc} />;

  return (
    <section id="dispatch-line" data-tour="pipeline" ref={ref} className="relative h-[260vh] bg-void">
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-6 lg:grid-cols-[280px_1fr]">
          {/* step rail */}
          <div className="relative z-10">
            <SectionKicker className="mb-6">DISPATCH.LINE</SectionKicker>
            <div className="relative">
              <span className="absolute bottom-5 left-[15px] top-5 w-px bg-line" aria-hidden />
              <motion.span
                className="absolute left-[15px] top-5 w-px origin-top bg-brand"
                style={{ height: "calc(100% - 40px)", scaleY: railScale }}
                aria-hidden
              />
              <div className="flex flex-col gap-6">
                {STATIONS.map((s, i) => (
                  <div key={s.id} className="relative flex items-center gap-4">
                    <span
                      className={cn(
                        "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-all duration-300",
                        active === i
                          ? "border-brand bg-brand text-onbrand"
                          : i < active
                            ? "border-brand/60 bg-void text-brand"
                            : "border-line bg-void text-ink2"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-[0.14em] transition-colors duration-300",
                        active === i ? "text-ink0" : "text-ink2"
                      )}
                    >
                      {s.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* stage */}
          <div className="relative">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <p className="max-w-[420px] text-sm leading-relaxed text-ink1">{STATIONS[active].copy}</p>
              <span className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.14em] text-data">
                {STATIONS[active].mono}
              </span>
            </div>
            {/* dashed track */}
            <div className="relative rounded-xl border border-line bg-surface p-6">
              <div className="relative h-2 rounded-full border border-dashed border-linestrong/60" aria-hidden>
                {STATIONS.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      "absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 transition-all duration-300",
                      i <= active ? "border-brand bg-brand/30" : "border-line bg-surface"
                    )}
                    style={{ left: `calc(${(i / (STATIONS.length - 1)) * 100}% - 6px)` }}
                  />
                ))}
              </div>
              {/* moving shipment card */}
              <motion.div className="relative mt-6 h-[120px]" aria-hidden>
                <motion.div
                  className="absolute top-0 w-[190px]"
                  style={{ left: cardX, x: "-50%" }}
                >
                  <div className="relative rounded-lg border border-brand/50 bg-raised p-3">
                    <span className="absolute left-0 top-0 h-[10px] w-[10px] border-l border-t border-brand" />
                    <span className="absolute bottom-0 right-0 h-[10px] w-[10px] border-b border-r border-brand" />
                    <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink2">SHIPMENT</div>
                    <div className="font-mono text-[12px] font-semibold text-ink0">INV/2025/0117</div>
                    <div className="mt-1 font-mono text-[9px] tracking-[0.1em] text-data">→ DEL-NCR</div>
                  </div>
                </motion.div>
              </motion.div>
              {/* station visual */}
              <div className="mt-4 flex min-h-[110px] items-center border-t border-line pt-5">
                <StationVisual key={active} active={active} onOpenDoc={onOpenDoc} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
