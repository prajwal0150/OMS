# HEAVENLY PATH SUNSARI DISTRICT — Organization Management Platform

A production-ready management platform for the HEAVENLY PATH SUNSARI DISTRICT
organization: a public information website, an authenticated administration
console (organization → district → unit → community → committee), a member
portal, granular role/permission administration, reporting with PDF/Excel/CSV
exports and a full audit trail.

There is **no public registration anywhere**. The Super Admin provisions
administrator accounts; administrators provision member accounts.

## Stack

| Layer | Technology |
| --- | --- |
| API | Node.js, Express 4, TypeScript (strict), Mongoose 8 / MongoDB |
| Web | React 19, TypeScript, Redux Toolkit, React Router 7, Tailwind CSS 4, Recharts |
| Auth | JWT access tokens + rotating refresh tokens (httpOnly cookie + body), bcrypt, per-account lockout |
| Validation | Zod schemas on every body/query/param + Mongoose schema validation |
| Documents | PDFKit (branded reports), ExcelJS (xlsx), CSV |
| Storage | Pluggable provider: local disk (default), Cloudinary/S3 adapters |
| Tests | Vitest + Supertest integration suites against a disposable `*_test` database |

## Modules

* **Organization & scope** — organization profile/branding, districts, units, communities, committees.
* **Members** — member records, auto member IDs (`HPS-SUN-00001`), member accounts, member portal.
* **Programmes** — events, attendance (bulk marking, summaries, trends).
* **Publishing** — content with a `DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED` workflow, announcements, media library, documents.
* **Administration** — administrators, roles (8 built-in), permission catalog (67 permissions), member/user accounts, settings, audit logs, notifications, global search, public contact messages.
* **Reporting** — member/unit/community/committee/event/attendance/content/announcement/activity reports, dashboards, trend analytics, export history.

## Repository layout

```
OMS/
├─ backend/                     Express + Mongoose API
│  ├─ src/
│  │  ├─ config/                env validation, database connection
│  │  ├─ constants/             enums, permissions, roles, role→permission matrix
│  │  ├─ middleware/            authenticate, authorize, validate, rate limit, upload, errors
│  │  ├─ modules/<domain>/      model · repository · service · controller · routes · validation
│  │  ├─ routes/index.ts        mounts every module under /api
│  │  ├─ services/storage/      StorageProvider abstraction (local/cloudinary/s3)
│  │  ├─ shared/                BaseRepository, ScopedCrudService, crudController/Routes, scope, queryFilters
│  │  └─ utils/                 ApiError, responders, pagination, tokens, passwords, exporters, pdf
│  ├─ scripts/                  seed.ts (idempotent seeding) · smoke.ts (API surface check)
│  └─ tests/                    setup · helpers · auth · authorization · reports · administrators
└─ frontend/                    React administration console + public site + member portal
   └─ src/
      ├─ fetaures/**           Public, Auth, Members (portal), Admin modules (Redux slices/thunks/services/pages)
      ├─ services/api/         apiClient (axios + refresh + error normalisation), httpClient (downloads)
      ├─ routes/AppRoutes.tsx  route table with role/permission guards
      ├─ store/                Redux store, typed hooks
      ├─ components/           shared UI kit
      └─ types/                API envelope, models, enum mirrors
```

## Getting started

Prerequisites: Node.js ≥ 20, npm ≥ 10 and MongoDB (local service, Docker or Atlas).

```bash
# 1. install both applications
npm run setup                 # == npm --prefix backend install && npm --prefix frontend install

# 2. configure the API environment
cp backend/.env.example backend/.env   # then edit the secrets below
#    MONGODB_URI=mongodb://localhost:27017/hps_OMS
#    JWT_ACCESS_SECRET / JWT_REFRESH_SECRET      (long random strings)
#    SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD    (first sign in)
#    SEED_DEMO_DATA=true                         (demo district/units/members)

# 3. create permissions, roles, organization, super admin and demo data
npm run seed

# 4. run the API (terminal 1) and the web client (terminal 2)
npm run dev:api               # http://localhost:5000  (GET /health)
npm run dev:web               # http://localhost:5173  (proxies /api and /uploads)
```

### Seeded credentials (from `backend/.env`)

| Role | Email | Password |
| --- | --- | --- |
| Super Administrator | `SUPER_ADMIN_EMAIL` (`superadmin@heavenlypath.org`) | `SUPER_ADMIN_PASSWORD` (`ChangeMe@2026`) |

