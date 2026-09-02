import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import SectionKicker from "@/components/SectionKicker";
import BlueprintCard from "@/components/BlueprintCard";
import { GEOFENCE_FEED } from "@/components/fleet/data";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Mini geofence map: concentric rings around MUM-BHIWANDI + approaching vehicle. */
function GeoMiniMap() {
  return (
    <svg viewBox="0 0 420 320" className="h-auto w-full">
      {[56, 112, 168, 224, 280, 336].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="320" className="stroke-line" strokeWidth="0.5" />
      ))}
      {[64, 128, 192, 256].map((y) => (
        <line key={y} x1="0" y1={y} x2="420" y2={y} className="stroke-line" strokeWidth="0.5" />
      ))}
      {/* rings: 2km warn, 500m teal, pulsing outward */}
      {[86, 34].map((r, i) => (
        <motion.circle
          key={r}
          cx="210" cy="160" r={r}
          fill="none"
          className={i === 0 ? "stroke-warn" : "stroke-data"}
          strokeWidth="1.5"
          strokeDasharray="6 5"
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.04, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          style={{ transformOrigin: "210px 160px" }}
        />
      ))}
      <rect x="203" y="153" width="14" height="14" className="fill-brand" />
      <text x="224" y="164" className="fill-ink1 font-mono" fontSize="10" letterSpacing="1.5">
        MUM-BHIWANDI
      </text>
      <text x="210" y="70" textAnchor="middle" className="fill-warn font-mono" fontSize="8" letterSpacing="2">
        2KM RING · DOCK CREW + RESERVE
      </text>
      <text x="210" y="126" textAnchor="middle" className="fill-data font-mono" fontSize="8" letterSpacing="2">
        500M · GATE PASS READY
      </text>
      {/* demo vehicle approaching on a 7s loop */}
      <motion.g
        animate={{ x: [330, 214], y: [280, 164] }}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
      >
        <path d="M 0 -8 L 6 6 L 0 3 L -6 6 Z" className="fill-brand" />
        <text x="10" y="4" className="fill-ink0 font-mono" fontSize="9" letterSpacing="1">TRK-07</text>
      </motion.g>
    </svg>
  );
}

export default function Geofence() {
  // alert feed: rows stream in as the demo vehicle crosses rings (7s loop)
  const [visible, setVisible] = useState(1);
  useEffect(() => {
    const t = window.setInterval(() => {
      setVisible((v) => (v >= GEOFENCE_FEED.length ? 1 : v + 1));
    }, 2100);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section className="bg-page py-24 md:py-36">
      <div className="mx-auto max-w-[1280px] px-6">
        <SectionKicker>GEOFENCE</SectionKicker>
        <h2 className="mt-6 max-w-[720px] font-display text-[32px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink0 md:text-[52px]">
          The gate knows before the horn.
        </h2>

        <div data-tour="geofence" className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <p className="max-w-[520px] text-[15px] leading-[1.7] text-ink1">
              Vehicles crossing geofences trigger real work: 2km out — dock crew
              notified and dock reserved; 500m — gate pass pre-fetched, barrier
              ready; on departure the customer gets a live tracking link.
            </p>

            <BlueprintCard className="mt-6 p-5 hover:-translate-y-0">
              <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink2">
                <span>ALERT FEED · GEOFENCE → GATE</span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-data" />
                  STREAMING
                </span>
              </div>
              <ul className="flex min-h-[150px] flex-col gap-1.5">
                {GEOFENCE_FEED.slice(0, visible).map((f, i) => (
                  <motion.li
                    key={`${f.t}-${visible >= GEOFENCE_FEED.length ? "full" : visible}-${i}`}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <Link
                      to="/gate"
                      className="flex items-baseline gap-2 font-mono text-[11px] tracking-[0.06em] transition-colors hover:text-brand"
                    >
                      <span className="text-ink2 font-tnum">{f.t}</span>
                      <span
                        className={cn(
                          f.tone === "data" && "text-data",
                          f.tone === "warn" && "text-warn",
                          f.tone === "brand" && "text-brand"
                        )}
                      >
                        {f.text}
                      </span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-ink2">
                EVERY ROW LANDS ON /GATE · 7S DEMO LOOP
              </p>
            </BlueprintCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-12% 0px" }}
            transition={{ duration: 0.8, ease: EASE }}
          >
            <BlueprintCard className="p-4 hover:-translate-y-0">
              <GeoMiniMap />
            </BlueprintCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
