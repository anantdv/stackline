import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import { RULEBOOK } from "./data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Section 6 — compliance rulebook, expandable mono rows. */
export default function RulesTable() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-page py-[120px]">
      <div className="mx-auto max-w-[980px] px-6">
        <SectionKicker className="mb-4">RULEBOOK</SectionKicker>
        <h2 className="font-display text-4xl font-bold tracking-tight text-ink0 md:text-5xl">
          <SplitWords text="The rulebook, encoded." />
        </h2>

        <div className="mt-10 overflow-hidden rounded-xl border border-line bg-surface">
          {RULEBOOK.map((r, i) => {
            const isOpen = open === i;
            return (
              <motion.div
                key={r.rule}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: EASE }}
                className={cn(i > 0 && "border-t border-line")}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-raised"
                >
                  <span className="font-mono text-[10px] text-ink2 font-tnum">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-mono text-[11px] uppercase tracking-[0.1em] text-ink0 md:text-[12px]">
                    {r.rule}
                  </span>
                  <ChevronDown
                    className={cn("h-4 w-4 shrink-0 text-ink2 transition-transform duration-300", isOpen && "rotate-180 text-brand")}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-dashed border-line px-5 py-4 pl-[52px] text-sm leading-relaxed text-ink1">
                        {r.plain}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
