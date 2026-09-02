import * as cookie from "cookie";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { findUserByEmail } from "./queries/users";
import { verifyPassword } from "./lib/password";
import { ensureTestUsers } from "./lib/bootstrap";
import { signSessionToken } from "./kimi/session";
import { env } from "./lib/env";

/**
 * True when an error is a database connectivity/query failure (Drizzle
 * wraps driver errors as "Failed query: ..."). These must never surface
 * raw SQL to the client — the user sees a retryable, human message.
 */
function isDbFailure(e: unknown): boolean {
  const msg = String((e as any)?.message ?? e);
  return /Failed query|ECONNREFUSED|ETIMEDOUT|ECONNRESET|connect |Connection|Pool/i.test(msg);
}

export const authRouter = createRouter({
  me: authedQuery.query((opts) => opts.ctx.user),
  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  /** Email + password sign-in for provisioned local accounts. */
  loginWithPassword: publicQuery
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.trim().toLowerCase();
      let user;
      try {
        user = await findUserByEmail(email);
      } catch (e) {
        if (isDbFailure(e)) {
          console.error("[auth] DB unreachable during login lookup:", e);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database temporarily unavailable — please retry in a few seconds.",
          });
        }
        throw e;
      }
      if (!user) {
        // self-heal: the boot-time provisioning may not have completed yet —
        // run it now (idempotent, memoized) and retry the lookup once
        try {
          await ensureTestUsers();
          user = await findUserByEmail(email);
        } catch (e) {
          console.error("[auth] on-demand provisioning failed:", e);
          if (isDbFailure(e)) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Database temporarily unavailable — please retry in a few seconds.",
            });
          }
        }
      }
      if (!user || !user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }
      const token = await signSessionToken({
        unionId: user.unionId,
        clientId: env.appId,
      });
      const opts = getSessionCookieOptions(ctx.req.headers);
      ctx.resHeaders.append(
        "set-cookie",
        cookie.serialize(Session.cookieName, token, {
          httpOnly: opts.httpOnly,
          path: opts.path,
          sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
          secure: opts.secure,
          maxAge: Session.maxAgeMs / 1000,
        }),
      );
      return { success: true, name: user.name, role: user.role };
    }),
});
