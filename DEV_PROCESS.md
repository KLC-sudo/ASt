# Development Process Journal

A living log of the work done on this project, decisions made, and how to continue. Intended as a memory aid for resuming work after time away, and as a record of the build process.

Last updated: Phase 5 in progress (admin CRUD).

---

## Project shape

Two-service monorepo for a ticketed-events product:
- **Service 1 (static):** Vite + nginx single-page marketing site with an in-browser CMS panel. Brand: `Quaestor Favillae`. Payments: Fornax (primary, dial `*XXXX#`), Ventus (alternative, phone number).
- **Service 2 (api):** Next.js 14 + Prisma + Postgres + NextAuth. Public ticketing flow + admin control deck + SMS payment webhook. Currency: UGX.

---

## Deployment status (live)

| Service | Status | Notes |
|---|---|---|
| Static site | **live at album-studies.up.railway.app** | Custom domain, 3D orbit, CMS, Tailwind v4 build |
| API (ticketing) | **live at albumstudies.up.railway.app** | Next.js app with Prisma + Postgres |
| CMS global sync | **live** | CMS Save button: saves locally + publishes to API in one step |
| Postgres | connected to API service | Tables created via `prisma db push` |

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
| 2.9 | Fix static site healthcheck (nginx bind to $PORT) | ✓ | `094a08f` |
| 2.10 | Mobile title fix (justify-between hiding) | ✓ | `6a6241a` |
| 2.11 | Mobile FAB for Get Tickets + Ticketing tab + global CMS sync | ✓ | `3a14810` |
| 2.12 | CORS headers on site-config API routes | ✓ | `6ce2646` |
| 2.13 | Tailwind v4 build (drop CDN) + texture enhancement on orbit | ✓ | `2d8a47d` + `09b8379` |
| 2.14 | CSS cascade layer fix (@layer base/components) + Dockerfile fixes | ✓ | `9324ec0` |
| 2.15 | CMS global sync via /api/content endpoint (single JSON blob) | ✓ | `c03206a` |
| 2.16 | One-click CMS Save (local + global publish in one action) | ✓ | `9699f5c` |
| 3 | SMS webhook with parser, HMAC, idempotency | pending | — |
| 4 | PDF ticket generation + email delivery + WhatsApp deep link | pending | — |
| 5 | Admin CRUD (events, tiers, orders, webhooks, manual verify) | **in progress** | — |
| 6 | Android SMS forwarder setup guide at `/admin/help` | pending | — |
| 7 | Hardening (rate limiting, error emails, Sentry, backups) | pending | — |

See `TICKETING_PLAN.md` for the original detailed design.
See `RAILWAY_DEPLOY.md` for the deployment walkthrough.

---

## Decision log

### 1. Static + separate API, not a full Next.js migration
**Why:** the existing static site works and has a localStorage CMS. Migrating it would be a big rewrite with no functional gain. Two services on the same repo, shared Postgres, link-out for the "Get Tickets" CTA.

### 2. Reference format `TKT-{SLUG}-{6char}`
**Why:** includes the event tag so support staff can identify the event from the reference alone. 6 random uppercase alphanumeric chars (no I/O/0/1 to avoid confusion) gives ~31^6 ≈ 887M combinations — collision-safe with retries.

### 3. WhatsApp via `wa.me` deep links, not Twilio
**Why:** zero ongoing cost, no Meta approval process, customer-initiated. Twilio auto-message deferred.

### 4. Resend for transactional email
**Why:** free tier covers 100/day, sends from your own domain (DKIM-signed), handles bounces/complaints. Self-hosted SMTP rejected for deliverability risk.

### 5. NextAuth Credentials for admin (not Clerk/OAuth)
**Why:** no third-party dependency, password is bcrypt-hashed, JWT session.

### 6. Payment providers abstracted to Fornax / Ventus
**Why:** generic template, real names go in env vars and the `Event` table.

### 7. `prisma migrate deploy` in the start command (not `db push`)
**Why:** `db push` is for development. `migrate deploy` runs the migrations folder in production. We don't have a migrations folder yet — first deploy should `db push` once, then commit a baseline.

### 8. Obfuscation done in a single commit, not gradually
**Why:** GitHub repo is public and the user wanted security-by-default. All brand/provider/country references replaced in one pass.

