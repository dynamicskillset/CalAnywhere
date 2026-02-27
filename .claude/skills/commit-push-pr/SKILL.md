---
name: commit-push-pr
description: Ship code through verified commit pipeline with upstream contribution
---

Ship code through the verified commit pipeline.

Follow these steps in order:

1. **Check working tree:** Run `git status` to see what's staged/unstaged.

2. **Verify TypeScript:** Run `tsc --noEmit` in `backend/` for any backend changes, and in `frontend/` for frontend changes. Fix any errors before continuing.

3. **Lint frontend:** If frontend files changed, run `npm run lint` in `frontend/`. Fix any errors.

4. **Review changes:** Run `git diff` to review what will be committed. Flag anything unexpected.

5. **Upstream triage:** For each changed file in `backend/` or `frontend/`, classify as:
   - **upstream** — benefits self-hosters (security fixes, auth improvements, DX, Dockerfile fixes, frontend auth UI, general utilities)
   - **cloud-only** — managed platform only (`cloud/`, dashboard, tier enforcement, billing, `render.yaml`)
   - **mixed** — both upstream and cloud changes in the same file

   Decision tree:
   - `cloud/` directory → cloud-only
   - `render.yaml` → cloud-only
   - `backend/src/routes/dashboard.ts` → cloud-only
   - Dashboard pages, services (`DashboardPage`, `CreatePagePage`, `RequestsPage`, `services/dashboard.ts`) → cloud-only
   - Tier/subscription logic → cloud-only
   - Everything else in `backend/` or `frontend/` → upstream (unless it only exists to serve a cloud-only feature)

   Present the classification as a table:
   ```
   | File | Classification | Notes |
   |------|---------------|-------|
   ```

   If upstream or mixed files exist, tell the user: "These changes benefit self-hosters and should be contributed to upstream. I'll prepare an upstream PR after committing to origin."

   If all files are cloud-only: "All changes are cloud-specific. No upstream contribution needed."

6. **Stage and commit:** Stage relevant files (not HANDOFF.md, not .env files). Write a commit message following Conventional Commits: `type: short description`. Ask the user to confirm the commit message before creating the commit.

7. **Push:** Ask the user to confirm before pushing: "Ready to push to [branch]?" Push after confirmation.

8. **Upstream contribution** (if step 5 found upstream or mixed files):
   a. `git fetch upstream`
   b. Create branch: `git checkout -b upstream/<topic> upstream/main`
   c. For pure upstream files: apply changes cleanly from main.
   d. For mixed files: "clean forward port" — start from the upstream version of the file, apply only upstream-eligible hunks, leave out cloud-specific imports and logic.
   e. Verify: `tsc --noEmit` in backend/ and frontend/ on the upstream branch.
   f. Commit with Conventional Commits format.
   g. Push: `git push origin upstream/<topic>`
   h. PR: `gh pr create --repo dajbelshaw/CalAnywhere --base main --head dynamicskillset:upstream/<topic>`
   i. Switch back: `git checkout main`

9. **PR (optional):** If the user wants a PR to origin, use `gh pr create` with a title and body summarising the changes. Ask for confirmation before creating.

Do not use `git add -A` or `git add .` — stage files explicitly by name.
