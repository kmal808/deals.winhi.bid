# deals.winhi.bid

### A web app for specialty contractors to build estimates and contracts.

### Technology Stack

- **TanStack Start** - Full-stack React meta-framework
- **TanStack Router/Query** - Type-safe routing and data fetching
- **PostgreSQL + Drizzle ORM** - Database with type-safe queries
- **Tailwind CSS + shadcn/ui** - Styling and components
- **Zustand** - State management for configurator wizard

### Project Structure

```
app/
├── src/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout
│   │   ├── index.tsx               # Redirects to /login or /customers
│   │   ├── login.tsx               # Login page
│   │   └── _protected/             # Auth-required routes
│   │       ├── customers.tsx       # Customer list with TanStack Table
│   │       ├── customers/
│   │       │   ├── new.tsx         # New customer form
│   │       │   └── $customerId.tsx # Customer detail/edit
│   │       ├── configurator/       # Window configurator wizard
│   │       │   └── $customerId.tsx # Wizard entry point
│   │       └── admin/              # Admin config pages
│   │           ├── index.tsx       # Admin dashboard
│   │           ├── brands.tsx      # Brands management
│   │           ├── frame-types.tsx
│   │           ├── frame-colors.tsx
│   │           ├── glass-types.tsx
│   │           ├── grid-styles.tsx
│   │           ├── grid-sizes.tsx
│   │           ├── product-configs.tsx
│   │           └── disclaimers.tsx
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   └── admin/                  # Admin components
│   │       └── data-table.tsx      # Generic CRUD table
│   ├── server/functions/
│   │   ├── customers.ts            # Customer CRUD
│   │   └── admin.ts                # Admin config CRUD
│   ├── lib/
│   │   ├── auth.ts                 # Session auth
│   │   ├── db.ts                   # Drizzle client
│   │   └── utils.ts                # cn() helper
│   └── db/
│       ├── schema.ts               # Drizzle schema
│       └── seed.ts                 # Seed script
├── drizzle.config.ts
└── .env.example
```

### Implementation Progress

- [x] Phase 1: Foundation (TanStack Start, Tailwind, Drizzle, Auth)
- [x] Phase 2: Customer Management (CRUD, search, TanStack Table)
- [x] Phase 3: Admin Configuration (all config table pages)
- [x] Phase 4: Window Configurator Wizard (Zustand store, 10-step wizard)
- [x] Phase 5: Cart & Window Management (inline edit, price override, reorder)
- [x] Phase 6: PDF Generation (estimate + contract via @react-pdf/renderer)
- [x] Frame designer (Konva) with the drawing on every estimate/contract line item
- [ ] Phase 7: Polish & Deployment

Verified end to end against a live database: login → create customer → configure a
window through the wizard → save cart → line item priced and stored server-side.

**Still open for Phase 7**

Contract readiness:

- Signature capture (`customers.signatureSvg` is read by the contract, nothing
  writes it). Not urgent: reps currently open the PDF in PDF Expert, sign on
  screen with a finger or stylus, flatten it, and email it to the customer and
  the office manager, who re-keys it into the CRM.

  Worth noting that signing is not the slow part of that. The app could send the
  finished PDF to both addresses itself and remove a manual step without
  capturing a signature at all — probably the higher-value half, and much less
  work.

Catalogue and drawing:

- `product_configs` still carries the eleven invented seed rows, deactivated
  rather than deleted, alongside the 62 imported from the PHP database
- The designer splits panels evenly; uneven ratios are supported by the data
  model (`SplitSection.ratios`) but not exposed in the UI
- Dimension lines per panel, which both the reference Konva demo and the
  OpenJanela quote print and an installer would work from
- Handle hardware on the opening edge of operating panels
- Shapes the geometry cannot draw: trapezoids, geometric and bay units exist in
  the catalogue but the layout assumes a rectangle

Housekeeping:

- Window reorder is implemented server-side (`reorderWindows`) but the table's
  drag handle is not wired to it
- Admin screens still do a full `window.location.reload()` after each mutation
  instead of `router.invalidate()`
- `SESSION_SECRET` is in `.env.example` but nothing reads it; sessions are random
  256-bit ids in the database. Either wire it into cookie signing or drop it

### Frame Designer

The configurator's Design step (`components/configurator/window-designer.tsx`) lets a
rep click a panel, split it horizontally or vertically, and set how each panel
operates — transoms, sidelites and anything the flat operation codes cannot express.

The unit is stored as a recursive section tree in `windows.design` (jsonb), not as an
image. `src/lib/window-design.ts` owns the tree and turns it into flat geometry; two
renderers consume that one layout:

- `components/configurator/window-designer.tsx` — react-konva, on screen
- `components/pdf/window-drawing.tsx` — `@react-pdf` SVG primitives, on the estimate
  and contract line items

Because the PDF draws vector from the same geometry, the printed drawing always
matches what was configured, stays sharp at any size, and needs no stored bitmap.
`design` is nullable: rows created before the designer fall back to
`designFromOperationType(productConfig.operationType)`, so older windows still draw.

Sections store **proportions, not pixels**. Unit dimensions come from the Size step
and can be edited later on the windows table, so a design has to reflow when a unit
goes from 36" to 72" rather than being baked to the size it was drawn at.

An operating panel carries its own sash frame around its glass (`LaidOutLeaf.glass`);
a fixed lite is glazed straight into the frame. That difference is what makes an
elevation readable without reading the labels.

**Operation codes** are read from the outside, left to right: **X moves, O is
stationary**. Canonical set: `XO`, `OX`, `XOX`, `PW` (picture), `CR`/`CL` (casement,
hinged right/left), `AWN` (awning). `PIC`, `AW`, `SH`, `DH` and `HOP` are accepted as
aliases for rows seeded before the vocabulary settled.

> The wizard previously labelled these backwards ("X = fixed"). The giveaway was
> French Door, stored as `XX` — under the inverted reading, a french door whose
> panels are both fixed shut.

### People

Accounts are managed at `/admin/representatives` — create, edit, deactivate, and
set a new password. Admin only.

Two rules are enforced on the server rather than only in the UI. An admin cannot
deactivate or demote their own account, because locking the last administrator
out of the screen that manages administrators has no remedy inside the app. And
deactivating someone, or resetting their password, deletes their sessions
immediately: a reset after a lost phone actually revokes access rather than
waiting for the session to expire.

### Deploying

The image migrates the database on start-up, then serves. A failed migration
fails the deploy rather than serving against a schema it does not match. Set
`SKIP_MIGRATIONS=1` where something else owns migrations, or to get a container
up for diagnosis when a migration is the broken thing.

`GET /health` returns 200 only when the process is up *and* postgres answers,
and 503 otherwise, so a container that booted without a database is treated as a
failed deploy. It reports the build that answered, from `APP_VERSION`:

```bash
docker build --build-arg APP_VERSION=$(git rev-parse --short HEAD) -t winhi .
```

Required at runtime: `DATABASE_URL`. That is all — the image carries no source,
no package manager and no node_modules, and every dependency is bundled.

One replica at a time. Two containers starting together would race on the
migrations table.

**Preview deploys** should get their own throwaway database rather than pointing
at staging, so a migration on a branch cannot alter what the rep is testing. An
empty database is useless without a catalogue, so a preview wants `pnpm db:seed`
after migrating.

### Migrations

There is a generated baseline in `drizzle/`, and `db:migrate` should be used from
here on. `db:push` is convenient but keeps no history, which is exactly what a
staging or production database cannot do without.

A database that was built with `db:push` already has the tables but no migration
history, so `db:migrate` would try to create them again and fail on the first
one. Record the baseline as already applied instead — once, per database:

```bash
pnpm db:baseline --dry-run   # show what would be recorded
pnpm db:baseline             # record it
```

Only do that where the schema already matches the migrations being recorded: it
asserts a claim about the database rather than inspecting it. A fresh, empty
database wants `pnpm db:migrate` and nothing else.

### Branding

`src/lib/brand.ts` holds the palette (sampled from `public/logo.png`), the company
details and the logo path. The estimate and contract share `components/pdf/letterhead.tsx`.

`BRAND.logoSrc` is a URL because these documents are generated in the browser. A
server-side renderer resolves it against the filesystem instead — set `PDF_LOGO_PATH`
to an absolute path there. Setting it to null falls back to a typographic wordmark;
@react-pdf has no error boundary for images, so a broken path fails the whole document.

**Swing indicators.** `SWING_APEX` in `lib/window-design.ts` decides whether the
casement/awning/hopper mark points at the hinge or at the edge that moves. It is one
constant because an awning is a casement rotated a quarter turn, so the two must agree.
Set to `'hinge'`, matching Windows Hawaii practice.

### Security Model

Identity is derived from the session cookie **on the server**, never from the request
body. Server functions attach one of two middlewares from `src/server/middleware/auth.ts`:

- `authMiddleware` — requires a signed-in representative, injects `context.session`
- `adminMiddleware` — additionally requires `role === 'admin'`