Demo administrators created when `SEED_DEMO_DATA=true` (district/unit admins and
a member portal account) are printed by `npm run seed` — **change every password
before deploying**.

## Scripts

| Command | Description |
| --- | --- |
| `npm run setup` | Install dependencies for the API and the web client |
| `npm run dev:api` / `npm run dev:web` | Development servers (tsx watch / Vite) |
| `npm run build` | Type-check and build both applications (`backend/dist`, `frontend/dist`) |
| `npm run start` | Serve the compiled API (`node dist/server.js`) |
| `npm run seed` | Idempotent database seeding |
| `npm test` | Vitest integration suites (39 tests) against `MONGODB_TEST_URI` |
| `npm run smoke` | Calls every endpoint the web client uses against a running API |
| `npm run typecheck` | `tsc --noEmit` for both applications |
| `npm run lint` | oxlint on the web client |
| `dev:api` extras | `npm --prefix backend run typecheck:tests` type-checks tests + scripts |

## Architecture

### Layered request flow

```
Route (guards: authenticate → requirePermission → validate)
  → Controller (asyncHandler, thin: parses request, shapes response)
    → Service (business rules, scope checks, workflow transitions)
      → Repository (BaseRepository: search, sort, pagination, scope filter)
        → Mongoose model / MongoDB
```

* `shared/ScopedCrudService` + `makeCrudController` + `createCrudRouter` give every
  organizational module the same REST surface with the least possible code.
* `shared/scope.ts` is the single source of truth for organizational scope:

| Role | Scope | What it may see |
| --- | --- | --- |
| `SUPER_ADMIN` | organization | everything |
| `DISTRICT_ADMIN`, `DISTRICT_COMMITTEE_MEMBER` | district | one district |
| `UNIT_ADMIN`, `UNIT_COMMITTEE_MEMBER` | unit | one unit |
| `COMMUNITY_COORDINATOR` | community | one community |
| `COMMITTEE_MEMBER` | committee | its committee |
| `MEMBER` | self | only its own profile |

Scope is enforced **in the database filter** (`buildScopeFilter` applied inside
`BaseRepository`) and again on writes (`assertWithinScope` in
`ScopedCrudService.create/update` and in the member service), so a record can
neither be read, created nor moved outside the caller's scope.

### Authorization

Permissions (e.g. `member.view`, `report.export`) are granted per role in the
`ROLE_PERMISSIONS` matrix, seeded into the `roles` collection and editable
afterwards through `PATCH /api/administrators/roles/:id/permissions`.
`portal.access` is a break-glass permission that can never be removed.
`requirePermission` / `requireAnyPermission` run on every protected route.

### Content workflow

`DRAFT → PENDING_REVIEW → APPROVED → PUBLISHED`, plus `SCHEDULE`, `ARCHIVE`
and `UNPUBLISH`, are enforced in `contentPublishing.service.ts` — invalid
transitions are rejected by the API, not just by the UI.

### Reports

`report.service.ts` builds a normalised payload (summary + tables) that is
rendered by `report.export.service.ts` into branded **PDF**, **Excel** or
**CSV**. Each export writes a history record (`report_records`) scoped to the
generator, deletable afterwards.

## API surface

Base URL `/api` (see `backend/src/routes/index.ts`): `auth`, `organization`,
`districts`, `units`, `communities`, `committees`, `members`, `events`,
`attendance`, `content`, `announcements`, `media`, `documents`, `notifications`,
`reports`, `audit-logs`, `administrators`, `roles`, `permissions`, `users`,
`settings`, `search`, `contact-messages`, plus public read-only views under
each module's `/public` routes and `/health` on the server root.

Envelope: `{ success, message, data, meta? }`; errors
`{ success: false, message, errors: [{ field?, message, code? }] }`.

## Testing

```bash
npm test          # 39 integration tests, 4 suites
```

* `tests/setup.ts` pins `MONGODB_URI` to `MONGODB_TEST_URI` before any module
  is imported, refuses to run against a database not ending in `_test`, and
  drops the database before/after each run.
* `auth.test.ts` — login, refresh rotation, lockout, password reset, and the
  absence of any registration endpoint.
* `authorization.test.ts` — district/unit scoping, cross-scope read and write
  rejection, member self-service immutability.
