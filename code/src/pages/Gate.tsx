import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton, GhostButton } from "@/components/Buttons";
import { SplitWords } from "@/components/SplitText";
import GateHero from "@/components/gate/GateHero";
import OpsBoard from "@/components/gate/OpsBoard";
import GateLifecycle from "@/components/gate/GateLifecycle";
import DockGantt from "@/components/gate/DockGantt";
import YardMap from "@/components/gate/YardMap";
import GateSecurity from "@/components/gate/GateSecurity";
import GateToasts, { type GateToast } from "@/components/gate/GateToasts";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Gate() {
  const [toasts, setToasts] = useState<GateToast[]>([]);
  const idRef = useRef(0);

  const pushToast = useCallback((t: Omit<GateToast, "id">) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev.slice(-2), { ...t, id }]);
    window.setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      t.tone === "crit" ? 9000 : 5500
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return (
    <>
      {/* 1 — Hero */}
      <GateHero />
      {/* 2 — Gate ops board */}
      <OpsBoard pushToast={pushToast} />
      {/* 3 — Gate pass lifecycle */}
      <GateLifecycle />
      {/* 4 — Dock scheduling */}
      <DockGantt />
      {/* 5 — Yard map */}
      <YardMap />
      {/* 6 — Security & compliance */}
      <GateSecurity />
      {/* 7 — CTA */}
      <section data-tour="gate-outro" className="blueprint-grid relative overflow-hidden bg-void py-24 md:py-32">
        {/* boom-barrier line rising behind the H2 */}
        <motion.div
          aria-hidden
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
          className="absolute left-1/2 top-1/2 h-px w-[min(80vw,720px)] origin-center -translate-x-1/2 bg-brand/40"
        />
        <motion.span
          aria-hidden
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-[calc(min(40vw,360px))] -translate-y-1/2 rounded-[2px] bg-brand/60"
        />
        <div className="relative mx-auto flex max-w-[880px] flex-col items-center px-6 text-center">
          <SectionKicker className="justify-center">NEXT.LEG</SectionKicker>
          <h2 className="mt-6 font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[44px]">
            <SplitWords text="A gate that knows what's on the truck." />
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
            <GhostButton to="/fleet">Next: fleet &amp; GPS →</GhostButton>
          </motion.div>
        </div>
      </section>

      <GateToasts toasts={toasts} onDismiss={dismiss} />
    </>
  );
}
