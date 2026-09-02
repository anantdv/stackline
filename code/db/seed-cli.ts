/** Manual seed entry: `npx tsx db/seed-cli.ts` (the server self-seeds on boot). */
import { seedDatabase } from "./seed";

seedDatabase()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
