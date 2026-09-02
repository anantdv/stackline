import { motion } from "framer-motion";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function FeaturesCta() {
  return (
    <section className="relative overflow-hidden bg-void py-24 md:py-32">
      {/* breathing orange glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl"
        animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="mx-auto max-w-3xl font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
          <SplitWords text="Run all four engines on your floor." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          className="mx-auto mt-4 max-w-xl text-lg text-ink1"
        >
          One twin, one ledger, one afternoon to see it live.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/erpnext">See ERPNext integration</GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
