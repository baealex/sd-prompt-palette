---
type: decision
date: 2026-02-28
tags: [backend, guardrails, convention]
refs: []
---
**Context**: Repeated server-side utilities and handlers were growing with 3+ positional parameters, reducing readability and increasing call-site mistakes.
**Options**: 1) Rely on review discipline only 2) Enforce object-parameter convention with an automated staged-file guard.
**Decision**: Adopt Option 2 by adding a pre-commit guard that blocks changed functions with 3+ parameters and requests a single object parameter.
**Rationale**: Automated enforcement keeps the rule consistent without manual policing and limits migration noise by checking changed hunks only.
**Learning**: Convention guards are most practical when scoped to staged diffs, so teams can incrementally converge on cleaner signatures.
