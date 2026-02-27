# MISTAKES.md — Error Log & Lessons Learned

Each entry captures a mistake made, its root cause, and how to prevent it. Update this file whenever a recurring problem is discovered.

---

## Format

**Date | Error | Root Cause | Prevention**

---

## Entries

### 2026-02-27 | XSS vulnerability in calendar URL rendering
- **Error:** User-supplied calendar URLs were rendered without sanitisation, allowing script injection.
- **Root Cause:** Trusting client input directly in the frontend without output encoding.
- **Prevention:** Always sanitise/encode user-supplied strings before rendering. Use `textContent` not `innerHTML`. Validate URLs server-side before storing.

### 2026-02-27 | SSRF risk via calendar URL fetching
- **Error:** Backend fetched user-supplied URLs without validation, enabling Server-Side Request Forgery.
- **Root Cause:** No allowlist or validation on URLs passed to the calendar fetcher.
- **Prevention:** Validate all URLs before fetching. Block private IP ranges (10.x, 192.168.x, 127.x, 169.254.x). Use the `/api/validate` endpoint pattern established for this.

### 2026-02-27 | Privacy leak via calendar URL in logs/responses
- **Error:** Raw calendar URLs (potentially containing auth tokens) were logged or returned in API responses.
- **Root Cause:** Insufficient care around what gets logged or serialised.
- **Prevention:** Never log raw calendar URLs. Strip sensitive query params before logging. Return opaque IDs to the frontend rather than raw URLs.

### 2026-02-27 | Cross-architecture Docker build failures
- **Error:** Docker images built on Apple Silicon (arm64) failed to run on linux/amd64 in production.
- **Root Cause:** `docker build` without `--platform linux/amd64` flag.
- **Prevention:** Always specify `--platform linux/amd64` when building for deployment. Use `docker buildx` for multi-arch builds if needed.

### 2026-02-27 | nginx upstream resolution failure
- **Error:** nginx container couldn't resolve the backend container by hostname on startup.
- **Root Cause:** nginx resolved DNS at start before the backend container was ready.
- **Prevention:** Use Docker Compose `depends_on` with health checks. In nginx config, use `resolver 127.0.0.11` (Docker's internal DNS) with `valid=30s` to allow re-resolution.

### 2026-02-27 | Duplicate body-parser inclusion
- **Error:** `body-parser` was included as a dependency despite Express 4.16+ having built-in `express.json()`.
- **Root Cause:** Copy-pasting older boilerplate.
- **Prevention:** Use `express.json()` and `express.urlencoded()` directly. Don't add `body-parser` to new Express 4.16+ projects.

### 2026-02-27 | Upstream-eligible changes committed without contribution
- **Error:** 8 commits to origin/main contained shared improvements (SSRF protection, rate limiting, email service rewrite, EmojiPicker accessibility, Dockerfile fix, expired page handling, full auth UI) without any being contributed to the upstream repo (dajbelshaw/CalAnywhere).
- **Root Cause:** The commit workflow had no upstream triage step. The review skill did not check for upstream-eligible changes.
- **Prevention:** `/commit-push-pr` now has mandatory upstream triage (step 5) and contribution (step 8). `/review` has upstream check (check 7). `/handoff` tracks upstream debt. `/catchup` checks for it at session start.

---

## Patterns to Watch

- **Input sanitisation:** Always sanitise user input before rendering or processing, especially URLs and calendar data.
- **Docker platform targeting:** Explicitly set `--platform` for production builds from Apple Silicon.
- **Dependency hygiene:** Check if Express built-ins cover a dependency before adding it.
- **Logging sensitivity:** Never log user-supplied URLs or tokens, even in development.
- **Upstream contribution:** Every commit to `backend/` or `frontend/` must be triaged for upstream contribution. Don't batch and defer.
