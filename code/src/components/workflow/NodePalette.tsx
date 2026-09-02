import { motion } from "framer-motion";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import { cn } from "@/lib/utils";
import { NODE_TYPES, NODE_COLOR_HEX, type NodeTypeDef } from "@/components/workflow/builder-data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const COLOR_TEXT: Record<NodeTypeDef["color"], string> = {
  data: "text-data",
  brand: "text-brand",
  warn: "text-warn",
  crit: "text-crit",
};

/** Small node glyph with an idle micro-loop that plays on hover only. */
function NodeGlyph({ def }: { def: NodeTypeDef }) {
  const hex = NODE_COLOR_HEX[def.color];
  return (
    <div
      className="relative flex h-12 w-20 items-center rounded-md border bg-void/60"
      style={{ borderColor: `${hex}55` }}
    >
      <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full" style={{ background: hex }} />
      <span className="absolute right-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full border" style={{ borderColor: hex }} />
      <span
        className="ml-5 font-mono text-[8px] font-semibold tracking-[0.14em]"
        style={{ color: hex }}
      >
        {def.label}
      </span>
      {/* micro-loop: ping ring, paused until hover */}
      <span
        aria-hidden
        className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full [animation:ripple_1.8s_ease-out_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]"
        style={{ border: `1px solid ${hex}` }}
      />
    </div>
  );
}

export default function NodePalette() {
  return (
    <section className="bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <SectionKicker>NODE.TYPES</SectionKicker>
            <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
              <SplitWords text="Eight nodes build any process." />
            </h2>
          </div>
          <div className="flex gap-4 pb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand" /> Action</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-data" /> Data</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-warn" /> Decision</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-crit" /> Exception</span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {NODE_TYPES.map((def, i) => {
            const Icon = def.icon;
            return (
              <motion.div
                key={def.key}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8% 0px" }}
                transition={{ delay: (i % 4) * 0.08, duration: 0.6, ease: EASE }}
              >
                <BlueprintCard className="h-full p-5">
                  <div className="flex items-start justify-between">
                    <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-raised", COLOR_TEXT[def.color])}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <NodeGlyph def={def} />
                  </div>
                  <div className="mt-4 font-mono text-sm font-semibold tracking-[0.14em] text-ink0">
                    {def.label}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink1">
                    {def.description}
                  </p>
                </BlueprintCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
