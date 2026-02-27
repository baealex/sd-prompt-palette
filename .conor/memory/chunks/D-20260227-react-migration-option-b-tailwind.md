---
type: decision
date: 2026-02-27
tags: [frontend, migration, react, tailwind]
refs: []
---
**Context**: React migration plan needed a fixed cutover path and styling standard.
**Options**: 1) In-place replace legacy client 2) New `packages/client` then cutover.
**Persona Input**: Execution and architecture review prioritized reversible cutover and clear runtime path changes.
**Decision**: Adopt Option B (`packages/client` new app, final cutover, then legacy removal) and require Tailwind CSS as primary styling.
**Rationale**: This reduces migration risk, keeps rollback possible, and enforces consistent UI implementation.
**Learning**: Locking cutover topology and styling rules early prevents plan drift across CI/Docker/runtime steps.
