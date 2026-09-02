/**
 * Baked demo dataset for /scanning-bay — used verbatim when the DB is
 * unreachable or empty, and as the shape target for live tRPC adapters.
 */
import { volumetricWeightKg, chargeableWeight } from "@contracts/types";

export type XrayFlag = "clear" | "review" | "blocked";

export interface ScanRecordView {
  id: number;
  parcelId: string;
  /** cm */
  l: number;
  w: number;
  h: number;
  actualKg: number;
  volKg: number;
  flag: XrayFlag;
  contents: string | null;
  dock: string | null;
}

function mk(
  id: number,
  parcelId: string,
  l: number,
  w: number,
  h: number,
  actualKg: number,
  flag: XrayFlag,
  contents: string | null,
  dock: string | null = "D-03"
): ScanRecordView {
  return {
    id,
    parcelId,
    l,
    w,
    h,
    actualKg,
    volKg: Math.round(volumetricWeightKg(l / 100, w / 100, h / 100) * 100) / 100,
    flag,
    contents,
    dock,
  };
}

/** Seeded set: 12 records — 9 clear / 2 review / 1 blocked. */
export const DEMO_SCANS: ScanRecordView[] = [
  mk(1, "PCL-90417", 60, 40, 38, 12.4, "clear", "ELECTRONICS"),
  mk(2, "PCL-90418", 45, 32, 28, 6.1, "clear", "APPAREL"),
  mk(3, "PCL-90419", 80, 55, 50, 21.8, "review", "MIXED — DENSITY VOID", "D-05"),
  mk(4, "PCL-90420", 35, 25, 20, 3.4, "clear", "COSMETICS"),
  mk(5, "PCL-90421", 52, 38, 30, 9.7, "clear", "SPARE PARTS"),
  mk(6, "PCL-90422", 66, 44, 42, 15.2, "clear", "ELECTRONICS"),
  mk(7, "PCL-90423", 40, 40, 40, 8.9, "blocked", "UNDECLARED LIQUIDS", "EXC-LANE"),
  mk(8, "PCL-90424", 30, 22, 15, 1.8, "clear", "DOCUMENTS"),
  mk(9, "PCL-90425", 58, 40, 36, 11.3, "clear", "FOOTWEAR"),
  mk(10, "PCL-90426", 70, 50, 48, 19.6, "review", "DIMS ≠ MASTER +7%", "D-01"),
  mk(11, "PCL-90427", 42, 30, 26, 5.5, "clear", "PHARMA — COLD"),
  mk(12, "PCL-90428", 55, 38, 34, 10.2, "clear", "HOME GOODS"),
];

export interface ConsoleParcel {
  parcelId: string;
  l: number;
  w: number;
  h: number;
  actualKg: number;
  declared: string;
  detected: string;
  mismatch: boolean;
}

/** Console demo cycle: 3rd pass is the mismatch cycle. */
export const CONSOLE_PARCELS: ConsoleParcel[] = [
  { parcelId: "PCL-90429", l: 60, w: 40, h: 38, actualKg: 12.4, declared: "ELECTRONICS", detected: "ELECTRONICS", mismatch: false },
  { parcelId: "PCL-90430", l: 45, w: 32, h: 28, actualKg: 6.1, declared: "APPAREL", detected: "APPAREL", mismatch: false },
  { parcelId: "PCL-90431", l: 52, w: 38, h: 30, actualKg: 9.7, declared: "SPARE PARTS", detected: "LIQUIDS DETECTED", mismatch: true },
  { parcelId: "PCL-90432", l: 66, w: 44, h: 42, actualKg: 15.2, declared: "ELECTRONICS", detected: "ELECTRONICS", mismatch: false },
];

export function billingFor(p: { l: number; w: number; h: number; actualKg: number }, divisor = 5000) {
  const volKg = volumetricWeightKg(p.l / 100, p.w / 100, p.h / 100, divisor);
  const charge = chargeableWeight(p.actualKg, volKg);
  return { volKg: Math.round(volKg * 100) / 100, ...charge };
}
