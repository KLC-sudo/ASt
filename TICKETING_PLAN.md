# Quaestor Favillae — Ticketing System Plan

**Status:** Phase 1 + 2 complete
**Date:** 2026-06-07
**Approach:** Two-service monorepo (static + API)

---

## 1. Architecture

A monorepo with two services. The static site is a Vite + nginx build serving a marketing landing page with an in-browser CMS panel. The API service is a Next.js 14 application that owns events, orders, tickets, webhooks, and the admin control deck. Both services share a single Postgres database (Railway plugin).

```
┌─────────────────────────────────────┐         ┌─────────────────────────────────────┐
│  Service 1: Static Site             │         │  Service 2: API + Tickets          │
│  Vite + nginx                        │         │  Next.js 14 App Router             │
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
| 1 | Currency | Local currency code (configurable, e.g. UGX) |
| 2 | Database | Railway Postgres plugin |
| 3 | Email | Resend (third-party, but sends from your domain) |
| 4 | Customer confirm | `wa.me` deep links for v1; auto-message in phase 2+ |
| 5 | MVP scope | Phases 1–5 first, then iterate |
| 6 | Admin auth | NextAuth Credentials provider (email + bcrypt) |
| 7 | CTA button | CMS-customisable; "Get Tickets" for now |
| 8 | Domain | Configurable (custom CNAMEs to Railway) |
| 9 | Reference format | `TKT-{EVENT_SLUG}-{6char}` e.g. `TKT-EVT-A7K2B9` |

---

## 3. Email: Resend (third-party)

**Self-hosted SMTP** is cheapest at scale but you own deliverability. SPF/DKIM/DMARC must be perfect, IP must be warmed for weeks, bounces/complaints/blacklists are 100% on you.

**Resend** owns deliverability and reputation while sending from your domain via DKIM, so customers see `noreply@your-domain.com` — not a third-party brand. Free tier: 100 emails/day, then $20/mo for 50k. Webhooks for delivery status, bounce/complaint handling built in. Wrapped in `lib/email.ts` so providers can be swapped later.

---

## 4. Cross-Service Communication

- **Static → API:** link-out only. `Get Tickets` button → `<API_URL>/events`. No CORS.
- **API → Static:** none. The static site keeps its localStorage CMS; no unification in v1.
- **Webhook:** server-to-server POST from the Android device to `<API_URL>/api/webhooks/sms-payment`.

---

## 5. Database Schema (Prisma)

```prisma
model AdminUser      { id, email, hashedPassword, role, createdAt }
model Event          { id, slug @unique, title, description, venue, startsAt,
                       endsAt, capacity, status, fornaxCode, ventusNumber,
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
model SiteConfig     { key @unique, value, updatedAt }
```

---

## 6. Webhook Endpoint

`POST /api/webhooks/sms-payment`

**Request body** (from Android SMS forwarder app):
```json
{
  "from": "Fornax Mobile Money",
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
5. TLS-only

**Parsers:**
- `amount`: `/UGX\s+([\d,]+)/i` (currency code configurable)
- `phone`: `/(?:from\s+\w+\s*)?\(?(\d{10,13})\)?/i`
- `reference`: `/(TKT-[A-Z0-9-]+)/i`
- `txId`: `/(?:TxId|Transaction|Trx)[:\s]+([A-Z0-9]+)/i`

**Verification logic:**
1. Parse SMS — if any required field missing → `parse_failed` log, email admin
2. Find Order by `reference`
3. If order already `paid` → 200 + `duplicate` log
4. If amount matches + status pending → mark `paid`, generate tickets, queue email
5. Amount mismatch → `amount_mismatch` log, leave order pending
6. Always 200 unless 5xx (sender retries on non-2xx)

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
        • Amount (local currency)
        • Provider A: dial *XXXX# → Merchant Pay → amount → ref
        • OR Provider B: send amount to phone, include ref
        • "I have paid" → wa.me deep link
  → /checkout/.../pending/[ref]
    → poll /api/orders/[ref] every 5s
    → when paid → /order/[ref] (download PDF ticket)
```

---

## 8. Admin Dashboard

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

## 9. Android SMS Forwarder Setup (lives at `/admin/help`)

- Install the open-source "Incoming SMS to URL Webhook" forwarder from F-Droid
- Forwarding rules (one per provider):
  - `Provider A` → `POST <API_URL>/api/webhooks/sms-payment`
  - `Provider B` → same endpoint
  - Auth: `Bearer <WEBHOOK_SECRET>` (generated in `/admin/dashboard`, copy-paste)
  - Enable "Ignore non-matching SMS"
- Battery-optimisation whitelist (device-specific)
- Optional weekly health-check ping

---

## 10. Deployment (Two Railway Services)

**Service 1: Static Site** — set Root Directory to `site` in the Railway UI.

**Service 2: API + Tickets** — set Root Directory to `api` in the Railway UI.
- Multi-stage Node 20 → standalone Next.js
- **Plugins:** Railway Postgres, Upstash Redis (external, free tier)
- **Env vars:** see `api/.env.example`

**Custom domain (optional):**
- `your-domain.com` → static service
- `api.your-domain.com` → API service

---

## 11. Phased Build Order

| Phase | What ships | Status |
|---|---|---|
| **1. API scaffold** | Next.js + Prisma + Postgres + NextAuth. Admin login works. | ✓ |
| **2. Public ticketing flow** | `/events`, `/events/[slug]`, `/checkout`, `/order/[ref]`. Orders created, stay pending. | ✓ |
| **3. SMS webhook** | `/api/webhooks/sms-payment` with parser, security, idempotency. | pending |
| **4. Payment → ticket** | On paid: PDF ticket, email it, surface download link. | pending |
| **5. Admin dashboard** | Events CRUD, orders table, webhook logs, manual override. | pending |
| **6. Android setup guide** | `/admin/help` page with step-by-step instructions. | pending |
| **7. Hardening** | Rate limit, error emails, Sentry, backup strategy. | pending |
| **8. (Optional) SiteConfig sync** | Static site reads `SiteConfig` from API. Deprecates localStorage CMS. | pending |

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Forwarder app on cheap phone crashes | Admin `/admin/manual-verify` accepts pasted raw SMS |
| Provider SMS format changes | Parser versioned, alerts on `parse_failed`, manual fallback |
| Customer pays, closes browser before poll resolves | `wa.me` link + email + persistent status URL by reference |
| Race: two SMS arrive simultaneously | Postgres unique constraint on `WebhookEvent.payloadHash` |
| Webhook secret leaks | Rotate via env var, no logging of secret |
| PDF generation slow | `pdf-lib` is fast enough for v1; queue in phase 7 if needed |
| Network latency breaks polling | 7s poll with exponential backoff, max 5 min |
| Self-hosted email deliverability | Use Resend (third-party) for transactional; you own the domain |
