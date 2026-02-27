# PLAN.md — Development Roadmap

_Updated: 2026-02-27_

## Vision

CalAnywhere Cloud is the managed hosting layer for CalAnywhere, a privacy-first scheduling tool. It uses iCal (the open standard) exclusively — no OAuth, no Big Tech dependencies. Users authenticate with Emoji IDs and their private iCal URL. The free tier is a complete product; paid tiers unlock more pages and features.

---

## Product Decisions

| Decision | Detail |
|----------|--------|
| **No OAuth, ever** | iCal is the only calendar integration. Anti-lock-in positioning. Works with any provider (Proton, Fastmail, Apple, Google, Outlook). |
| **Email-free auth** | Emoji ID (3-emoji handle) as identity, iCal URL as possession factor. No email collected, no passwords. |
| **Passkeys always free** | Security features are never gated behind payment. |
| **Page expiry model** | Every page has an `expires_at` timestamp. Free tier: max 30 days. Paid tier: longer/configurable. Expired pages are not renewable; user creates a new one. |
| **Graceful downgrade** | On payment failure/cancellation, user drops to free tier. Existing pages run until their expiry. No data deleted. User chooses which page to keep active. |
| **Notification email per page** | Each page can optionally have a notification email (encrypted, never plaintext). Paid users can have different emails per page. Requests also always visible in dashboard. |
| **Pricing TBD** | Monthly + annual options. Price points decided later. |

## Tiers

| | Free | Paid |
|---|---|---|
| Scheduling pages | 1 | Multiple |
| Max page expiry | 30 days | Longer / configurable |
| Notification email per page | 1 email | Different per page |
| Passkeys | Yes | Yes |
| Recovery codes | Yes | Yes |
| iCal integration | Yes | Yes |
| Custom domain | No | Yes |
| Custom page slug | Yes | Yes |

Downgrade: existing pages run until expiry. No data deletion. User chooses which page to keep.

---

## Roadmap

### Phase 1: Frontend Auth + Backend Hardening ✅
**Status:** Complete
**Goal:** Users can sign up, sign in, recover, and maintain sessions through the UI.

All done:
- [x] Auth context provider + `useAuth` hook
- [x] Signup page — 3 emoji ID suggestions, iCal URL with provider guides, recovery code ceremony
- [x] Signin page — emoji ID + iCal URL, rate limit handling
- [x] Recovery page — emoji ID + recovery code, optional iCal URL update
- [x] Auth-aware NavBar (hidden on scheduling pages)
- [x] SSRF protection on iCal URL fetch (DNS resolution + private IP blocking)
- [x] Input trimming on all auth endpoints
- [x] Emoji alphabet curated (128 emoji, 3-emoji IDs)
- [x] Batch suggest endpoint (`?count=3`)
- [x] Docker deployment fixes (route paths, migration file copying)

### Phase 2: Dashboard + Page Ownership + Expiry Model
**Status:** Next up
**Goal:** Authenticated users create and manage scheduling pages from a dashboard, with tier-based limits and encrypted notification emails.

#### 2a. Database migration (003)

The existing `scheduling_pages` table already has `user_id` (nullable FK) and `expires_at`. Changes needed:

- [ ] Remove `owner_email` column (plaintext, pre-auth era)
- [ ] Add encrypted notification email columns:
  - `notification_email_enc TEXT` (AES-256-GCM ciphertext)
  - `notification_email_iv VARCHAR(32)` (initialisation vector, hex)
  - `notification_email_tag VARCHAR(32)` (GCM auth tag, hex)
- [ ] Add `title VARCHAR(100)` column (display name for the page, shown in dashboard)
- [ ] Add index on `user_id` for dashboard queries

New environment variable: `EMAIL_ENCRYPTION_KEY` (32-byte hex string for AES-256).

#### 2b. Email encryption utility

