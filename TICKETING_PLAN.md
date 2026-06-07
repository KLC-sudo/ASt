# Album Studies — Ticketing System Plan

**Status:** Phase 1 in progress
**Date:** 2026-06-07
**Approach:** Option B — Static site + separate API service

---

## 1. Architecture

Two Railway services sharing one Postgres database. The static site (`site/`) is untouched and continues to serve the marketing landing page with its localStorage CMS. The new `api/` service owns all dynamic logic: events, orders, tickets, webhooks, and admin.

```
┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│  Service 1: Static Site (existing)  │         │  Service 2: API + Tickets (new)     │
│  /site/  → Vite build → nginx       │         │  /api/  → Next.js 14 App Router     │
│                                       │  ──→   │                                       │
│  Marketing landing, CMS panel        │ links  │  /events, /checkout, /order, /admin  │
│  (localStorage)                      │        │  /api/webhooks/sms-payment           │
└─────────────────────────────────────┘         └─────────────────────────────────────┘
                       │                                       │
                       └──────────────┬────────────────────────┘
                                      ▼
                          ┌────────────────────────┐
                          │  Railway Postgres      │
                          └────────────────────────┘
```

---

## 2. Confirmed Decisions

| # | Topic | Decision |
|---|---|---|
| 1 | Currency/region | UGX (Uganda), MTN Uganda + Airtel Uganda |
| 2 | Database | Railway Postgres plugin |
| 3 | Email | Resend (third-party, but sends from our domain) |
| 4 | WhatsApp | `wa.me` deep links for v1; Twilio auto-message in phase 2+ |
| 5 | MVP scope | Find out along the way — ship phases 1–5 first |
| 6 | Admin auth | NextAuth Credentials provider (email + bcrypt) |
| 7 | CTA button | CMS-customisable; "Get Tickets" for now |
| 8 | Domain | Already have it (CNAMEs to Railway) |
| 9 | Reference format | `TKT-{EVENT_SLUG}-{6char}` e.g. `TKT-EVT2026-748392` |

---

## 3. Why Resend, not self-hosted email

**Self-hosted SMTP** (your own Postfix server) is cheapest at scale but you own deliverability. SPF/DKIM/DMARC must be perfect, IP must be warmed for weeks, bounces/complaints/blacklists are 100% on you. One bad batch lands you in spam and the customer never gets their ticket.

**Resend** owns deliverability and reputation while sending from **our** domain via DKIM, so customers still see `tickets@albumstudies.com` — not a third-party brand. Free tier: 100 emails/day, then $20/mo for 50k. Webhooks for delivery status, bounce/complaint handling built in. We wrap it in `lib/email.ts` so we can swap providers later.

---

## 4. Cross-Service Communication

- **Static → API:** link-out only. `Get Tickets` button → `<API_URL>/events`. CORS not needed.
- **API → Static:** none. The static site keeps its localStorage CMS; we don't try to unify them in v1.
- **Webhook:** server-to-server POST from the Android device to `<API_URL>/api/webhooks/sms-payment`.

---

## 5. Database Schema (Prisma)

```prisma
model AdminUser      { id, email, hashedPassword, role, createdAt }
model Event          { id, slug @unique, title, description, venue, startsAt,
                       endsAt, capacity, status, mtnMerchantCode, airtelNumber,
                       coverImage, createdAt, tiers[] }
model TicketTier     { id, eventId, name, priceUGX, capacity, sold }
model Order          { id, reference @unique, tierId, customerName,
                       customerEmail, customerPhone, quantity, amountUGX,
                       status, paymentProvider, paymentTxId, ipAddress,
                       createdAt, paidAt, tickets[] }
model Ticket         { id, orderId, code @unique, qrPayload, attendeeName,
                       checkedInAt }
model WebhookEvent   { id, payloadHash @unique, rawPayload, signature,
                       processedAt, matchedOrderId, result, error }
model WebhookLog     { id, receivedAt, sourceIp, status, message }
model EmailLog       { id, orderId, recipient, subject, status, providerId, sentAt }
model SiteConfig     { key @unique, value, updatedAt }   // (phase 8) sync static CMS
```

---

## 6. Webhook Endpoint

`POST /api/webhooks/sms-payment`

**Request body** (from F-Droid SMS Gateway app):
```json
{
  "from": "MTN Mobile Money",
  "text": "You have received UGX 45000 from 2567XXXXXX. Ref: TKT-EVT2026-748392 ...",
  "sentStamp": "...",
  "receivedStamp": "...",
  "sim": "1"
}
```

**Security stack:**
1. `Authorization: Bearer <WEBHOOK_SECRET>` header
2. Upstash Redis rate limit: 60 req/min per IP
3. `sha256(rawBody)` is the dedupe key
4. Postgres unique constraint on `WebhookEvent.payloadHash` enforces idempotency
5. TLS-only (Railway)

