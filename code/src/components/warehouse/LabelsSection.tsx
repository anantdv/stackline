import { memo } from "react";
import { motion } from "framer-motion";
import { QrCode, MonitorSmartphone, Server } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { SplitWords } from "@/components/SplitText";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Animated QR pattern: blocks pop in sequence, loops. Isolated + memoized. */
const QrAssembly = memo(function QrAssembly() {
  // Deterministic QR-ish 5x5 mask (with finder corners)
  const cells: boolean[] = [];
  let s = 1337;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let y = 0; y < 5; y++)
    for (let x = 0; x < 5; x++) {
      const finder =
        (x < 2 && y < 2) || (x > 2 && y < 2) || (x < 2 && y > 2);
      cells.push(finder || rnd() > 0.52);
    }
  return (
    <div className="grid h-16 w-16 grid-cols-5 gap-[3px]" aria-hidden>
      {cells.map((on, i) => (
        <motion.span
          key={i}
          className={on ? "rounded-[2px] bg-data" : "rounded-[2px] bg-raised"}
          animate={
            on
              ? { scale: [0, 1.25, 1, 1, 0], opacity: [0, 1, 1, 1, 0] }
              : { opacity: 0.35 }
          }
          transition={
            on
              ? {
                  duration: 3.2,
                  times: [0, 0.12, 0.2, 0.86, 1],
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeOut",
                }
              : undefined
          }
        />
      ))}
    </div>
  );
});

const CARDS = [
  {
    icon: QrCode,
    title: "QR bin labels",
    body: "One click exports print-ready QR sheets. Scan any bin to open its live card on a phone or Zebra terminal.",
    qr: true,
  },
  {
    icon: MonitorSmartphone,
    title: "Any device",
    body: "The twin runs in the browser — desktop wallboards, tablets on forklifts, handhelds in aisles.",
    qr: false,
  },
  {
    icon: Server,
    title: "Self-hosted or cloud",
    body: "Deploy beside your ERPNext site. Your geometry and stock data never leave your infrastructure.",
    qr: false,
  },
];

export default function LabelsSection() {
  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>ON.THE.FLOOR</SectionKicker>
        <h2 className="mt-5 font-display text-[32px] font-semibold leading-[1.02] tracking-[-0.02em] text-ink0 md:text-[52px]">
          <SplitWords text="From the screen to the steel." />
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {CARDS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ delay: i * 0.12, duration: 0.8, ease: EASE }}
            >
              <BlueprintCard className="h-full p-7">
                <div className="flex items-center justify-between">
                  <c.icon className="h-6 w-6 text-brand" />
                  {c.qr && <QrAssembly />}
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold text-ink0">
                  {c.title}
                </h3>
                <p className="mt-3 text-sm leading-[1.65] text-ink1">{c.body}</p>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
