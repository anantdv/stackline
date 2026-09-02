import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Isometric rack wireframe row (SVG group). */
function RackRow({
  y,
  stroke,
  opacity,
}: {
  y: number;
  stroke: string;
  opacity: number;
}) {
  return (
    <g stroke={stroke} strokeOpacity={opacity} fill="none">
      <polygon points={`0,${y + 20} 200,${y - 40} 208,${y - 34} 8,${y + 26}`} />
      <line x1={8} y1={y + 26} x2={8} y2={y + 44} />
      <line x1={0} y1={y + 20} x2={0} y2={y + 38} />
      <line x1={208} y1={y - 34} x2={208} y2={y - 16} />
      <line x1={200} y1={y - 40} x2={200} y2={y - 22} />
      {Array.from({ length: 5 }, (_, i) => {
        const x = 30 + i * 36;
        return (
          <line
            key={i}
            x1={x}
            y1={y + 11 - i * 10.8}
            x2={x}
            y2={y + 29 - i * 10.8}
          />
        );
      })}
    </g>
  );
}

function WireframeLayer({
  className,
  stroke,
  opacity,
}: {
  className?: string;
  stroke: string;
  opacity: number;
}) {
  return (
    <svg viewBox="0 0 208 260" className={className} aria-hidden>
      {[0, 1, 2, 3].map((r) => (
        <RackRow key={r} y={50 + r * 52} stroke={stroke} opacity={opacity} />
      ))}
    </svg>
  );
}

export default function IndustriesHero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yBack = useTransform(scrollYProgress, [0, 1], [0, -20]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, 20]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[65vh] items-center justify-center overflow-hidden bg-void blueprint-grid"
    >
      {/* drifting isometric rack wireframes, two parallax depths */}
      <motion.div style={{ y: yBack }} className="pointer-events-none absolute inset-0" aria-hidden>
        <WireframeLayer
          stroke="#FF6B1A"
          opacity={0.10}
          className="absolute -left-10 top-8 h-[340px] w-[272px] animate-float-slow"
        />
        <WireframeLayer
          stroke="#2DD4BF"
          opacity={0.08}
          className="absolute -right-8 bottom-4 h-[300px] w-[240px] animate-float-slow [animation-delay:-8s]"
        />
      </motion.div>
      <motion.div style={{ y: yFront }} className="pointer-events-none absolute inset-0" aria-hidden>
        <WireframeLayer
          stroke="#94A3B8"
          opacity={0.12}
          className="absolute right-[12%] top-2 h-[220px] w-[176px] animate-float-slow [animation-delay:-4s]"
        />
        <WireframeLayer
          stroke="#FF6B1A"
          opacity={0.07}
          className="absolute bottom-0 left-[16%] h-[260px] w-[208px] animate-float-slow [animation-delay:-12s]"
        />
      </motion.div>

      <div className="relative mx-auto max-w-[820px] px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <SectionKicker className="justify-center">INDUSTRIES</SectionKicker>
        </motion.div>
        <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[68px]">
          <SplitChars
            segments={[
              { text: "One twin. " },
              { text: "Every kind of floor.", accent: true },
            ]}
          />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: EASE }}
          className="mx-auto mt-6 max-w-[600px] text-base leading-[1.65] text-ink1 md:text-lg"
        >
          Rack profiles, bin rules and workflows ship as industry presets. Your
          warehouse starts configured — not from a blank page.
        </motion.p>
      </div>
    </section>
  );
}
