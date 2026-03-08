---
type: learning
date: 2026-03-08
tags: [frontend, ux, auto-collect]
refs: []
---
**Finding**: In Auto Collect Browse, when a saved watch path no longer exists, the first request returned 404 and the browser looked stuck.
**Cause**: The client showed the error immediately and did not recover to default directory listing after `targetPath` failure.
**Fix**: On 404/400 for a targeted path, retry without a path and render the available roots/directories automatically.
**File**: packages/client/src/features/collection/use-auto-collect-control.ts
