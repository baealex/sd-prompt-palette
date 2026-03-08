---
type: learning
date: 2026-03-08
tags: [frontend, ux, auto-collect]
refs: []
---
**Finding**: On first `Browse Server` click in Auto Collect settings, users could see an empty folder list and hesitate.
**Cause**: The first directory API response can return only `roots` while `currentPath` and `directories` are empty, and the UI rendered that state directly.
**Fix**: If first load has no `currentPath` but has roots, auto-open the first root so folders appear immediately.
**File**: packages/client/src/features/collection/use-auto-collect-control.ts
