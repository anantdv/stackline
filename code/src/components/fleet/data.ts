/**
 * Baked demo dataset for /fleet — used verbatim when the DB is unreachable or
 * empty, and as the shape target for live tRPC adapters. Coordinates are
 * lat/lng in the Mumbai–Navi-Mumbai corridor (map projects them to canvas px).
 */
import type { RouteStop } from "@contracts/types";

export type VehicleState = "moving" | "loading" | "idle" | "delayed";

export interface FleetVehicle {
  id: number;
  regNo: string; // MH-04-GH-1107
  code: string; // TRK-07
  driver: string;
  phone: string;
  state: VehicleState;
  lat: number;
  lng: number;
  headingDeg: number;
  speedKmh: number;
  loadPct: number;
  trip: string | null; // TRIP-0417
  nextStop: string | null; // "STOP 3/6 · KALYAN"
  etaMin: number | null;
  ewb: { no: string; status: "valid" | "expiring" | "expired"; hoursLeft: number } | null;
  pings: string[]; // last 5 GPS ping timestamps
  loadPlan: string | null; // LP-0417
}

export interface FleetRoute {
  id: number;
  routeNo: string; // TRIP-0417
  vehicleCode: string;
  direction: "outward" | "inward" | "backhaul";
  status: "planned" | "active" | "completed";
  stops: RouteStop[];
  totalKm: number;
  etaMinutes: number;
  stopsDone: number;
  docRefs: string[];
  /** inward-only meta */
  supplier?: string;
  asn?: string;
  pickupWindow?: string;
  binsReserved?: number;
}

export const MAP_BOUNDS = {
  latMin: 18.86,
  latMax: 19.38,
  lngMin: 72.78,
  lngMax: 73.3,
};

export const DEPOTS = [
  { id: "MUM-BHIWANDI", lat: 19.292, lng: 73.062 },
  { id: "PNQ-NORTH", lat: 18.905, lng: 73.22 },
];

export const DEMO_VEHICLES: FleetVehicle[] = [
  {
    id: 1, regNo: "MH-04-GH-1107", code: "TRK-07", driver: "R. PATIL", phone: "+91 98•• •••210",
    state: "moving", lat: 19.12, lng: 72.93, headingDeg: 62, speedKmh: 48, loadPct: 91,
    trip: "TRIP-0417", nextStop: "STOP 3/6 · KALYAN", etaMin: 22,
    ewb: { no: "EWB 2841 9912 7710", status: "valid", hoursLeft: 22 },
    pings: ["14:26:04", "14:27:16", "14:28:28", "14:29:40", "14:30:52"],
    loadPlan: "LP-0417",
  },
  {
    id: 2, regNo: "MH-12-PQ-3355", code: "TRK-12", driver: "D. MORE", phone: "+91 90•• •••442",
    state: "moving", lat: 19.24, lng: 73.12, headingDeg: 198, speedKmh: 42, loadPct: 34,
    trip: "TRIP-0418", nextStop: "PICKUP 2/3 · TALOJA", etaMin: 14,
    ewb: null,
    pings: ["14:26:11", "14:27:23", "14:28:35", "14:29:47", "14:30:59"],
    loadPlan: null,
  },
  {
    id: 3, regNo: "MH-46-BV-6630", code: "TRK-03", driver: "K. JADHAV", phone: "+91 97•• •••118",
    state: "delayed", lat: 19.03, lng: 72.86, headingDeg: 310, speedKmh: 12, loadPct: 88,
    trip: "TRIP-0419", nextStop: "STOP 2/4 · ANDHERI", etaMin: 41,
    ewb: { no: "EWB 2841 9901 1187", status: "expired", hoursLeft: 0 },
    pings: ["14:21:02", "14:24:14", "14:27:26", "14:29:38", "14:30:50"],
    loadPlan: "LP-0419",
  },
  {
    id: 4, regNo: "MH-14-AA-9021", code: "TRK-05", driver: "N. SHAIKH", phone: "+91 91•• •••730",
    state: "loading", lat: 19.292, lng: 73.062, headingDeg: 0, speedKmh: 0, loadPct: 62,
    trip: "TRIP-0420", nextStop: "LOADING · DOCK D-07", etaMin: null,
    ewb: null,
    pings: ["14:29:10", "14:29:22", "14:29:34", "14:29:46", "14:29:58"],
    loadPlan: "LP-0420",
  },
  {
    id: 5, regNo: "GJ-27-ZX-0914", code: "TRK-09", driver: "H. PARMAR", phone: "+91 99•• •••064",
    state: "moving", lat: 19.18, lng: 73.02, headingDeg: 95, speedKmh: 51, loadPct: 77,
    trip: "TRIP-0417", nextStop: "STOP 4/6 · DOMBIVLI", etaMin: 31,
    ewb: { no: "EWB 2841 9912 5520", status: "expiring", hoursLeft: 2 },
    pings: ["14:26:44", "14:27:56", "14:29:08", "14:30:20", "14:31:32"],
    loadPlan: "LP-0417",
  },
  {
    id: 6, regNo: "DL-08-RT-5541", code: "TRK-11", driver: "A. SINGH", phone: "+91 88•• •••591",
    state: "idle", lat: 19.297, lng: 73.07, headingDeg: 0, speedKmh: 0, loadPct: 0,
    trip: null, nextStop: null, etaMin: null, ewb: null,
    pings: ["14:28:02", "14:28:14", "14:28:26", "14:28:38", "14:28:50"],
    loadPlan: null,
  },
  {
    id: 7, regNo: "KA-05-MN-2210", code: "TRK-14", driver: "P. REDDY", phone: "+91 96•• •••383",
    state: "moving", lat: 19.08, lng: 73.0, headingDeg: 24, speedKmh: 44, loadPct: 55,
    trip: "TRIP-0418", nextStop: "PICKUP 3/3 · TURBHE", etaMin: 18,
    ewb: null,
    pings: ["14:27:12", "14:28:24", "14:29:36", "14:30:48", "14:31:00"],
    loadPlan: null,
  },
  {
    id: 8, regNo: "TN-09-KL-7702", code: "TRK-16", driver: "V. KUMAR", phone: "+91 94•• •••827",
    state: "idle", lat: 18.905, lng: 73.222, headingDeg: 0, speedKmh: 0, loadPct: 0,
    trip: null, nextStop: "DEPOT PNQ-NORTH", etaMin: null, ewb: null,
    pings: ["14:25:30", "14:25:42", "14:25:54", "14:26:06", "14:26:18"],
    loadPlan: null,
  },
];

