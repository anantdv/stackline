import { motion } from "framer-motion";
import { Camera, ClipboardCheck, ShieldAlert } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import DocBadge from "@/components/gate/DocBadge";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CARDS = [
  {
    icon: ClipboardCheck,
    title: "Checklist enforcement",
    body: "Booth can't open the barrier until the checklist clears: seal, docs, photo, ID.",
    extra: (
      <div className="mt-4 flex flex-col gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]">
        {["SEAL INTACT", "DOCS MATCHED", "PHOTO CAPTURED", "DRIVER ID"].map((c, i) => (
          <span key={c} className="flex items-center gap-2 text-ink1">
            <motion.span
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.25 }}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border border-data bg-data/15 text-[9px] text-data"
            >
              ✓
            </motion.span>
            {c}
          </span>
        ))}
      </div>
    ),
  },
  {
    icon: Camera,
    title: "Photo & audit trail",
    body: "Every event timestamped with booth photos; exportable audit log per vehicle.",
    extra: (
      <div className="mt-4 flex flex-col gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink2">
        <span>14:26:07 · BOOTH-01 · GP-2844 · <span className="text-data">IMG ✓</span></span>
        <span>14:26:31 · WB-02 · GP-2844 · <span className="text-data">16,240 KG</span></span>
        <span>14:32:02 · GATE-2 · GP-2844 · <span className="text-brand">EXIT ✓</span></span>
      </div>
    ),
  },
  {
    icon: ShieldAlert,
    title: "Statutory gate checks",
    body: "OUT lanes verify EWB validity before exit — an expired EWB holds the vehicle and alerts dispatch.",
    extra: (
      <div className="mt-4">
        <DocBadge
          code="EWB"
          tone="expired"
          detail="EXPIRED — HOLD"
          pulse
          to="/dispatch"
        />
        <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
          EWB 2841 9901 1187 · REGENERATE ON /DISPATCH
        </p>
      </div>
    ),
  },
];

export default function GateSecurity() {
  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>SECURITY.COMPLIANCE</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          The barrier answers to paperwork.
        </h2>

        <div data-tour="security-checks" className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15% 0px" }}
              transition={{ delay: i * 0.12, duration: 0.7, ease: EASE }}
            >
              <BlueprintCard className="h-full p-6">
                <c.icon className="h-6 w-6 text-brand" />
                <h3 className="mt-4 font-display text-[20px] font-semibold tracking-[-0.01em] text-ink0">
                  {c.title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-ink1">{c.body}</p>
                {c.extra}
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
