import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * StepRail — horizontal numbered mono step rail with a connector line that
 * fills with scroll progress. Static, always-visible half of the v2
 * self-learning workflow explanation (design-delta §4.11).
 */
export default function StepRail({
  steps,
  className,
  tourKey,
}: {
  steps: { key: string; title: string; body: string }[];
  className?: string;
  tourKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        /* 0 when the rail top hits 85% viewport, 1 when its bottom hits 45% */
        const t = (vh * 0.85 - r.top) / (vh * 0.4 + r.height);
        setProgress(Math.max(0, Math.min(1, t)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)} data-tour={tourKey}>
      {/* connector track */}
      <div
        aria-hidden
        className="absolute left-0 right-0 top-[26px] hidden h-px bg-linestrong lg:block"
      />
      <motion.div
        aria-hidden
        className="absolute left-0 top-[26px] hidden h-px origin-left bg-data lg:block"
        style={{ scaleX: progress, width: "100%" }}
      />
      <ol className="grid gap-10 lg:grid-cols-4 lg:gap-6">
        {steps.map((s, i) => {
          const passed = progress * steps.length > i + 0.5;
          return (
            <motion.li
              key={s.key}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ delay: i * 0.1, duration: 0.7, ease: EASE }}
              className="relative"
            >
              <div
                className={cn(
                  "relative z-10 flex h-[52px] w-[52px] items-center justify-center rounded-full border font-mono text-sm transition-colors duration-500",
                  passed
                    ? "border-brand bg-brand text-onbrand"
                    : "border-linestrong bg-surface text-ink2"
                )}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 font-mono text-xs uppercase tracking-[0.18em] text-ink0">
                {s.title}
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink1">
                {s.body}
              </p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
