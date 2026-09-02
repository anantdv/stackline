import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function useInViewOnce() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

function useCountUp(target: number, active: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, duration]);
  return value;
}

/**
 * Big tabular number (Space Grotesk) + mono caption. Counts up on scroll.
 * Pass `decimals` for fractional values and `format` to fully control output.
 */
export default function MetricStat({
  value,
  caption,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
}: {
  value: number;
  caption: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
}) {
  const { ref, inView } = useInViewOnce();
  const v = useCountUp(value, inView);
  const display = decimals > 0
    ? v.toFixed(decimals)
    : Math.round(v).toLocaleString("en-US");
  return (
    <div ref={ref} className={cn("flex flex-col gap-1", className)}>
      <span className="font-display text-4xl font-semibold tracking-tight text-ink0 font-tnum md:text-[56px] md:leading-none">
        {prefix}
        {display}
        {suffix && <span className="text-brand">{suffix}</span>}
      </span>
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink2">
        {caption}
      </span>
    </div>
  );
}