const S = (id: string | number, lat: number, lng: number, label: string): RouteStop => ({ id, lat, lng, label });

export const DEMO_ROUTES: FleetRoute[] = [
  {
    id: 1, routeNo: "TRIP-0417", vehicleCode: "TRK-07", direction: "outward", status: "active",
    stops: [
      S("s1", 19.06, 72.89, "ANDHERI"),
      S("s2", 19.11, 72.91, "GOREGAON"),
      S("s3", 19.21, 73.0, "KALYAN"),
      S("s4", 19.19, 73.06, "DOMBIVLI"),
      S("s5", 19.25, 73.13, "AMBERNATH"),
      S("s6", 19.3, 73.18, "BADLAPUR"),
    ],
    totalKm: 66, etaMinutes: 175, stopsDone: 2,
    docRefs: ["INV/2025/0117", "EWB 2841 9912 7710", "GP-2844"],
  },
  {
    id: 2, routeNo: "TRIP-0418", vehicleCode: "TRK-12", direction: "inward", status: "active",
    stops: [S("p1", 19.15, 73.08, "TALOJA"), S("p2", 19.08, 73.02, "TURBHE"), S("p3", 19.2, 72.97, "GHANSOLI")],
    totalKm: 41, etaMinutes: 110, stopsDone: 1,
    docRefs: ["ASN-0118"],
    supplier: "PRECISION FASTENERS PVT", asn: "ASN-0118", pickupWindow: "14:00–16:00", binsReserved: 3,
  },
  {
    id: 3, routeNo: "TRIP-0419", vehicleCode: "TRK-03", direction: "outward", status: "active",
    stops: [S("q1", 19.02, 72.85, "DADAR"), S("q2", 19.11, 72.87, "ANDHERI"), S("q3", 19.0, 72.9, "CHEMBUR"), S("q4", 19.07, 72.99, "VASHI")],
    totalKm: 38, etaMinutes: 95, stopsDone: 1,
    docRefs: ["INV/2025/0112", "EWB 2841 9901 1187"],
  },
  {
    id: 4, routeNo: "TRIP-0420", vehicleCode: "TRK-05", direction: "backhaul", status: "planned",
    stops: [S("b1", 19.3, 73.18, "BADLAPUR (LAST DROP)"), S("b2", 19.26, 73.1, "SUPPLIER YARD — BACKHAUL")],
    totalKm: 18, etaMinutes: 40, stopsDone: 0,
    docRefs: ["ASN-0124"],
    supplier: "KONARK POLYMERS", asn: "ASN-0124", pickupWindow: "16:00–17:30", binsReserved: 2,
  },
];

export interface DriverCard {
  name: string;
  phone: string;
  drivenH: number;
  maxH: number;
  trip: string | null;
}

export const DEMO_DRIVERS: DriverCard[] = [
  { name: "R. PATIL", phone: "+91 98•• •••210", drivenH: 5.2, maxH: 8, trip: "TRIP-0417" },
  { name: "D. MORE", phone: "+91 90•• •••442", drivenH: 3.1, maxH: 8, trip: "TRIP-0418" },
  { name: "S. YADAV", phone: "+91 92•• •••615", drivenH: 6.4, maxH: 8, trip: null },
];

export interface EtaItem {
  id: string;
  stop: string;
  place: string;
  etaMin: number;
  vehicle: string;
}

export const DEMO_ETAS: EtaItem[] = [
  { id: "e1", stop: "STOP 3", place: "KALYAN", etaMin: 22, vehicle: "TRK-07" },
  { id: "e2", stop: "PICKUP 2", place: "TALOJA", etaMin: 14, vehicle: "TRK-12" },
  { id: "e3", stop: "STOP 2", place: "ANDHERI", etaMin: 41, vehicle: "TRK-03" },
  { id: "e4", stop: "PICKUP 3", place: "TURBHE", etaMin: 18, vehicle: "TRK-14" },
  { id: "e5", stop: "STOP 4", place: "DOMBIVLI", etaMin: 31, vehicle: "TRK-09" },
];

export const GEOFENCE_FEED = [
  { t: "14:31", text: "TRK-07 ▸ 2KM RING · DOCK D-03 RESERVED", tone: "warn" as const },
  { t: "14:38", text: "TRK-07 ▸ 500M · GATE PASS GP-2841 READY", tone: "data" as const },
  { t: "14:41", text: "GATE IN ✓ TAT 38M · BOOTH-01", tone: "brand" as const },
  { t: "14:52", text: "TRK-12 ▸ DEPARTED TALOJA · TRACKING LINK SENT", tone: "data" as const },
  { t: "15:04", text: "TRK-09 ▸ 2KM RING · CREW NOTIFIED", tone: "warn" as const },
];
