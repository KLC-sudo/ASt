# Development Process Journal

A living log of the work done on this project, decisions made, and how to continue. Intended as a memory aid for resuming work after time away, and as a record of the build process.

Last updated: commit `38ac71b` (and a follow-up fix on `site/railway.json` in this update).

---

## Project shape

Two-service monorepo for a ticketed-events product:
- **Service 1 (static):** Vite + nginx single-page marketing site with an in-browser CMS panel
- **Service 2 (api):** Next.js 14 + Prisma + Postgres + NextAuth. Public ticketing flow + admin control deck + SMS payment webhook

Brand is obfuscated on the public GitHub repo (`Quaestor Favillae`, providers `Fornax`/`Ventus`). All real names, phone numbers, merchant codes, and domains are placeholders to be replaced on actual deployment via env vars and a final find-replace.

---

## Deployment status (as of latest commit)

| Service | Status | Railway service | Public URL |
|---|---|---|---|
| API (ticketing) | **deployed and working** | `ASt` in `inspiring-adaptation` project | `a-st-production.up.railway.app` |
| Static site (marketing) | **build broken, fix in this commit** | second service in same project, not yet created | TBD |

API shows "Quaestor Favillae — Tickets" landing with "Get Tickets" + "Admin" buttons. Static site is the 3D orbit hero, mission, vision, gallery, values, CMS panel — not yet deployed.

---

## Phased build order

| # | Phase | Status | Commit |
|---|---|---|---|
| 1 | API scaffold (Next.js, Prisma, NextAuth, admin login + dashboard shell) | ✓ | `e2a363e` |
| 2 | Public ticketing flow (events, checkout, polling, order lookup) | ✓ | `103a332` |
| 2.5 | Obfuscate all public content for security | ✓ | `67feef5` |
| 2.6 | Railway monorepo deploy fix (root Dockerfile, etc.) | ✓ | `057050a` |
| 2.7 | Prisma libssl + missing /api/public on Railway | ✓ | `00682d4` |
| 2.8 | "Get Tickets" CTA linking static site to API | ✓ | `38ac71b` |
| 2.9 | Fix static site `railway.json` (npx not found) | ✓ | this commit |
| 3 | SMS webhook with parser, HMAC, idempotency | pending | — |
| 4 | PDF ticket generation + email delivery + WhatsApp deep link | pending | — |
| 5 | Admin CRUD (events, tiers, orders, webhooks, manual verify) | pending | — |
| 6 | Android SMS forwarder setup guide at `/admin/help` | pending | — |
| 7 | Hardening (rate limiting, error emails, Sentry, backups) | pending | — |
| 8 | (optional) Sync static CMS with API `SiteConfig` table | pending | — |

See `TICKETING_PLAN.md` for the detailed design.
See `RAILWAY_DEPLOY.md` for the deployment walkthrough.

---

## Decision log

### 1. Static + separate API, not a full Next.js migration
**Why:** the existing static site works and has a localStorage CMS. Migrating it would be a big rewrite with no functional gain. Two services on the same repo, shared Postgres, link-out for the "Get Tickets" CTA.

### 2. Reference format `TKT-{SLUG}-{6char}`
**Why:** includes the event tag so support staff can identify the event from the reference alone. 6 random uppercase alphanumeric chars (no I/O/0/1 to avoid confusion) gives ~31^6 ≈ 887M combinations — collision-safe with retries. Falls back to a timestamp suffix if all 6 attempts collide.

### 3. WhatsApp via `wa.me` deep links, not Twilio
**Why:** zero ongoing cost, no Meta approval process, customer-initiated. Twilio auto-message deferred to phase 8+ if needed.

### 4. Resend for transactional email
**Why:** free tier covers 100/day, sends from your own domain (DKIM-signed), handles bounces/complaints. Self-hosted SMTP was rejected for deliverability risk — one bad batch lands the customer's ticket email in spam.

