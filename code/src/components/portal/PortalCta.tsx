import { motion } from "framer-motion";
import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function PortalCta() {
  return (
    <section className="relative overflow-hidden bg-void px-6 py-24 md:py-32">
      {/* faint KPI echo behind */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center gap-16 opacity-[0.04]"
      >
        {["1,842", "98.7%", "24H", "₹86.4L"].map((v) => (
          <span key={v} className="font-display text-[9vw] font-bold text-ink0 font-tnum">
            {v}
          </span>
        ))}
      </div>
      <div className="relative mx-auto max-w-[800px] text-center">
        <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-tight text-ink0 md:text-[44px]">
          <SplitWords text="Retention is a login screen." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          className="mx-auto mt-4 max-w-[480px] text-lg text-ink1"
        >
          Customers who can see their stock don&rsquo;t churn.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/mobile-app">See the floor app →</GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
