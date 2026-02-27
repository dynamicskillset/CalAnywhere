---
name: commit-push-pr
description: Ship code through verified commit pipeline
---

Ship code through the verified commit pipeline.

Follow these steps in order:

1. **Check working tree:** Run `git status` to see what's staged/unstaged.

2. **Verify TypeScript:** Run `tsc --noEmit` in `backend/` for any backend changes, and in `frontend/` for frontend changes. Fix any errors before continuing.

3. **Lint frontend:** If frontend files changed, run `npm run lint` in `frontend/`. Fix any errors.

4. **Review changes:** Run `git diff` to review what will be committed. Flag anything unexpected.

5. **Stage and commit:** Stage relevant files (not HANDOFF.md, not .env files). Write a commit message following Conventional Commits: `type: short description`. Ask the user to confirm the commit message before creating the commit.

6. **Push:** Ask the user to confirm before pushing: "Ready to push to [branch]?" Push after confirmation.

7. **PR (optional):** If the user wants a PR, use `gh pr create` with a title and body summarising the changes. Ask for confirmation before creating.

Do not use `git add -A` or `git add .` — stage files explicitly by name.
