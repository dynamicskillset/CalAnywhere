---
name: handoff
description: Write end-of-session handoff notes to HANDOFF.md
---

Write end-of-session handoff notes to HANDOFF.md.

Overwrite HANDOFF.md with the following structure (do not append — always replace with the latest session):

```
## Last Session: [today's date]

### What was accomplished
[Bullet list of completed tasks with brief descriptions]

### What's next
[Ordered list of the next immediate tasks, referencing PLAN.md phase if relevant]

### Blockers / Notes
[Any blockers, open decisions, or context that will matter next session. "None" if clean.]

### Context
- Current branch: [output of git branch --show-current]
- Last commit: [output of git log --oneline -1]
- Working tree: [clean / uncommitted changes in X files]
```

After writing the file, confirm the handoff is written and remind the user to start next session with `/catchup`.
