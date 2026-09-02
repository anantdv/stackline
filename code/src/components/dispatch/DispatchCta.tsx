import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { PrimaryButton, GhostButton } from "@/components/Buttons";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Section 7 — final CTA; ghost links onward to /gate. */
export default function DispatchCta() {
  return (
    <section data-tour="gate-link" className="relative overflow-hidden bg-void py-[120px]">
      {/* faint document fan echo */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5" aria-hidden>
        {[-14, -7, 0, 7, 14].map((r) => (
          <motion.div
            key={r}
            className="absolute h-64 w-48 rounded-xl border-2 border-brand"
            style={{ rotate: r }}
            animate={{ rotate: [r, r * 1.4, r] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <div className="relative mx-auto max-w-[760px] px-6 text-center">
        <SectionKicker className="mb-6 justify-center">NEXT.GATE</SectionKicker>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="font-display text-[44px] font-bold leading-tight tracking-tight text-ink0"
        >
          <SplitWords text="No shipment waits for paperwork." />
        </motion.h2>
        <p className="mx-auto mt-5 max-w-[520px] text-lg leading-relaxed text-ink1">
          Method-aware compliance, generated at invoice time, checked again at the
          gate.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/gate">Next: gate management →</GhostButton>
        </div>
      </div>
    </section>
  );
}
