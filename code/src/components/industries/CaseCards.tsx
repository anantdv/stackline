import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CASES = [
  {
    tag: "3PL · 42,000 M²",
    quote: "Full twin from a hand-drawn plan; picking live in week 6.",
    stats: [
      { value: 31, suffix: "%", label: "Faster putaway" },
      { value: 1152, suffix: "", label: "Bins" },
      { value: 12, suffix: "ms", label: "Sync" },
    ],
  },
  {
    tag: "PHARMA DISTRIBUTOR",
    quote: "FEFO allocation ended expired-stock write-offs.",
    stats: [
      { value: 100, suffix: "%", label: "Traceability" },
      { value: 0, suffix: "", label: "Write-offs Q3" },
      { value: 2, suffix: "–8°C", label: "Cold zones" },
    ],
  },
  {
    tag: "AUTO-PARTS MANUFACTURER",
    quote: "Kitting workflow feeds 14 production lines.",
    stats: [
      { value: 14, suffix: "", label: "Lines fed" },
      { value: 0, suffix: "", label: "Stoppages" },
      { value: 4, suffix: "wk", label: "Rollout" },
    ],
  },
];

/** Small counting stat for case cards. */
function MiniStat({
  value,
  suffix,
  label,
  active,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  active: boolean;
  delay: number;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 1200));
      const eased = 1 - Math.pow(1 - t, 4);
      setV(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, value, delay]);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-2xl font-semibold tracking-tight text-ink0 font-tnum">
        {Math.round(v).toLocaleString("en-US")}
        <span className="text-brand">{suffix}</span>
      </span>
      <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
        {label}
      </span>
    </div>
  );
}

function CaseCard({ item, index }: { item: (typeof CASES)[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ delay: index * 0.12, duration: 0.7, ease: EASE }}
      className="h-full"
    >
      <BlueprintCard className="flex h-full flex-col p-7">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-data">
          {item.tag}
        </div>
        <blockquote className="relative mt-5 flex-1 pl-6 text-lg leading-[1.55] text-ink0">
          <motion.span
            aria-hidden
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : undefined}
            transition={{ delay: 0.3 + index * 0.12, duration: 0.4, ease: EASE }}
            className="absolute left-0 top-0 font-display text-3xl leading-none text-brand"
          >
            "
          </motion.span>
          {item.quote}
        </blockquote>
        <div className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
          {item.stats.map((s, i) => (
            <MiniStat
              key={s.label}
              value={s.value}
              suffix={s.suffix}
              label={s.label}
              active={inView}
              delay={i * 120}
            />
          ))}
        </div>
      </BlueprintCard>
    </motion.div>
  );
}

export default function CaseCards() {
  return (
    <section className="bg-void py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>DEPLOYED</SectionKicker>
        <h2 className="mt-6 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="Twins in production." />
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {CASES.map((c, i) => (
            <CaseCard key={c.tag} item={c} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