- [ ] `backend/src/utils/encryption.ts` — `encryptEmail(plaintext)` / `decryptEmail(enc, iv, tag)`
- [ ] Uses `crypto.createCipheriv('aes-256-gcm', ...)` with random IV per encryption
- [ ] Key from `EMAIL_ENCRYPTION_KEY` env var
- [ ] Shared by dashboard routes (encrypt on create) and notification sender (decrypt on send)

#### 2c. Dashboard API routes

New router: `backend/src/routes/dashboard.ts`, all behind `requireAuth(pool)`.

- [ ] `GET /api/dashboard/pages` — list user's pages (active + expired), ordered by `created_at` desc
- [ ] `POST /api/dashboard/pages` — create a page
  - Validates iCal URL(s) (reuse existing validation + SSRF check)
  - Enforces free tier limit: 1 active (non-expired) page
  - Caps `expires_at` at 30 days for free tier
  - Encrypts notification email if provided
  - Auto-generates slug (existing `generateSlug()` pattern)
  - Returns page object with slug, expiry, settings
- [ ] `PATCH /api/dashboard/pages/:id` — update page settings
  - Only own pages (check `user_id` matches session)
  - Can update: title, bio, calendar URLs, duration, buffer, date range, notice hours, weekends, notification email
  - Cannot extend expiry beyond tier limit
- [ ] `DELETE /api/dashboard/pages/:id` — soft-delete or hard-delete a page
  - Only own pages
  - Frees up the slot for creating a new one
- [ ] `GET /api/dashboard/pages/:id/requests` — list appointment requests for a page
  - Returns pending and confirmed bookings
  - Only own pages

Mount at `/api/dashboard` in `index.ts`, behind auth.

#### 2d. Update existing pages router

- [ ] `GET /api/pages/:slug` — when page is expired, return a specific `expired: true` flag (not just 404) so frontend can show the right message
- [ ] Appointment request notification: decrypt email from page, send if present. If no email, request is still stored (visible in dashboard).

#### 2e. Frontend: dashboard page

- [ ] `/dashboard` route, protected (redirect to `/signin` if not authenticated)
- [ ] `ProtectedRoute` wrapper component using `useAuth`
- [ ] Dashboard layout:
  - Page count indicator ("1 of 1 pages" for free tier)
  - List of pages, each showing: title, slug (as link), emoji display of owner, expiry date + countdown, status badge (active / expired)
  - "Create new page" button (disabled at limit with tooltip)
  - Each page: edit, copy link, delete actions
- [ ] Empty state for new users: "Create your first scheduling page"

#### 2f. Frontend: page creation form

- [ ] Either `/dashboard/new` or modal from dashboard
- [ ] Fields: title, bio (optional), notification email (optional), calendar URL(s), duration, buffer, date range, notice hours, weekends toggle, expiry picker
- [ ] Expiry picker: presets (7 days, 14 days, 30 days) for free tier
- [ ] iCal URL validation (call existing `/api/pages/validate`)
- [ ] On success: redirect to dashboard, show the new page

#### 2g. Frontend: page edit

- [ ] `/dashboard/edit/:id` or modal
- [ ] Pre-populated form with current settings
- [ ] Cannot change slug (would break existing links)

#### 2h. Frontend: expired page visitor view

- [ ] When `GET /api/pages/:slug` returns expired, show a clean message: "This scheduling page is no longer active"
- [ ] Styled consistently with existing confirmation/error pages (Nord theme cards)
- [ ] No action buttons — just the message

#### 2i. Frontend: appointment requests view

- [ ] Section within dashboard (or sub-page) showing requests per page
- [ ] Each request: requester name, email, requested time, reason, status
- [ ] Read-only for now (no accept/reject actions in Phase 2)

**Depends on:** Phase 1 (auth) ✅

### Phase 1.5: Passkeys
**Goal:** Users can add a passkey as a second auth factor from their dashboard.

- [ ] `webauthn_credentials` table (migration)
- [ ] Server-side WebAuthn challenge/assertion (`@simplewebauthn/server`)
- [ ] `/auth/passkey/register` and `/auth/passkey/authenticate` endpoints
- [ ] Frontend: "Add passkey" flow in dashboard, passkey signin option
- [ ] Fallback: Emoji ID + iCal URL always works, passkey is optional convenience

