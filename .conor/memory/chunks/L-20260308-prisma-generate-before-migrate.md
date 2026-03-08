---
type: learning
date: 2026-03-08
tags: [prisma, typescript, server]
refs: []
---
**발견**: 서버 실행 경로에서 Prisma Client 생성이 보장되지 않으면 타입 불일치 에러가 재발할 수 있다.
**원인**: `dev/start/test`는 `migrate deploy`만 호출하고 `prisma generate`를 항상 선행하지 않았다.
**해결책**: 공통 DB 초기화 함수에서 `generate` 후 `migrate deploy` 순서로 실행하고, Prisma 바이너리 경로를 패키지/워크스페이스 후보에서 탐색하도록 보강했다.
**파일**: packages/server/script/shared.ts
