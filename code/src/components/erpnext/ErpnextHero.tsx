import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import { PrimaryButton } from "@/components/Buttons";
import { SplitChars } from "@/components/SplitText";
import SyncDiagram from "@/components/erpnext/SyncDiagram";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function ErpnextHero() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden bg-void blueprint-grid">
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-14 px-6 py-20 lg:grid-cols-2">
        {/* Copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            <SectionKicker>ERPNEXT.NATIVE</SectionKicker>
          </motion.div>
          <h1 className="mt-6 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-ink0 md:text-[68px]">
            <SplitChars
              segments={[
                { text: "Not an integration. " },
                { text: "A mirror.", accent: true },
              ]}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
            className="mt-6 max-w-[520px] text-base leading-[1.65] text-ink1 md:text-lg"
          >
            Stackline is built on the Frappe framework's own protocol. Every
            bin, carton and move in the 3D twin is a live ERPNext document —
            posted, validated and permission-checked in real time.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: EASE }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <PrimaryButton to="/contact">Connect my ERPNext site</PrimaryButton>
            <a
              href="#doctype-map"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
            >
              Read the doctype map ↓
            </a>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-10 font-mono text-[10px] uppercase tracking-[0.18em] text-ink2"
          >
            Frappe v14/v15 <span className="text-brand">·</span> REST + Webhooks + SocketIO{" "}
            <span className="text-brand">·</span> Self-hosted &amp; Frappe Cloud
          </motion.div>
        </div>

        {/* Sync diagram */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
        >
          <SyncDiagram />
        </motion.div>
      </div>
    </section>
  );
}
