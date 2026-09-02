import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton } from "@/components/Buttons";
import { SplitChars } from "@/components/SplitText";
import GatePassCard from "@/components/gate/GatePassCard";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Ghost CTA that smooth-scrolls to the ops board instead of routing. */
function ScrollGhost({ target, children }: { target: string; children: string }) {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById(target)?.scrollIntoView({ behavior: "smooth" })
      }
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px]",
        "font-display text-[15px] font-semibold text-ink0 transition-colors duration-300",
        "hover:border-brand hover:text-brand"
      )}
    >
      {children}
    </button>
  );
}

/** Dimension-tick frame around the hero image (measurement ruler feel). */
function DimensionTicks() {
  const ticks = Array.from({ length: 17 }, (_, i) => i);
  return (
    <>
      <div aria-hidden className="absolute -top-5 left-0 right-0 flex justify-between">
        {ticks.map((i) => (
          <span key={i} className={cn("w-px bg-linestrong", i % 4 === 0 ? "h-2.5" : "h-1.5")} />
        ))}
      </div>
      <div aria-hidden className="absolute -bottom-5 left-0 right-0 flex justify-between">
        {ticks.map((i) => (
          <span key={i} className={cn("w-px bg-linestrong", i % 4 === 0 ? "h-2.5" : "h-1.5")} />
        ))}
      </div>
      <span aria-hidden className="absolute -top-6 right-0 font-mono text-[9px] tracking-[0.14em] text-ink2">
        GATE APRON · 24 M
      </span>
      <span aria-hidden className="absolute -bottom-6 left-0 font-mono text-[9px] tracking-[0.14em] text-ink2">
        BOOTH-01 ▸ DUSK SHIFT
      </span>
    </>
  );
}

export default function GateHero() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 40]);

  return (
    <section
      ref={ref}
      data-tour="hero"
      className="blueprint-grid relative overflow-hidden bg-void"
    >
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 items-center gap-12 px-6 py-20 md:py-28 lg:min-h-[calc(100svh-72px)] lg:grid-cols-2">
        {/* left — content */}
        <div className="relative z-10">
          <SectionKicker>GATE.CONTROL</SectionKicker>
          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.03em] text-ink0 md:text-[74px]">
            <SplitChars
              segments={[
                { text: "The gate is a " },
                { text: "ledger", accent: true },
                { text: " too." },
              ]}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-[480px] text-base leading-[1.65] text-ink1 md:text-lg"
          >
            Pre-registered arrivals, one-QR gate passes, security checks, dock
            assignments and a live yard queue. Every in and every out is a
            stamped, auditable event tied to real documents.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: EASE }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Control my gates</PrimaryButton>
            <ScrollGhost target="gate-ops">See the ops board ↓</ScrollGhost>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink2"
          >
            <span>GATE IN <span className="text-data">42 / DAY</span></span>
            <span>AVG TURNAROUND <span className="text-data">38 MIN</span></span>
            <span><span className="text-brand">0</span> UNREGISTERED ENTRIES</span>
          </motion.div>
        </div>

        {/* right — image panel + floating pass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.9, ease: EASE }}
          className="relative mx-auto w-full max-w-[560px]"
        >
          <motion.div style={{ y: imgY }} className="relative">
            <DimensionTicks />
            <div className="relative overflow-hidden rounded-xl border border-line">
              <img
                src="/gate-truck-dusk.jpg"
                alt="Truck at a warehouse gate at dusk, boom barrier half-raised"
                className="aspect-[16/10] w-full object-cover"
                loading="eager"
              />
              {/* teal/orange duotone overlay ~40% */}
              <div
                aria-hidden
                className="absolute inset-0 mix-blend-multiply"
                style={{
                  background:
                    "linear-gradient(120deg, var(--data-soft), transparent 45%, var(--accent-soft))",
                }}
              />
              <div aria-hidden className="absolute inset-0 bg-void/25 dark:bg-void/40" />
              <span className="absolute bottom-3 right-3 rounded border border-line bg-void/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink1 backdrop-blur">
                CAM · GATE-2-OUT · LIVE
              </span>
            </div>

            {/* floating mini gate pass */}
            <motion.div
              animate={reduced ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-4 w-[300px] -rotate-3 md:-left-12"
            >
              <GatePassCard
                mini
                qrReshuffle
                passNo="GP-2844"
                plate="MH-04-GH-1107"
                driver="R. PATIL"
                stamp="CLEARED"
                stampTone="data"
                footer="EWB ✓ VALID 22H · INV/2025/0117"
              />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