Customer-scoped access goes through `assertCustomerAccess` / `assertWindowAccess` in
`src/server/access.ts`: representatives reach only their own customers, admins reach
all. A missing record and a forbidden record return the same error, so a rep cannot
probe for the existence of another rep's customers.

Sessions are rows in the `sessions` table keyed by a 256-bit random cookie value, and
the role is re-read from the representative row on every request — so deactivating or
demoting an account takes effect immediately rather than at next login.

Prices are always recomputed server-side from the factor tables on save. The
configurator's live estimate is a preview only; the cart lives in `localStorage` and
is fully editable by the user, so it is never trusted as the figure of record.

### Database Schema

**Core tables:** `representatives`, `customers`, `windows`, `contractDisclaimers`

**Config tables:** `brands`, `frameColors`, `frameTypes`, `glassTypes`, `gridStyles`, `gridSizes`, `productConfigs`, `disclaimers`

### Pricing Logic

All of this lives in exactly one place — `src/lib/pricing.ts` — and is covered by
`src/lib/pricing.test.ts`. Do not reimplement it in a component; the configurator and
the contract PDF must never be able to disagree about a number.

```zsh
windowPrice = (height + width) × (brandFactor + frameFactor + colorFactor + glassFactor + gridFactor)
subtotal = sum(window prices)
afterDiscount = subtotal × (1 - customerDiscount%)
taxAmount = afterDiscount × 0.04712  // Hawaii GET, Oahu rate
total = afterDiscount + taxAmount
```

Factors are **additive dollars per linear inch**, not multipliers. The brand carries
the base rate (~1.25) and everything else is an adjustment (0.05, 0.15, …). An option
the user has not selected contributes **zero**, matching the column defaults in the
schema. A line item's `manualPrice`, when set, always wins over `calculatedPrice` —
including an explicit `0`, so a comped item stays comped.

### Commands

**Day-to-day development** runs postgres in a container and the dev server on the
host, which gives you Vite's sub-second reload:

```bash
docker compose up -d db     # postgres on localhost:5432
pnpm dev                    # app on localhost:3000
```

The compose project name is pinned to `dealswinhibid`, so the data volume is the
same whichever directory you run from — without that, running compose from a git
worktree silently creates a second, empty database.

The `app` service is the *production* image and sits behind a `full` profile, so
it will not start by default and cannot fight `pnpm dev` for port 3000. It runs
the real built image on your machine, which is a rehearsal for deployment, not a
deployment:

```bash
docker compose --profile full up --build
```

There is deliberately no file-watching dev container. The image contains no source
and serves a built bundle, so syncing source into it restarts the process without
changing what it runs.

```bash
cd app

# Development
pnpm dev                # Start dev server on port 3000
pnpm test               # Run the unit tests

# Database
pnpm db:generate        # Generate migrations from schema
pnpm db:push            # Push schema to database
pnpm db:studio          # Open Drizzle Studio
pnpm db:seed            # Seed initial data

# Build
pnpm build
pnpm preview
```

### Gotchas

**Pin `nitro`, never float it.** `package.json` previously carried
`"nitro": "npm:nitro-nightly@latest"`. The nightly it resolved to dropped the
`content-type` header from every server-function response, so the client transport
rejected all of them with `Invariant failed: expected content-type header to be set` —
an error that names nothing related to the actual cause and makes the app look like it
has an auth or database problem. It is now pinned to an exact nightly. If server
functions start failing inexplicably after a dependency bump, suspect this first.

**`POSTGRES_PASSWORD` only applies when the volume is first created.** Changing
`DB_PASSWORD` in `.env` later does nothing to an existing volume, and connections then
fail with `28P01` from outside Docker while `docker exec psql` still works — because
`pg_hba.conf` trusts `127.0.0.1` but requires `scram-sha-256` for everything else. Fix
with `ALTER ROLE windows_hawaii WITH PASSWORD '…'`, not by recreating the volume.

**Existing password hashes are `$2y$`,** carried over from the PHP app rather than
generated by `src/db/seed.ts` (the seed uses `onConflictDoNothing`, so it never
overwrote them). bcryptjs verifies `$2y$` correctly, so the original passwords work.

### Philosophy

The current iteration is tailored towards window and door replacement companies, but with a few minor tweaks this can be used for plumbers, electricians, roofers, flooring, drywallers, siding installers. This app is meant to fill the space left between an Excell spreadsheet and Houzz, Jobber and other big name estimating softwares. Excell works great until it doesn't, and is quickly outgrown with any amount of success. The Houzz's of the world are either too expensive, too steep of a learning curve for non-technical users, or try to be everything to everyone.
