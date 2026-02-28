---
type: learning
date: 2026-02-28
tags: [backend, guardrails, refactor]
refs: [D-20260228-function-param-guard]
---
**발견**: 비대한 서비스 파일은 작은 수정도 넓은 diff를 만들어 시그니처 가드 적용 체감이 나빠진다.
**원인**: 메타데이터 변환/경로 탐색 같은 순수 로직이 서비스 클래스에 함께 누적되어 변경 범위가 과도해졌다.
**해결책**: `live-images.ts`에서 순수 로직을 `live-images.metadata.ts`, `live-images.watch-paths.ts`로 분리하고, 파라미터 가드는 함수 본문이 아닌 시그니처 변경 라인만 검사하도록 조정했다.
**파일**: packages/server/src/modules/live-images.ts, packages/server/src/modules/live-images.metadata.ts, packages/server/src/modules/live-images.watch-paths.ts, scripts/guardrails/check-function-params.mjs
