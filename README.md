# Quaestor Favillae — Monorepo

A two-service monorepo: a static Vite landing page and a Next.js 14 ticketing backend.

```
lorem-ipsum/
├── site/            Service 1: Vite + nginx (static landing page + CMS)
├── api/             Service 2: Next.js 14 + Prisma + NextAuth (ticketing backend)
├── Dockerfile       Root-level wrapper that builds api/ (Railpack will use this if Root Directory = .)
├── start.sh         Defensive fallback for the Shell buildpack
├── nixpacks.toml    Root-level Nixpacks config (builds api/)
├── railpack.json    Root-level Railpack config (builds api/)
├── README.md
├── RAILWAY_DEPLOY.md   Step-by-step Railway guide (READ THIS if deploying)
└── TICKETING_PLAN.md
```

---

## ⚠️ Railway deployment: READ `RAILWAY_DEPLOY.md` FIRST

Railway's auto-detect reads the **build context root** to find a `package.json`, `Dockerfile`, or `start.sh`. Our monorepo has none of those at the root, so auto-detect fails with `Script start.sh not found`. There are now **three layers of defense** to make this work:

| Layer | File | What it does |
|---|---|---|
| 1 (root) | `Dockerfile` | Multi-stage build that wraps `api/`. Use this if **Root Directory = `.`** |
| 2 (root) | `railpack.json` / `nixpacks.toml` | Explicit Railpack/Nixpacks config that builds `api/`. Use if Railpack supports it |
| 3 (subdir) | `api/Dockerfile`, `api/railpack.json`, `api/nixpacks.toml` | The proper setup when **Root Directory = `api`** (recommended) |

**Recommended: set `Root Directory = api` in the Railway service settings.** This is the cleanest and most reliable path. If that doesn't work for some reason, leave `Root Directory = .` and the root `Dockerfile` will build the API.

**The error you saw** (`Script start.sh not found`, `Railpack could not determine how to build the app`) happens when:
- Root Directory is set to the repo root
- AND the older Railpack version doesn't honor `railpack.json` or `nixpacks.toml` at root
- AND there's no Dockerfile at root (we just added one in commit `67feef5+`)

After pulling the latest commit, the root `Dockerfile` should kick Railpack into Docker mode and build correctly.

---

## Service 1 — Static Site (`site/`)

Vite + Tailwind (via CDN) + custom font. Single-page marketing landing with an in-browser CMS panel that stores data in localStorage.

- Build: `npm run build` → `dist/`
- Serve: nginx from `dist/`
- No backend, no env vars
- Railway Root Directory: `site`

## Service 2 — API + Tickets (`api/`)

Next.js 14 App Router + TypeScript + Prisma + NextAuth.

### Routes

| Path | Auth | Purpose |
|---|---|---|
| `GET /` | public | Service landing |
| `GET /events` | public | List of published events |
| `GET /events/[slug]` | public | Event detail with tier cards |
| `GET /checkout/[tierId]` | public | Buyer form |
| `GET /checkout/[tierId]/pending/[reference]` | public | Payment instructions + auto-polling |
| `GET /order` | public | Reference lookup |
| `GET /order/[reference]` | public | Status page |
| `POST /api/orders` | public | Create order |
| `GET /api/orders/[reference]` | public | Poll order status |
| `POST /api/webhooks/sms-payment` | secret | Inbound payment SMS |
| `/admin/*` | admin | Control deck |

### Local development

```bash
cd api
cp .env.example .env       # fill in DATABASE_URL, secrets
npm install
npx prisma db push
npm run db:seed            # creates the first admin
npm run dev
```

## Reference format

`TKT-{EVENT_SLUG}-{6char}` e.g. `TKT-EVT-A7K2B9`. Collision-safe with up to 6 retries, then a timestamp fallback.

See [TICKETING_PLAN.md](./TICKETING_PLAN.md) for the full plan.
See [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) for Railway troubleshooting.
