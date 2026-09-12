# FretLab

A focused guitar practice app: daily sessions, fretboard drills, key theory, routines, and progress. One key colour system runs across every practice surface.

FretLab is built to **App Template Contract v1**. See [Contract conformance](#contract-conformance) for what that means here and where this project deliberately differs.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, Next.js 16 App Router |
| Backend | Next.js route handlers under `/api/v1` |
| Database | Cloudflare D1 (SQLite) via Drizzle |
| Files | Cloudflare R2 |
| Runtime | Cloudflare Workers, built with vinext + Vite |

The contract names four templates (`tmpl-mern`, `tmpl-fastapi`, `tmpl-mac`, `tmpl-ios`). FretLab matches none of them: it is a Next.js app on Workers. The §5 architecture, §3 wire format, §4 data model, §2 auth contract and §7 copy rules apply unchanged; §8 and the Lab-v2/Traefik parts of §9 do not apply.

## Run locally

```bash
npm install
cp .env.example .env
npm run setup      # applies migrations, then seeds
npm run dev
```

Then open http://localhost:3000 and sign in at `/signin`.

`npm run setup` is the no-manual-steps path §9 asks for. It is the Workers equivalent of `docker compose up -d`.

Sign in with either seeded account:

| Email | Role | Password |
|---|---|---|
| `owner@fretlab.local` | owner | `practice-every-day` |
| `member@fretlab.local` | member | `practice-every-day` |

## Validate

```bash
npm run typecheck        # tsc --noEmit
npm run lint             # includes the §5 boundary rules
npm test                 # build, then the full suite
npm run test:integration  # needs a running server; see below
```

The integration suite exercises auth, a CRUD round trip, an upload and the
error envelope against real D1 and R2. It **skips** when nothing is listening,
so `npm test` stays runnable without a database. To run it:

```bash
npm run setup && npm run dev   # terminal 1
npm run test:integration       # terminal 2
```

## Environment variables

Every variable the app reads, and what happens when it is unset.

| Variable | Required | Default | What it does |
|---|---|---|---|
| `AUTH_MODE` | no | `local` | Selects the §2 auth implementation: `local` (backend-issued session, no external IdP) or `oidc` (Authentik, Authorization Code + PKCE). |
| `AUTH_SECRET` | **yes in production** | a development fallback | Signs session cookies and the HMAC on signed file read URLs. Generate with `openssl rand -hex 32`. Leaving it unset in production makes signed URLs forgeable. |
| `APP_URL` | no | inferred from the request | Absolute origin used to build OIDC redirect URIs and signed file URLs. Set it when running behind a proxy that rewrites the host. |
| `OIDC_ISSUER` | only under `oidc` | — | Authentik issuer URL. Discovery reads `{issuer}/.well-known/openid-configuration`. |
| `OIDC_CLIENT_ID` | only under `oidc` | — | Confidential client id. |
| `OIDC_CLIENT_SECRET` | only under `oidc` | — | Confidential client secret. Never reaches the browser. |

Bindings are configured in `.openai/hosting.json`, not in env vars:

| Field | Value | Purpose |
|---|---|---|
| `d1` | `"DB"` | D1 binding name. Setting it to `null` disables the database and every data route returns a §3 error envelope. |
| `r2` | `"R2"` | R2 binding name. Setting it to `null` disables uploads. |

### Email delivery

There is no mail provider wired up. Password reset and email verification tokens are written to the structured log by `deliver()` in `lib/auth/tokens.ts`:

```json
{"event":"auth_token_issued","purpose":"email_verify","path":"/api/v1/auth/verify/<token>"}
```

Swapping in a real provider means changing that one function. Nothing else in the auth flow moves.

## Architecture: the three levels

§5 is enforced by `eslint-plugin-boundaries`, not by discipline. The contract's directory shape is written for a Vite SPA; on the App Router the same three levels are spelled:

| Level | Lives in | Owns |
|---|---|---|
| **L1** page | `app/_screens/` | Data, URL and page state, page layout, error boundaries |
| **L2** section | `app/_sections/` | A coherent region. Composes L3. Local interaction state only. Never fetches, never reads the router |
| **L3** element | `components/` | Single purpose. Props in, events out. Pure presentation |

`_`-prefixed folders are App Router private folders, so L2 and L3 live under `app/` without becoming routes.

Every view is a real route. `lib/fretlab/routes.ts` is the single place that maps a view to a URL, and each route folder holds a thin binding that resolves URL state and hands the L1 screen the props it takes:

| Route | View | Route | View |
|---|---|---|---|
| `/` | today | `/scales` | scales |
| `/drills` | drills | `/scales/:id` | scale study |
| `/drills/groups` | grouped | `/scales/current` | scale detail |
| `/drills/:id` | drill detail | `/songs` | songs |
| `/train` | train | `/songs/:id` | song detail |
| `/keys` | keys | `/progress` | progress |
| `/keys/current` | key detail | `/routines` | routines |
| `/theory` | theory | `/routines/current` | routine detail |
| `/chords` | chords | `/routines/runner` | runner |
| `/chords/:id` | chord detail | `/routines/summary` | summary |
| `/signin` | account | `/routines/guided` | guided |

Screens never import the router. The frame supplies `go(view, id)` and screens call it, which is why they stay inside the §5 boundary and why the lint can forbid `next/navigation` in L2 and L3.

Dependency direction, enforced:

```
L1  ->  L2  ->  L3
L1  ->  lib/*
L2  ->  L3 and lib/fretlab only
L3  ->  L3 and lib/fretlab only
```

`lib/fretlab/` is the pure domain layer: music theory, the content library, the key palette, audio. It imports nothing but itself, so L2 and L3 may use it without reaching across a boundary.

A violation fails the build, and `tests/boundaries.test.mjs` proves the rule actually fires rather than merely reading as enforcement.

## The renamed `Item`

§4 says: *"`Item` exists to be renamed. It is the seam where a real project starts: rename the entity, keep every wire, and the app still runs."*

FretLab has performed that rename. `Item` is **`PracticeSession`** — one logged practice attempt.

- Table: `practice_sessions`
- Endpoints: `/api/v1/practice-sessions` and `/api/v1/practice-sessions/:id`
- Model: `db/schema.ts`, serializer: `lib/api/serialize.ts`

Every §4 scaffolding field is kept so the wire still matches the other templates (`id`, `owner_id`, `title`, `body`, `status`, `tags[]`, `created_at`, `updated_at`, `deleted_at`), with the domain columns added after them (`drill_id`, `music_key`, `bpm`, `accuracy`, `reps`, `duration_seconds`).

### Renaming it again for a new project

1. Rename the table and its indexes in `db/schema.ts`, plus the exported type.
2. Write a migration in `drizzle/` (see the note on `drizzle-kit` below).
3. Rename `app/api/v1/practice-sessions/` to the new resource name.
4. Rename `practiceSessionToWire` in `lib/api/serialize.ts`.
5. Replace the domain columns. Leave the scaffolding fields alone.

The wire format, pagination, search, sort, soft delete and idempotency all keep working, because none of them know the entity's name.

## Database

Migrations live in `drizzle/` and are applied by `npm run db:migrate` (add `:remote` for deployed D1).

**`drizzle-kit generate` currently hangs in this environment**, producing no output. `drizzle/0000_contract_v1_baseline.sql` was therefore authored by hand to match `db/schema.ts` exactly. If you change the schema and `db:generate` still hangs, write the SQL by hand and keep the two in step. The migration is verified against real SQLite by the test suite setup.

## API

Base path `/api/v1`. JSON only. UTC ISO-8601 timestamps. Field names are snake_case on the wire (§4).

Every failure uses the §3 envelope, with no exceptions:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "Display name must be under 64 characters.",
    "field": "display_name",
    "request_id": "01J8..."
  }
}
```

Collections use `{ "data": [...], "page": { "limit", "offset", "total" } }`.

Every response carries `X-Request-Id`. Every mutating request must carry `Idempotency-Key`; replaying a key returns the original response instead of acting twice. A few naturally idempotent endpoints (`refresh`, `logout`, `read-all`, preference writes) opt out.

### Endpoints

**Identity** (§2 — identical surface under both auth modes)

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/session` | Current user, or 401 |
| POST | `/auth/login` | local: credentials. oidc: returns `authorize_url` |
| GET | `/auth/callback` | oidc only; exchanges the code and sets the session |
| POST | `/auth/refresh` | Rotates, both modes |
| POST | `/auth/logout` | Clears the session; oidc also returns `end_session_url` |
| POST | `/auth/register` | local only; 404 under oidc |
| POST | `/auth/password/reset` | Always the same response, so it cannot enumerate accounts |
| POST | `/auth/password/reset/confirm` | Revokes every session on success |
| POST | `/auth/verify/resend` | |
| GET | `/auth/verify/:token` | |

