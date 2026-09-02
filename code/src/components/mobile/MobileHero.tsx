import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Play, Apple } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { PrimaryButton } from "@/components/Buttons";
import PhoneFrame, { PhoneTabBar } from "@/components/mobile/PhoneFrame";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function TickUp({ target, active, delay = 0 }: { target: number; active: boolean; delay?: number }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const start = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / 1200));
      setV(Math.round(target * (1 - Math.pow(1 - t, 4))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, delay]);
  return <>{v}</>;
}

/** App home screen: greeting, today's tasks, mini twin strip, tab bar. */
function HomeScreen() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex flex-1 flex-col gap-3 px-4 pb-2 pt-4">
      <div>
        <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">Stackline floor</div>
        <div className="font-display text-lg font-semibold text-ink0">MORNING, RAVI</div>
      </div>
      {/* today's tasks */}
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink2">Today&rsquo;s tasks</div>
        <div className="mt-2 flex gap-2">
          {[
            { v: 12, k: "PICKS", d: 0 },
            { v: 4, k: "PUTAWAYS", d: 200 },
            { v: 1, k: "COUNT", d: 400 },
          ].map((t) => (
            <div key={t.k} className="flex-1 rounded-lg border border-line bg-page/60 px-2 py-2 text-center">
              <div className="font-display text-xl font-semibold text-ink0 font-tnum">
                <TickUp target={t.v} active={inView} delay={t.d} />
              </div>
              <div className="font-mono text-[7px] tracking-[0.14em] text-ink2">{t.k}</div>
            </div>
          ))}
        </div>
      </div>
      {/* mini twin map strip */}
      <div className="relative h-[150px] overflow-hidden rounded-xl border border-line bg-void">
        <svg viewBox="0 0 260 150" className="h-full w-full">
          {Array.from({ length: 4 }, (_, r) => (
            <rect key={r} x={24} y={18 + r * 30} width={212} height={14} rx={2} fill="none" stroke="var(--line-strong)" strokeWidth={1} />
          ))}
          <path d="M40 140 V60 H130 V25" fill="none" stroke="var(--data)" strokeWidth={1.5} strokeDasharray="5 5" className="animate-[dash-flow_1.2s_linear_infinite]" />
        </svg>
        <span className="absolute left-[36px] top-[132px] h-2 w-2 rounded-full bg-data animate-pulse-dot" aria-hidden />
        <span className="absolute bottom-1.5 left-2 font-mono text-[7px] uppercase tracking-[0.14em] text-ink2">
          WH-MUM-01 · ZONE A
        </span>
      </div>
      <PhoneTabBar active="TASKS" />
    </div>
  );
}

export default function MobileHero() {
  return (
    <section
      data-tour="hero"
      className="relative flex min-h-[calc(100svh-72px)] items-center overflow-hidden bg-void blueprint-grid"
    >
      {/* theme scrim keeps the left column readable in both themes */}
      <div className="absolute inset-0" style={{ background: "var(--scrim)" }} aria-hidden />
      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] items-center gap-12 px-6 py-20 lg:grid-cols-[55%_45%]">
        <div>
          <SectionKicker>FLOOR.APP</SectionKicker>
          <h1 className="mt-6 font-display text-[40px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[76px]">
            <SplitWords text="Every workflow, six feet from the rack." stagger={0.05} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: EASE }}
            className="mt-6 max-w-[480px] text-lg leading-[1.65] text-ink1"
          >
            The Stackline floor app for Android and iOS. Scan with the camera,
            tap NFC tags, read QR bin labels, work offline in dead zones — every
            move posts to the twin and to ERPNext the moment signal returns.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
            <span className="inline-flex cursor-default items-center gap-2 rounded-lg border border-linestrong px-5 py-[13px] font-display text-[14px] font-semibold text-ink1">
              <Apple className="h-4 w-4" /> App Store
            </span>
            <span className="inline-flex cursor-default items-center gap-2 rounded-lg border border-linestrong px-5 py-[13px] font-display text-[14px] font-semibold text-ink1">
              <Play className="h-4 w-4" /> Google Play
            </span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2"
          >
            ANDROID 10+ · iOS 16+ · OFFLINE-FIRST · &lt;60MB
          </motion.p>
        </div>

        {/* hero phone with gyro tilt */}
        <motion.div
          initial={{ opacity: 0, y: 80, rotateY: 8 }}
          animate={{ opacity: 1, y: 0, rotateY: 0 }}
          transition={{ duration: 0.9, ease: EASE }}
          className="flex justify-center lg:justify-end"
        >
          <PhoneFrame tilt float dataTour="mobile-home" width={320} height={650}>
            <HomeScreen />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}
