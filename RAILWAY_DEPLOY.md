# Railway Deployment — Step by Step

This monorepo has two services. The most common reason builds fail on Railway is that the **build context** is set to the repo root, where there's no obvious build manifest.

## The two services

| Service | Source | Root Directory in Railway |
|---|---|---|
| Static landing | `site/` | `site` |
| API + tickets | `api/` | `api` (or `.` for root Dockerfile) |

## The error you saw

```
[inf]  ⚠ Script start.sh not found
[inf]  ✖ Railpack could not determine how to build the app.
[inf]  The app contents that Railpack analyzed contains:
[inf]  ./
[inf]  ├── api/
[inf]  ├── site/
[inf]  ├── .gitignore
[inf]  ├── README.md
[inf]  └── TICKETING_PLAN.md
[err]  railpack process exited with an error
```

This happens when **Root Directory** is the repo root and Railpack can't auto-detect. There's no `package.json`, no `Dockerfile`, no `start.sh` at the root.

## What was added to fix it

After the first report, the following defensive layers were added in commit `67feef5+`:

**At the repo root:**
- `Dockerfile` — multi-stage build that wraps `api/`. Railpack will use this in Docker mode.
- `start.sh` — defensive script with a clear error message.
- `nixpacks.toml` — explicit Nixpacks config to build `api/`.
- `railpack.json` — explicit Railpack config to build `api/`.

**Inside `api/`:**
- `Dockerfile` — multi-stage Next.js standalone build.
- `railpack.json` — Railpack config.
- `nixpacks.toml` — Nixpacks config.

## Three ways to deploy the API service

### Option A (recommended): Root Directory = `api`

1. Create a new Railway service from the repo
2. **Settings → Build → Root Directory** = `api`
3. **Settings → Build → Watch Paths** = `api/**`
4. Set env vars from `api/.env.example`
5. Add the Postgres plugin
6. Run migrations: `railway run --service <name> npx prisma db push`
7. Seed the first admin: `railway run --service <name> npm run db:seed`

Railway reads `api/Dockerfile` or `api/railpack.json` directly.

### Option B: Root Directory = `.` (root Dockerfile)

Use this if you can't or won't set Root Directory.

1. Create a new Railway service from the repo
2. Leave **Root Directory = `.`** (default)
3. Railway sees the root `Dockerfile` and uses it
4. The Dockerfile builds `api/` internally (multi-stage)

The result is identical to Option A.

### Option C: Local build to test

```bash
# From repo root
docker build -t quaestor-api .
docker run -p 3000:3000 --env-file api/.env quaestor-api
```

## Static site (separate service)

For the Vite static site:

1. Create a second Railway service from the same repo
2. **Root Directory** = `site`
3. **Watch Paths** = `site/**`
4. Railway detects Vite, builds with `npm run build`, serves `dist/` via nginx

## Force Docker builder

If Railpack still misbehaves, force Docker:

1. Service → **Settings → Build**
2. Set **Builder** = `Dockerfile` (dropdown)
3. Leave **Dockerfile Path** blank (it'll find the root one)
4. Redeploy

## Healthcheck

The `startCommand` serves on `PORT` (Railway sets this automatically). The healthcheck hits `/` and expects 200.

## Common gotchas

- **Watch Paths**: set them so site changes don't trigger API rebuilds (and vice versa). Saves minutes per deploy.
- **Postgres URL**: the Railway plugin auto-sets `DATABASE_URL`. Don't override it.
- **NEXTAUTH_URL**: must match the public URL of the API service. Set it to the Railway-provided domain or your custom domain.
- **Migrations**: not automatic. Run `prisma db push` once after the first deploy, then after every schema change.

## Verifying the build works

After deploying, hit the API service's root URL. You should see the public landing page ("Get Tickets" / "Admin" buttons). If you get a 502, the container didn't start — check the deploy logs for stack traces.
