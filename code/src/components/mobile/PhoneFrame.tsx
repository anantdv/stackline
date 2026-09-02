import { useRef, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Device mock (design-delta §4.7): rounded shell + bezel + notch pill with
 * LIVE React UI inside (never raster screenshots). The screen re-asserts the
 * dark token set (data-theme="dark") so the floor app stays dark in Daylight
 * mode; the bezel picks up --line-strong per theme.
 *
 * `tilt` enables gyroscopic cursor follow: ±6° clamp, lerp 0.1, MotionValues
 * only (no re-render per frame).
 */
export default function PhoneFrame({
  children,
  width = 320,
  height = 650,
  tilt = false,
  float = false,
  className,
  screenClassName,
  dataTour,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  tilt?: boolean;
  float?: boolean;
  className?: string;
  screenClassName?: string;
  dataTour?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  const rotX = useMotionValue(0);
  const rotY = useMotionValue(0);
  const reduced = useReducedMotion();

  useAnimationFrame(() => {
    if (!tilt || reduced) return;
    // lerp 0.1 toward cursor target
    rotX.set(rotX.get() + (targetX.get() - rotX.get()) * 0.1);
    rotY.set(rotY.get() + (targetY.get() - rotY.get()) * 0.1);
  });

  const onMove = (e: React.PointerEvent) => {
    if (!tilt || reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
    targetY.set(Math.max(-6, Math.min(6, nx * 6)));
    targetX.set(Math.max(-6, Math.min(6, -ny * 6)));
  };
  const onLeave = () => {
    targetX.set(0);
    targetY.set(0);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      data-tour={dataTour}
      style={{ width, height, perspective: 1000 }}
      className={cn("relative", className)}
    >
      <motion.div
        style={tilt ? { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" } : undefined}
        animate={float && !reduced ? { y: [0, -2, 0, 2, 0] } : undefined}
        transition={float ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : undefined}
        className="h-full w-full rounded-[44px] border border-linestrong bg-raised p-[10px] shadow-2xl"
      >
        {/* notch pill */}
        <div className="absolute left-1/2 top-[18px] z-20 h-[18px] w-[92px] -translate-x-1/2 rounded-full bg-black/90" aria-hidden />
        {/* screen — always dark app UI */}
        <div
          data-theme="dark"
          className={cn(
            "relative flex h-full w-full flex-col overflow-hidden rounded-[34px] bg-page text-ink0",
            screenClassName
          )}
        >
          {/* status bar */}
          <div className="relative z-10 flex items-center justify-between px-5 pt-3 font-mono text-[9px] tracking-[0.1em] text-ink1">
            <span>9:41</span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden>▂▄▆</span>
              <span>5G</span>
              <span className="inline-block h-2 w-4 rounded-[2px] border border-ink2 align-middle">
                <span className="block h-full w-3/4 bg-data" />
              </span>
            </span>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

/** Bottom tab bar used across the in-phone app screens. */
export function PhoneTabBar({ active = "TASKS" }: { active?: string }) {
  const tabs = ["TASKS", "SCAN", "MAP", "MORE"];
  return (
    <div className="mt-auto flex items-center justify-around border-t border-line bg-surface/80 px-2 py-2.5">
      {tabs.map((t) => (
        <span
          key={t}
          className={cn(
            "font-mono text-[8px] tracking-[0.16em]",
            t === active ? "text-brand" : "text-ink2"
          )}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
