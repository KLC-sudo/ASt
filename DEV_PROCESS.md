# Development Process Journal

A living log of the work done on this project, decisions made, and how to continue. Intended as a memory aid for resuming work after time away, and as a record of the build process.

Last updated: Phase 5 complete, Phase 4 next.

---

## Project shape

Two-service monorepo for a ticketed-events product:
- **Service 1 (static):** Vite + nginx single-page marketing site with an in-browser CMS panel. Brand: `Quaestor Favillae`. Payments: Fornax (primary, dial `*XXXX#`), Ventus (alternative, phone number).
- **Service 2 (api):** Next.js 14 + Prisma + Postgres + NextAuth. Public ticketing flow + admin control deck + SMS payment webhook. Currency: UGX.

---

## Deployment status (live)

| Service | Status | URL | Notes |
|---|---|---|---|
| Static site | **live** | album-studies.up.railway.app | 3D orbit, CMS, Tailwind v4 |
| API (ticketing) | **live** | albumstudies.up.railway.app | Next.js + Prisma + Postgres |
| CMS global sync | **live** | — | One-click Save publishes to API |
| Postgres | **connected** | — | Tables via `prisma db push` |

---

## What's working

| Feature | Status | Notes |
|---|---|---|
| Marketing site (3D orbit, CMS) | ✅ | Single-page with Tailwind v4 |
| Public ticketing flow | ✅ | Browse events → checkout → payment instructions → order lookup |
| Admin login + dashboard | ✅ | NextAuth Credentials + JWT |
| Admin event CRUD | ✅ | Create/edit/delete events + ticket tiers |
| Admin order management | ✅ | View orders, mark paid/cancel/refund |
| CMS global sync | ✅ | Save button publishes to API in one step |
| Auto-seed admin user | ✅ | Creates on first boot via `prisma.ts` |
| Docker builds | ✅ | node:20-slim builder, nginx:alpine runner |

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
| 2.17 | Docker build fix: node:20 for @tailwindcss/oxide + entrypoint for prisma db push | ✓ | `279befe`–`f8078d0` |
| 2.18 | Auto-seed admin user on first startup | ✓ | `d65625a` |
| 2.19 | Admin login redirect loop fix (layout.tsx bare render for unauth) | ✓ | `5cbfa83` |
| 3 | SMS webhook with parser, HMAC, idempotency | **pending** | — |
| 4 | PDF ticket generation + email delivery + WhatsApp deep link | **pending** | — |
| 5 | Admin CRUD (events, tiers, orders) | ✓ | `9f7b88d` |
| 5.1 | Event creation error handling + optional field transforms | ✓ | `c7dc438` |
| 6 | Android SMS forwarder setup guide at `/admin/help` | **pending** | — |
| 7 | Hardening (rate limiting, error emails, Sentry, backups) | **pending** | — |

See `TICKETING_PLAN.md` for the original detailed design.
See `RAILWAY_DEPLOY.md` for the deployment walkthrough.

---

## Remaining phases — what to build next

### Phase 4: PDF tickets + email delivery (HIGHEST PRIORITY)
**Why:** customers don't receive tickets after paying. This is the most impactful next step.
**Stack already installed:** `pdf-lib`, `qrcode`, `resend`
**Files to create:**
- `lib/ticket-generator.ts` — generates PDF ticket with event details + QR code
- `lib/email.ts` — sends ticket PDF via Resend
- Hook into order `paid` transition in `lib/orders.ts` or `app/api/orders/route.ts`
**Env vars needed:** `RESEND_API_KEY`, `EMAIL_FROM`

