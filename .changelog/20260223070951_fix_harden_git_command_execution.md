---
type: Fix
---

Harden internal Git command execution by running `diff`, `push`, `checkout`, `close`, `commit`, and `sync` commands without shell interpolation, so command arguments are treated as literal values.
