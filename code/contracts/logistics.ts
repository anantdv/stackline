/**
 * Shared v2 logistics contracts — plain TypeScript types + pure,
 * dependency-free functions usable from BOTH frontend and backend.
 *
 * No zod, no drizzle, no node APIs. Runtime-light by design.
 */

// ---------------------------------------------------------------------------
// Entity types (mirror db/schema.ts v2 tables; timestamps are Date — superjson
// preserves Date across the tRPC boundary)
// ---------------------------------------------------------------------------

export type WarehouseCategoryMode = "single-category" | "multi-category";

export interface Location {
  id: number;
  code: string;
  name: string;
  city: string;
  region: string;
  lat: number;
  lng: number;
  createdAt: Date;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  brandColor: string;
  contactEmail: string | null;
  createdAt: Date;
}

export type DockType = "inbound" | "outbound" | "both";

export interface Dock {
  id: number;
  warehouseId: number;
  code: string;
  type: string;
}

export type VehicleType =
  | "truck-32ft"
  | "truck-20ft"
  | "container-40"
  | "container-20"
  | "van";
export type VehicleStatus = "idle" | "enroute" | "loading" | "maintenance";

export interface Vehicle {
  id: number;
  regNo: string;
  type: string;
  lengthM: number;
  widthM: number;
  heightM: number;
  maxWeightKg: number;
  gpsLat: number | null;
  gpsLng: number | null;
  status: string;
  driverName: string | null;
  createdAt: Date;
}

export type GatePassDirection = "in" | "out";
export type GatePassStatus =
  | "scheduled"
  | "at-gate"
  | "in-yard"
  | "completed"
  | "cancelled";

export interface GatePass {
  id: number;
  passNo: string;
  warehouseId: number;
  vehicleId: number;
  direction: string;
  driverName: string;
  purpose: string;
  status: string;
  docRef: string | null;
  scheduledAt: Date | null;
  inAt: Date | null;
  outAt: Date | null;
  createdAt: Date;
}

export type DocType = "EWB" | "IRN" | "BOL" | "AWB" | "LR" | "RR";
export type DocStatus = "valid" | "expiring" | "expired" | "draft";

export interface ComplianceDoc {
  id: number;
  docType: string;
  docNo: string;
  movementId: number | null;
  invoiceId: number | null;
  payloadJson: string | null;
  validFrom: Date | null;
  validUntil: Date | null;
  status: string;
  createdAt: Date;
}

export type ShippingMethod = "road" | "sea" | "air" | "rail";
export type InvoiceStatus = "draft" | "issued" | "paid";

export interface Invoice {
  id: number;
  invoiceNo: string;
  customerId: number | null;
  warehouseId: number;
  movementId: number | null;
  amountPaise: number;
  taxPaise: number;
  currency: string;
  shippingMethod: string;
  status: string;
  createdAt: Date;
}

export type XrayFlag = "clear" | "review" | "blocked";

export interface ScanRecord {
  id: number;
  parcelId: string;
  warehouseId: number;
  dockId: number | null;
  lengthM: number;
  widthM: number;
  heightM: number;
  actualWeightKg: number;
  volumetricWeightKg: number;
  xrayFlag: string;
  contentsGuess: string | null;
  createdAt: Date;
}

export type LoadPlanStatus = "draft" | "optimized" | "locked" | "dispatched";

export interface LoadPlan {
  id: number;
  planNo: string;
  vehicleId: number;
  warehouseId: number;
  status: string;
  utilizationPct: number;
  totalWeightKg: number;
  sequenceJson: string | null;
  createdAt: Date;
}

export type RouteDirection = "outward" | "inward" | "backhaul";
export type RouteStatus = "planned" | "active" | "completed";