### Phase 3: SMS payment webhook
**Why:** currently payments require manual verification via admin panel.
**Files to create:**
- `lib/sms-parser.ts` — parses SMS text to extract reference + amount
- `app/api/webhooks/sms-payment/route.ts` — receives webhook, matches order, marks paid
- `lib/rate-limit.ts` — Upstash Redis rate limiting
**Env vars needed:** `WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

### Phase 6: Android SMS forwarder setup guide
**Why:** supports Phase 3 — customers need an Android device to forward payment SMS to the webhook.
**File to update:** `app/admin/help/page.tsx` (currently a stub)

### Phase 7: Production hardening
- Rate limiting on public endpoints
- Error alerting (Sentry or similar)
- Database backups
- Monitoring

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

### 7. `prisma db push` in the start command
**Why:** used for initial setup. Future deploys should use `migrate deploy` once migrations are committed.

### 8. Obfuscation done in a single commit, not gradually
**Why:** GitHub repo is public and the user wanted security-by-default. All brand/provider/country references replaced in one pass.

### 9. Force `DOCKERFILE` builder on Railway for the static site
**Why:** Nixpacks runtime doesn't include npx/prisma in PATH. The site already has a working multi-stage Dockerfile.

### 10. Add root-level Dockerfile as defense-in-depth for the monorepo
**Why:** Railpack auto-detection scans the build context root. With no manifest there, it falls back to the Staticfile buildpack and fails.

### 11. nginx binds to `PORT` env var via envsubst
**Why:** Railway assigns each service a `PORT` (default 8080). nginx defaults to port 80, so the healthcheck on `/` timed out.

### 12. Mobile-first responsive header for the "Get Tickets" CTA
**Why:** the inline header button crams the centered logo on small screens. Replaced with `md:flex` for the inline button and a `md:hidden` floating action button (FAB) at bottom-right for mobile.

### 13. Center logo with `inset-x-0 mx-auto w-fit` instead of `left-1/2 -translate-x-1/2`
**Why:** the `.reveal` class sets `transform: translateY(0)` when visible, which overrides Tailwind's `-translate-x-1/2`.

### 14. Use Tailwind v4 via @tailwindcss/postcss (not the CDN)
**Why:** the CDN runtime ships ~3 MB of JS that JIT-compiles classes in the browser, blocks the main thread, and prints a "should not be used in production" warning.

### 15. Echo the request Origin in CORS, not `*`
**Why:** allows cookies/credentials to flow if ever needed, and works correctly behind CDNs/proxies that set Origin.

### 16. Auto-seed admin user in prisma.ts
**Why:** `prisma db seed` requires `npx` at runtime which isn't available in the Docker runner. Auto-seeding on first connection avoids the need for a separate seed step.

### 17. Admin layout renders bare children for unauthenticated users
**Why:** the previous layout called `redirect('/admin/login')` for all unauthenticated users — including those already on `/admin/login`, causing an infinite redirect loop.

### 18. One-click CMS Save (local + global publish)
**Why:** the previous two-button flow (Save locally → Publish to API) was confusing. Merged into a single "Save" button that does both actions.

---

## Issues encountered and fixes

### Issue 1: Prisma relation validation error
**Symptom:** `The relation field 'orders' on model 'Event' is missing an opposite relation field on the model 'Order'.`
**Fix:** removed direct `Event.orders`; orders accessed through `tier.event`.

### Issue 2: Middleware path resolution
**Symptom:** `Module not found: Can't resolve './auth.config'`
**Fix:** used the `@/server/auth.config` path alias.

### Issue 3–7: Various build/deploy fixes
See earlier entries in this file.

### Issue 8: Railway build fails with `Script start.sh not found`
**Fix:** Root `Dockerfile` + `start.sh` + `nixpacks.toml` + `railpack.json`.

### Issue 9: Prisma `libssl.so.1.1: No such file or directory`
**Fix:** `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` in schema.

### Issue 10: `/repo/api/public: not found` in Docker build
**Fix:** created `api/public/.gitkeep`.

### Issue 11: Static site deploy fails with `The executable 'npx' could not be found`
**Fix:** Changed `builder` to `DOCKERFILE` in `site/railway.json`.

### Issue 12: Static site healthcheck on `/` fails
**Fix:** nginx binds to `$PORT` via envsubst.

### Issue 13: CORS error on /api/site-config/publish
**Fix:** `src/lib/cors.ts` helper echoes Origin, handles OPTIONS preflight.

### Issue 14: cdn.tailwindcss.com in production
**Fix:** Switched to `@tailwindcss/postcss` + `@import "tailwindcss"`.

### Issue 15: Orbit boxes render as flat color blocks
**Fix:** Enhanced gradients, shadows, vinyl grooves, concentric centering.

### Issue 16: Tailwind CSS not applying in dev server
**Symptom:** All Tailwind utility classes ignored, custom CSS worked.
**Fix:** Custom CSS was unlayered, beating Tailwind's `@layer utilities` in cascade priority. Wrapped custom CSS in `@layer base` and `@layer components`.

### Issue 17: Docker build fails — `Cannot find native binding`
**Symptom:** `@tailwindcss/postcss` depends on `@tailwindcss/oxide` which requires Node 20+.
**Fix:** Upgraded Dockerfile from `node:18-alpine` to `node:20-slim`.

### Issue 18: CMS global sync doesn't work
**Symptom:** Changes saved in CMS panel don't appear for other visitors.
**Fix:** Two issues — (a) API URL was wrong (pointing to static site instead of API service), (b) localStorage was overriding remote config. Fixed by making remote config authoritative and using correct API URL.

### Issue 19: `prisma db push` fails at runtime — "prisma: not found"
**Symptom:** Nixpacks runner doesn't include npx/prisma in PATH.
**Fix:** Created `entrypoint.sh` to run prisma before server start, or use `node ./node_modules/prisma/build/index.js` directly.

