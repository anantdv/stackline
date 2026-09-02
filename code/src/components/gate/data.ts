/**
 * Baked demo dataset for /gate — used verbatim when the DB is unreachable or
 * empty, and as the shape target for live tRPC data adapters.
 */

export type GateDirection = "in" | "out";
export type GateStatus =
  | "scheduled"
  | "at-gate"
  | "in-yard"
  | "completed"
  | "cancelled";
export type EwbStatus = "valid" | "expiring" | "expired";

export interface GateVehicle {
  id: number;
  passNo: string; // GP-2841
  plate: string; // GJ-01-AB-4421
  driver: string;
  direction: GateDirection;
  /** ASN-0117 / INV/2025/0117 etc. */
  ref: string;
  dock: string | null; // D-03
  staging: string | null; // Y-07
  waitMin: number;
  status: GateStatus;
  ewbNo: string | null;
  ewbStatus: EwbStatus | null;
  ewbHoursLeft: number | null;
}

export interface GateBoardData {
  inLane: GateVehicle[];
  yard: GateVehicle[];
  outLane: GateVehicle[];
  completedToday: GateVehicle[];
}

export interface DockSlot {
  id: string;
  dock: string; // D-01
  /** minutes from 08:00 */
  start: number;
  end: number;
  state: "booked" | "occupied" | "overrun" | "free";
  label: string; // ASN-0117
  crew: number;
  estMin: number;
  vehicle: string | null;
}

export const DEMO_BOARD: GateBoardData = {
  inLane: [
    {
      id: 101,
      passNo: "GP-2841",
      plate: "GJ-01-AB-4421",
      driver: "M. CHAVDA",
      direction: "in",
      ref: "ASN-0117",
      dock: "D-03",
      staging: null,
      waitMin: 4,
      status: "at-gate",
      ewbNo: null,
      ewbStatus: null,
      ewbHoursLeft: null,
    },
    {
      id: 102,
      passNo: "GP-2842",
      plate: "MH-12-PQ-3355",
      driver: "S. YADAV",
      direction: "in",
      ref: "ASN-0118",
      dock: "D-01",
      staging: null,
      waitMin: 11,
      status: "scheduled",
      ewbNo: null,
      ewbStatus: null,
      ewbHoursLeft: null,
    },
    {
      id: 103,
      passNo: "GP-2843",
      plate: "KA-05-MN-2210",
      driver: "P. REDDY",
      direction: "in",
      ref: "ASN-0121",
      dock: "D-02",
      staging: null,
      waitMin: 19,
      status: "scheduled",
      ewbNo: null,
      ewbStatus: null,
      ewbHoursLeft: null,
    },
  ],
  yard: [
    {
      id: 104,
      passNo: "GP-2838",
      plate: "MH-04-CD-8812",
      driver: "R. PATIL",
      direction: "in",
      ref: "ASN-0115",
      dock: "D-05",
      staging: "Y-07",
      waitMin: 22,
      status: "in-yard",
      ewbNo: null,
      ewbStatus: null,
      ewbHoursLeft: null,
    },
    {
      id: 105,
      passNo: "GP-2839",
      plate: "DL-08-RT-5541",
      driver: "A. SINGH",
      direction: "out",
      ref: "INV/2025/0114",
      dock: "D-07",
      staging: "Y-03",
      waitMin: 31,
      status: "in-yard",
      ewbNo: "EWB 2841 9912 4471",
      ewbStatus: "valid",
      ewbHoursLeft: 22,
    },
    {
      id: 106,
      passNo: "GP-2840",
      plate: "TN-09-KL-7702",
      driver: "V. KUMAR",
      direction: "in",
      ref: "ASN-0116",
      dock: "D-04",
      staging: "Y-10",
      waitMin: 41,
      status: "in-yard",
      ewbNo: null,
      ewbStatus: null,
      ewbHoursLeft: null,
    },
  ],
  outLane: [
    {
      id: 107,
      passNo: "GP-2844",
      plate: "MH-04-GH-1107",
      driver: "TRK-07 · R. PATIL",
      direction: "out",
      ref: "INV/2025/0117",
      dock: null,
      staging: null,
      waitMin: 6,
      status: "at-gate",
      ewbNo: "EWB 2841 9912 7710",
      ewbStatus: "valid",
      ewbHoursLeft: 22,
    },
    {
      id: 108,
      passNo: "GP-2845",
      plate: "GJ-27-ZX-0914",
      driver: "TRK-12 · D. MORE",
      direction: "out",
      ref: "INV/2025/0118",
      dock: null,
      staging: null,
      waitMin: 14,
      status: "scheduled",
      ewbNo: "EWB 2841 9912 5520",
      ewbStatus: "expiring",
      ewbHoursLeft: 2,
    },
    {
      id: 109,
      passNo: "GP-2846",
      plate: "MH-46-BV-6630",
      driver: "TRK-03 · K. JADHAV",
      direction: "out",
      ref: "INV/2025/0112",
      dock: null,
      staging: null,
      waitMin: 26,
      status: "scheduled",
      ewbNo: "EWB 2841 9901 1187",
      ewbStatus: "expired",
      ewbHoursLeft: 0,
    },
  ],
  completedToday: [
    {
      id: 110,
      passNo: "GP-2836",
      plate: "MH-14-AA-9021",
      driver: "TRK-05 · N. SHAIKH",
      direction: "out",
      ref: "INV/2025/0111",
      dock: null,
      staging: null,
      waitMin: 0,
      status: "completed",
      ewbNo: "EWB 2841 9900 3402",
      ewbStatus: "valid",
      ewbHoursLeft: 8,
    },
  ],
};