### 9. Force `DOCKERFILE` builder on Railway for the static site
**Why:** the original `site/railway.json` had a `npx serve dist/ ...` start command. The `serve` package isn't in `site/package.json` and `npx` isn't in the Nixpacks runtime PATH. The site already has a working multi-stage Dockerfile, so we set `builder: DOCKERFILE`.

### 10. Add root-level Dockerfile as defense-in-depth for the monorepo
**Why:** Railpack auto-detection scans the build context root. With no manifest there, it falls back to the Staticfile buildpack and fails. The root `Dockerfile` wraps `api/` so the API service can deploy even if `Root Directory` isn't set.

### 11. nginx binds to `PORT` env var via envsubst
**Why:** Railway assigns each service a `PORT` (default 8080). nginx defaults to port 80, so the healthcheck on `/` timed out. Standard fix: `listen ${PORT}` with envsubst at container start, plus `apk add gettext` for the `envsubst` binary.

### 12. Mobile-first responsive header for the "Get Tickets" CTA
**Why:** the inline header button crams the centered logo on small screens. Replaced with `md:flex` for the inline button and a `md:hidden` floating action button (FAB) at bottom-right for mobile.

### 13. Center logo with `inset-x-0 mx-auto w-fit` instead of `left-1/2 -translate-x-1/2`
**Why:** the `.reveal` class sets `transform: translateY(0)` when visible, which overrides Tailwind's `-translate-x-1/2` (same specificity, later in cascade). The element ended up at `left: 50%` with no x-translate, so it was pushed right. `inset-x-0 mx-auto w-fit` centers without using transform.

### 14. Use Tailwind v4 via @tailwindcss/postcss (not the CDN)
**Why:** the CDN runtime ships ~3 MB of JS that JIT-compiles classes in the browser, blocks the main thread, and prints a "should not be used in production" warning. The v4 PostCSS plugin + `@import "tailwindcss"` in the CSS file is the proper production setup. v4 replaces the JS `tailwind.config = {...}` pattern with CSS `@theme` directives.

### 15. Echo the request Origin in CORS, not `*`
**Why:** allows cookies/credentials to flow if ever needed, and works correctly behind CDNs/proxies that set Origin. We don't currently use credentials, but echoing is safer for future features.

### 16. Make the orbit textures visible (gradient + shadow + groove opacity)
**Why:** the original gradients had only ~5% color difference, vinyl grooves at 5% opacity, no drop shadow. On 95–125 px boxes this rendered as flat color squares. Enhanced to 25% gradient contrast, layered white highlight overlay, per-color vinyl rings at 18% opacity, top-edge inset highlight + drop shadow, truly concentric via `translate(-50%, -50%)`.

---

## Issues encountered and fixes

### Issue 1: Prisma relation validation error
**Symptom:** `The relation field 'orders' on model 'Event' is missing an opposite relation field on the model 'Order'.`
**Fix:** removed direct `Event.orders`; orders accessed through `tier.event`. Admin events page counts via `tiers[]._count.orders`.

### Issue 2: Middleware path resolution
**Symptom:** `Module not found: Can't resolve './auth.config'`
**Fix:** used the `@/server/auth.config` path alias.

### Issue 3: TypeScript reject of `Event.orders` in include
**Fix:** rolled into `tiers: { include: { _count: { select: { orders: true } } } }` and summed in the page.

### Issue 4: Public layout didn't apply to root page
**Fix:** moved all public pages into `src/app/(public)/`. Admin pages stayed at `src/app/admin/`.

### Issue 5: Public layout used `headers()` for active nav state
**Fix:** extracted nav into a client component (`PublicNav.tsx`) using `usePathname()`.

### Issue 6: `site/` was an embedded git repo
**Fix:** removed `site/.git/`, re-added as regular files.

### Issue 7: Root gitignored assets swept into commit by `git add .`
**Fix:** expanded `.gitignore` to ignore `*.pdf`, `*.zip`, `*.jpeg`, `*.png`, `*.gif`, `*.webp`, plus listed specific files and `site2/`.

