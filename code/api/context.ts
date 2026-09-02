import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { authenticateRequest } from "./kimi/auth";
import { bootstrapDatabase } from "./lib/bootstrap";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };
  // Memoized — instant after first boot. Time-boxed: if the DB is briefly
  // unreachable, requests proceed (and surface their own query errors)
  // instead of hanging the whole site.
  await Promise.race([
    bootstrapDatabase(),
    new Promise<void>((resolve) => setTimeout(resolve, 8000)),
  ]);
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
