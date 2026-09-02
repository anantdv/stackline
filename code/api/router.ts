import { createRouter, publicQuery } from "./middleware";
import { wmsRouter } from "./routers/wms";
import { erpnextRouter } from "./routers/erpnext";
import { networkRouter } from "./routers/network";
import { valuationRouter } from "./routers/valuation";
import { complianceRouter } from "./routers/compliance";
import { portalRouter } from "./routers/portal";
import { gateRouter } from "./routers/gate";
import { scanningRouter } from "./routers/scanning";
import { transportRouter } from "./routers/transport";
import { fleetRouter } from "./routers/fleet";
import { authRouter } from "./auth-router";
import { usersRouter } from "./routers/users";
import { twinRouter } from "./routers/twin";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  users: usersRouter,

  wms: wmsRouter,
  erpnext: erpnextRouter,
  network: networkRouter,
  valuation: valuationRouter,
  compliance: complianceRouter,
  portal: portalRouter,
  gate: gateRouter,
  scanning: scanningRouter,
  transport: transportRouter,
  fleet: fleetRouter,
  twin: twinRouter,
});

export type AppRouter = typeof appRouter;
