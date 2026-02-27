# CalAnywhere Cloud — Claude Memory

## Project

CalAnywhere Cloud is the managed hosting platform for CalAnywhere, a privacy-first scheduling tool. This repo extends the open-source core with cloud features for calanywhere.com.

- **Upstream core:** github.com/dajbelshaw/CalAnywhere (AGPL-3.0)
- **This repo:** github.com/dynamicskillset/CalAnywhere — BSL-1.1 (converts to AGPL-3.0 after 3 years per release)
- **Built by:** Dynamic Skillset

## Upstream Contribution Rule

Only `cloud/` and code required specifically for the hosted SaaS belong in this repo. Everything else (backend/, frontend/, shared improvements) should be contributed back to the upstream repo at github.com/dajbelshaw/CalAnywhere.

## Upstream Contribution Workflow

Every commit touching `backend/` or `frontend/` (outside `cloud/`) must be assessed for upstream contribution. This is enforced by the `/commit-push-pr` skill (step 5: triage, step 8: upstream PR) and the `/review` skill (check 7).

**Classification per file:**
- **upstream** — security fixes, bug fixes, auth improvements, DX, Dockerfile fixes, frontend auth UI, general utilities
- **cloud-only** — dashboard, tier enforcement, billing, Render config, `cloud/` directory
- **mixed** — both; apply only upstream hunks via clean forward port

**Process:**
1. During `/commit-push-pr`, the triage table is generated for every commit
2. Upstream-eligible changes are branched from `upstream/main` as `upstream/<topic>`
3. Mixed files get a "clean forward port" (start from upstream base, apply only shared changes)
4. PR created via `gh pr create --repo dajbelshaw/CalAnywhere`
5. Deferred contributions logged as upstream debt in HANDOFF.md

**Upstream remote:** `git@github.com:dajbelshaw/CalAnywhere.git` (remote name: `upstream`)

## Architecture

```
backend/          # Express + TypeScript API (AGPL-3.0, synced from upstream)
  src/auth/       # Emoji ID auth (merged PR #1) — email-free, iCal URL as credential
frontend/         # React + Vite + TypeScript UI (AGPL-3.0, synced from upstream)
cloud/            # BSL-1.1 cloud additions
  billing/        # Stripe subscriptions (Phase 3)
```

## Product Principles

- **No OAuth, ever.** iCal only. Anti-Big Tech, anti-lock-in. Works with any calendar provider.
- **Email-free auth.** Emoji ID + iCal URL. No email collected, no passwords.
- **Security features always free.** Passkeys, recovery codes never gated behind payment.
- **Graceful downgrades.** No data deletion on plan change. Pages run until expiry.

## Ports

- Backend: `4000`
- Frontend: `5173` (Vite dev) or `80/443` (Docker nginx)

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend runtime | Node.js + TypeScript |
| Backend framework | Express 4 |
| Database | PostgreSQL (pg driver); falls back to in-memory if unavailable |
| Frontend | React 18 + Vite + TypeScript + TailwindCSS |
| Routing | React Router v6 |
| HTTP client | Axios |
| Security | Helmet, express-rate-limit, CORS |
| Containerisation | Docker Compose |

## Key Files

- `backend/src/index.ts` — Express app entry, DB init, middleware, routes
- `backend/src/auth/` — Emoji ID auth module (routes, sessions, recovery, middleware)
- `backend/src/routes/pages.ts` — Pages router (core scheduling feature)
- `backend/src/db/client.ts` — PostgreSQL connection + init
- `backend/src/db/migrate.ts` — DB migrations
- `backend/src/db/migrations/` — SQL migrations (001 initial, 002 emoji auth)
- `backend/src/store/` — In-memory/DB store abstraction
- `frontend/src/` — React app
- `docker-compose.yml` — Full-stack local environment
- `render.yaml` — Render deployment config

## Commit Style

Conventional Commits: `type: short description`

Types used: `feat`, `fix`, `security`, `a11y`, `style`, `deploy`, `scaffold`, `hygiene`, `content`, `rebrand`

## Development

```bash
# Backend (from /backend)
npm run dev       # nodemon + ts-node, watches src/

# Frontend (from /frontend)
npm run dev       # Vite dev server

# Full stack
docker-compose up # PostgreSQL + backend + frontend via nginx
```

## Syncing Upstream

```bash
git fetch upstream
git merge upstream/main
```

After merging, check `backend/` and `frontend/` for conflicts. Cloud additions in `cloud/` are not affected.

## Architecture Decisions

- **In-memory fallback:** Backend gracefully degrades to in-memory store when PostgreSQL is unavailable, making local dev easier without Docker.
- **CSP disabled:** Frontend is served separately (different origin), so CSP on the API server is disabled.
- **Trust proxy:** Set to `1` for correct IP resolution behind nginx/Docker.
- **CORS:** Wildcard in dev; `ALLOWED_ORIGIN` env var locks it down in production.
