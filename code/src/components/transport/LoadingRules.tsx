import { motion } from "framer-motion";
import { ArrowDownWideNarrow, FlaskConical, Layers, Lock } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const RULES = [
  { icon: Layers, title: "Stackability", mono: "MAX STACK 3 · NO-STACK FLAGGED SKUS" },
  { icon: ArrowDownWideNarrow, title: "Weight order", mono: "HEAVY FLOOR, LIGHT TOP · 210KG BASE LIMIT" },
  { icon: Lock, title: "Orientation locks", mono: "THIS-SIDE-UP RESPECTED · 6-AXIS CHECK" },
  { icon: FlaskConical, title: "Compatibility", mono: "CHEM ≠ FOOD · ZONE SEPARATION IN VEHICLE" },
];

/** Section 5 — loading rules (physics, encoded). */
export default function LoadingRules() {
  return (
    <section className="bg-void py-[140px]">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker className="mb-4">RULES</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="Physics, encoded." />
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {RULES.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ delay: i * 0.12, duration: 0.55, ease: EASE }}
              >
                <BlueprintCard className="h-full p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-raised transition-colors duration-300 group-hover:border-brand">
                    <Icon className="h-5 w-5 text-brand transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-semibold text-ink0">{r.title}</h3>
                  <div className="mt-2 font-mono text-[10px] uppercase leading-4 tracking-[0.1em] text-ink2">
                    {r.mono}
                  </div>
                </BlueprintCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
