import { motion } from "framer-motion";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function IndustriesCta() {
  return (
    <section className="relative overflow-hidden bg-void py-24 md:py-32">
      {/* breathing orange radial glow behind the H2 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <motion.span
          className="h-[460px] w-[720px] rounded-full bg-brand blur-[140px]"
          animate={{ scale: [0.85, 1.05, 0.85], opacity: [0.10, 0.05, 0.10] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto max-w-[820px] px-6 text-center">
        <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
          <SplitWords text="Your industry. Your twin. 48 hours." />
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ delay: 0.25, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/pricing">See pricing</GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
