import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { BillingToggle, EASE, type Billing } from "@/components/pricing/shared";

export default function PricingHero({
  billing,
  onBillingChange,
}: {
  billing: Billing;
  onBillingChange: (b: Billing) => void;
}) {
  return (
    <section className="blueprint-grid relative flex min-h-[55dvh] flex-col items-center justify-center overflow-hidden bg-void px-6 py-24 text-center">
      {/* vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,transparent_0%,#07090C_100%)]"
      />
      <div className="relative flex flex-col items-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <SectionKicker>PRICING</SectionKicker>
        </motion.div>

        <h1 className="max-w-[900px] text-balance font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[64px] md:leading-[1.02]">
          <SplitWords text="Priced by the bin, not by the mystery." stagger={0.05} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
          className="max-w-[580px] text-lg leading-relaxed text-ink1"
        >
          Your warehouse is geometry — so is our pricing. Count your bins, pick a
          tier, know your number.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 22 }}
        >
          <BillingToggle billing={billing} onChange={onBillingChange} />
        </motion.div>
      </div>
    </section>
  );
}
