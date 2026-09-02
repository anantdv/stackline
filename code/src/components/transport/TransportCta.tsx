import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { PrimaryButton, GhostButton } from "@/components/Buttons";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Section 7 — final CTA; utilization ring echo, ghost links to /dispatch. */
export default function TransportCta() {
  return (
    <section data-tour="dispatch-link" className="relative overflow-hidden bg-void py-[120px]">
      {/* utilization ring echo, one slow sweep */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5" aria-hidden>
        <svg width="520" height="520" viewBox="0 0 100 100" className="-rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--data)" strokeWidth="1.5" />
          <motion.circle
            cx="50" cy="50" r="42" fill="none" stroke="var(--accent)" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
            whileInView={{ strokeDashoffset: 2 * Math.PI * 42 * 0.09 }}
            viewport={{ once: true }}
            transition={{ duration: 2.4, ease: EASE }}
          />
        </svg>
      </div>
      <div className="relative mx-auto max-w-[760px] px-6 text-center">
        <SectionKicker className="mb-6 justify-center">NEXT.DISPATCH</SectionKicker>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: EASE }}
          className="font-display text-[44px] font-bold leading-tight tracking-tight text-ink0"
        >
          <SplitWords text="Fill the truck, not the yard." />
        </motion.h2>
        <p className="mx-auto mt-5 max-w-[520px] text-lg leading-relaxed text-ink1">
          Placeholder reservations today; legal, sequenced, 91%-full vehicles at
          dispatch.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/dispatch">Next: dispatch & docs →</GhostButton>
        </div>
      </div>
    </section>
  );
}
