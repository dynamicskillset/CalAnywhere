---
name: catchup
description: Orient yourself at the start of a new session
---

Orient yourself at the start of a new session.

1. Read HANDOFF.md to understand what was accomplished last session and what's next.
2. Read STATE.md to get the current status of all components.
3. Run `git status` and `git log --oneline -5` to confirm the current branch and any uncommitted changes.
4. Check for upstream debt: run `git log --oneline upstream/main..HEAD -- backend/ frontend/` to see if any changes to core files haven't been contributed to upstream yet. Note any uncontributed changes.
5. Summarise in 3-5 bullet points: what was done, what's next, any upstream debt, and any blockers to be aware of.
6. Ask if there's anything specific to focus on, or proceed with "what's next" from HANDOFF.md.
