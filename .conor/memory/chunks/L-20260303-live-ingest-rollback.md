---
type: learning
date: 2026-03-03
tags: [backend, ingest, rollback]
refs: []
---
**발견**: 라이브 인제스트에서 `registerLibraryFile` 실패 시 copy/move 후 파일이 롤백되지 않아 고아 파일이 남았다.
**원인**: `ingestSourceToLibrary`가 파일 이동/복사와 DB 등록을 단일 예외 처리 경계로 묶지 않았다.
**해결책**: 실패 시 copy 모드는 destination 삭제, move 모드는 source 복구(`moveFile(destination, source)`)를 수행하도록 롤백 로직을 추가했다.
**파일**: packages/server/src/modules/live-images.ingest.ts
