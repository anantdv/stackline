import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BadgeCheck, Mail, Phone } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import DemoForm from "@/components/contact/DemoForm";
import { EASE } from "@/components/contact/shared";

const REASSURANCES = [
  { meta: "48H", text: "Twin turnaround from a floor plan" },
  { meta: "30 MIN", text: "Live demo, your use case, your questions" },
  { meta: "NO CARD", text: "Pilot starts free" },
];

export default function ContactHero() {
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: imgWrapRef,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [30, -30]);

  return (
    <section className="blueprint-grid relative min-h-[100svh] overflow-hidden bg-void">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_30%_20%,transparent_0%,#07090C_100%)]"
      />
      <div className="relative mx-auto grid max-w-[1280px] gap-12 px-6 py-16 md:py-24 lg:grid-cols-[55fr_45fr] lg:gap-14">
        {/* Left — copy & reassurance */}
        <div className="flex flex-col gap-7">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <SectionKicker>BOOK.DEMO</SectionKicker>
          </motion.div>

          <h1 className="text-balance font-display text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[60px]">
            <SplitWords text="See your warehouse in 3D — this week." stagger={0.05} />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
            className="max-w-[520px] text-[17px] leading-relaxed text-ink1"
          >
            Send us a floor plan before the call and we'll demo on a twin of{" "}
            <em className="not-italic text-ink0">your</em> racks — not a sample.
          </motion.p>

          <div className="flex flex-col gap-4">
            {REASSURANCES.map((r, i) => (
              <motion.div
                key={r.meta}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: EASE }}
                className="flex items-center gap-4"
              >
                <span className="w-20 shrink-0 rounded-md border border-linestrong bg-surface px-2 py-1.5 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-data">
                  {r.meta}
                </span>
                <span className="text-sm text-ink1">{r.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Office image with parallax + caption chip */}
          <motion.div
            ref={imgWrapRef}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8, ease: EASE }}
            className="relative mt-2 overflow-hidden rounded-xl border border-line"
          >
            <motion.img
              src="/contact-office.jpg"
              alt="Stackline operations control room with a live warehouse twin on the wall monitor"
              style={{ y: imgY }}
              className="h-auto w-full scale-[1.15] object-cover"
              loading="lazy"
            />
            {/* duotone overlay */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/80 via-brand-soft/20 to-data-soft/20 mix-blend-multiply"
            />
            <span className="absolute bottom-4 left-4 rounded-md border border-linestrong bg-void/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-data backdrop-blur-sm">
              Ops control room — WH-EAST-01 twin live
            </span>
          </motion.div>

          {/* Direct contacts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.6, ease: EASE }}
            className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink1"
          >
            <a href="mailto:demo@stackline.io" className="flex items-center gap-2 transition-colors hover:text-brand">
              <Mail className="h-3.5 w-3.5 text-brand" />
              demo@stackline.io
            </a>
            <a href="tel:+15550134470" className="flex items-center gap-2 transition-colors hover:text-brand">
              <Phone className="h-3.5 w-3.5 text-brand" />
              +1 (555) 013-4470
            </a>
            <span className="flex items-center gap-2 text-data">
              <BadgeCheck className="h-3.5 w-3.5" />
              Frappe Partner Directory
            </span>
          </motion.div>
        </div>

        {/* Right — sticky demo form */}
        <motion.div
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 20 }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <DemoForm />
        </motion.div>
      </div>
    </section>
  );
}
