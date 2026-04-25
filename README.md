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
- [x] Phase 4: Window Configurator Wizard (Zustand store, 9-step wizard)
- [ ] Phase 5: Cart & Window Management
- [ ] Phase 6: PDF Generation
- [ ] Phase 7: Polish & Deployment

### Database Schema

**Core tables:** `representatives`, `customers`, `windows`, `contractDisclaimers`

**Config tables:** `brands`, `frameColors`, `frameTypes`, `glassTypes`, `gridStyles`, `gridSizes`, `productConfigs`, `disclaimers`

### Pricing Logic

```zsh
windowPrice = (height + width) × (brandFactor + frameFactor + colorFactor + glassFactor + gridFactor)
subtotal = sum(window prices)
afterDiscount = subtotal × (1 - customerDiscount%)
taxAmount = afterDiscount × 0.04712  // Hawaii tax
total = afterDiscount + taxAmount
```

### Commands

```bash
cd app

# Development
pnpm dev                # Start dev server on port 3000

# Database
pnpm db:generate        # Generate migrations from schema
pnpm db:push            # Push schema to database
pnpm db:studio          # Open Drizzle Studio
pnpm db:seed            # Seed initial data

# Build
pnpm build
pnpm preview
```

### Philosophy

The current iteration is tailored towards window and door replacement companies, but with a few minor tweaks this can be used for plumbers, electricians, roofers, flooring, drywallers, siding installers. This app is meant to fill the space left between an Excell spreadsheet and Houzz, Jobber and other big name estimating softwares. Excell works great until it doesn't, and is quickly outgrown with any amount of success. The Houzz's of the world are either too expensive, too steep of a learning curve for non-technical users, or try to be everything to everyone.