### 5. NextAuth Credentials for admin (not Clerk/OAuth)
**Why:** no third-party dependency, password is bcrypt-hashed, JWT session. Single admin team — no need for OAuth complexity.

### 6. Payment providers abstracted to Fornax / Ventus
**Why:** the repo is a generic template. Real provider names go in env vars (`FORNAX_MERCHANT_CODE`, `VENTUS_NUMBER`) and the `Event` table (`fornaxCode`, `ventusNumber`). The actual deployment swaps them.

### 7. `prisma migrate deploy` in the start command (not `db push`)
**Why:** `db push` is for development. `migrate deploy` runs the migrations folder in production. We don't have a migrations folder yet (we used `db push` for v1), so the first deploy should `db push` once, then commit a `prisma migrate dev` baseline so future deploys are reproducible.

### 8. Obfuscation done in a single commit, not gradually
**Why:** the GitHub repo is public and the user wanted security-by-default. All brand/provider/country references replaced in one pass. Find-replace on actual deployment.

### 9. Force `DOCKERFILE` builder on Railway for the static site
**Why:** the original `site/railway.json` had a `npx serve dist/ ...` start command from an earlier Nixpacks-based iteration. The `serve` package isn't in `site/package.json`, so even if `npx` were available, it would fail. The site already has a working multi-stage Dockerfile (node:18-alpine → nginx:alpine), so we set `builder: DOCKERFILE` in `site/railway.json` and let the Dockerfile's `CMD ["nginx", ...]` drive runtime.

### 10. Add root-level Dockerfile as defense-in-depth for the monorepo
**Why:** Railpack auto-detection scans the build context root. With no `package.json` or `Dockerfile` there, it falls back to the Staticfile buildpack and fails. The root `Dockerfile` is a multi-stage build that wraps `api/` — gives the API service a way to deploy even if `Root Directory` isn't set in the Railway UI.

---

## Issues encountered and fixes

### Issue 1: Prisma relation validation error
**Symptom:** `The relation field 'orders' on model 'Event' is missing an opposite relation field on the model 'Order'.`
**Cause:** added a direct `Event.orders Order[]` relation, but orders relate to events via `tier` (which has an `event` back-reference).
**Fix:** removed the direct `Event.orders` field; orders accessed through `tier.event`. Updated admin events page to count orders via `tiers[]._count.orders`.

### Issue 2: Middleware path resolution
**Symptom:** `Module not found: Can't resolve './auth.config'`
**Cause:** `src/middleware.ts` used a relative import but the target is at `src/server/auth.config.ts`.
**Fix:** switched to the `@/server/auth.config` path alias.

### Issue 3: TypeScript reject of `Event.orders` in include
**Symptom:** TypeScript flagged `_count.orders` on `Event` because there's no such relation.
**Fix:** rolled the order count into a `tiers: { include: { _count: { select: { orders: true } } } }` and summed them in the page.

### Issue 4: Public layout didn't apply to root page
**Symptom:** the public header/footer didn't show on `/`, `/events`, etc. even though `(public)/layout.tsx` existed.
**Cause:** Next.js route groups only apply to pages *inside* the group folder. Pages at `app/page.tsx` and `app/events/page.tsx` were at the top level, not inside `app/(public)/`.
**Fix:** moved all public pages into `src/app/(public)/`. Admin pages stayed at `src/app/admin/`.

### Issue 5: Public layout used `headers()` for active nav state
**Symptom:** unreliable path detection via `x-invoke-path` / `x-pathname` headers.
**Fix:** extracted the nav into a client component (`PublicNav.tsx`) using `usePathname()`. Server layout stays server-rendered; only the nav is client.

### Issue 6: `site/` was an embedded git repo
**Symptom:** `git add site/` added a gitlink, not files. GitHub wouldn't have the contents.
**Fix:** removed `site/.git/`, re-added as regular files. Site is now part of the monorepo.