### Issue 20: Admin login redirect loop (DOMException)
**Symptom:** `Too many calls to Location or History APIs` + `DOMException: The operation is insecure`.
**Fix:** Admin layout was calling `redirect('/admin/login')` for unauthenticated users — including when already on the login page. Fixed by rendering bare children when no session.

### Issue 21: Event creation 500 error
**Symptom:** POST to `/admin/events/new` returns 500.
**Fix:** Added try/catch with error logging, NEXT_REDIRECT digest re-throw, empty-string-to-null transforms for optional fields, error display in form.

---

## Cross-service linking (now live)

### Static site → API
The CMS panel (`/cms.html`) has a **Save** button that:
1. Saves to localStorage (local browser)
2. POSTs to `https://albumstudies.up.railway.app/api/content` (global)

Configure in **Ticketing** tab → **Publish Globally** panel:
- **API Base URL:** `https://albumstudies.up.railway.app`
- **Publish Key:** value of `CMS_PUBLISH_SECRET` env var

The static site's `main.js` fetches `/api/content` on every page load (falls back to `cms-config.json`, then localStorage).

### API → Static site
In the API service's Railway Variables, set `STATIC_SITE_URL` to the static site's URL.

---

## Working conventions

### Code style
- TypeScript strict mode, no `any` unless unavoidable
- Tailwind utility classes inline; shared component classes in `globals.css` (`@layer components`) for the API, in `style.css` for the static site
- Server components by default; `'use client'` only when needed (forms, polling, nav with active state)
- Server actions in `admin/actions.ts` with try/catch + error returns
- Prisma singleton in `lib/prisma.ts` (includes auto-seed)

### Git workflow
- One commit per phase (or logical group within a phase)
- `git add <specific paths>` not `git add .` (root has many untracked assets)
- Commit message format: `Phase N: <summary>` for phase commits, `<type>: <summary>` for fixes

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
│   ├── main.js                 ← CMS hydration + /api/content fetch
│   ├── cms.js                  ← CMS editor, one-click save (local + API)
│   ├── style.css               ← @import "tailwindcss" + @theme + @layer base/components
│   ├── postcss.config.js
│   ├── vite.config.js
│   ├── Dockerfile              ← multi-stage: node:20-slim → nginx:alpine
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
    │   │   │   ├── layout.tsx  # bare render for unauth (no redirect loop)
    │   │   │   ├── actions.ts  # server actions: event/tier/order CRUD
    │   │   │   ├── login/
    │   │   │   ├── dashboard/
    │   │   │   ├── events/     # list + new + [id] (CRUD)
    │   │   │   ├── orders/     # list + [reference] (status mgmt)
    │   │   │   ├── webhooks/   # read-only log
    │   │   │   ├── manual-verify/
    │   │   │   └── help/       # Android setup guide (phase 6)
    │   │   ├── api/
    │   │   │   ├── auth/[...nextauth]/
    │   │   │   ├── content/    # GET + POST (CMS global sync)
    │   │   │   ├── orders/     # POST + GET [ref]
    │   │   │   ├── site-config/# GET + PUT /publish
    │   │   │   └── webhooks/sms-payment/   # (phase 3)
    │   │   ├── globals.css
    │   │   └── layout.tsx
    │   ├── components/
    │   │   ├── public/
    │   │   └── admin/
    │   ├── lib/
    │   │   ├── prisma.ts       # singleton + auto-seed admin user
    │   │   ├── orders.ts
    │   │   ├── reference.ts
    │   │   ├── format.ts
    │   │   ├── whatsapp.ts
    │   │   └── cors.ts
    │   └── server/
    │       ├── auth.ts         # trustHost: true
    │       └── auth.config.ts  # trustHost: true
    ├── entrypoint.sh           # runs prisma db push before server
    ├── nixpacks.toml
    ├── railway.json            # builder: DOCKERFILE
    ├── Dockerfile              # node:20-slim, copies prisma binaries
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
6. **Phase 4 (NEXT):** PDF tickets + email. Create `lib/ticket-generator.ts` (pdf-lib + qrcode), `lib/email.ts` (Resend), hook into order paid transition. Test with a real order.
7. **Phase 3:** SMS webhook. Create `lib/sms-parser.ts`, `app/api/webhooks/sms-payment/route.ts`, `lib/rate-limit.ts`.
8. **Phase 6:** Fill in `app/admin/help/page.tsx` with Android SMS forwarder setup guide.
9. **Phase 7:** Rate limiting, Sentry, backups.

---

## Known gotchas

