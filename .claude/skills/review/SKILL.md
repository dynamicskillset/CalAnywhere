---
name: review
description: Self-check work against CalAnywhere standards
---

Self-check the work done so far against CalAnywhere's standards.

Check each of the following and report pass/fail with brief notes:

1. **TypeScript:** No `any` types used without justification. No TypeScript errors (run `tsc --noEmit` in backend/ and frontend/ if changes were made).
2. **ESLint:** No lint errors in changed files (run `npm run lint` in frontend/ if frontend files changed).
3. **Security:** No user input rendered without sanitisation. No sensitive data logged. URL validation in place for any new URL-fetching code.
4. **Commit style:** Any commits follow Conventional Commits format (`type: description`).
5. **MISTAKES.md:** If a new error pattern was encountered, has it been logged?
6. **State accuracy:** Does STATE.md still accurately reflect component status after today's changes?
7. **Upstream contribution:** Do any changed files in `backend/` or `frontend/` (outside `cloud/`) contain improvements that benefit self-hosters? If yes, classify each as upstream / cloud-only / mixed and note whether an upstream PR has been created or is pending. Run `git log --oneline upstream/main..HEAD -- backend/ frontend/` to check for uncontributed changes.

Report the result of each check. If anything fails, describe what needs fixing.
