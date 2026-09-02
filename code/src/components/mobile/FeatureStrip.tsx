import { memo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import PhoneFrame from "@/components/mobile/PhoneFrame";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------- mini app screens (4s loops) ------- */

const WaveScreen = memo(function WaveScreen() {
  return (
    <div className="flex flex-1 flex-col gap-2 px-3 pt-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">Wave W-42</div>
      {[80, 55, 30].map((p, i) => (
        <div key={i} className="rounded-lg border border-line bg-surface p-2">
          <div className="flex justify-between font-mono text-[7px] tracking-[0.1em] text-ink1">
            <span>ZONE {String.fromCharCode(65 + i)}</span>
            <span>{p}%</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-page">
            <motion.div
              className="h-full rounded-full bg-data"
              animate={{ width: [`${p - 25}%`, `${p}%`] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            />
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-brand/50 bg-brand-soft p-2 font-mono text-[7px] tracking-[0.1em] text-brand">
        12 LINES · OPTIMIZED PATH
      </div>
    </div>
  );
});

const CountScreen = memo(function CountScreen() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">Cycle count · C-01-04</div>
      <div className="flex items-center gap-4">
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="rounded-lg border border-linestrong bg-raised px-4 py-3 font-display text-2xl font-semibold text-ink0 font-tnum"
        >
          47
        </motion.div>
      </div>
      <div className="font-mono text-[7px] tracking-[0.12em] text-data">MATCHES LEDGER ✓</div>
    </div>
  );
});

const PhotoScreen = memo(function PhotoScreen() {
  return (
    <div className="relative flex flex-1 flex-col px-3 pt-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">Photo proof · Damage</div>
      <div className="relative mt-2 h-[200px] overflow-hidden rounded-lg border border-line bg-void">
        <div className="absolute left-1/2 top-1/2 h-20 w-24 -translate-x-1/2 -translate-y-1/2 rounded bg-[#C8A27A]/80" />
        <motion.div
          className="absolute inset-0 bg-white"
          animate={{ opacity: [0, 0, 0.8, 0] }}
          transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.6] }}
        />
        <span className="absolute bottom-1.5 left-1.5 font-mono text-[6px] tracking-[0.12em] text-ink2">
          ASN-0117 · CARTON 3/12
        </span>
      </div>
      <div className="mx-auto mt-3 h-8 w-8 rounded-full border-2 border-ink0" />
    </div>
  );
});

const BroadcastScreen = memo(function BroadcastScreen() {
  return (
    <div className="flex flex-1 flex-col gap-2 px-3 pt-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">Supervisor broadcast</div>
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="rounded-lg rounded-tl-none border border-brand/40 bg-brand-soft p-2.5"
      >
        <div className="font-mono text-[7px] tracking-[0.1em] text-brand">OPS LEAD · NOW</div>
        <div className="mt-1 text-[10px] leading-snug text-ink0">
          W-44 priority — clear dock 2 before 13:00.
        </div>
      </motion.div>
      <div className="rounded-lg border border-line bg-surface p-2 font-mono text-[7px] tracking-[0.1em] text-ink2">
        3 OPERATORS ACKED ✓
      </div>
    </div>
  );
});

const ScoreScreen = memo(function ScoreScreen() {
  return (
    <div className="flex flex-1 flex-col gap-2 px-3 pt-3">
      <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">Perf scorecard</div>
      <div className="rounded-lg border border-line bg-surface p-2.5 text-center">
        <div className="font-display text-2xl font-semibold text-ink0 font-tnum">61</div>
        <div className="font-mono text-[7px] tracking-[0.12em] text-ink2">PICKS/HR · RAVI</div>
      </div>
      <div className="flex h-[110px] items-end justify-around rounded-lg border border-line bg-surface p-2">
        {[40, 55, 48, 61, 58, 66, 61].map((v, i) => (
          <motion.div
            key={i}
            className={cn("w-3 rounded-sm", i === 5 ? "bg-brand" : "bg-data/70")}
            animate={{ height: [`${v * 0.7}%`, `${v}%`] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
});

/* ------- strip ------- */

const FEATURES = [
  { key: "wave", caption: "WAVE PICKING", Screen: WaveScreen },
  { key: "count", caption: "CYCLE COUNTS", Screen: CountScreen },
  { key: "photo", caption: "PHOTO PROOF", sub: "DAMAGE / RECEIVING", Screen: PhotoScreen },
  { key: "broadcast", caption: "SUPERVISOR BROADCASTS", Screen: BroadcastScreen },
  { key: "score", caption: "PERF SCORECARD", sub: "PICKS/HR", Screen: ScoreScreen },
];

export default function FeatureStrip() {
  const stripRef = useRef<HTMLDivElement>(null);
  const [center, setCenter] = useState(0);
  const [hovered, setHovered] = useState(false);

  // center detection from scroll position
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const onScroll = () => {
      const cardW = el.scrollWidth / FEATURES.length;
      setCenter(Math.round(el.scrollLeft / cardW));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // auto-advance every 5s unless hovered
  useEffect(() => {
    if (hovered) return;
    const t = window.setInterval(() => {
      const el = stripRef.current;
      if (!el) return;
      const cardW = el.scrollWidth / FEATURES.length;
      const next = (Math.round(el.scrollLeft / cardW) + 1) % FEATURES.length;
      el.scrollTo({ left: next * cardW, behavior: "smooth" });
    }, 5000);
    return () => window.clearInterval(t);
  }, [hovered]);

  return (
    <section className="bg-page px-6 py-24 md:py-36">
      <div className="mx-auto max-w-[1280px]">
        <SectionKicker>FEATURES</SectionKicker>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
          <SplitWords text="Shipped in the box." />
        </h2>
      </div>
      <div
        ref={stripRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="mx-auto mt-12 flex max-w-[1280px] snap-x snap-mandatory gap-8 overflow-x-auto px-6 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {FEATURES.map((f, i) => {
          const isCenter = i === center;
          return (
            <div key={f.key} className="flex shrink-0 snap-center flex-col items-center">
              <motion.div
                animate={{ scale: isCenter ? 1 : 0.94, opacity: isCenter ? 1 : 0.7 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <PhoneFrame width={200} height={410}>
                  <f.Screen />
                </PhoneFrame>
              </motion.div>
              <div className="mt-5 text-center">
                <span
                  className={cn(
                    "relative pb-1 font-mono text-[11px] uppercase tracking-[0.18em]",
                    isCenter ? "text-ink0" : "text-ink2"
                  )}
                >
                  {f.caption}
                  <span
                    className={cn(
                      "absolute bottom-0 left-0 h-px bg-brand transition-all duration-500",
                      isCenter ? "w-full" : "w-0"
                    )}
                    aria-hidden
                  />
                </span>
                {"sub" in f && f.sub && (
                  <div className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-ink2">{f.sub}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">
        Drag / scroll · auto-advances every 5s
      </p>
    </section>
  );
}