**Depends on:** Phase 1 (auth) ✅ + Phase 2 (dashboard exists)

### Phase 2.5: Browser Push Notifications
**Goal:** Users who don't provide a notification email can still be alerted to new appointment requests via their browser.

- [ ] Service worker registration
- [ ] Web Push API subscription management (store endpoint + keys per user)
- [ ] Push notification server (send on new appointment request)
- [ ] Frontend: opt-in prompt in dashboard, notification preferences
- [ ] Fallback: dashboard always shows requests regardless of notification preference

**Depends on:** Phase 2 (dashboard + requests view)

### Phase 3: Stripe Billing
**Goal:** Subscription tiers gate premium features; Stripe handles payments.

- [ ] Stripe account setup + products/prices configured
- [ ] `subscriptions` table (user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end)
- [ ] `/api/billing/checkout` — create Stripe Checkout session
- [ ] `/api/billing/portal` — Stripe Customer Portal redirect
- [ ] `/api/billing/webhook` — handle subscription events (created, cancelled, payment_failed)
- [ ] Entitlement checks: page count limit, max expiry duration
- [ ] Downgrade flow: user selects which page stays active
- [ ] Frontend: pricing page, upgrade prompt (at limit), billing management

**Lives in:** `cloud/billing` (SaaS-only, not upstream)
**Depends on:** Phase 2 (pages + dashboard)

### Phase 4: Production Hardening
- [ ] Lock CORS to calanywhere.com (`ALLOWED_ORIGIN`)
- [ ] Rate limiting tuning per endpoint
- [ ] Structured logging
- [ ] Error monitoring (Sentry or similar)
- [ ] Database backups
- [ ] HTTPS enforced
- [ ] Security headers review
- [ ] Load testing

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-27 | No OAuth — iCal only | Anti-Big Tech positioning. iCal is the open standard. Works with all providers. |
| 2026-02-27 | Emoji ID auth (not magic link) | Email-free. Privacy-first. Already merged in backend. |
| 2026-02-27 | Passkeys always free | Security features should never be gated behind payment. |
| 2026-02-27 | Page expiry model for tiers | Free = 30-day max expiry. Paid = longer. Graceful downgrade with no data deletion. |
| 2026-02-27 | Passkeys in Phase 1.5, not Phase 1 | Get core auth working first, add passkeys as upgrade once dashboard exists. |
| 2026-02-27 | 3-emoji IDs (not 4) | Fits better in UI, easier to remember, 2.1M combinations is sufficient. LessPass precedent. |
| 2026-02-27 | 3 suggestions, no custom IDs | Stakeholders preferred picking from options. Better UX, more uniform ID distribution. |
| 2026-02-27 | Notification email per page (encrypted) | AES-256-GCM, never plaintext. Paid users can have different emails per page. Requests also visible in dashboard (email optional). |
| 2026-02-27 | Expired pages: no renewal | Expired pages show "no longer active" to visitors. User creates a new page if needed. |
| 2026-02-27 | Browser push notifications (future) | For users who skip notification email. Web Push API, service worker. Phase 2.5. |
| 2026-02 | In-memory fallback for PostgreSQL | Simplifies local dev without Docker (core features only, not auth). |
| 2026-02 | BSL-1.1 for cloud/ | Protects commercial features while remaining source-available. |
| 2026-02 | Stripe for billing | Battle-tested, handles tax/compliance. |

---

## Upstream Sync Notes

When merging from upstream (dajbelshaw/CalAnywhere), check for:
- Changes to `backend/src/routes/pages.ts` that conflict with auth middleware or dashboard routes
- Changes to `frontend/src/` that affect routing or auth context
- Any new dependencies that might conflict

**Contributions back upstream:** SSRF fixes, input validation, auth module improvements, frontend auth components, email encryption utility — anything not Stripe/billing/cloud-specific.
