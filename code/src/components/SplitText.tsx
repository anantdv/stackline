import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Segment = { text: string; accent?: boolean };

/**
 * Character-level split: chars rise from overflow-hidden masks.
 * Used for the hero H1. Segments let us color specific phrases.
 */
export function SplitChars({
  segments,
  className,
  delay = 0,
  stagger = 0.035,
}: {
  segments: Segment[];
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  let charIndex = 0;
  return (
    <span className={cn("inline", className)} aria-label={segments.map((s) => s.text).join("")}>
      {segments.map((seg, si) => (
        <span key={si} className={seg.accent ? "text-brand" : undefined}>
          {seg.text.split(" ").map((word, wi, arr) => (
            <span key={wi} className="inline-block whitespace-nowrap">
              {word.split("").map((ch, ci) => {
                const i = charIndex++;
                return (
                  <span key={ci} className="inline-block overflow-hidden align-bottom">
                    <motion.span
                      className="inline-block"
                      initial={reduced ? false : { y: "110%" }}
                      animate={{ y: 0 }}
                      transition={{
                        delay: delay + i * stagger,
                        duration: 0.9,
                        ease: EASE,
                      }}
                    >
                      {ch}
                    </motion.span>
                  </span>
                );
              })}
              {wi < arr.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

/** Word-level split reveal for section headlines (whileInView). */
export function SplitWords({
  text,
  className,
  delay = 0,
  stagger = 0.05,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <span className={cn("inline", className)} aria-label={text}>
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={reduced ? false : { y: "110%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-18% 0px" }}
            transition={{ delay: delay + i * stagger, duration: 0.7, ease: EASE }}
          >
            {word}
          </motion.span>
          <span className="inline-block">&nbsp;</span>
        </span>
      ))}
    </span>
  );
}
