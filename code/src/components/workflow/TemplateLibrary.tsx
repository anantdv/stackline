import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import BlueprintCard from "@/components/BlueprintCard";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import {
  NODE_TYPE_MAP,
  NODE_COLOR_HEX,
  NODE_W,
  NODE_H,
  TEMPLATES,
  type WorkflowTemplate,
} from "@/components/workflow/builder-data";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Mini node-graph thumbnail rendered from the template's real layout. */
function TemplateThumb({ t }: { t: WorkflowTemplate }) {
  return (
    <svg viewBox="0 0 900 360" className="h-28 w-full" aria-hidden>
      {t.edges.map(([a, b], i) => {
        const na = t.nodes[a];
        const nb = t.nodes[b];
        const x1 = na.x + NODE_W;
        const y1 = na.y + NODE_H / 2;
        const x2 = nb.x;
        const y2 = nb.y + NODE_H / 2;
        const dx = Math.max(40, Math.abs(x2 - x1) / 2);
        return (
          <path
            key={i}
            d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="#2DD4BF"
            strokeOpacity="0.5"
            strokeWidth="2"
            strokeDasharray="5 6"
            className="[animation:dash-flow_1.2s_linear_infinite] [animation-play-state:paused] group-hover:[animation-play-state:running]"
          />
        );
      })}
      {t.nodes.map((n, i) => {
        const hex = NODE_COLOR_HEX[NODE_TYPE_MAP[n.type].color];
        return (
          <g key={i}>
            <rect
              x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx="9"
              fill="#12161C" stroke={hex} strokeOpacity="0.7" strokeWidth="1.5"
            />
            <circle cx={n.x + 16} cy={n.y + NODE_H / 2} r="4" fill={hex} />
            <text
              x={n.x + 30} y={n.y + NODE_H / 2 + 4}
              fontSize="13" fontFamily="JetBrains Mono, monospace"
              letterSpacing="1.5" fill="#9AA7B5"
            >
              {n.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function TemplateLibrary({
  onUseTemplate,
}: {
  onUseTemplate: (t: WorkflowTemplate) => void;
}) {
  return (
    <section id="templates" className="scroll-mt-24 bg-page py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <SectionKicker>TEMPLATES</SectionKicker>
            <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
              <SplitWords text="Start from a proven flow." />
            </h2>
          </div>
          <p className="max-w-sm pb-2 text-sm leading-relaxed text-ink1">
            Every template loads straight into the builder above — tune the
            rules, then publish to the floor.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.6, ease: EASE }}
            >
              <BlueprintCard className="flex h-full flex-col p-5">
                <div className="rounded-lg border border-line bg-void/60 px-2 py-3">
                  <TemplateThumb t={t} />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink0">
                  {t.title}
                </h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink1">
                  {t.blurb}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink2 font-tnum">
                    {t.meta}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUseTemplate(t)}
                    className="group/link inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink1 transition-colors duration-300 hover:text-brand"
                  >
                    Use template
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
                  </button>
                </div>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
