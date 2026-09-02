import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ENGINE_ANCHORS } from "@/components/features/FeaturesHero";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Sticky engine anchor-nav: pins under the site navbar while §2–§5 scroll by,
 * with a scroll-spy progress state (orange underline on the active engine).
 */
export default function EngineAnchorNav() {
  const [active, setActive] = useState<string>(ENGINE_ANCHORS[0].id);

  useEffect(() => {
    const sections = ENGINE_ANCHORS.map((a) =>
      document.getElementById(a.id)
    ).filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.75, duration: 0.7, ease: EASE }}
      className="sticky top-16 z-30 -mt-16 flex justify-center px-4 pb-6 pt-4"
      aria-label="Engine sections"
    >
      <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-page/80 p-1.5 backdrop-blur-[14px]">
        {ENGINE_ANCHORS.map((a) => (
          <a
            key={a.id}
            href={`#${a.id}`}
            className={cn(
              "relative whitespace-nowrap rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors duration-300",
              active === a.id ? "text-ink0" : "text-ink2 hover:text-ink1"
            )}
          >
            <span className={cn("mr-2", active === a.id ? "text-brand" : "text-ink2")}>
              {a.n}
            </span>
            {a.label}
            <span
              className={cn(
                "absolute inset-x-4 -bottom-px h-px bg-brand transition-transform duration-300",
                active === a.id ? "scale-x-100" : "scale-x-0"
              )}
              aria-hidden
            />
          </a>
        ))}
      </div>
    </motion.nav>
  );
}