export interface Route {
  id: number;
  routeNo: string;
  vehicleId: number;
  direction: string;
  status: string;
  optimizedStopsJson: string | null;
  totalKm: number;
  etaMinutes: number;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Volumetric weight
// ---------------------------------------------------------------------------

/**
 * Volumetric (dimensional) weight in kg for a parcel measured in METERS.
 * Industry formula: L×W×H (cm) ÷ divisor. With meter inputs this is
 * m³ × 1,000,000 ÷ divisor. Common divisors: 5000 (air), 4000 (courier),
 * 6000 (sea LCL).
 */
export function volumetricWeightKg(
  lengthM: number,
  widthM: number,
  heightM: number,
  divisor = 5000,
): number {
  if (divisor <= 0) return 0;
  const volCm3 = lengthM * 100 * (widthM * 100) * (heightM * 100);
  return volCm3 / divisor;
}

export interface ChargeableWeight {
  chargeableKg: number;
  basis: "actual" | "volumetric";
}

/** Carriers bill the greater of actual vs volumetric weight. */
export function chargeableWeight(
  actualWeightKg: number,
  volumetricKg: number,
): ChargeableWeight {
  return volumetricKg > actualWeightKg
    ? { chargeableKg: volumetricKg, basis: "volumetric" }
    : { chargeableKg: actualWeightKg, basis: "actual" };
}

// ---------------------------------------------------------------------------
// packLoad — heuristic 3D bin packing (shelf/layer first-fit decreasing)
// ---------------------------------------------------------------------------

export interface VehicleCargoSpace {
  lengthM: number;
  widthM: number;
  heightM: number;
  maxWeightKg: number;
}

export interface PackItem {
  id: string | number;
  l: number; // meters
  w: number;
  h: number;
  weightKg: number;
  qty: number;
}

/**
 * Rotation axis mapping: which item axis (l/w/h) lies along each vehicle
 * axis. "xyz" = no rotation (item length along vehicle length, etc.).
 */
export type RotationAxis = "xyz" | "xzy" | "yxz" | "yzx" | "zxy" | "zyx";

export interface PlacedItem {
  id: string | number;
  /** Position of the item's min corner inside the cargo space (meters). */
  x: number;
  y: number;
  z: number;
  /** Placed (post-rotation) dimensions along vehicle x/y/z. */
  dx: number;
  dy: number;
  dz: number;
  rotation: RotationAxis;
  /** Load order (0 = first in, floor-back-first). */
  sequence: number;
}

export interface UnplacedItem {
  id: string | number;
  qty: number;
  reason: "no-fit" | "overweight";
}

export interface PackLoadResult {
  placed: PlacedItem[];
  unplaced: UnplacedItem[];
  /** Cargo volume utilization, 0–100. */
  utilizationPct: number;
  /** Payload weight utilization, 0–100. */
  weightUtilizationPct: number;
  totalWeightKg: number;
  vehicleVolumeM3: number;
  usedVolumeM3: number;
}

interface OrientedBox {
  dx: number;
  dy: number;
  dz: number;
  rotation: RotationAxis;
}

/** All 6 axis permutations of a box, as placed dims + rotation label. */
function orientations(l: number, w: number, h: number): OrientedBox[] {
  return [
    { dx: l, dy: w, dz: h, rotation: "xyz" },
    { dx: l, dy: h, dz: w, rotation: "xzy" },
    { dx: w, dy: l, dz: h, rotation: "yxz" },
    { dx: w, dy: h, dz: l, rotation: "yzx" },
    { dx: h, dy: l, dz: w, rotation: "zxy" },
    { dx: h, dy: w, dz: l, rotation: "zyx" },
  ];
}

const EPS = 1e-9;

interface Shelf {
  /** y origin of the shelf row within its layer. */
  y: number;
  /** depth (y-extent) of the shelf row. */
  depth: number;
  /** next free x position. */
  x: number;
}

interface Layer {
  /** z origin of the layer. */
  z: number;
  /** height of the layer (set by its first placement). */
  height: number;
  shelves: Shelf[];
}

/**
 * Heuristic 3D bin packing: items sorted by decreasing volume are packed
 * floor-up into layers; each layer is filled with shelf rows (back-to-front).
 * All 6 rotations are tried; the first orientation fitting an existing
 * shelf/layer wins. Payload weight is a hard cap.
 */
export function packLoad(
  vehicle: VehicleCargoSpace,
  items: PackItem[],
): PackLoadResult {
  const vehicleVolumeM3 = vehicle.lengthM * vehicle.widthM * vehicle.heightM;

  // Expand quantities into individual boxes, largest volume first.
  interface Box extends OrientedBox {
    id: string | number;
    weightKg: number;
    volume: number;
    orientations: OrientedBox[];
  }
  const boxes: Box[] = [];
  for (const it of items) {
    const qty = Math.max(0, Math.floor(it.qty));
    for (let i = 0; i < qty; i++) {
      boxes.push({
        id: it.id,
        weightKg: it.weightKg,
        volume: it.l * it.w * it.h,
        orientations: orientations(it.l, it.w, it.h),
        dx: it.l,
        dy: it.w,
        dz: it.h,
        rotation: "xyz",
      });
    }
  }
  boxes.sort((a, b) => b.volume - a.volume || b.weightKg - a.weightKg);

  const placed: PlacedItem[] = [];
  const unplacedById = new Map<string | number, UnplacedItem>();
  const layers: Layer[] = [];
  let totalWeightKg = 0;
  let usedVolumeM3 = 0;

  const markUnplaced = (box: Box, reason: UnplacedItem["reason"]) => {
    const existing = unplacedById.get(box.id);
    if (existing) {
      existing.qty += 1;
      if (existing.reason !== "overweight") existing.reason = reason;
    } else {
      unplacedById.set(box.id, { id: box.id, qty: 1, reason });
    }
  };

  for (const box of boxes) {
    if (totalWeightKg + box.weightKg > vehicle.maxWeightKg + EPS) {
      markUnplaced(box, "overweight");
      continue;
    }

    let spot: { layer: Layer; shelf: Shelf | null; o: OrientedBox } | null =
      null;

    // 1) Existing shelves in existing layers.
    outer: for (const layer of layers) {
      for (const shelf of layer.shelves) {
        for (const o of box.orientations) {
          if (
            o.dx <= vehicle.lengthM - shelf.x + EPS &&
            o.dy <= shelf.depth + EPS &&
            o.dz <= layer.height + EPS
          ) {
            spot = { layer, shelf, o };
            break outer;
          }
        }
      }
    }
    // 2) New shelf row inside an existing layer.
    if (!spot) {
      for (const layer of layers) {
        const usedWidth = layer.shelves.reduce((s, sh) => s + sh.depth, 0);
        for (const o of box.orientations) {
          if (
            o.dx <= vehicle.lengthM + EPS &&
            o.dy <= vehicle.widthM - usedWidth + EPS &&
            o.dz <= layer.height + EPS
          ) {
            const shelf: Shelf = { y: usedWidth, depth: o.dy, x: 0 };
            layer.shelves.push(shelf);
            spot = { layer, shelf, o };
            break;
          }
        }
        if (spot) break;
      }
    }
    // 3) New layer.
    if (!spot) {
      const usedHeight = layers.reduce((s, l) => s + l.height, 0);
      for (const o of box.orientations) {
        if (
          o.dx <= vehicle.lengthM + EPS &&
          o.dy <= vehicle.widthM + EPS &&
          o.dz <= vehicle.heightM - usedHeight + EPS
        ) {
          const layer: Layer = {
            z: usedHeight,
            height: o.dz,
            shelves: [{ y: 0, depth: o.dy, x: 0 }],
          };
          layers.push(layer);
          spot = { layer, shelf: layer.shelves[0], o };
          break;
        }
      }
    }

    if (!spot) {
      markUnplaced(box, "no-fit");
      continue;
    }

    const { layer, shelf, o } = spot;
    placed.push({
      id: box.id,
      x: round3(shelf!.x),
      y: round3(shelf!.y),
      z: round3(layer.z),
      dx: round3(o.dx),
      dy: round3(o.dy),
      dz: round3(o.dz),
      rotation: o.rotation,
      sequence: placed.length,
    });
    shelf!.x += o.dx;
    totalWeightKg += box.weightKg;
    usedVolumeM3 += box.volume;
  }

  return {
    placed,
    unplaced: [...unplacedById.values()],
    utilizationPct:
      vehicleVolumeM3 > 0 ? (usedVolumeM3 / vehicleVolumeM3) * 100 : 0,
    weightUtilizationPct:
      vehicle.maxWeightKg > 0 ? (totalWeightKg / vehicle.maxWeightKg) * 100 : 0,
    totalWeightKg: round3(totalWeightKg),
    vehicleVolumeM3: round3(vehicleVolumeM3),
    usedVolumeM3: round3(usedVolumeM3),
  };
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

// ---------------------------------------------------------------------------
// Compliance validity helpers
// ---------------------------------------------------------------------------

/**
 * E-way bill validity: 1 day per 100 km of distance, plus 1 day
 * (the "100 km/day + 1" rule). Returned in hours.
 */
export function ewayBillValidityHours(distanceKm: number): number {
  const days = Math.floor(Math.max(0, distanceKm) / 100) + 1;
  return days * 24;
}

/**
 * Compute a document's live status from its validity window.
 * - no validUntil → 'draft'
 * - validUntil < now → 'expired'
 * - validUntil within `expiringWithinHours` → 'expiring'
 * - otherwise → 'valid'
 */
export function docStatusFromValidity(
  validUntil: Date | null,
  now: Date,
  expiringWithinHours = 6,
): DocStatus {
  if (!validUntil) return "draft";
  const msLeft = validUntil.getTime() - now.getTime();
  if (msLeft < 0) return "expired";
  if (msLeft <= expiringWithinHours * 3600 * 1000) return "expiring";
  return "valid";
}

/** Statutory document set required per shipping method. */
export function requiredDocsForMethod(method: ShippingMethod): DocType[] {
  switch (method) {
    case "road":
      return ["IRN", "EWB", "LR"];
    case "sea":
      return ["BOL"];
    case "air":
      return ["AWB"];
    case "rail":
      return ["EWB", "RR"];
  }
}

// ---------------------------------------------------------------------------
// Route optimization — nearest neighbor + 2-opt (haversine distances)
// ---------------------------------------------------------------------------

export interface RouteStop {
  id: string | number;
  lat: number;
  lng: number;
  /** Optional label / address for UI display. */
  label?: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

export interface OptimizedRoute {
  /** Stops in visit order (depot is the implicit start/end). */
  orderedStops: RouteStop[];
  totalKm: number;
}

function routeLengthKm(
  order: RouteStop[],
  depot: GeoPoint,
  roundTrip: boolean,
): number {
  if (order.length === 0) return 0;
  let km = haversineKm(depot, order[0]);
  for (let i = 1; i < order.length; i++) {
    km += haversineKm(order[i - 1], order[i]);
  }
  if (roundTrip) km += haversineKm(order[order.length - 1], depot);
  return km;
}

/**
 * Multi-stop route optimization: nearest-neighbor seed from the depot,
 * then 2-opt improvement passes until no swap shortens the route.
 * Routes are round-trips back to the depot (delivery runs return home).
 */
export function optimizeRoute(
  stops: RouteStop[],
  depot: GeoPoint,
): OptimizedRoute {
  // Nearest neighbor construction.
  const remaining = [...stops];
  const order: RouteStop[] = [];
  let cursor: GeoPoint = depot;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestKm = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const km = haversineKm(cursor, remaining[i]);
      if (km < bestKm) {
        bestKm = km;
        bestIdx = i;
      }
    }
    const [next] = remaining.splice(bestIdx, 1);
    order.push(next);
    cursor = next;
  }

  // 2-opt improvement.
  const n = order.length;
  let improved = true;
  let guard = 0;
  while (improved && guard < 100) {
    improved = false;
    guard++;
    for (let i = 0; i < n - 1 && n > 2; i++) {
      for (let j = i + 1; j < n; j++) {
        const before = routeLengthKm(order, depot, true);
        const candidate = [
          ...order.slice(0, i),
          ...order.slice(i, j + 1).reverse(),
          ...order.slice(j + 1),
        ];
        const after = routeLengthKm(candidate, depot, true);
        if (after < before - 1e-9) {
          order.splice(0, order.length, ...candidate);
          improved = true;
        }
      }
    }
  }

  return { orderedStops: order, totalKm: round3(routeLengthKm(order, depot, true)) };
}

// ---------------------------------------------------------------------------
// Misc formatting helpers shared by pages
// ---------------------------------------------------------------------------

/** Indian digit grouping: 1842300 → "18,42,300". */
export function formatINR(amountPaise: number): string {
  const rupees = Math.round(amountPaise / 100);
  const s = String(Math.abs(rupees));
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return `${rupees < 0 ? "-" : ""}₹${grouped}${last3}`;
}
