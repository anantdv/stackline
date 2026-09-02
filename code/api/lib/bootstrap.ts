import { sql } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { MIGRATION_STATEMENTS } from "../../db/migration-sql";
import { seedIfEmpty } from "../../db/seed";
import { ensureLocalUser, findUserByEmail } from "../queries/users";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./password";

/**
 * Self-bootstrap: the server provisions its own database on first boot.
 * 1. Executes the schema DDL (statement errors like "table exists" are ignored,
 *    so every boot is idempotent).
 * 2. Provisions the owner's test accounts (idempotent).
 * 3. Seeds the initial dataset only when the warehouses table is empty.
 * Each stage is isolated — a failure in one never blocks the others.
 */

let bootPromise: Promise<void> | null = null;
let testUsersPromise: Promise<void> | null = null;

async function ensureSchema() {
  const db = getDb();
  let applied = 0;
  // users table first — sign-in depends on it
  const ordered = [...MIGRATION_STATEMENTS].sort((a, b) => {
    const aU = a.includes("CREATE TABLE `users`") ? 0 : 1;
    const bU = b.includes("CREATE TABLE `users`") ? 0 : 1;
    return aU - bU;
  });
  for (const stmt of ordered) {
    try {
      await db.execute(sql.raw(stmt));
      applied++;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      // 1050 table exists / 1061 duplicate key / 1826 duplicate FK — all fine on re-boot
      if (/already exists|Duplicate|exists/i.test(msg)) continue;
      console.warn("[bootstrap] DDL statement failed:", msg.slice(0, 200));
    }
  }
  console.log(`[bootstrap] schema ensured (${applied} statements applied)`);
}

/** Test accounts requested by the app owner — provisioned idempotently. */
const TEST_USERS = [
  { email: "shubhangamsarkar@gmail.com", name: "Shubhangam Sarkar", role: "admin" as const },
  { email: "biswajit@anantdv.com", name: "Biswajit", role: "admin" as const },
  { email: "shantanu@anantdv.com", name: "Shantanu", role: "admin" as const },
];
const TEST_PASSWORD = "Stackline@123";

async function provisionTestUsers() {
  // remove the misspelled account provisioned by an earlier boot, if present
  const wrong = await findUserByEmail("biswajit@ananatdv.com");
  if (wrong) {
    await getDb().delete(users).where(eq(users.id, wrong.id));
    console.log("[bootstrap] removed misspelled account biswajit@ananatdv.com");
  }
  const passwordHash = hashPassword(TEST_PASSWORD);
  for (const u of TEST_USERS) {
    await ensureLocalUser({ ...u, passwordHash });
  }
  console.log(`[bootstrap] ${TEST_USERS.length} test accounts ensured`);
}

/**
 * Exported so the login endpoint can self-heal: if an account is missing,
 * it re-runs provisioning on the spot and retries — no dependence on the
 * boot-time run having succeeded. Memoized; safe to call concurrently.
 */
export function ensureTestUsers() {
  if (!testUsersPromise) {
    testUsersPromise = provisionTestUsers().catch((e) => {
      testUsersPromise = null; // allow retry on next call
      console.error("[bootstrap] test-user provisioning failed:", e);
      throw e;
    });
  }
  return testUsersPromise;
}

async function run() {
  await ensureSchema();
  try {
    await ensureTestUsers();
  } catch {
    // already logged inside ensureTestUsers
  }
  try {
    const seeded = await seedIfEmpty();
    console.log(seeded ? "[bootstrap] initial dataset seeded" : "[bootstrap] dataset present, seed skipped");
  } catch (e) {
    console.error("[bootstrap] seed failed (server continues):", e);
  }
}

/** Fire-and-forget bootstrap; never throws, never blocks server start. */
export function bootstrapDatabase() {
  if (!bootPromise) {
    bootPromise = run().catch((e) => {
      console.error("[bootstrap] failed (server continues):", e);
    });
  }
  return bootPromise;
}
