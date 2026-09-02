import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plane } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import PhoneFrame, { PhoneTabBar } from "@/components/mobile/PhoneFrame";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const BULLETS = [
  "Local queue with per-task status",
  "Conflict resolution — last-scan-wins + supervisor review",
  "Sync progress ring on reconnect",
  "Counts work fully offline",
];

type Task = { id: string; title: string; state: "open" | "queued" | "posted" };

const OfflineScreen = memo(function OfflineScreen({ active }: { active: boolean }) {
  // 6s loop: online → offline(queued×2) → reconnect → posted
  const [offline, setOffline] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "t1", title: "PUTAWAY · PAL-2211 → A-04-02-03", state: "open" },
    { id: "t2", title: "PICK · SKU-0417 × 2", state: "open" },
  ]);
  const [reconciled, setReconciled] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const timers: number[] = [];
    const later = (ms: number, fn: () => void) => timers.push(window.setTimeout(() => !cancelled && fn(), ms));

    const cycle = () => {
      setOffline(false);
      setReconciled(false);
      setTasks([
        { id: "t1", title: "PUTAWAY · PAL-2211 → A-04-02-03", state: "open" },
        { id: "t2", title: "PICK · SKU-0417 × 2", state: "open" },
      ]);
      later(900, () => setOffline(true));
      later(1700, () => setTasks((ts) => ts.map((t, i) => (i === 0 ? { ...t, state: "queued" } : t))));
      later(2500, () => setTasks((ts) => ts.map((t, i) => (i === 1 ? { ...t, state: "queued" } : t))));
      later(3400, () => setOffline(false));
      later(4000, () => setTasks((ts) => ts.map((t, i) => (i === 0 ? { ...t, state: "posted" } : t))));
      later(4600, () => {
        setTasks((ts) => ts.map((t, i) => (i === 1 ? { ...t, state: "posted" } : t)));
        setReconciled(true);
      });
    };
    cycle();
    const loop = window.setInterval(cycle, 6200);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.clearInterval(loop);
    };
  }, [active]);

  return (
    <div className="relative flex flex-1 flex-col gap-2 px-4 pb-2 pt-3">
      {/* offline banner */}
      <AnimatePresence>
        {offline && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 rounded-lg border border-warn/50 bg-warn/10 px-3 py-2"
          >
            <Plane className="h-3 w-3 text-warn" />
            <span className="font-mono text-[9px] tracking-[0.14em] text-warn">OFFLINE · QUEUING</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink2">Zone A · Aisle 04</span>
        <span className={cn("font-mono text-[8px] tracking-[0.12em]", offline ? "text-warn" : "text-data")}>
          {offline ? "NO SIGNAL" : "● ONLINE"}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 rounded-lg border border-line bg-surface p-2.5">
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
                t.state === "open" && "border border-linestrong text-transparent",
                t.state === "queued" && "border border-ink2 bg-raised text-transparent",
                t.state === "posted" && "bg-data text-void"
              )}
            >
              <Check className="h-3 w-3" />
            </span>
            <span className="flex-1 font-mono text-[8px] tracking-[0.08em] text-ink0">{t.title}</span>
            <AnimatePresence mode="wait">
              {t.state === "queued" && (
                <motion.span
                  key="q"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="rounded border border-linestrong bg-raised px-1.5 py-0.5 font-mono text-[7px] tracking-[0.1em] text-ink2"
                >
                  QUEUED
                </motion.span>
              )}
              {t.state === "posted" && (
                <motion.span
                  key="p"
                  initial={{ opacity: 0, scale: 0.85, backgroundColor: "rgba(45,212,191,0.35)" }}
                  animate={{ opacity: 1, scale: 1, backgroundColor: "rgba(45,212,191,0.1)" }}
                  className="rounded border border-data/50 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.1em] text-data"
                >
                  ✓ POSTED
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {/* reconciled readout */}
      <AnimatePresence>
        {reconciled && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-data/40 bg-data-soft px-3 py-2 text-center font-mono text-[8px] tracking-[0.12em] text-data"
          >
            2 ENTRIES RECONCILED · 0 CONFLICTS
          </motion.div>
        )}
      </AnimatePresence>
      <PhoneTabBar active="TASKS" />
    </div>
  );
});

export default function OfflineDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section data-tour="mobile-offline" className="bg-page px-6 py-24 md:py-36">
      <div ref={ref} className="mx-auto grid max-w-[1280px] items-center gap-12 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <SectionKicker>DEAD.ZONES</SectionKicker>
          <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
            <SplitWords text="Concrete eats signal. Work continues." />
          </h2>
          <p className="mt-5 max-w-[480px] text-base leading-[1.65] text-ink1">
            High-rack aisles and basements kill connectivity. The app queues
            every scan and move locally with conflict resolution, then
            reconciles in order when signal returns — the twin catches up as if
            nothing happened.
          </p>
          <ul className="mt-7 flex flex-col gap-3">
            {BULLETS.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
                className="flex items-center gap-3 text-sm text-ink1"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-data-soft text-data">
                  <Check className="h-3 w-3" />
                </span>
                {b}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
          className="flex justify-center"
        >
          <PhoneFrame width={300} height={610}>
            <OfflineScreen active={active} />
          </PhoneFrame>
        </motion.div>
      </div>
    </section>
  );
}
