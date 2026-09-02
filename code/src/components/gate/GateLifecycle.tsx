import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import GatePassCard from "@/components/gate/GatePassCard";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    id: "PRE-REGISTER",
    body: "Supplier/carrier or your own team raises an appointment: vehicle, driver, doc refs (ASN / invoice).",
  },
  {
    id: "ARRIVE & VERIFY",
    body: "Booth scans the appointment QR; number plate checked against registration.",
  },
  {
    id: "SECURITY CHECK",
    body: "Checklist: seal intact, photo capture, driver ID.",
  },
  {
    id: "DOCK ASSIGN",
    body: "Stackline assigns a dock by load type, queue depth and vehicle size.",
  },
  {
    id: "WEIGHBRIDGE",
    body: "Gross/tare weights captured; variance vs. invoice flagged.",
  },
  {
    id: "GATE OUT",
    body: "One gate-pass QR carries invoice, EWB and LR. Scan, lift the boom, done.",
  },
];

/** What the sticky card shows once each step is reached. */
const STEP_STAMPS: { text: string; tone: "brand" | "data" | "crit" | "ink" }[] = [
  { text: "SCHEDULED", tone: "ink" },
  { text: "VERIFIED ✓", tone: "brand" },
  { text: "CHECKED ✓", tone: "brand" },
  { text: "DOCK D-03", tone: "data" },
  { text: "GROSS 16,240 KG ✓", tone: "data" },
  { text: "EXIT 14:32", tone: "data" },
];

export default function GateLifecycle() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({
    target: listRef,
    offset: ["start 0.72", "end 0.45"],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24 });

  // Active step = last step whose row has crossed 60% viewport.
  const rowRefs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = rowRefs.current.indexOf(e.target as HTMLLIElement);
            if (idx >= 0) setActive((a) => Math.max(a, idx));
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px" }
    );
    rowRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const checklist = [
    { label: "SEAL INTACT", done: active >= 2 },
    { label: "PHOTO CAPTURED", done: active >= 2 },
    { label: "DRIVER ID VERIFIED", done: active >= 2 },
  ];

  return (
    <section className="bg-void py-24 md:py-40">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>HOW.IT.FLOWS</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          From appointment to asphalt.
        </h2>

        <div
          data-tour="pass-lifecycle"
          className="mt-14 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]"
        >
          {/* step rail */}
          <div className="relative">
            <div aria-hidden className="absolute bottom-4 left-[15px] top-4 w-px bg-line" />
            <motion.div
              aria-hidden
              style={{ scaleY: fill }}
              className="absolute bottom-4 left-[15px] top-4 w-px origin-top bg-brand"
            />
            <ol ref={listRef} className="flex flex-col gap-10">
              {STEPS.map((s, i) => {
                const reached = i <= active;
                return (
                  <li
                    key={s.id}
                    ref={(el) => {
                      rowRefs.current[i] = el;
                    }}
                    className="relative flex gap-5 pl-0"
                  >
                    <span
                      className={cn(
                        "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] tracking-[0.08em] transition-colors duration-300",
                        reached
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-void text-ink2"
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3
                        className={cn(
                          "font-mono text-[13px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300",
                          reached ? "text-ink0" : "text-ink2"
                        )}
                      >
                        {s.id}
                      </h3>
                      <p className="mt-2 max-w-[520px] text-[15px] leading-[1.65] text-ink1">
                        {s.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* sticky pass that fills in */}
          <div className="relative">
            <div className="lg:sticky lg:top-28">
              <GatePassCard
                passNo="GP-2844"
                plate="MH-04-GH-1107"
                driver="R. PATIL"
                dock={active >= 3 ? "D-03" : null}
                checklist={checklist}
                stamp={STEP_STAMPS[active].text}
                stampTone={STEP_STAMPS[active].tone}
                stampKey={active}
                footer={
                  active >= 4
                    ? "WB-02 · TARE 6,180 KG · VAR +0.4% ✓"
                    : "SCAN AT BOOTH · KEEP WITH DRIVER"
                }
                qrReshuffle={active >= 5}
              />
              <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                THE PASS FILLS AS THE VEHICLE MOVES · STEP {String(active + 1).padStart(2, "0")}/06
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