### Issue 7: Root gitignored PDF/JPG/zip assets swept into commit by `git add .`
**Symptom:** first commit included `BG.jpeg`, `logo.png`, two large zips, etc.
**Fix:** expanded `.gitignore` to ignore `*.pdf`, `*.zip`, `*.jpeg`, `*.png` (and listed specific files). Subsequent commits use targeted `git add <paths>` not `git add .`.

### Issue 8: Railway build fails with `Script start.sh not found`
**Symptom:** Railpack scans the monorepo root, sees no `package.json` or `Dockerfile`, and tries the Staticfile buildpack which requires `start.sh`. Fails.
**Fix:**
- `057050a`: added `api/nixpacks.toml` + `api/railpack.json` (defensive — only honored if Root Directory is `api`).
- `057050a`: added root `Dockerfile` (wraps `api/`), root `start.sh`, root `nixpacks.toml` + `railpack.json`. Created `RAILWAY_DEPLOY.md` with three options.
- `00682d4`: hardened the Dockerfiles after the next error (see Issue 9).

**If it still fails:** set the Builder to `Dockerfile` explicitly in Railway service settings, OR delete the service and recreate it after the commit lands.

### Issue 9: Prisma `libssl.so.1.1: No such file or directory` at runtime
**Symptom:** the build succeeds, but every Prisma query fails with:
```
Error loading shared library libssl.so.1.1: No such file or directory
(needed by .../libquery_engine-linux-musl-openssl-3.0.x.so.node)
```
**Cause:** Prisma 5's default engine binary is built against OpenSSL 1.1. Alpine 3.18+ (which `node:20-alpine` is based on) ships with OpenSSL 3. The package `libssl` is not installed.
**Fix (`00682d4`):**
- Added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to `schema.prisma` so `prisma generate` emits the matching `.so.node` binary.
- Added `apk add --no-cache openssl` to all three Docker stages (deps, builder, runner) as defense-in-depth.
- Re-ran `npx prisma generate` locally; verified `libquery_engine-linux-musl-openssl-3.0.x.so.node` is now present in `node_modules/.prisma/client/`.

### Issue 10: `/repo/api/public: not found` in Docker build
**Symptom:** `failed to compute cache key: "/repo/api/public": not found`
**Cause:** the App Router's `public/` folder doesn't exist; Next.js doesn't create it for us. The Dockerfile was trying to COPY it.
**Fix (`00682d4`):**
- Created `api/public/.gitkeep` to materialize the empty directory.
- Also added `.dockerignore` (root) and `api/.dockerignore` to keep build context lean.

### Issue 11: Static site deploy fails with `The executable 'npx' could not be found`
**Symptom:** on the second Railway service (static site), Railpack reports:
```
[err] The executable `npx` could not be found.
```
**Cause:** the existing `site/railway.json` had:
```json
{"build": {"builder": "NIXPACKS"}, "deploy": {"startCommand": "npx serve dist/ -s -l $PORT"}}
```
This was a leftover from an earlier iteration that planned to use `serve` as the static file server. Two problems: (1) `serve` isn't in `site/package.json` dependencies, so `npx serve` would fail to find it; (2) Nixpacks' runtime image doesn't always have `npx` available, especially in slim variants.
**Fix (this commit):**
- Updated `site/railway.json` to use `builder: DOCKERFILE`. The site already has a working multi-stage Dockerfile (`node:18-alpine` → `nginx:alpine`) with `CMD ["nginx", "-g", "daemon off;"]`. The Dockerfile is the source of truth, the `railway.json` is just configuration.

---

## Working conventions

### Code style
- TypeScript strict mode, no `any` unless unavoidable
- Tailwind utility classes inline; shared component classes in `globals.css` (`@layer components`)
- Server components by default; `'use client'` only when needed (forms, polling, nav with active state)
- Prisma singleton in `lib/prisma.ts` to avoid hot-reload connection storms

### Git workflow
- One commit per phase (or logical group within a phase)
- `git add <specific paths>` not `git add .` (root has many untracked assets)
- Commit message format: `Phase N: <summary>` for phase commits, `<type>: <summary>` for fixes