* `reports.test.ts` — dashboard analytics, previews, CSV/Excel/PDF binaries,
  export history scoping and deletion.
* `administrators.test.ts` — administrator creation, scope requirements,
  status/password flows, role permission guard rails.

```bash
npm run smoke     # requires a running API; 57 endpoint contract checks
```

## Production build

```bash
npm run build     # backend/dist + frontend/dist
npm run seed      # once
npm start         # API on PORT (default 5000)
npx --prefix frontend serve frontend/dist   # or host it behind any static server
```

Set `NODE_ENV=production`, strong JWT secrets, a real `MONGODB_URI`,
`CLIENT_URL` for CORS, and switch `STORAGE_PROVIDER` for cloud storage. Rate
limits tighten automatically in production (20 credential attempts / 15 min).
Uploaded files are served from `/uploads` by the API.

### Environment variables

See `backend/.env.example` for the complete list: `PORT`, `API_PREFIX`,
`MONGODB_URI`, `MONGODB_TEST_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
`JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`,
`CLIENT_URL`, `SUPER_ADMIN_*`, `SEED_DEMO_DATA`, `STORAGE_PROVIDER`,
`UPLOAD_DIR`, `MAX_*_SIZE_MB`. The web client accepts an optional
`VITE_API_BASE_URL` (defaults to the relative `/api`, which Vite proxies in
development).

`CLIENT_URL` accepts a **comma separated** list, e.g.
`https://oms.netlify.app,https://deploy-preview--12--oms.netlify.app`, so preview
deploys can be allowed alongside the production site. Origins are split and
trimmed before reaching CORS - do not reintroduce the raw string, because the
browser would then match no origin and silently block every request.

### Deploying to Netlify + Render

Two manifests at the repo root cover the whole setup.

**Backend (Render).** `render.yaml` is a Blueprint: create the service with
*New > Blueprint* pointing at the repository. It builds from `backend/`, runs
`npm start`, and health-checks `/health`. Render prompts for the secrets
(`MONGODB_URI`, `CLIENT_URL`, `SUPER_ADMIN_*`); `JWT_*_SECRET` are generated.
Never commit real credentials.

**Frontend (Netlify).** `netlify.toml` builds from `frontend/` and publishes
`dist`. The catch-all `/*` -> `/index.html` redirect is what keeps deep links
such as `/admin/members` working on a hard refresh.

Deploy in this order, because each step needs the previous one's URL:

1. Deploy the API, and note its URL, e.g. `https://hps-oms-api.onrender.com`.
2. Set `CLIENT_URL` on the Render service to the Netlify origin, plus the
   preview origin pattern if you use branch deploys.
3. Set `VITE_API_BASE_URL` in Netlify to `https://hps-oms-api.onrender.com/api`
   and deploy the frontend.

That variable is required in production, not optional. The API returns upload
paths like `/uploads/foo.jpg`; on a different origin those resolve against
Netlify and 404. `resolveAssetUrl()` rewrites them onto the API origin, which is
why every gallery, cover image, member photo and `<video src>` must pass through
it. Local development needs no value because Vite proxies `/api` and `/uploads`.

Verify the manifests before deploying:

```bash
node tools/verify-deploy-config.mjs   # 7 checks; exits non-zero on failure
```

**Uploads are ephemeral without a disk.** `STORAGE_PROVIDER=local` writes to the
service filesystem, which Render wipes on every deploy and restart, leaving dead
image paths in the database. Attach a Render Disk mounted at the upload
directory (see the commented block in `render.yaml`) or switch to
`STORAGE_PROVIDER=cloudinary`/`s3` before uploading real content.

After the first deploy, seed once against the production database:
`npm run seed` (creates the initial Super Admin only when none exists) and
`npm run sync:roles` (the role matrix is version-controlled, so an existing
database keeps the previous grants).

## Troubleshooting

* **Dashboard shows 0 records** — run `npm run seed`; the API reads
  `MONGODB_URI`, the seeder reads the same file.
* **401 immediately after login** — the JWT secrets in `backend/.env` changed
  between processes; restart the API.
* **Tests fail to connect** — start MongoDB and verify `MONGODB_TEST_URI`
  (default `mongodb://127.0.0.1:27017/hps_oms_test`). The suite intentionally
  refuses to run against a non-`_test` database.
* **Port already in use** — stop the previous `node dist/server.js` (5000) or
  Vite (5173) before restarting.


