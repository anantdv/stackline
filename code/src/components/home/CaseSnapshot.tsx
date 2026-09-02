import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import MetricStat from "@/components/MetricStat";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function CaseSnapshot() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section ref={ref} className="bg-void py-24 md:py-36">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 px-6 lg:grid-cols-2">
        {/* Image with parallax + orange duotone overlay */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15% 0px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-xl border border-line"
        >
          <motion.img
            src="/case-fulfillment.jpg"
            alt="Aerial view of a fulfillment floor at dusk"
            style={{ y: imgY, scale: 1.15 }}
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-tr from-brand/25 via-transparent to-data/15 mix-blend-overlay"
          />
          <div className="absolute bottom-3 left-3 rounded bg-void/80 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-ink1">
            SITE 042 — 42,000 M² — LIVE
          </div>
        </motion.div>

        <div>
          <SectionKicker>DEPLOYED</SectionKicker>
          <blockquote className="mt-6 font-display text-2xl font-medium leading-[1.3] tracking-[-0.01em] text-ink0 md:text-[28px]">
            <SplitWords text='"We photographed our floor on a Monday. By Friday the team was picking inside the twin — and ERPNext matched the racks to the carton."' />
          </blockquote>
          <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
            Head of Ops — 3PL, 42,000 m² Fulfillment Center
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6">
            <MetricStat value={31} suffix="%" caption="Faster Putaway" />
            <MetricStat value={99.2} decimals={1} suffix="%" caption="Count Accuracy" />
            <MetricStat value={6} caption="Weeks to Rollout" />
          </div>
        </div>
      </div>
    </section>
  );
}