/** Extra arrivals cycled into the IN lane on the demo stream. */
export const DEMO_ARRIVALS: GateVehicle[] = [
  {
    id: 201,
    passNo: "GP-2847",
    plate: "RJ-14-GA-1180",
    driver: "B. CHOUDHARY",
    direction: "in",
    ref: "ASN-0124",
    dock: "D-06",
    staging: null,
    waitMin: 0,
    status: "scheduled",
    ewbNo: null,
    ewbStatus: null,
    ewbHoursLeft: null,
  },
  {
    id: 202,
    passNo: "GP-2848",
    plate: "MP-09-HK-4417",
    driver: "I. QURESHI",
    direction: "in",
    ref: "ASN-0125",
    dock: "D-02",
    staging: null,
    waitMin: 0,
    status: "scheduled",
    ewbNo: null,
    ewbStatus: null,
    ewbHoursLeft: null,
  },
  {
    id: 203,
    passNo: "GP-2849",
    plate: "GJ-05-TT-8834",
    driver: "H. PARMAR",
    direction: "in",
    ref: "ASN-0126",
    dock: "D-01",
    staging: null,
    waitMin: 0,
    status: "scheduled",
    ewbNo: null,
    ewbStatus: null,
    ewbHoursLeft: null,
  },
];

export interface DemoDock {
  id: number;
  code: string;
  type: "inbound" | "outbound" | "both";
}

export const DEMO_DOCKS: DemoDock[] = [
  { id: 1, code: "D-01", type: "inbound" },
  { id: 2, code: "D-02", type: "inbound" },
  { id: 3, code: "D-03", type: "inbound" },
  { id: 4, code: "D-04", type: "both" },
  { id: 5, code: "D-05", type: "both" },
  { id: 6, code: "D-06", type: "outbound" },
  { id: 7, code: "D-07", type: "outbound" },
  { id: 8, code: "D-08", type: "outbound" },
];

/** Gantt slots, minutes from 08:00 (window 08:00 → 20:00). */
export const DEMO_SLOTS: DockSlot[] = [
  { id: "s1", dock: "D-01", start: 30, end: 120, state: "occupied", label: "ASN-0118", crew: 2, estMin: 45, vehicle: "MH-12-PQ-3355" },
  { id: "s2", dock: "D-01", start: 150, end: 225, state: "booked", label: "ASN-0126", crew: 2, estMin: 45, vehicle: null },
  { id: "s3", dock: "D-02", start: 60, end: 165, state: "overrun", label: "ASN-0116", crew: 3, estMin: 60, vehicle: "TN-09-KL-7702" },
  { id: "s4", dock: "D-02", start: 300, end: 390, state: "booked", label: "ASN-0121", crew: 2, estMin: 50, vehicle: null },
  { id: "s5", dock: "D-03", start: 0, end: 90, state: "occupied", label: "ASN-0117", crew: 2, estMin: 45, vehicle: "GJ-01-AB-4421" },
  { id: "s6", dock: "D-03", start: 240, end: 330, state: "booked", label: "ASN-0122", crew: 2, estMin: 45, vehicle: null },
  { id: "s7", dock: "D-04", start: 90, end: 180, state: "occupied", label: "ASN-0115", crew: 2, estMin: 40, vehicle: "MH-04-CD-8812" },
  { id: "s8", dock: "D-04", start: 420, end: 510, state: "booked", label: "TRIP-0419", crew: 2, estMin: 50, vehicle: null },
  { id: "s9", dock: "D-05", start: 150, end: 240, state: "free", label: "OPEN", crew: 0, estMin: 0, vehicle: null },
  { id: "s10", dock: "D-05", start: 330, end: 430, state: "booked", label: "ASN-0127", crew: 2, estMin: 55, vehicle: null },
  { id: "s11", dock: "D-06", start: 60, end: 150, state: "occupied", label: "INV/2025/0116", crew: 2, estMin: 50, vehicle: "TRK-09" },
  { id: "s12", dock: "D-06", start: 480, end: 570, state: "booked", label: "INV/2025/0121", crew: 2, estMin: 45, vehicle: null },
  { id: "s13", dock: "D-07", start: 120, end: 225, state: "occupied", label: "INV/2025/0114", crew: 3, estMin: 60, vehicle: "DL-08-RT-5541" },
  { id: "s14", dock: "D-07", start: 360, end: 450, state: "booked", label: "INV/2025/0119", crew: 2, estMin: 45, vehicle: null },
  { id: "s15", dock: "D-08", start: 210, end: 300, state: "overrun", label: "INV/2025/0112", crew: 2, estMin: 50, vehicle: "MH-46-BV-6630" },
  { id: "s16", dock: "D-08", start: 540, end: 660, state: "booked", label: "TRIP-0417", crew: 3, estMin: 60, vehicle: null },
];

/** Yard staging occupancy for the §5 utilization strip (12 slots). */
export const DEMO_STAGING_OCCUPANCY: Record<string, string | null> = {
  "Y-01": "MH-14-AA-9021",
  "Y-02": null,
  "Y-03": "DL-08-RT-5541",
  "Y-04": null,
  "Y-05": "GJ-27-ZX-0914",
  "Y-06": null,
  "Y-07": "MH-04-CD-8812",
  "Y-08": "TRK-07",
  "Y-09": null,
  "Y-10": "TN-09-KL-7702",
  "Y-11": null,
  "Y-12": "TRK-12",
};

/** Wait-bar tone thresholds (minutes). */
export function waitTone(min: number): "data" | "warn" | "crit" {
  if (min >= 35) return "crit";
  if (min >= 15) return "warn";
  return "data";
}

export function fmtClock(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