### File layout
```
albumStudies/                   ← repo root
├── Dockerfile                  ← wraps api/ (Railpack auto-detects this)
├── start.sh                    ← defensive fallback (Shell buildpack)
├── railpack.json               ← root-level Railpack config (builds api/)
├── nixpacks.toml               ← root-level Nixpacks config (builds api/)
├── .dockerignore
├── .gitignore
├── README.md
├── RAILWAY_DEPLOY.md
├── TICKETING_PLAN.md
├── DEV_PROCESS.md              ← this file
│
├── site/                       ← Service 1 (static)
│   ├── index.html
│   ├── cms.html
│   ├── main.js
│   ├── cms.js
│   ├── style.css
│   ├── Dockerfile              ← multi-stage: node:18-alpine → nginx:alpine
│   ├── nginx.conf
│   ├── railway.json            ← builder: DOCKERFILE
│   └── vite.config.js
│
└── api/                        ← Service 2 (Next.js)
    ├── prisma/
    │   ├── schema.prisma       ← binaryTargets include linux-musl-openssl-3.0.x
    │   └── seed.ts
    ├── public/.gitkeep         ← empty dir placeholder
    ├── src/
    │   ├── app/
    │   │   ├── (public)/       # public-facing routes
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   │   ├── events/
    │   │   │   ├── checkout/
    │   │   │   └── order/
    │   │   ├── admin/          # admin routes (auth-protected)
    │   │   │   ├── layout.tsx
    │   │   │   ├── login/
    │   │   │   ├── dashboard/
    │   │   │   ├── events/
    │   │   │   ├── orders/
    │   │   │   ├── webhooks/
    │   │   │   ├── manual-verify/
    │   │   │   └── help/
    │   │   ├── api/
    │   │   │   ├── auth/[...nextauth]/
    │   │   │   ├── orders/
    │   │   │   └── webhooks/sms-payment/
    │   │   ├── globals.css
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── public/         # public components
    │   │   └── admin/          # admin components
    │   ├── lib/
    │   │   ├── prisma.ts
    │   │   ├── orders.ts
    │   │   ├── reference.ts
    │   │   ├── format.ts
    │   │   └── whatsapp.ts
    │   └── server/
    │       ├── auth.ts         # NextAuth (Credentials provider)
    │       └── auth.config.ts  # edge-safe auth config for middleware
    ├── nixpacks.toml
    ├── railpack.json
    ├── Dockerfile              ← multi-stage: node:20-alpine → standalone Next.js
    ├── .dockerignore
    └── package.json
```

---

## How to pick this up after time away

1. **Read this file first** to remember where you are.
2. **Read `TICKETING_PLAN.md`** for the design intent and remaining phases.
3. **Check `git log --oneline`** to see the commit history (one commit per phase).
4. **Look at the most recent commit's diff** to see exactly what changed.
5. **Run `cd api && npm install && npm run build`** — if this passes, the code is good.
6. **For phase 3 (webhook):** start with `lib/sms-parser.ts`, then the route handler at `src/app/api/webhooks/sms-payment/route.ts`, then add `lib/rate-limit.ts` for Upstash.
7. **For phase 4 (ticket PDF):** install `pdf-lib` and `qrcode` (already in package.json), write `lib/ticket-generator.ts`, write `lib/email.ts` for Resend, hook both into the order `paid` transition.
8. **For phase 5 (admin CRUD):** mostly forms + server actions. Use `revalidatePath('/admin/events')` after mutations.

---

## Known gotchas (read these before changing code)

- **Prisma Alpine:** the `binaryTargets` array in `schema.prisma` must include `linux-musl-openssl-3.0.x` for Alpine 3.18+. If you bump the Node base image, you may need to regenerate. Always include `apk add --no-cache openssl` in Dockerfiles for safety.

