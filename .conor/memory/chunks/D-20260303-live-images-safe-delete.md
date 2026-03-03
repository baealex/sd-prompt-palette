---
type: decision
date: 2026-03-03
tags: [backend, live-images, transaction]
refs: []
---
**상황**: `deleteCollection` 이후 orphan 이미지 정리 시 동시성 레이스로 데이터 손실 위험이 있었다.
**결정**: `deleteImageAndRelationsIfOrphan` 트랜잭션 경로를 도입하고 collection 삭제는 `models.$transaction`으로 고정했다.
**근거**: orphan 판정과 연관 삭제를 같은 DB 경계에서 처리해 stale count 기반 오삭제 가능성을 줄인다.
**배운 것**: 삭제 플로우는 "판정과 실행"이 분리되면 레이스가 생기므로 조건부 삭제를 원자화해야 한다.
