import { motion } from "framer-motion";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ErpnextCta() {
  return (
    <section className="relative overflow-hidden bg-void py-24 md:py-32">
      {/* breathing teal pulse ring behind the H2 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
        <motion.span
          className="h-[420px] w-[420px] rounded-full border border-data"
          animate={{ scale: [0.7, 1.05, 0.7], opacity: [0.08, 0.02, 0.08] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="absolute h-[640px] w-[640px] rounded-full border border-data"
          animate={{ scale: [0.7, 1.05, 0.7], opacity: [0.05, 0.01, 0.05] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
        />
      </div>

      <div className="relative mx-auto max-w-[760px] px-6 text-center">
        <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
          <SplitWords text="Mirror your ERPNext in 3D." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ delay: 0.2, duration: 0.7, ease: EASE }}
          className="mx-auto mt-5 max-w-[520px] text-base leading-[1.65] text-ink1 md:text-lg"
        >
          Works with ERPNext v14 &amp; v15, Frappe Cloud and self-hosted.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/pricing">See pricing</GhostButton>
        </motion.div>
      </div>
    </section>
  );
}
