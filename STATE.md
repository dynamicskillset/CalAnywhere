# STATE.md — CalAnywhere Component Status

_Updated: 2026-02-27_

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Backend (Express) | Working | Serves on port 4000 |
| PostgreSQL integration | Working | Falls back to in-memory for core features (not auth) |
| DB migrations | Working | 2 migrations: initial schema + emoji auth |
| Pages router | Working | Core scheduling feature (no ownership yet) |
| Emoji ID auth (backend) | Complete | `backend/src/auth/` — signup, signin, recover, sessions, middleware, SSRF protection |
| Emoji ID auth (frontend) | Complete | Signup, signin, recover pages + AuthContext + NavBar |
| Page ownership + expiry | Not started | Phase 2 — next priority |
| Passkeys | Not started | Phase 1.5 (after Phase 2) |
| Frontend (React + Vite) | Working | Serves on port 5173 |
| TailwindCSS | Working | PostCSS + Autoprefixer configured |
| React Router | Working | v6 |
| Docker Compose | Working | PostgreSQL + backend + nginx/frontend |
| Render deployment | Configured | `render.yaml` for one-click deploy |
| Stripe billing | Not started | Phase 3 — will live in `cloud/billing` |

## Auth System (backend/src/auth/)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/suggest?count=N` | GET | Generate unique Emoji ID(s). Default 1, max 5. |
| `/api/auth/signup` | POST | Create account (emoji ID + iCal URL) |
| `/api/auth/signin` | POST | Sign in (emoji ID + iCal URL), rate-limited |
| `/api/auth/recover` | POST | Use recovery code, optionally update iCal URL |
| `/api/auth/signout` | POST | Destroy session |
| `/api/auth/me` | GET | Get current session's emoji ID |

**Auth model:** Email-free. Emoji ID (3-emoji handle from 128-emoji alphabet, ~2.1M combinations) as identity, iCal URL as possession factor (PBKDF2 hashed). Sessions via httpOnly cookies (SHA-256 hashed tokens, 7-day TTL). 5 one-time recovery codes at signup. No OAuth — iCal only, by design.

**Frontend auth flow:** Signup presents 3 random suggestions to pick from (single API call). No custom ID option. Signin and recover use text input for emoji ID.

## Product Tiers

| | Free | Paid |
|---|---|---|
| Scheduling pages | 1 | Multiple |
| Max page expiry | 30 days | Longer / configurable |
| Passkeys | Yes | Yes |
| iCal integration | Yes | Yes |
| Custom domain | No | Yes |

Downgrade: existing pages run until expiry. No data deletion. User chooses which page to keep.

**Expired pages:** Show "this page has expired" to visitors. No renewal — user creates a new page.

## Known Issues / Limitations

- No test suite (no jest, vitest, or similar configured).
- CORS is wildcard `*` in dev. Must lock down via `ALLOWED_ORIGIN` before production.
- CSP headers disabled on backend (frontend is separate origin).
- Auth requires PostgreSQL — no in-memory fallback for auth store.
- Phase 1 changes are uncommitted.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Optional (falls back to in-memory) | PostgreSQL connection string |
| `PORT` | Optional (defaults to 4000) | Backend listen port |
| `ALLOWED_ORIGIN` | Production required | Locks down CORS from wildcard |

## Data Flow (Core + Auth)

```
User browser
  → Frontend (React, :5173)
    → POST /api/auth/signup|signin (Express, :4000)
      → PostgreSQL: users, sessions, recovery_codes
    → GET/POST /api/pages (Express, :4000)
      → requireAuth middleware → checks session cookie
      → PostgreSQL (or in-memory store for pages)
```

## Recent Changes

- 2026-02-27: Phase 1 complete — frontend auth UI (signup, signin, recover, NavBar, AuthContext)
- 2026-02-27: Backend hardening — SSRF protection, input trimming, route path fix, Dockerfile fix
- 2026-02-27: Emoji ID reduced to 3 emoji (from 4). Custom ID option removed.
- 2026-02-27: Suggest endpoint extended with `?count=N` for batch suggestions.
- 2026-02-27: Emoji alphabet curated (removed peach, deduped clover, added ice cube + planet)
- 2026-02-21: Emoji ID auth module merged (PR #1) — backend only
