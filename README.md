# Stackline WMS·3D — Project Bundle (V14)

This ZIP contains the complete Visual Warehouse OS project.

## Contents

```
stackline-wms-3d/
├── preview/     The built application — exactly what runs in production
│   ├── boot.js      compiled server (Hono + tRPC API)
│   └── public/      compiled frontend (React SPA + assets)
├── code/        Full source code (TypeScript)
│   ├── src/         React frontend (pages, components, 3D engine)
│   ├── api/         Hono + tRPC 11 backend, auth, routers
│   ├── db/          Drizzle schema, migrations, seed scripts
│   ├── contracts/   Shared tRPC contracts
│   └── .env.example Environment template (copy to .env)
└── database/    schema.sql + seeding notes
```

## Run the preview locally

```bash
cd preview
cp ../code/.env.example .env   # fill in DATABASE_URL etc.
NODE_ENV=production node boot.js
```

The server self-bootstraps: it creates the schema, provisions admin
accounts and seeds the demonstration dataset on first boot.

## Develop from source

```bash
cd code
npm install
cp .env.example .env           # fill in values
npm run dev                    # frontend + API in dev mode
npm run build                  # produces dist/ (same as preview/)
```

## Accounts

Three admin test accounts are provisioned on first boot:
shubhangamsarkar@gmail.com · biswajit@anantdv.com · shantanu@anantdv.com
(password as shared separately).

## Documentation

- Project outline: Warehouse_Projects/Visual_3D_Warehouse_Management/docs/Project_Outline.docx
- Walkthrough deck: .../presentation/stackline-wms-3d.pptd
- Twin Studio design: Warehouse_Projects/Twin_Studio_Design/design/Twin_Studio_Design.docx