**Account** — `GET/PATCH/DELETE /me`, `POST/DELETE /me/avatar`
**Resource** — `GET/POST /practice-sessions`, `GET/PATCH/DELETE /practice-sessions/:id`
**Files** — `POST /files`, `GET/DELETE /files/:id`, `GET /files/:id/content`
**Notifications** — `GET /notifications`, `PATCH /notifications/:id`, `POST /notifications/read-all`, `GET/PUT /notifications/preferences`, `GET /notifications/stream` (SSE)
**Health** — `GET /health`

### Auth notes

The backend is the confidential client. Access and refresh tokens stay server side; the browser holds an httpOnly, `SameSite=Lax` session cookie. **No tokens in `localStorage`, ever.**

Passwords use PBKDF2-HMAC-SHA256 at 210,000 iterations through WebCrypto, since Workers has no bcrypt. Session cookies and emailed links are stored only as SHA-256 hashes.

Roles are `owner`, `admin`, `member`, resolved from Authentik groups under oidc and from `users.role` under local. The first account to register locally becomes the owner. Route guards read the resolved role, never the raw claim.

## Contract conformance

Applied in full:

- §1 Identity, Account, Resource, Files, Notifications
- §2 Both auth modes, one contract
- §3 Wire format, error envelope, idempotency, request ids
- §4 Data model, with `Item` renamed to `PracticeSession`
- §5 Three levels, enforced by lint
- §7 Interface copy rules

