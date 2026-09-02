import { eq } from "drizzle-orm";
import * as schema from "@db/schema";
import type { InsertUser } from "@db/schema";
import { getDb } from "./connection";
import { env } from "../lib/env";

export async function findUserByUnionId(unionId: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, unionId))
    .limit(1);
  return rows.at(0);
}

export async function upsertUser(data: InsertUser) {
  const values = { ...data };
  const updateSet: Partial<InsertUser> = {
    lastSignInAt: new Date(),
    ...data,
  };

  if (
    values.role === undefined &&
    values.unionId &&
    values.unionId === env.ownerUnionId
  ) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  await getDb()
    .insert(schema.users)
    .values(values)
    .onDuplicateKeyUpdate({ set: updateSet });
}

export async function findUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  return rows.at(0);
}

/**
 * Idempotently provision an email+password account. Local accounts use
 * `local:<email>` as their unionId so they never collide with Kimi OAuth ids.
 */
export async function ensureLocalUser(data: {
  email: string;
  name: string;
  role: "user" | "admin";
  passwordHash: string;
}) {
  const existing = await findUserByEmail(data.email);
  if (existing) return existing;
  await getDb()
    .insert(schema.users)
    .values({
      unionId: `local:${data.email}`,
      name: data.name,
      email: data.email,
      role: data.role,
      passwordHash: data.passwordHash,
      lastSignInAt: new Date(),
    });
  return findUserByEmail(data.email);
}

export async function listUsers() {
  return getDb().select().from(schema.users);
}

export async function setUserRole(id: number, role: "user" | "admin") {
  await getDb()
    .update(schema.users)
    .set({ role })
    .where(eq(schema.users.id, id));
}