### Issue 8: Railway build fails with `Script start.sh not found`
**Symptom:** Railpack scans the monorepo root, sees no `package.json`/`Dockerfile`/`start.sh`, falls back to Staticfile buildpack.
**Fix (commits `057050a`, `00682d4`):**
- Root `Dockerfile` (multi-stage wraps `api/`)
- Root `start.sh` (defensive shell with helpful error)
- Root `nixpacks.toml` + `railpack.json` (explicit build of `api/`)
- `api/nixpacks.toml` + `api/railpack.json` (subdir versions)
- `RAILWAY_DEPLOY.md` with three options: Root Directory = `api` / Root Directory = `.` / force Docker builder

### Issue 9: Prisma `libssl.so.1.1: No such file or directory`
**Fix (`00682d4`):** added `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` to `schema.prisma` (Alpine 3.18+ ships OpenSSL 3, not 1.1). `apk add --no-cache openssl` in all Docker stages as defense-in-depth.

### Issue 10: `/repo/api/public: not found` in Docker build
**Fix (`00682d4`):** created `api/public/.gitkeep`. Added `.dockerignore` (root) and `api/.dockerignore`.

### Issue 11: Static site deploy fails with `The executable 'npx' could not be found`
**Fix (`094a08f`):** `site/railway.json` had a leftover `npx serve dist/ ...` start command. Changed `builder` to `DOCKERFILE`. The site's `Dockerfile` (node:18-alpine → nginx:alpine) handles everything.

### Issue 12: Static site healthcheck on `/` fails with "service unavailable"
**Symptom:** build succeeded, image pushed, but healthcheck times out on every retry.
**Fix (`01272c9`):** nginx was listening on port 80 but Railway's healthcheck probes the `PORT` env var (default 8080). Updated `nginx.conf` to `listen ${PORT}`. Added `entrypoint.sh` that runs `envsubst` on the config at container start. Dockerfile: `apk add gettext`, `EXPOSE 8080`, `ENTRYPOINT` instead of `CMD`.

### Issue 13: CORS error: "Cross-Origin Request Blocked" on /api/site-config/publish
**Symptom:** static site (custom domain) trying to PUT to API (different Railway host) — browser blocks the cross-origin request.
**Fix (`6ce2646`):** new `src/lib/cors.ts` helper that echoes `Origin`, declares `GET, PUT, OPTIONS` methods, allows `Content-Type, X-Publish-Key` headers. `OPTIONS` handlers returning 204. CORS headers on every response (success + 4xx/5xx). Constant-time string compare for the publish secret.

### Issue 14: cdn.tailwindcss.com should not be used in production
**Symptom:** console warning + 57ms forced reflow because the CDN script JIT-compiles classes in the browser.
**Fix (`2d8a47d`):** added `'@tailwindcss/postcss': {}` to `site/postcss.config.js` (was already in `package.json` but unused). `@import "tailwindcss"` + `@theme` block in `style.css`. Removed CDN script + inline `tailwind.config` from both HTMLs. `cms.js` now imports `./style.css` at the top so Vite picks it up.

### Issue 15: Orbit boxes render as flat color blocks (no textures)
**Symptom:** local server shows the 4 orbit boxes with no visible gradient/shadow/grooves — looks like flat squares.
**Fix (`09b8379`):** gradients had only 5% contrast, vinyl grooves 5% opacity, no drop shadow. Enhanced to 25% gradient contrast, layered white highlight overlay, per-color vinyl rings at 18% opacity, top-edge inset highlight + drop shadow, vinyl rings centered via `translate(-50%,-50%)` for true concentricity.

---

## Cross-service linking (now live)

### Static site → API
Open the static site's `/cms.html` panel. In the **"Ticketing"** tab (newly added), scroll to the **"Publish to API (Global Sync)"** panel at the bottom:
- **API Base URL** = API service public URL (e.g. `https://a-st-production.up.railway.app`)
- **Publish Key** = value of `CMS_PUBLISH_SECRET` set in the API's Railway Variables
- Click **"Publish to API"** — all CMS fields are saved to the database
- Click **"Fetch Latest from API"** — pulls the team's shared config onto a new device

The static site's `main.js` calls `/api/site-config` on every page load and merges with localStorage. Remote wins for fields it has, localStorage wins for new local edits.

### API → Static site
In the API service's Railway Variables, set `STATIC_SITE_URL` to the static site's URL. Used for the admin "View live site" link.

---

## Working conventions

