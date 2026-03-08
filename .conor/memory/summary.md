# Memory Index

## Decisions
- [D-20260303-live-images-safe-delete](chunks/D-20260303-live-images-safe-delete.md) `deleteCollection` 이후 orphan 이미지 정리 시 동시성 레이스로 데이터 손실 위험이 있었다. | #backend #live-images #transaction (2026-03-03)
- [D-20260228-function-param-guard](chunks/D-20260228-function-param-guard.md) Repeated server-side utilities and handlers were growing with 3+ positional parameters, reducing readability and increasing call-site mistakes. | #backend #guardrails #convention (2026-02-28)
- [D-20260227-auto-collect-ux-control](chunks/D-20260227-auto-collect-ux-control.md) Collection control used technical `Realtime` labels and modal-first activation, slowing discoverability and enable flow. | #frontend #ux #live-collect (2026-02-27)
- [D-20260227-meta-plan-contract](chunks/D-20260227-meta-plan-contract.md) Metadata expansion plan had conflicts across ingest safety, data ownership, and API transport. | #metadata #architecture #api (2026-02-27)
- [D-20260227-react-migration-option-b-tailwind](chunks/D-20260227-react-migration-option-b-tailwind.md) React migration plan needed a fixed cutover path and styling standard. | #frontend #migration #react #tailwind (2026-02-27)

## Learnings
- [L-20260308-auto-collect-browser-first-open](chunks/L-20260308-auto-collect-browser-first-open.md) On first `Browse Server` click in Auto Collect settings, users could see an empty folder list and hesitate. | #frontend #ux #auto-collect (2026-03-08)
- [L-20260308-auto-collect-stale-path-recovery](chunks/L-20260308-auto-collect-stale-path-recovery.md) In Auto Collect Browse, when a saved watch path no longer exists, the first request returned 404 and the browser looked stuck. | #frontend #ux #auto-collect (2026-03-08)
- [L-20260308-auto-collect-status-visibility](chunks/L-20260308-auto-collect-status-visibility.md) Auto Collect progress feedback was easy to miss because it appeared only briefly during active syncing. | #frontend #realtime #ux (2026-03-08)
- [L-20260308-live-image-date-priority](chunks/L-20260308-live-image-date-priority.md) Prioritizing `birthtime` during ingest can shift timestamps to copy time and distort the original capture timeline. | #backend #ingest #datetime (2026-03-08)
- [L-20260308-png-parameter-no-date](chunks/L-20260308-png-parameter-no-date.md) A sample SD PNG (`parameters` text chunk) had no embedded creation date, so the pipeline had to rely on filesystem timestamps. | #backend #metadata #datetime (2026-03-08)
- [L-20260308-prisma-generate-before-migrate](chunks/L-20260308-prisma-generate-before-migrate.md) 서버 실행 경로에서 Prisma Client 생성이 보장되지 않으면 타입 불일치 에러가 재발할 수 있다. | #prisma #typescript #server (2026-03-08)
- [L-20260303-live-ingest-rollback](chunks/L-20260303-live-ingest-rollback.md) 라이브 인제스트에서 `registerLibraryFile` 실패 시 copy/move 후 파일이 롤백되지 않아 고아 파일이 남았다. | #backend #ingest #rollback (2026-03-03)
- [L-20260228-live-images-orchestration-split](chunks/L-20260228-live-images-orchestration-split.md) 서비스 클래스가 500줄을 넘기면 수정 포인트를 찾는 시간이 급격히 늘어난다. | #backend #orchestration #refactor (2026-02-28)
- [L-20260228-live-images-service-split](chunks/L-20260228-live-images-service-split.md) 비대한 서비스 파일은 작은 수정도 넓은 diff를 만들어 시그니처 가드 적용 체감이 나빠진다. | #backend #guardrails #refactor (2026-02-28)
- [L-20260227-idea-page-selection-ux](chunks/L-20260227-idea-page-selection-ux.md) Idea 페이지의 기본형 체크박스는 선택 상태 가시성과 터치 사용성(44px)에서 일관성이 부족했다. | #frontend #ux #consistency (2026-02-27)