- **Prisma on Alpine:** `binaryTargets` must include `linux-musl-openssl-3.0.x`. `apk add openssl` in Dockerfiles.
- **`prisma db push` vs `migrate deploy`:** v1 used `db push`. Future deploys need committed migrations.
- **Public layout must be inside `(public)/`:** Next.js route groups only apply to nested pages.
- **`force-dynamic` on DB pages:** don't remove or you cache order state in the public CDN.
- **Payment provider names (`Fornax`, `Ventus`) are placeholders.** Find-replace on real deployment.
- **Static `site/` uses localStorage CMS + API sync.** Don't try to unify fully in v1.
- **Admin auto-seed:** runs on first server start. Override with `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` env vars. **Rotate after first login.**
- **`site2/` is a backup/duplicate.** Gitignored.
- **Static site must use `DOCKERFILE` builder.** Nixpacks doesn't work for the static site.
- **Tailwind v4 uses `@layer base/components`** for custom CSS — unlayered CSS beats layered utilities.
- **NextAuth `trustHost: true`** is required in both `auth.ts` and `auth.config.ts`.
- **Admin layout must not redirect unauthenticated users** from `/admin/login` — causes infinite loop.
- **Server actions that call `redirect()`** must re-throw `NEXT_REDIRECT` digest errors.

---

## Env vars

### API service
```
DATABASE_URL                  (auto-set by Railway Postgres plugin)
NEXTAUTH_SECRET               (openssl rand -base64 32)
NEXTAUTH_URL                  (https://albumstudies.up.railway.app)
AUTH_TRUST_HOST               (true — required for NextAuth on Railway)
CMS_PUBLISH_SECRET            (openssl rand -base64 32, for static site sync)
SEED_ADMIN_EMAIL              (admin email for auto-seed, default: admin@example.com)
SEED_ADMIN_PASSWORD           (admin password for auto-seed, default: change-me-immediately-1234)
WEBHOOK_SECRET                (openssl rand -base64 32, phase 3)
RESEND_API_KEY                (re_xxx from resend.com, phase 4)
EMAIL_FROM                    (e.g. "Quaestor Favillae <noreply@your-domain.com>", phase 4)
UPSTASH_REDIS_REST_URL        (from upstash.com, phase 3/7)
UPSTASH_REDIS_REST_TOKEN      (from upstash.com, phase 3/7)
STATIC_SITE_URL               (https://album-studies.up.railway.app)
FORNAX_MERCHANT_CODE          (the actual merchant code on real deploy)
VENTUS_NUMBER                 (the actual phone on real deploy)
PAYMENT_SUPPORT_PHONE         (the WhatsApp support number)
```

### Static site (site service)
- `Root Directory`: `site`
- `Watch Paths`: `site/**`
- `Builder`: `Dockerfile`
- No env vars needed (pure static)

---

## Tools and services

| Tool | Why |
|---|---|
| Next.js 14 App Router | file-system routing, server components, server actions |
| Prisma 5 | type-safe DB, needs Alpine-compatible binaryTargets |
| NextAuth v5 (beta) | admin auth with Credentials + JWT |
| Resend | transactional email (phase 4) |
| Upstash Redis | rate limiting (phase 3/7) |
| pdf-lib | server-side PDF ticket generation (phase 4) |
| qrcode | QR code payloads for tickets (phase 4) |
| Tailwind v4 | build-time CSS via @tailwindcss/postcss |
| Vite 5 | static site bundler |
| nginx (alpine) | static site runtime |
| bcryptjs | password hashing |
| zod | request validation |
| Railway | hosting + Postgres plugin |
| GitHub | source control |

---

## Things that tripped us up — a checklist for future me

- ✗ Don't use the Tailwind CDN script in production
- ✗ Don't use Nixpacks for the static site (use Dockerfile)
- ✗ Don't use `prisma db push` in production (use migrate deploy)
- ✗ Don't reference env-var-baked values in static JSON files
- ✗ Don't forget `force-dynamic` on pages that hit the DB
- ✗ Don't trust `-translate-x-1/2` on elements with `.reveal`
- ✗ Don't bind nginx to port 80 on Railway (use $PORT)
- ✗ Don't skip the CORS preflight handler
- ✗ Don't use `*` for CORS if you ever need credentials
- ✗ Don't let git embed an inner `.git` directory
- ✗ Don't use Nixpacks for the API if you need prisma CLI at runtime
- ✗ Don't redirect unauthenticated users from the login page itself
- ✗ Don't use `npx` in Dockerfile CMD — it's not in PATH at runtime
- ✗ Don't forget `trustHost: true` in NextAuth config for Railway
- ✗ Don't put unlayered CSS above Tailwind's `@layer utilities`
- ✓ Do pin the OpenSSL binary target in Prisma schema for Alpine
- ✓ Do create `public/.gitkeep` for Next.js apps
- ✓ Do make textures pronounced — subtle doesn't read on small elements
- ✓ Do provide defensive fallbacks (`start.sh`, `railway.json` at root)
- ✓ Do auto-seed admin users in code (not via `prisma db seed` at runtime)
- ✓ Do use try/catch in server actions with NEXT_REDIRECT re-throw
- ✓ Do wrap optional form fields with `.transform(v => v || null)` in Zod
