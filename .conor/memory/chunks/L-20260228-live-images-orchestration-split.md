---
type: learning
date: 2026-02-28
tags: [backend, orchestration, refactor]
refs: [L-20260228-live-images-service-split]
---
**발견**: 서비스 클래스가 500줄을 넘기면 수정 포인트를 찾는 시간이 급격히 늘어난다.
**원인**: watcher 초기화/ingest I/O/라이브러리 DB 반영 책임이 단일 파일에 결합되어 변경이 서로 전파됐다.
**해결책**: `live-images.ts`를 오케스트레이션 중심으로 두고 `live-images.library-manager.ts`, `live-images.watcher-runtime.ts`, `live-images.ingest.ts`로 역할을 분리해 책임 경계를 명시했다.
**파일**: packages/server/src/modules/live-images.ts, packages/server/src/modules/live-images.library-manager.ts, packages/server/src/modules/live-images.watcher-runtime.ts, packages/server/src/modules/live-images.ingest.ts
