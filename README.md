# Album Studies — Repository

Two-service deployment for the Album Studies brand site.

```
albumStudies/
├── site/           Service 1: static Vite landing page (Railway, nginx)
├── api/            Service 2: Next.js 14 ticketing backend (Railway, standalone)
├── TICKETING_PLAN.md
├── BG.jpeg
├── (why)album studies.pdf
├── brandkit.pdf
└── logo.png, LL2.png
```

## Service 1 — Static Site (`site/`)
- Vite build → static `dist/` → nginx
- Existing marketing landing + in-browser CMS panel
- Deploy: Dockerfile in `site/`

## Service 2 — API + Tickets (`api/`)
- Next.js 14 App Router + TypeScript
- Prisma + Postgres (Railway plugin)
- NextAuth Credentials for admins
- SMS webhook at `POST /api/webhooks/sms-payment`
- Public routes: `/events`, `/events/[slug]`, `/checkout/*`, `/order/[ref]`
- Admin routes: `/admin/*` (login, dashboard, events, orders, webhooks, manual-verify, help)

### Local development
```bash
cd api
cp .env.example .env       # fill in DATABASE_URL, secrets, etc.
npm install
npx prisma db push         # create tables
npm run db:seed            # creates the first admin user
npm run dev
```

### Deploy to Railway
1. Create a new Railway project.
2. Add the **Postgres** plugin (gives you `DATABASE_URL`).
3. Create a new service pointing at `api/`. Railway will use the Dockerfile.
4. Set env vars from `.env.example`.
5. Run `railway run npx prisma db push` to create tables.
6. Run `railway run npm run db:seed` to create the first admin.
7. Set `NEXTAUTH_URL` to your service's public URL.
8. CNAME your domain (`api.your-domain.com`) to the service.

### Phased rollout
See [TICKETING_PLAN.md](./TICKETING_PLAN.md) for the full plan. Phase 1 (scaffold + admin login) is complete; phases 2–7 ship incrementally.
