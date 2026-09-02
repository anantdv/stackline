import { motion } from "framer-motion";
import { FileText, FileCheck2, Ship, Plane, ReceiptText } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STACK = [
  { code: "EWB", sub: "2841 9912 4471 · VALID 22H", icon: FileCheck2, fan: -12, x: -84, tone: "text-data" },
  { code: "INV", sub: "INV/2025/0117 · IRN + QR", icon: FileText, fan: -6, x: -42, tone: "text-brand" },
  { code: "B/L", sub: "MAEU-8841-QF · 3 ORIGINALS", icon: Ship, fan: 0, x: 0, tone: "text-ink1" },
  { code: "AWB", sub: "098-5531 4421 · BOM→DXB", icon: Plane, fan: 6, x: 42, tone: "text-ink1" },
  { code: "LR", sub: "LR-7782 · MH-04-CD-8812", icon: ReceiptText, fan: 12, x: 84, tone: "text-ink1" },
] as const;

/** One paper-styled doc card in the fan. Lifts out of the stack on hover. */
function DocCard({ d, i }: { d: (typeof STACK)[number]; i: number }) {
  const Icon = d.icon;
  return (
    <motion.div
      className="absolute left-1/2 top-1/2 w-[196px] cursor-pointer"
      style={{ zIndex: 10 - Math.abs(d.fan), marginLeft: -98, marginTop: -120 }}
      animate={{
        rotate: [0, d.fan, d.fan, 0],
        x: [0, d.x, d.x, 0],
        y: [0, Math.abs(d.fan) * 0.6, Math.abs(d.fan) * 0.6, 0],
      }}
      transition={{ duration: 6, times: [0, 0.35, 0.62, 1], repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
      whileHover={{ y: -14, scale: 1.04, transition: { type: "spring", stiffness: 300, damping: 22 } }}
    >
      <div className="group relative rounded-xl border border-line bg-surface p-4 shadow-[var(--card-shadow)] transition-colors duration-300 hover:border-brand">
        {/* corner brackets */}
        <span className="absolute left-0 top-0 h-[12px] w-[12px] border-l border-t border-brand" aria-hidden />
        <span className="absolute bottom-0 right-0 h-[12px] w-[12px] border-b border-r border-brand" aria-hidden />
        <div className="flex items-center justify-between">
          <Icon className={`h-4 w-4 ${d.tone}`} />
          <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-ink2">AUTO-ATTACHED</span>
        </div>
        <div className="mt-8 font-display text-2xl font-bold tracking-tight text-ink0">{d.code}</div>
        <div className="mt-1 font-mono text-[9px] uppercase leading-4 tracking-[0.1em] text-ink2">{d.sub}</div>
        <div className="mt-3 space-y-1">
          {[72, 88, 56].map((w) => (
            <span key={w} className="block h-1 rounded bg-raised" style={{ width: `${w}%` }} aria-hidden />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function DispatchHero() {
  return (
    <section data-tour="hero" className="relative flex min-h-[calc(100svh-64px)] items-center overflow-hidden bg-void">
      {/* blueprint grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 py-20 lg:grid-cols-[45%_55%]">
        <div className="relative z-10">
          <div className="absolute inset-y-0 -left-10 right-[-20%] z-[-1]" style={{ background: "var(--scrim)" }} aria-hidden />
          <SectionKicker className="mb-6">DISPATCH.COMPLIANCE</SectionKicker>
          <h1 className="font-display text-[44px] font-bold leading-[1.02] tracking-tight text-ink0 sm:text-[60px] lg:text-[76px]">
            <SplitChars
              segments={[
                { text: "Ship it. The paperwork " },
                { text: "files itself.", accent: true },
              ]}
              stagger={0.02}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-[500px] text-lg leading-relaxed text-ink1"
          >
            Pick, pack, weigh, invoice — and Stackline assembles the exact statutory
            document set for your shipping method. E-way bill with live validity,
            e-invoice with IRN and QR, bill of lading, airway bill. Attached,
            numbered, audit-ready.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Automate my dispatch</PrimaryButton>
            <a
              href="#dispatch-line"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Walk the dispatch line ↓
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.05, duration: 0.6 }}
            className="mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2"
          >
            EWB · E-INVOICE IRN · B/L · AWB · LR · GATE PASS —{" "}
            <span className="text-data">AUTO-ATTACHED</span>
          </motion.div>
        </div>

        {/* document stack */}
        <div className="relative mx-auto hidden h-[420px] w-full max-w-[520px] sm:block" aria-hidden>
          {STACK.map((d, i) => (
            <DocCard key={d.code} d={d} i={i} />
          ))}
          {/* caption strip */}
          <motion.div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-ink2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6, ease: EASE }}
          >
            5 DOCUMENTS · GENERATED AT INVOICE TIME
          </motion.div>
        </div>
      </div>
    </section>
  );
}
