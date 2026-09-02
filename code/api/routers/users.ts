import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminQuery, createRouter } from "../middleware";
import * as q from "../queries/users";

export const usersRouter = createRouter({
  list: adminQuery.query(() => q.listUsers()),
  setRole: adminQuery
    .input(z.object({ id: z.number().int(), role: z.enum(["user", "admin"]) }))
    .mutation(({ input, ctx }) => {
      if (ctx.user.id === input.id && input.role === "user") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot demote your own account.",
        });
      }
      return q.setUserRole(input.id, input.role);
    }),
});
