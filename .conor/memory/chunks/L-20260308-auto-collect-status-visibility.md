---
type: learning
date: 2026-03-08
tags: [frontend, realtime, ux]
refs: []
---
**Finding**: Auto Collect progress feedback was easy to miss because it appeared only briefly during active syncing.
**Cause**: The UI was tied mostly to transient `syncing` state and did not persist `syncScanned` / `syncUpdatedAt` in visible copy.
**Fix**: Persist realtime sync fields in state and show a continuous summary with last scanned count and last sync time on the control card.
**File**: packages/client/src/features/collection/use-auto-collect-control.ts, packages/client/src/components/domain/CollectionRealtimeControl.tsx
