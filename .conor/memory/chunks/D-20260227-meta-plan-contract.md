---
type: decision
date: 2026-02-27
tags: [metadata, architecture, api]
refs: []
---
**Context**: Metadata expansion plan had conflicts across ingest safety, data ownership, and API transport.
**Options**: 1) Extend Collection only 2) ImageMeta 1:1 + REST only 3) ImageMeta 1:1 + GraphQL summary + REST detail.
**Persona Input**: Steve required clear separation of editable prompt vs generated metadata; Viktor/Yuna prioritized delete safety and N+1 avoidance.
**Decision**: Use ImageMeta 1:1, make ingest non-blocking, and adopt GraphQL summary plus REST detail.
**Rationale**: This separates user-edited text from generated metadata and avoids collection-page performance regressions.
**Learning**: Lock ingest invariants and data boundaries before parser depth to prevent regressions.
