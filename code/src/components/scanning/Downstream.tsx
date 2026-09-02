import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import MetricStat from "@/components/MetricStat";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const DESTS = [
  { to: "/warehouse-3d", title: "Bin capacity", desc: "DIMS FIT RACKS" },
  { to: "/transport", title: "Load planning", desc: "TRUE CUBE & WEIGHT" },
  { to: "/dispatch", title: "Freight invoicing", desc: "CHARGEABLE WEIGHT" },
];

export default function Downstream() {
  return (
    <section className="bg-page py-24 md:py-32">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>DOWNSTREAM</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          Measured once, used everywhere.
        </h2>

        {/* flow band */}
        <div data-tour="downstream" className="mt-12 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr]">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <BlueprintCard className="flex h-full flex-col justify-center p-5 hover:-translate-y-0">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
                SCAN BAY
              </span>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">
                DIMS · WEIGHT · CONTENTS
              </p>
            </BlueprintCard>
          </motion.div>

          {DESTS.map((d, i) => (
            <div key={d.to} className="contents">
              {/* arrow connector with travelling packet */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
                className="hidden items-center lg:flex"
                aria-hidden
              >
                <svg width="64" height="24" viewBox="0 0 64 24">
                  <motion.line
                    x1="0" y1="12" x2="56" y2="12"
                    className="stroke-data" strokeWidth="1.5" strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.2, duration: 0.8, ease: EASE }}
                  />
                  <path d="M 52 6 L 62 12 L 52 18" fill="none" className="stroke-data" strokeWidth="1.5" />
                  <circle r="2.5" className="fill-data">
                    <animateMotion dur="1.8s" begin={`${i * 0.6}s`} repeatCount="indefinite" path="M 4 12 L 52 12" />
                  </circle>
                </svg>
              </motion.div>
              <ArrowRight className="mx-auto h-5 w-5 rotate-90 text-data lg:hidden" aria-hidden />
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: EASE }}
              >
                <Link to={d.to} className="block h-full">
                  <BlueprintCard className="h-full p-5">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-ink0">
                      {d.title}
                    </span>
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-data">
                      {d.desc}
                    </p>
                  </BlueprintCard>
                </Link>
              </motion.div>
            </div>
          ))}
        </div>

        {/* stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 lg:grid-cols-4">
          <MetricStat value={1400} caption="PARCELS / HOUR" />
          <MetricStat value={2} prefix="±" suffix=" MM" caption="DIMENSION · ±5G WEIGHT" />
          <MetricStat value={0.8} decimals={1} suffix="S" caption="CAPTURE TIME" />
          <MetricStat value={99.1} decimals={1} suffix="%" caption="AUTO-CLEAR RATE" />
        </div>
      </div>
    </section>
  );
}
