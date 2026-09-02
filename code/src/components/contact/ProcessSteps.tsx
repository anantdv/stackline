import { motion } from "framer-motion";
import { Boxes, Rocket, Video } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";
import { EASE } from "@/components/contact/shared";

const STEPS = [
  {
    n: "01",
    title: "CALL",
    icon: Video,
    body: "30 minutes on your operation: SKUs, flows, ERPNext setup. Bring your floor plan if you have one.",
  },
  {
    n: "02",
    title: "TWIN",
    icon: Boxes,
    body: "We build your warehouse in Stackline within 48 hours and sync it to a sandbox ERPNext site.",
  },
  {
    n: "03",
    title: "PILOT",
    icon: Rocket,
    body: "30-day pilot on your floor — pick, move and count in the twin while the ledger proves itself.",
  },
];

export default function ProcessSteps() {
  return (
    <section className="bg-page px-6 py-24 md:py-[140px]">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-col gap-4">
          <SectionKicker>PROCESS</SectionKicker>
          <h2 className="font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
            <SplitWords text="From call to twin in three steps." />
          </h2>
        </div>

        <div className="relative mt-14">
          {/* dashed connector line drawn behind the cards */}
          <svg
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-1/2 hidden h-2 w-full -translate-y-1/2 md:block"
            preserveAspectRatio="none"
            viewBox="0 0 100 2"
          >
            <motion.line
              x1={2}
              y1={1}
              x2={98}
              y2={1}
              stroke="rgba(45,212,191,0.4)"
              strokeWidth={0.5}
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ delay: 0.5, duration: 1, ease: EASE }}
            />
          </svg>

          <div className="relative grid gap-6 md:grid-cols-3 lg:gap-8">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12% 0px" }}
                transition={{ delay: i * 0.12, duration: 0.8, ease: EASE }}
              >
                <BlueprintCard className="flex h-full flex-col gap-5 p-8">
                  <div className="flex items-center justify-between">
                    <motion.span
                      initial={{ scale: 0, rotate: -12 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true, margin: "-12% 0px" }}
                      transition={{ delay: i * 0.12 + 0.25, type: "spring", stiffness: 380, damping: 18 }}
                      className="flex h-12 w-12 items-center justify-center rounded-lg border border-linestrong bg-void text-brand"
                    >
                      <step.icon className="h-5 w-5" />
                    </motion.span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
                      STEP {step.n}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-ink0">
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed text-ink1">{step.body}</p>
                </BlueprintCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
