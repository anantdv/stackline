import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router";
import Lenis from "lenis";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GuideTour from "@/components/guide/GuideTour";
import GuideTrigger from "@/components/guide/GuideTrigger";

/**
 * Shared site shell: sticky Navbar + page content + Footer.
 * Children pattern — App.tsx renders <Layout><Routes>…</Routes></Layout>.
 * The nav is sticky (in normal flow), so pages need no offset bookkeeping.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const lenisRef = useRef<Lenis | null>(null);

  // Global Lenis smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, anchors: true });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] bg-page text-ink0">
      <Navbar />
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>
      <Footer />
      {/* Self-learning layer (guide.md): tour engine + pill/nudge triggers */}
      <GuideTour />
      <GuideTrigger />
    </div>
  );
}