**Parsers:**
- `amountUGX`: `/UGX\s+([\d,]+)/i`
- `phone`: `/(?:from\s+\w+\s*)?\(?(\d{10,13})\)?/i`
- `reference`: `/(TKT-[A-Z0-9-]+)/i`
- `txId`: `/(?:TxId|Transaction|Trx)[:\s]+([A-Z0-9]+)/i`

**Verification logic:**
1. Parse SMS — if any required field missing → `parse_failed` log, email admin
2. Find Order by `reference`
3. If order already `paid` → 200 + `duplicate` log
4. If amount matches + status pending → mark `paid`, generate tickets, queue email
5. Amount mismatch → `amount_mismatch` log, leave order pending
6. Always 200 unless 5xx (SMS Gateway retries non-2xx)

---

## 7. Frontend Flow (Customer)

```
[Static site "Get Tickets" CTA]
  → /events                       (list)
  → /events/[slug]                (detail + tier select)
  → /checkout/[tierId]            (form: name, email, phone, qty)
    → POST creates Order (pending)
    → returns reference + payment instructions
        • TKT-EVT2026-748392
        • UGX 45,000
        • MTN: *1653# → Merchant Pay → Merchant Code → amount → ref
        • OR Airtel: send UGX 45,000 to 2567XXXXXX, include ref
        • "I have paid" → wa.me deep link
  → /checkout/.../pending/[ref]
    → poll /api/orders/[ref] every 5s
    → when paid → /order/[ref] (download PDF ticket)
```

---

## 8. Admin Dashboard (in `api/`)

All behind NextAuth.

```
/admin/login
/admin/dashboard       → KPIs + recent activity
/admin/events          → CRUD
/admin/orders          → filterable table + status override
/admin/orders/[id]     → detail, resend email
/admin/webhooks        → log viewer, reprocess
/admin/manual-verify   → paste raw SMS, see parse, mark paid
/admin/help            → Android SMS Gateway setup steps
```

---

## 9. Android SMS Gateway Setup (lives at `/admin/help`)

- Install **SMS Gateway** from F-Droid
- Forwarding rules (one per provider):
  - `MTN Mobile Money` → `POST <API_URL>/api/webhooks/sms-payment`
  - `Airtel Money` → same endpoint
  - Auth: `Bearer <WEBHOOK_SECRET>` (generated in `/admin/dashboard`, copy-paste)
  - Enable "Ignore non-matching SMS"
- Battery-optimisation whitelist (Samsung/Xiaomi/Tecno device-specific)
- Optional weekly health-check ping

---

## 10. Deployment (Two Railway Services)

**Service 1: Static Site** — already configured, no changes.

**Service 2: API + Tickets** — new:
- `api/Dockerfile` — multi-stage Node 20 → standalone Next.js
- `api/railway.json` — Nixpacks fallback
- **Plugins:** Railway Postgres (shared), Upstash Redis (external, free tier)
- **Env vars:**
  - `DATABASE_URL` (auto from Postgres plugin)
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `EMAIL_FROM` (e.g. `Album Studies <tickets@albumstudies.com>`)
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`
  - `STATIC_SITE_URL`
  - `MTN_MOMO_MERCHANT_CODE`
  - `AIRTEL_MONEY_NUMBER`

**Custom domain (optional):**
- `albumstudies.com` → static service
- `api.albumstudies.com` → API service

---

## 11. Phased Build Order

| Phase | What ships | Status |
|---|---|---|
| **1. API scaffold** | Next.js + Prisma + Postgres + NextAuth. Admin login works. | 🔧 in progress |
| **2. Public ticketing flow** | `/events`, `/events/[slug]`, `/checkout`, `/order/[ref]`. Orders created, stay pending. | ⏳ |
| **3. SMS webhook** | `/api/webhooks/sms-payment` with parser, security, idempotency. | ⏳ |
| **4. Payment → ticket** | On paid: PDF ticket, email it, surface download link. | ⏳ |
| **5. Admin dashboard** | Events CRUD, orders table, webhook logs, manual override. | ⏳ |
| **6. Android setup guide** | `/admin/help` page with step-by-step instructions. | ⏳ |
| **7. Hardening** | Rate limit, error emails, Sentry, backup strategy. | ⏳ |
| **8. (Optional) SiteConfig sync** | Static site reads `SiteConfig` from API. Deprecates localStorage CMS. | ⏳ |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| SMS app on cheap phone crashes | Admin `/admin/manual-verify` accepts pasted raw SMS |
| MTN/Airtel SMS format changes | Parser versioned, alerts on `parse_failed`, manual fallback |
| Customer pays, closes browser before poll resolves | `wa.me` link + email + persistent status URL by reference |
| Race: two SMS arrive simultaneously | Postgres unique constraint on `WebhookEvent.payloadHash` |
| Webhook secret leaks | Rotate via env var, no logging of secret |
| PDF generation slow | `pdf-lib` is fast enough for v1; queue in phase 7 if needed |
| Uganda network latency breaks polling | 7s poll with exponential backoff, max 5 min |
| Self-hosted email deliverability | Use Resend (third-party) for transactional; we own the domain |