### Code style
- TypeScript strict mode, no `any` unless unavoidable
- Tailwind utility classes inline; shared component classes in `globals.css` (`@layer components`) for the API, in `style.css` for the static site
- Server components by default; `'use client'` only when needed (forms, polling, nav with active state)
- Prisma singleton in `lib/prisma.ts` to avoid hot-reload connection storms

### Git workflow
- One commit per phase (or logical group within a phase)
- `git add <specific paths>` not `git add .` (root has many untracked assets)
- Commit message format: `Phase N: <summary>` for phase commits, `<type>: <summary>` for fixes
- Avoid numbers in commit messages that look like pathspecs (e.g. "16 modules" gets parsed as a path)

### File layout
```
albumStudies/
├── Dockerfile                  ← wraps api/ (Railpack auto-detects)
├── start.sh                    ← defensive fallback
├── railpack.json
├── nixpacks.toml
├── .dockerignore
├── .gitignore
├── README.md
├── RAILWAY_DEPLOY.md
├── TICKETING_PLAN.md
├── DEV_PROCESS.md              ← this file
│
├── site/                       ← Service 1 (static)
│   ├── index.html              ← Tailwind via build (no CDN), 3D orbit, FAB
│   ├── cms.html                ← CMS panel + global publish panel
│   ├── main.js                 ← CMS hydration + load-time remote fetch
│   ├── cms.js                  ← CMS editor, generic + custom renderers, publish panel
│   ├── style.css               ← @import "tailwindcss" + @theme + orbit CSS
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── Dockerfile              ← multi-stage: node:18-alpine → nginx:alpine
│   ├── nginx.conf
│   ├── entrypoint.sh           ← envsubst to bind nginx to $PORT
│   ├── railway.json            ← builder: DOCKERFILE
│   └── ANALYSIS.md
│
└── api/                        ← Service 2 (Next.js)
    ├── prisma/
    │   ├── schema.prisma       ← binaryTargets include linux-musl-openssl-3.0.x
    │   └── seed.ts
    ├── public/.gitkeep
    ├── src/
    │   ├── app/
    │   │   ├── (public)/       # public routes with shared header/footer
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   │   ├── events/     # list + [slug]
    │   │   │   ├── checkout/   # form + pending/[ref]
    │   │   │   └── order/      # lookup + [ref]
    │   │   ├── admin/
    │   │   │   ├── layout.tsx
    │   │   │   ├── login/
    │   │   │   ├── dashboard/
    │   │   │   ├── events/     # read-only list
    │   │   │   ├── orders/     # read-only list
    │   │   │   ├── webhooks/   # read-only log
    │   │   │   ├── manual-verify/
    │   │   │   └── help/       # Android setup guide (phase 6)
    │   │   ├── api/
    │   │   │   ├── auth/[...nextauth]/
    │   │   │   ├── orders/     # POST + GET [ref]
    │   │   │   ├── site-config/# GET + PUT /publish
    │   │   │   └── webhooks/sms-payment/   # (phase 3)
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
    │   │   ├── whatsapp.ts
    │   │   └── cors.ts         # CORS headers + preflight handler
    │   └── server/
    │       ├── auth.ts
    │       └── auth.config.ts
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
3. **Read `RAILWAY_DEPLOY.md`** if anything deploy-related is broken.
4. **Check `git log --oneline`** to see the commit history.
5. **Run `cd api && npm install && npm run build`** — if this passes, the code is good.
6. **For phase 3 (webhook):** start with `lib/sms-parser.ts`, then `src/app/api/webhooks/sms-payment/route.ts`, then add `lib/rate-limit.ts` for Upstash.
7. **For phase 4 (ticket PDF):** `lib/ticket-generator.ts` (pdf-lib), `lib/email.ts` (Resend), hook into the order `paid` transition.
8. **For phase 5 (admin CRUD):** mostly forms + server actions. Use `revalidatePath('/admin/events')` after mutations.

---

## Known gotchas

- **Prisma on Alpine:** `binaryTargets` must include `linux-musl-openssl-3.0.x`. `apk add openssl` in Dockerfiles as defense-in-depth.
- **`prisma db push` vs `migrate deploy`:** v1 used `db push`. Future deploys need committed migrations.
- **Public layout must be inside `(public)/`:** Next.js route groups only apply to nested pages. New public page at `app/foo/page.tsx` won't get the header/footer — move to `app/(public)/foo/page.tsx`.
- **`force-dynamic` on DB pages:** don't remove or you cache order state in the public CDN.
- **Payment provider names (`Fornax`, `Ventus`) and `priceUGX` field name are placeholders.** Find-replace on real deployment.
- **Static `site/` still uses localStorage CMS** (plus the new global sync via API). Don't try to unify fully in v1.
- **`prisma seed` logs the default password.** Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD`. **Rotate after first login.**
- **`site2/` is a backup/duplicate.** It's gitignored but you may want to delete it from disk.
- **Static `site/railway.json` must use `DOCKERFILE` builder.** Don't use Nixpacks unless `serve` is in `site/package.json`.
- **Static site uses Tailwind via build, not CDN.** v4 PostCSS plugin + `@theme` in CSS. CDN will throw console warnings.
- **Orbit CSS textures are subtle by design at small sizes.** They become visible at 95+ px due to the layered gradients + shadows.
- **Center `position: absolute` elements without using `-translate-x-1/2` if any parent has `.reveal`** — the reveal class overrides transforms.

