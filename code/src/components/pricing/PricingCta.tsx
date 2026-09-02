import { memo } from "react";
import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";
import { EASE } from "@/components/pricing/shared";

/** Isolated perpetual glow so the loop never re-renders the section. */
const BreathingGlow = memo(function BreathingGlow() {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-soft blur-[100px]"
      animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
});

export default function PricingCta() {
  return (
    <section className="relative overflow-hidden bg-page px-6 py-24 md:py-[120px]">
      <BreathingGlow />
      <div className="relative mx-auto flex max-w-[760px] flex-col items-center gap-6 text-center">
        <h2 className="font-display text-[32px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink0 md:text-[44px]">
          <SplitWords text="Start with your floor plan." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          className="text-lg text-ink1"
        >
          30-day pilot on your real warehouse — bins, racks, ERPNext sync and all.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.7, ease: EASE }}
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
        </motion.div>
      </div>
    </section>
  );
}
