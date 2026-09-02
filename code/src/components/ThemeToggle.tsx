import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getTheme, useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const WIPE_SESSION_KEY = "stackline-theme-wiped";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Navbar theme toggle (theme.md §4). 40×40 ghost button; Sun in dark mode
 * ("switch to light"), Moon in light. Icons crossfade with a 180° rotate +
 * scale spring. First switch of the session fires a radial wipe from the
 * button; afterwards the 0.3s CSS token transitions carry the change.
 */
export default function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [wipe, setWipe] = useState<{ x: number; y: number; theme: Theme } | null>(
    null
  );

  const toggle = () => {
    const next: Theme = getTheme() === "dark" ? "light" : "dark";
    const reduced = prefersReducedMotion();
    let wiped = false;
    try {
      wiped = sessionStorage.getItem(WIPE_SESSION_KEY) === "1";
    } catch {
      /* ignore */
    }

    if (!reduced && !wiped && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      // Paint the incoming theme's page color over the outgoing theme,
      // expanding in a circle from the button. Tokens flip underneath first.
      applyTheme(next);
      setWipe({ x, y, theme: next });
      try {
        sessionStorage.setItem(WIPE_SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    } else {
      applyTheme(next);
    }
  };

  const label = theme === "dark" ? "THEME: DAYLIGHT" : "THEME: CONTROL ROOM";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-pressed={theme === "light"}
        aria-label={`Switch color theme (current: ${theme})`}
        className={cn(
          "group/theme relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-linestrong",
          "text-ink1 transition-colors duration-300 hover:border-brand hover:text-brand",
          className
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={theme}
            initial={
              prefersReducedMotion()
                ? { opacity: 0 }
                : { opacity: 0, rotate: 180, scale: 0 }
            }
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={
              prefersReducedMotion()
                ? { opacity: 0 }
                : { opacity: 0, rotate: 180, scale: 0 }
            }
            transition={
              prefersReducedMotion()
                ? { duration: 0.15 }
                : { type: "spring", stiffness: 260, damping: 20 }
            }
            className="flex items-center justify-center"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </motion.span>
        </AnimatePresence>
        {/* mono tooltip */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[calc(100%+8px)] -translate-x-1/2 whitespace-nowrap rounded border border-line bg-raised px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-ink1 opacity-0 transition-opacity duration-200 group-hover/theme:opacity-100"
        >
          {label}
        </span>
      </button>

      {/* First-switch radial wipe (once per session) */}
      <AnimatePresence>
        {wipe && (
          <motion.div
            key="theme-wipe"
            aria-hidden
            className="pointer-events-none fixed inset-0 z-[200]"
            style={{
              background: wipe.theme === "light" ? "#F2F5F8" : "#0B0E12",
            }}
            initial={{
              clipPath: `circle(0px at ${wipe.x}px ${wipe.y}px)`,
              opacity: 1,
            }}
            animate={{
              clipPath: `circle(150% at ${wipe.x}px ${wipe.y}px)`,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            onAnimationComplete={() => setWipe(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
