---
type: decision
date: 2026-02-27
tags: [frontend, ux, live-collect]
refs: []
---
**Context**: Collection control used technical `Realtime` labels and modal-first activation, slowing discoverability and enable flow.
**Options**: 1) Rename labels only 2) Add immediate toggle and redesign settings IA in one modal.
**Decision**: Keep API unchanged and implement Option 2 with `Auto Collect` naming, top-level toggle, single-modal folder browsing, and unified feedback.
**Rationale**: This improves activation speed and comprehension while preserving rollback safety through UI-only changes.
**Learning**: UX friction in operational controls is often reduced fastest by direct actions + constrained IA before backend redesign.
