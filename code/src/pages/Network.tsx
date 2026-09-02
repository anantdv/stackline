import { useMemo, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { GhostButton, PrimaryButton } from "@/components/Buttons";
import SectionKicker from "@/components/SectionKicker";
import { SplitChars, SplitWords } from "@/components/SplitText";
import { trpc } from "@/providers/trpc";
import LocationMap from "@/components/network/LocationMap";
import MapSection from "@/components/network/MapSection";
import Drilldown from "@/components/network/Drilldown";
import StepRail from "@/components/network/StepRail";
import TransferBoard from "@/components/network/TransferBoard";
import RollupTable from "@/components/network/RollupTable";
import {
  DEMO_NET_LOCATIONS,
  DEMO_NETWORK,
  DEMO_TRANSFERS,
  NETWORK_TOTALS,
  adaptLocations,
  num,
  type DemoTransfer,
} from "@/components/network/demo";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const QUERY_OPTS = {
  retry: false,
  refetchOnWindowFocus: false,
  staleTime: 30_000,
} as const;

/* ------------------------------------------------------------------ */
/* §1 — Hero: the whole network, one screen                           */
/* ------------------------------------------------------------------ */

function NetworkHero({ locationCount }: { locationCount: number }) {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 40, damping: 20 });
  const y = useSpring(my, { stiffness: 40, damping: 20 });

  return (
    <section
      ref={ref}
      data-tour="hero"
      className="relative flex min-h-[100dvh] items-center overflow-hidden bg-void"
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        mx.set(((e.clientX - r.left) / r.width - 0.5) * 24);
        my.set(((e.clientY - r.top) / r.height - 0.5) * 24);
      }}
    >
      {/* full-bleed map backdrop with slow parallax drift */}
      <motion.div
        aria-hidden
        className="absolute -inset-8 opacity-70"
        style={{ x, y }}
      >
        <LocationMap
          locations={DEMO_NET_LOCATIONS}
          interactive={false}
          showLabels={false}
        />
      </motion.div>
      {/* scrim */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "var(--scrim)" }}
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-6 pb-24 pt-32 md:pl-[8vw]">
        <SectionKicker>NETWORK.TOPOLOGY</SectionKicker>
        <h1 className="mt-8 max-w-4xl font-display text-5xl font-bold leading-[0.98] tracking-[-0.03em] text-ink0 md:text-[80px]">
          <SplitChars
            segments={[
              { text: "Many locations. " },
              { text: "One", accent: true },
              { text: " nervous system." },
            ]}
            stagger={0.03}
          />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: EASE }}
          className="mt-8 max-w-[520px] text-lg leading-relaxed text-ink1"
        >
          Stackline models your entire footprint — regions, locations, and
          every warehouse inside them — as one navigable hierarchy.
          Similar-SKU warehouses or multi-category zones, metros or tier-3
          towns: one twin, one ledger.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.92, duration: 0.8, ease: EASE }}
          className="mt-10 flex flex-wrap gap-4"
        >
          <PrimaryButton to="/contact">Map my network</PrimaryButton>
          <a
            href="#network-map"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-linestrong px-6 py-[13px] font-display text-[15px] font-semibold text-ink0 transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            Drill into a location ↓
          </a>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-14 font-mono text-[11px] uppercase tracking-[0.18em] text-ink2"
        >
          {locationCount} LOCATIONS · {NETWORK_TOTALS.warehouses} WAREHOUSES ·{" "}
          {NETWORK_TOTALS.zones} ZONES · {num(NETWORK_TOTALS.bins)} BINS · 3 STATES
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* §7 — CTA band                                                      */
/* ------------------------------------------------------------------ */

