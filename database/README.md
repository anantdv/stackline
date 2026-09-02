# Database

## schema.sql
Full DDL for all 14 core tables (bins, compliance_docs, customers, docks,
erpnext_configs, gate_passes, invoices, items, load_plans, locations,
movements, placements, racks, routes, scan_records, users, vehicles,
warehouses) plus foreign keys and indexes. Idempotent — safe to apply to an
empty MySQL/TiDB database.

## Seeding
You do not need a separate seed file. On first boot the server
(`NODE_ENV=production node dist/boot.js`) automatically:
1. Applies schema.sql (the same statements embedded in db/migration-sql.ts)
2. Provisions the admin accounts
3. Seeds the demonstration dataset (warehouses, racks, bins, items, stock)

To re-seed manually, use `db/seed-cli.ts` from the `code/` tree:
`npx tsx db/seed-cli.ts`

## Connection
The server reads its database connection from environment variables — see
`.env.example` in the project root of the `code/` tree. Never commit real
credentials.