---

## Env vars

### API service
```
DATABASE_URL                  (auto-set by Railway Postgres plugin)
NEXTAUTH_SECRET               (openssl rand -base64 32)
NEXTAUTH_URL                  (e.g. https://api.your-domain.com)
WEBHOOK_SECRET                (openssl rand -base64 32)
CMS_PUBLISH_SECRET            (openssl rand -base64 32, for static site sync)
RESEND_API_KEY                (re_xxx from resend.com)
EMAIL_FROM                    (e.g. "Quaestor Favillae <noreply@your-domain.com>")
UPSTASH_REDIS_REST_URL        (from upstash.com)
UPSTASH_REDIS_REST_TOKEN      (from upstash.com)
STATIC_SITE_URL               (https://your-domain.com)
FORNAX_MERCHANT_CODE          (the actual merchant code on real deploy)
VENTUS_NUMBER                 (the actual phone on real deploy)
PAYMENT_SUPPORT_PHONE         (the WhatsApp support number)
```

### Static site (site service)
- `Root Directory`: `site`
- `Watch Paths`: `site/**`
- `Builder`: `Dockerfile` (auto-detected from `site/railway.json`)
- No env vars needed (it's pure static)

---

## Tools and services

| Tool | Why |
|---|---|
| Next.js 14 App Router | file-system routing, server components, server actions |
| Prisma 5 | type-safe DB, needs Alpine-compatible binaryTargets |
| NextAuth v5 (beta) | admin auth with Credentials + JWT |
| Resend | transactional email, DKIM signed, free tier |
| Upstash Redis | serverless Redis for rate limiting (free tier) |
| pdf-lib | server-side PDF ticket generation |
| qrcode | QR code payloads for tickets |
| Tailwind v4 (api) | build-time CSS, @theme block |
| Tailwind v4 (site) | build-time CSS via @tailwindcss/postcss plugin |
| Vite 5 (site) | static site bundler |
| nginx (alpine) | static site runtime, binds to $PORT via envsubst |
| bcryptjs | password hashing (no native build issues) |
| zod | request validation |
| Railway | hosting + Postgres plugin |
| GitHub | source control (obfuscated public view) |

---

## Things that tripped us up — a checklist for future me

- ✗ Don't use the Tailwind CDN script in production
- ✗ Don't use Nixpacks for the static site (use Dockerfile)
- ✗ Don't use `prisma db push` in production (use migrate deploy)
- ✗ Don't reference env-var-baked values in static JSON files (e.g. railway.json)
- ✗ Don't forget `force-dynamic` on pages that hit the DB
- ✗ Don't trust `-translate-x-1/2` on elements with `.reveal`
- ✗ Don't bind nginx to port 80 on Railway (use $PORT via envsubst)
- ✗ Don't skip the CORS preflight handler
- ✗ Don't use `*` for CORS if you ever need credentials
- ✗ Don't let git embed an inner `.git` directory inside a tracked folder
- ✓ Do pin the OpenSSL binary target in Prisma schema for Alpine
- ✓ Do create `public/.gitkeep` for Next.js apps even if empty
- ✓ Do make textures pronounced — subtle doesn't read on small elements
- ✓ Do provide a defensive fallback (`start.sh`, `railway.json` at root) for monorepos