function NetworkCta() {
  return (
    <section className="blueprint-grid relative overflow-hidden bg-void py-24 md:py-32">
      <div className="relative mx-auto max-w-[1280px] px-6 text-center">
        <h2 className="mx-auto max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight text-ink0 md:text-[44px]">
          <SplitWords text="Your network already exists. Now see it." />
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink1">
          Send us your location list and floor plans — we'll return a
          navigable network twin in days, not quarters.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <PrimaryButton to="/contact">Book a live demo</PrimaryButton>
          <GhostButton to="/valuation">See asset valuation →</GhostButton>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function Network() {
  const locQ = trpc.network.listLocations.useQuery(undefined, QUERY_OPTS);
  const transferQ = trpc.network.transfers.useQuery({}, QUERY_OPTS);

  const locations = useMemo(
    () => adaptLocations(locQ.data) ?? DEMO_NET_LOCATIONS,
    [locQ.data]
  );
  const live = locations !== DEMO_NET_LOCATIONS;

  const transfers: DemoTransfer[] = useMemo(() => {
    const rows = transferQ.data;
    if (!rows || rows.length === 0) return DEMO_TRANSFERS;
    return rows.slice(0, 8).map((r, i) => {
      const fromCode = r.from.warehouse?.code ?? "MAIN-DC";
      const toCode = r.to.warehouse?.code ?? "DEL-01";
      const ageH = r.createdAt
        ? (Date.now() - new Date(r.createdAt).getTime()) / 3_600_000
        : 48;
      return {
        id: `MOV-${String(r.id).padStart(4, "0")}`,
        erpDoc: `STE-${String(r.id).padStart(4, "0")}`,
        fromCode,
        toCode,
        fromLoc: fromCode,
        toLoc: toCode,
        skus: 1,
        qty: r.qty,
        valueInr: r.qty * 1800,
        status: ageH < 12 ? "IN TRANSIT" : ageH < 24 ? "DOCKED" : "RECEIVED ✓",
        truck: `TRK-${String((i % 19) + 1).padStart(2, "0")}`,
        eta:
          ageH < 12
            ? `${Math.max(1, Math.round(12 - ageH))}H 00M`
            : ageH < 24
              ? "DOCKED"
              : "DONE",
      };
    });
  }, [transferQ.data]);

  /* drill-down state (lifted so §2 chips can preselect §3) */
  const [drillLocCode, setDrillLocCode] = useState(DEMO_NETWORK[0].code);
  const [drillWhCode, setDrillWhCode] = useState(DEMO_NETWORK[0].warehouses[0].code);
  const drillLoc =
    DEMO_NETWORK.find((l) => l.code === drillLocCode) ?? DEMO_NETWORK[0];

  const jumpToWarehouse = (locationCode: string, warehouseCode: string) => {
    const demoLoc = DEMO_NETWORK.find((l) => l.code === locationCode);
    const hasWh = demoLoc?.warehouses.some((w) => w.code === warehouseCode);
    if (demoLoc && hasWh) {
      setDrillLocCode(demoLoc.code);
      setDrillWhCode(warehouseCode);
    }
    document
      .getElementById("network-drilldown")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <NetworkHero locationCount={locations.length} />

      <MapSection
        locations={locations}
        isLive={live}
        onWarehouseJump={jumpToWarehouse}
      />

      <Drilldown
        location={drillLoc}
        warehouseCode={drillWhCode}
        onWarehouseChange={setDrillWhCode}
        live={live}
      />

      {/* §4 — How it flows */}
      <section className="bg-page py-24 md:py-36">
        <div className="mx-auto max-w-[1280px] px-6">
          <SectionKicker>HOW.IT.FLOWS</SectionKicker>
          <h2 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.02] tracking-tight text-ink0 md:text-[52px]">
            <SplitWords text="From pin to bin in four clicks." />
          </h2>
          <StepRail
            className="mt-16"
            steps={[
              { key: "pin", title: "PIN", body: "Click a location node. Its warehouses, utilization and stock value load instantly." },
              { key: "wh", title: "WAREHOUSE", body: "Pick a warehouse tab. Same-category or multi-category — the zoning map shows how the building is divided." },
              { key: "zone", title: "ZONE & RACK", body: "Hover a zone for live stats; open any rack in the 3D twin." },
              { key: "act", title: "ACT", body: "Transfer, re-zone or value — every action posts back to ERPNext across the whole network." },
            ]}
          />
        </div>
      </section>

      <TransferBoard transfers={transfers} live={live && transferQ.isSuccess} />

      <RollupTable locations={locations} live={live} />

      <NetworkCta />
    </>
  );
}
