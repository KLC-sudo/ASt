# Lorem Ipsum Studios — Monorepo

A two-service monorepo: a static Vite landing page and a Next.js 14 ticketing backend.

```
lorem-ipsum/
├── site/            Service 1: Vite + nginx (static landing page + CMS)
├── api/             Service 2: Next.js 14 + Prisma + NextAuth (ticketing backend)
├── README.md
└── TICKETING_PLAN.md
```

## Deploying to Railway (monorepo)

This repo has two services in subdirectories. **Railway's auto-detect can't tell which to build from the monorepo root**, so you must set the **Root Directory** on each service:

1. **Create the project** in Railway and add a **Postgres** plugin (this is Service 2's database).
2. **Add the static service:**
   - New → GitHub Repo → select this repo
   - Open the service **Settings** tab → **Build** section
   - Set **Root Directory** to `site`
   - Set **Watch Paths** to `site/**` (so it only rebuilds on site changes)
   - Railway detects Vite, builds, and serves the static output
3. **Add the API service:**
   - New → GitHub Repo → same repo
   - **Root Directory** → `api`
   - **Watch Paths** → `api/**`
   - Railway auto-detects Node + reads `api/Dockerfile`
4. **Set environment variables** on the API service (see `api/.env.example`).
5. **Run migrations + seed the first admin:**
   ```bash
   railway run --service api npx prisma db push
   railway run --service api npm run db:seed
   ```
6. **Add custom domains** in the Settings → Networking tab (optional).

> If the build still fails, confirm the **Root Directory** is set and that the Dockerfile is being read. Switch the builder to **Dockerfile** explicitly if Railpack's auto-detect is misfiring.

## Service 1 — Static Site (`site/`)

Vite + Tailwind (via CDN) + Aicon font. Single-page marketing landing with an in-browser CMS panel that stores data in localStorage.

- Build: `npm run build` → `dist/`
- Serve: nginx from `dist/`
- No backend, no env vars

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
