import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Faint isometric wireframe of a single rack, floating slowly. */
function RackWireframe() {
  return (
    <svg
      viewBox="0 0 300 220"
      className="h-full w-full animate-float-slow"
      fill="none"
      stroke="#FF6B1A"
      strokeWidth="1"
    >
      {/* iso rack: uprights */}
      {[
        [40, 120],
        [40, 60],
        [260, 20],
        [260, 80],
      ].map(([x, y], i) => (
        <line key={i} x1={x} y1={y} x2={x} y2={y + 70} />
      ))}
      {/* beams */}
      {[0, 24, 48, 70].map((dy, i) => (
        <g key={i}>
          <line x1={40} y1={120 + dy} x2={260} y2={80 + dy} />
          <line x1={40} y1={60 + dy} x2={260} y2={20 + dy} />
          <line x1={40} y1={120 + dy} x2={40} y2={60 + dy} />
          <line x1={260} y1={80 + dy} x2={260} y2={20 + dy} />
        </g>
      ))}
    </svg>
  );
}

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-page py-24 blueprint-grid md:py-40">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[560px] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]"
      >
        <RackWireframe />
      </div>

      <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 text-center">
        <SectionKicker className="justify-center">GET.STARTED</SectionKicker>
        <h2 className="mt-6 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[64px]">
          <SplitWords text="Your warehouse is already 3D. Your software should be too." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-6 max-w-[560px] text-base leading-[1.65] text-ink1 md:text-lg"
        >
          Send us a floor plan — we'll return a working twin of your warehouse,
          synced to your ERPNext site, within 48 hours.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ delay: 0.12, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/pricing">See pricing</GhostButton>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2"
        >
          No middleware · Self-hosted or cloud · Frappe-certified
        </motion.div>
      </div>
    </section>
  );
}
