import { useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "framer-motion";
import { FileUp, Ruler, Boxes, RefreshCw } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    n: "01",
    title: "IMPORT",
    icon: FileUp,
    body: "Drop your floor plan or CSV of rack coordinates. Stackline detects walls, columns, dock doors and clearance zones automatically.",
  },
  {
    n: "02",
    title: "PROFILE",
    icon: Ruler,
    body: "Pick rack profiles: beam height, bay width, depth, load rating. Apply per zone — bulk, pick-face, mezzanine, cold store.",
  },
  {
    n: "03",
    title: "GENERATE",
    icon: Boxes,
    body: "Bins are enumerated with your naming convention — ZONE-AISLE-RACK-LEVEL — and registered as ERPNext Warehouses/Bins.",
  },
  {
    n: "04",
    title: "SYNC",
    icon: RefreshCw,
    body: "The twin goes live: stock levels, reservations and moves mirror ERPNext in real time.",
  },
];

export default function PipelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 78%", "end 55%"],
  });
  const draw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length + 0.15)));
  });

  return (
    <section className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>PIPELINE</SectionKicker>
        <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="From paper to parametric." />
        </h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-18% 0px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mt-5 max-w-[560px] text-base leading-[1.65] text-ink1 md:text-lg"
        >
          Four steps between a drawing on a clipboard and a live,
          ERPNext-synced spatial model of your floor.
        </motion.p>

        {/* Timeline */}
        <div ref={ref} className="relative mt-16">
          {/* Connector line (desktop) */}
          <div className="absolute left-0 right-0 top-[27px] hidden lg:block" aria-hidden>
            <svg width="100%" height="8" preserveAspectRatio="none" viewBox="0 0 100 8">
              <line
                x1="0"
                y1="4"
                x2="100"
                y2="4"
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="1"
                strokeDasharray="2 3"
                vectorEffect="non-scaling-stroke"
              />
              <motion.line
                x1="0"
                y1="4"
                x2="100"
                y2="4"
                stroke="#FF6B1A"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
                style={{ pathLength: draw }}
              />
            </svg>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-12% 0px" }}
                transition={{ delay: i * 0.15, duration: 0.8, ease: EASE }}
              >
                <BlueprintCard className="h-full p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "flex h-[54px] w-[54px] items-center justify-center rounded-lg border font-mono text-sm font-semibold tracking-[0.1em] transition-colors duration-500",
                        i <= active
                          ? "border-brand bg-brand text-page"
                          : "border-linestrong bg-raised text-ink2"
                      )}
                    >
                      {s.n}
                    </span>
                    <s.icon
                      className={cn(
                        "h-5 w-5 transition-colors duration-500",
                        i <= active ? "text-brand" : "text-ink2"
                      )}
                    />
                  </div>
                  <h3 className="mt-6 font-display text-lg font-semibold tracking-[0.06em] text-ink0">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-[1.65] text-ink1">
                    {s.body}
                  </p>
                </BlueprintCard>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