Deliberately different, and why:

| Contract says | FretLab does | Why |
|---|---|---|
| §6 HeroUI v3 + Bloom DS dark tokens | Keeps its cream "paper" palette and hand-written CSS | The existing visual identity is the product. §6's token discipline (semantic names, no raw hex in components, one breakpoint set) is adopted; the dark palette is not. |
| §5 `src/pages/Dashboard/DashboardPage.tsx` | `app/_screens/`, `app/_sections/`, `components/` | The contract's shape assumes a Vite SPA. The three levels and the dependency direction are unchanged. |
| §9 docker compose, Traefik, `*.platform.local` | `npm run setup`, Cloudflare Workers | Different runtime. The intent, one command to a working app, is preserved. |
| §1 "server push channel (SSE)" | SSE that polls D1 | Workers cannot hold a subscription to D1, so the stream polls and emits only on change. |
| §8 Apple workspace | Not applicable | No Apple targets. |

### Where the data comes from

`Progress` and `DrillHistory` read real practice sessions through `lib/api/client.ts`. Both handle the four states §1 requires, and both show an empty state that names the action that fills it rather than sample numbers.

A completed training module records a session with the accuracy it actually measured (hits against misses), the reps attempted, and the elapsed time. **Nothing else is recorded, on purpose.** The routine runner is a timer, not a scorer, so it has no accuracy to report; inventing one would put fabricated numbers in the user's history. The same reasoning applies to the progress insight tiles: best tempo, most-practised drill and next milestone are all derived from stored columns, where the previous per-string and per-fret breakdowns were invented.

Still outstanding:

- The routine runner does not score a session, so completing a routine records nothing. Giving `Runner` real per-drill scoring is the next piece of work.
- §9's responsive and keyboard-accessibility audit from 375px to 1920px has not been re-run since the refactor.
- §1's avatar upload, account deletion and notification preferences have endpoints and integration tests but no screen yet; `/signin` covers sign up, sign in and sign out only.

## Project layout

```
app/
  layout.tsx            html shell, wraps every route in the frame
  <route>/page.tsx      thin route bindings, one per view
  _screens/             L1: screens, the frame, the navigation hook
  _sections/            L2
  api/v1/               route handlers
components/fretlab/     L3
lib/
  fretlab/              pure domain: theory, library, palette, audio, routes
  http/                 §3 wire format, error envelope, route wrapper
  auth/                 §2 both modes, sessions, crypto
  api/                  client, hooks, serializers, validation, files, progress
db/                     Drizzle schema and client
drizzle/                migrations
scripts/seed.mjs        §9 seed
tests/                  render, contract, boundary, and integration suites
wrangler.jsonc          CLI-only config for D1 migrations and seeding
```

### A note on `wrangler.jsonc`

The Cloudflare Vite plugin merges `wrangler.jsonc` with the inline `config` in `vite.config.ts`. Anything the plugin already supplies must **not** be repeated there: duplicating `compatibility_flags` stops the Workers runtime from starting, and an older `compatibility_date` than the plugin's default breaks dev with `WeakRef is not defined`.
# Fretlab
