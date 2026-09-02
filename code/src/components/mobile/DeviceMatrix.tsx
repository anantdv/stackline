import { motion } from "framer-motion";
import { MonitorSmartphone, ScanLine, Smartphone, Watch } from "lucide-react";
import SectionKicker from "@/components/SectionKicker";
import { SplitWords } from "@/components/SplitText";
import BlueprintCard from "@/components/BlueprintCard";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const DEVICES = [
  {
    icon: Smartphone,
    title: "BYOD phones",
    spec: "ANDROID 10+ / iOS 16+ · CAMERA SCAN · NFC WHERE AVAILABLE",
    loop: "group-hover:animate-[float-slow_3s_ease-in-out_infinite]",
  },
  {
    icon: ScanLine,
    title: "Rugged scanners",
    spec: "ZEBRA/HONEYWELL ANDROID TERMINALS · HARDWARE TRIGGER → SCAN SCREEN",
    loop: "group-hover:animate-pulse",
  },
  {
    icon: MonitorSmartphone,
    title: "Forklift tablets",
    spec: "DASHBOARD MOUNT · TWIN MAP VIEW · TASK AUTO-ADVANCE",
    loop: "group-hover:-translate-y-0.5",
  },
  {
    icon: Watch,
    title: "Wearables",
    spec: "TASK BUZZ + GLANCEABLE BIN IDS · RING-SCANNER COMPATIBLE",
    loop: "group-hover:animate-[pulse-dot_1s_ease-in-out_infinite]",
  },
];

export default function DeviceMatrix() {
  return (
    <section className="bg-void px-6 py-24 md:py-36">
      <div className="mx-auto max-w-[1280px]">
        <SectionKicker>FLEET.OF.DEVICES</SectionKicker>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink0 md:text-[52px] md:leading-[1.02]">
          <SplitWords text="Phones, Zebra guns, forklift tablets." />
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {DEVICES.map((d, i) => (
            <motion.div
              key={d.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
            >
              <BlueprintCard className="h-full p-6">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border border-line bg-raised text-brand transition-transform duration-300 ${d.loop}`}
                >
                  <d.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink0">{d.title}</h3>
                <p className="mt-2 font-mono text-[10px] leading-[1.7] tracking-[0.1em] text-ink2">{d.spec}</p>
              </BlueprintCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
