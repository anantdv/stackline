import { motion } from "framer-motion";
import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function MobileCta() {
  return (
    <section className="relative overflow-hidden bg-void px-6 py-24 md:py-32">
      {/* faint NFC ripple behind CTAs */}
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-data/40 animate-[ripple_2.4s_ease-out_infinite]"
            style={{ animationDelay: `${i * 0.8}s` }}
          />
        ))}
      </div>
      <div className="relative mx-auto max-w-[860px] text-center">
        <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-tight text-ink0 md:text-[44px]">
          <SplitWords text="The floor already has phones. Give them the twin." />
        </h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/gate">Next: gate management →</GhostButton>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2"
        >
          MDM-READY · SSO · ROLE-SCOPED TASKS
        </motion.p>
      </div>
    </section>
  );
}
