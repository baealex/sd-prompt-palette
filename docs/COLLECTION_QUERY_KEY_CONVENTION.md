# 2026-03-02 Collection Query Key Convention

## Goal

- Keep collection-related cache keys predictable and composable.
- Avoid broad invalidation (`['collections']`) when only part of cache should refresh.

## Key Factory

- Source: `packages/client/src/features/collection/query-keys.ts`
- Root namespace: `['collections']`
- Fixed groups:
  - `collectionQueryKeys.modelOptions()` -> `['collections', 'model-options']`
  - `collectionQueryKeys.listRoot()` -> `['collections', 'list']`
  - `collectionQueryKeys.showcaseRoot()` -> `['collections', 'showcase']`
- Parametric keys:
  - `collectionQueryKeys.list({ ...filters, page, limit })`
  - `collectionQueryKeys.showcase({ theme, ...filters, page?, limit? })`

## Convention Rules

1. All new collection query keys must be added through `collectionQueryKeys`.
2. Key segment order is fixed: `domain -> feature -> filters -> paging`.
3. Do not build ad-hoc literal keys in hooks/components.
4. Invalidation should target the smallest stable root that matches the event scope.
5. Use `exact: true` only when refreshing one specific key.

## Invalidation Policy

- Live image ingest/update:
  - Invalidate `listRoot` with `exact: false`
  - Invalidate `showcaseRoot` with `exact: false`
  - Invalidate `modelOptions` with `exact: true`
- Avoid invalidating `collectionQueryKeys.all()` for routine updates.

## Migration Notes

- If a new filter is added, update both:
  - key input type (`CollectionFilterKeyInput`)
  - key builder argument order in list/showcase keys
- Filter order changes are cache-breaking and should be treated as intentional.
