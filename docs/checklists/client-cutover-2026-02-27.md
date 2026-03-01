# Client Cutover Checklist (2026-02-27)

## 1) Scope
- Target runtime frontend: `packages/client`
- Legacy frontend kept as reference only: `packages/legacy-client`
- Routes in scope:
  - `/`
  - `/idea`
  - `/collection`
  - `/collection/gallery`
  - `/collection/slide-show`
  - `/collection/:id`
  - `/image-load`

## 2) Automated Checks
- [x] `pnpm --filter @ocean-palette/client run typecheck`
- [x] `pnpm --filter @ocean-palette/client run test`
- [x] `pnpm --filter @ocean-palette/client run build`
- [x] `pnpm --filter @ocean-palette/server exec tsc --noEmit`
- [ ] `pnpm --filter @ocean-palette/server run build` (blocked: Prisma engine file rename EPERM on Windows host)

## 3) Route Parity (Manual)
- [ ] `/` Home: category/keyword create-rename-delete, DnD reorder, copy/view/remove action parity
- [ ] `/idea`: category-select random generation parity
- [ ] `/collection`: list/search/infinite scroll/realtime update parity
- [ ] `/collection/gallery`: query + infinite scroll + realtime update parity
- [ ] `/collection/slide-show`: fullscreen route + randomized playback + play/pause parity
- [ ] `/collection/:id`: detail view rename/delete/copy parity
- [ ] `/image-load`: prompt parse/upload/save-to-collection/copy action parity

## 4) Performance Smoke (Manual)
- [ ] Initial page load and route transition feel acceptable on desktop
- [ ] Collection list/gallery incremental load is stable under rapid scroll
- [ ] Realtime refresh does not trigger noisy repeated refetch loops

## 5) Mobile Layout (Manual)
- [ ] Header/navigation layout is usable on small screens
- [ ] Home page keyword/category cards remain readable and operable
- [ ] Collection list/gallery controls and cards remain usable on touch
- [ ] ImageLoad core actions are reachable without layout break

## 6) Keyboard and A11y (Manual)
- [ ] Primary flows work with keyboard-only navigation
- [ ] Visible focus indicators on interactive controls
- [ ] Dialog open/close and focus return behavior is correct
- [ ] Collection and ImageLoad action controls expose proper semantics

## 7) Notes
- Realtime collection refresh path is now socket-driven (`live:images`) with React Query invalidation.
- Vite dev proxy includes `/socket.io` with `ws: true` for both client variants.

## 8) Legacy Removal Progress
- [x] Root default scripts switched to client flow (`dev`, `start`, `lint`, `test`)
- [x] CI switched to client mandatory path
- [x] Server static path switched to `../client/dist`
- [x] Docker client build/copy switched to `packages/client`
- [x] `packages/legacy-client` removed
- [x] No active `legacy-client`/`svelte` references in runtime/build/CI files
