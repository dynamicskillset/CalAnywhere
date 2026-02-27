---
name: techdebt
description: Identify and address safe technical debt
---

Identify and address safe technical debt in the current codebase.

Safe technical debt means: changes that improve code quality without altering behaviour or breaking things.

1. **Scan for opportunities** in recently touched files:
   - Duplicate code that could be a shared utility
   - Overly complex functions that could be simplified
   - TODO/FIXME comments that are now addressable
   - Dependencies that are unused or could be replaced by built-ins
   - Type annotations that are missing or imprecise (`any` types)
   - Console.log statements left from debugging

2. **Prioritise by impact:** Focus on things that will cause confusion or bugs if left.

3. **For each item found:** Describe it, assess risk, and ask before making any change that touches core logic.

4. **After changes:** Run `/review` to confirm nothing was broken.

Do not refactor for its own sake — only address debt that has a clear benefit.
