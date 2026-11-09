# Torchlabs KPIs-2027

Organizational KPI evaluation and tracking dashboard for Torchlabs.

## Features

- Six organizational goals (G1–G6) and 40 editable organizational measures.
- Separate annual, quarterly and monthly targets and actual results.
- Higher-is-better, lower-is-better and approved-range evaluation.
- Review notes and evidence links.
- Follow-up actions with owners, due dates and completion status.
- Saved update history, CSV result exports and a full JSON backup.
- Cloudflare D1 persistence, sign-in checks and optimistic concurrency protection.

Targets and actual results start blank. Measurement definitions are working interpretations of the agreed organizational framework and should be reviewed before use. No overall weighted score is invented.

## Technology

React 19, TypeScript, Vinext/Vite, Cloudflare Workers, Cloudflare D1 and Drizzle ORM.

## Local development

Requires Node.js 22.13 or later and pnpm 11.25.

```sh
pnpm install
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_shiny_trauma.sql
pnpm dev
```

The portable development server provides a local test sign-in. This simulation is excluded from production. Hosted sign-in and access are managed by the Sites hosting platform.

## Source layout

- `app/dashboard.tsx`: dashboard screens and data-entry flows
- `app/model.ts`: goal definitions, initial measures and evaluation rules
- `app/api/state/route.ts`: authenticated data reads/writes and conflict handling
- `db/schema.ts` and `drizzle/`: database schema and migrations
- `worker/index.ts`: production Worker entry point
- `.openai/hosting.json`: existing Sites deployment identity and D1 binding

The current deployment identity belongs to the existing private dashboard. Deploying a separate instance requires its own hosting configuration and database.

## Privacy and deployment

This repository contains source code and measure definitions only. It excludes credentials, local databases, entered KPI actuals, runtime state, dependencies and build output.

Making this source repository public does not make the deployed dashboard or its saved records public. No GitHub Actions deployment workflow is configured.