- **`prisma db push` vs `migrate deploy`:** v1 used `db push`. Future deploys need committed migrations. Run `npx prisma migrate dev --name init` once locally to create the baseline, commit the `prisma/migrations/` folder, then change the start command to `prisma migrate deploy`.

- **Public layout must be inside `(public)/`:** Next.js route groups only apply to nested pages. If you add a new public page at `app/foo/page.tsx`, the public header/footer won't apply. Move it to `app/(public)/foo/page.tsx`.

- **Admin pages bypass the public layout** because they have their own `admin/layout.tsx`. Both layouts wrap children in the root layout.

- **`force-dynamic` is set on all pages that hit the DB.** Don't remove it or you'll cache order state in the public CDN and break the polling.

- **Payment provider names (`Fornax`, `Ventus`) and the `priceUGX` field name are placeholder abstractions.** On real deployment, decide whether to rename them globally or leave as-is and treat as "currency code" + "provider label."

- **The static `site/` service still uses Tailwind via CDN and has a localStorage CMS.** Don't try to "unify" it with the API in v1 — that's phase 8.

- **The `prisma seed` script logs the default password to console.** Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` env vars. **Rotate after first login.**

- **The `site2/` directory at the repo root is a backup/duplicate.** It's gitignored but you may want to delete it from disk.

- **Static site `railway.json` must use `DOCKERFILE` builder.** Don't try to use Nixpacks unless `serve` is added to `site/package.json` dependencies. The Dockerfile is the right path.

---

## Env vars to set on Railway (api service)

```
DATABASE_URL                  (auto-set by Railway Postgres plugin)
NEXTAUTH_SECRET               (openssl rand -base64 32)
NEXTAUTH_URL                  (e.g. https://api.your-domain.com)
WEBHOOK_SECRET                (openssl rand -base64 32)
RESEND_API_KEY                (re_xxx from resend.com)
EMAIL_FROM                    (e.g. "Quaestor Favillae <noreply@your-domain.com>")
UPSTASH_REDIS_REST_URL        (from upstash.com)
UPSTASH_REDIS_REST_TOKEN      (from upstash.com)
STATIC_SITE_URL               (https://your-domain.com)
FORNAX_MERCHANT_CODE          (the actual merchant code on real deploy)
VENTUS_NUMBER                 (the actual phone on real deploy)
PAYMENT_SUPPORT_PHONE         (the WhatsApp support number)
```

## Env vars / settings for the static site (site service)

- `Root Directory`: `site`
- `Watch Paths`: `site/**`
- `Builder`: `Dockerfile` (auto-detected from `site/railway.json`)
- No env vars needed (it's pure static)

## Linking the two services

After both services are deployed:

**Static site → API (in the static site's CMS panel):**
1. Open the static site's public URL.
2. Go to `/cms.html`.
3. **Global & Branding** tab → **Header Call-to-Action** group.
4. Set **Header Button URL** to the API's public URL + `/events` (e.g. `https://a-st-production.up.railway.app/events`).
5. Save.

**API → Static site (in Railway Variables on the api service):**
- Set `STATIC_SITE_URL` to the static site's public URL.

---

## Tools and services

| Tool | Why |
|---|---|
| Next.js 14 App Router | file-system routing, server components, server actions |
| Prisma 5 | type-safe DB client, migration tooling. Alpine needs `binaryTargets` |
| NextAuth v5 (beta) | admin auth with Credentials + JWT |
| Resend | transactional email, DKIM signed, free tier |
| Upstash Redis | serverless Redis for rate limiting (free tier) |
| pdf-lib | server-side PDF ticket generation |
| qrcode | QR code payloads for tickets |
| Tailwind 3 (api) / Tailwind CDN (site) | styling, same color palette |
| bcryptjs | password hashing (no native build issues vs bcrypt) |
| zod | request validation |
| Vite 5 (site) | static site bundler |
| nginx (alpine) | static site runtime |
| Railway | hosting + Postgres + Redis plugin |
| GitHub | source control (obfuscated public view) |
