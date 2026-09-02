import MobileHero from "@/components/mobile/MobileHero";
import SenseTriptych from "@/components/mobile/SenseTriptych";
import DayOnFloor from "@/components/mobile/DayOnFloor";
import OfflineDemo from "@/components/mobile/OfflineDemo";
import DeviceMatrix from "@/components/mobile/DeviceMatrix";
import FeatureStrip from "@/components/mobile/FeatureStrip";
import MobileCta from "@/components/mobile/MobileCta";
import { Link } from "react-router";
import { Smartphone } from "lucide-react";

/**
 * /mobile-app — floor-management app showcase (mobile.md). All device screens
 * are live React UI inside PhoneFrame; no raster screenshots, no tRPC.
 */
export default function MobileApp() {
  return (
    <>
      {/* Live PWA banner */}
      <div className="border-b border-line bg-surface/60">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-center gap-3 px-6 py-3 text-center">
          <Smartphone className="h-4 w-4 text-data" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink1">
            The live floor app is installable now — PWA for Android/iOS,
            APK-ready via Capacitor
          </span>
          <Link
            to="/floor-app"
            className="rounded-md bg-brand px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-onbrand transition-colors hover:bg-brand-hover"
          >
            Open /floor-app
          </Link>
        </div>
      </div>
      {/* 1 — Hero: the twin, in your pocket */}
      <MobileHero />
      {/* 2 — Scan anything: camera / QR / NFC triptych */}
      <SenseTriptych />
      {/* 3 — A day on the floor (pinned walkthrough) */}
      <DayOnFloor />
      {/* 4 — Offline mode */}
      <OfflineDemo />
      {/* 5 — Devices & hardware */}
      <DeviceMatrix />
      {/* 6 — App-store feature strip */}
      <FeatureStrip />
      {/* 7 — CTA */}
      <MobileCta />
    </>
  );
}
