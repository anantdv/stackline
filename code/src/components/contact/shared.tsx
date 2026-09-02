import { motion } from "framer-motion";

export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Animated isometric rack that "assembles" — beams snap in with a stagger.
 * Used in the contact form success state.
 */
export function RackAssembly({ className }: { className?: string }) {
  // One rack face: 4 bays × 3 levels, plus a depth offset layer behind.
  const W = 240;
  const H = 150;
  const bays = 4;
  const levels = 3;
  const cw = W / bays;
  const ch = H / levels;

  const snap = (i: number) => ({
    type: "spring" as const,
    stiffness: 320,
    damping: 24,
    delay: 0.15 + i * 0.06,
  });

  let n = 0;
  const beams = Array.from({ length: levels + 1 }).map((_, i) => ({
    key: `b${i}`,
    x1: 0,
    x2: W,
    y1: i * ch,
    y2: i * ch,
    delay: snap(n++).delay,
  }));
  const uprights = Array.from({ length: bays + 1 }).map((_, i) => ({
    key: `u${i}`,
    x1: i * cw,
    x2: i * cw,
    y1: 0,
    y2: H,
    delay: snap(n++).delay,
  }));

  return (
    <svg viewBox={`-30 -20 ${W + 60} ${H + 50}`} className={className} role="img" aria-label="Rack assembling">
      {/* depth layer */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3, x: -14, y: -14 }}
        transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
      >
        <rect x={0} y={0} width={W} height={H} fill="none" stroke="#FF6B1A" strokeWidth={1.5} />
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="#FF6B1A" strokeWidth={1} />
      </motion.g>

      {/* beams */}
      {beams.map((l) => (
        <motion.line
          key={l.key}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#FF6B1A"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: l.delay }}
        />
      ))}
      {/* uprights */}
      {uprights.map((l) => (
        <motion.line
          key={l.key}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#FF6B1A"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE, delay: l.delay }}
        />
      ))}
      {/* bin dots pop in last */}
      {Array.from({ length: bays * levels }).map((_, i) => {
        const bx = i % bays;
        const lv = Math.floor(i / bays);
        return (
          <motion.rect
            key={`d${i}`}
            x={bx * cw + cw / 2 - 5}
            y={lv * ch + ch / 2 - 5}
            width={10}
            height={10}
            rx={2}
            fill="#2DD4BF"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.7 + i * 0.04 }}
          />
        );
      })}
    </svg>
  );
}
