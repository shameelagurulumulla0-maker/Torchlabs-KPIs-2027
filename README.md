# Torchlabs KPIs-2027

Torchlabs performance workspace with a black-and-orange interface, departmental dashboards, organizational goals, supervisory scorecards and individual employee KPI tracking.

## Framework

- Six organizational goals and 40 organizational measures.
- 31 departmental / functional goals across 10 functional areas.
- 13 designation frameworks applied to 15 employee scorecards.
- Exact imported functional KPI names and weights, with Common HR measures. Each employee scorecard totals 100%.
- Separate year, quarter and month controls. Period results are entered independently; rates are never summed.
- Targets and actuals start blank. Grouped departmental measurement definitions remain subject to review.

## Roles

| Role | KPI permissions |
| --- | --- |
| Individual Employee | Enter actuals and achievement evidence for their assigned employee scorecard. Cannot change targets or other employees' results. |
| Functional Leader | Review assigned departments; enter departmental actuals and their own linked scorecard actuals. Cannot change targets. |
| CEO | Configure KPI targets at all performance layers and organizational actuals; review all performance layers. |
| General Admin | Manage all KPI configuration, results, employee profiles and application role assignments. |

Role checks and data filtering are enforced by the server. Application role assignment does not grant access to the private hosted site; site invitations are separate.

The existing owner-private deployment initializes its first authorized visitor as General Admin during framework migration. Keep that deployment private during initialization. A separate deployment must use an equivalent protected bootstrap process before admitting other users.

## Evidence and guidance

Each result supports an achievement description, up to 10 supporting links and up to 20 evidence files for that KPI period. Supported files include PDF, common images, spreadsheets, Word documents and text, up to 10 MB each. Authenticated downloads enforce the KPI's read permissions and use attachment delivery.

Every performance page has a contextual guide. Each KPI has a Guide button explaining its measurement, unit, role responsibilities and evidence submission. A full User guide is available in navigation.

Actions have owners, due dates and statuses. Saved changes and evidence submissions appear in the activity history. CSV result export and JSON data export cover the current user's permitted records. Evidence files are downloaded separately.

## Stack and source

React 19, TypeScript, Vinext/Vite, Cloudflare Workers, Cloudflare D1, Cloudflare R2 and Drizzle ORM.

- `app/workspace.tsx`: current dashboard and entry workflows
- `app/model.ts`, `frameworks.ts`, `framework-data.json`: framework and evaluation definitions
- `app/permissions.ts`: application role authorization and visibility
- `app/api/workspace/route.ts`: persisted data updates and role management
- `app/api/evidence/route.ts`: protected evidence uploads/downloads
- `app/api/state/route.ts`: compatibility alias for the secured workspace API
- `app/guides.ts`: page instructions
- `db/schema.ts`, `drizzle/`: database schema and migration
- `worker/index.ts`: production entry point
- `.openai/hosting.json`: current Sites identity and DB / BUCKET bindings

## Local development

Requires Node.js 22.13+ and pnpm 11.25.

```sh
pnpm install
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_shiny_trauma.sql
pnpm dev
```

The portable preview provides local test sign-in; it is excluded from production. Hosted sign-in and site audience are managed by the Sites platform. D1 and R2 are separate local resources during preview. Publishing applies the database migration and provisions the declared hosted bindings.

## Deployment and privacy

The retained Sites identity belongs to the existing private dashboard. A separate instance needs its own project identity, database, object storage and authentication/access boundary. Publishing this repository does not make the dashboard or saved records public. No automatic GitHub deployment workflow is configured.

Credentials, entered actuals, memberships, local databases, uploaded evidence, runtime state, dependencies and generated builds are excluded from this repository.


## Employee achievement and early warnings

Each KPI shows a brief description, linked organizational business goals and expected outcome alongside the original measurement definition. My performance provides quarterly and monthly achievement history, period targets and read-only L1–L5 intervals. General Admin and CEO alone configure targets and level intervals; all unapproved thresholds remain blank. Lower interval limits are inclusive and upper limits exclusive. Overall levels require complete scorecard results.

Employees can raise an At risk or Unlikely to achieve warning, optional forecast and help request. It routes to the assigned immediate manager, then the functional leader, then General Admin. Managers acknowledge or resolve warnings in-app; open dashboards refresh every 15 seconds. No email notifications are sent.

Contribution graphs aggregate weighted employee achievement with coverage shown explicitly. Sales recognized revenue is entered once per employee and period, separately from company revenue actuals; support achievement is represented as quality contribution. Goal-linked indexes are non-additive and do not replace organizational actuals.
