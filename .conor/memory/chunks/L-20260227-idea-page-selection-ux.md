---
type: learning
date: 2026-02-27
tags: [frontend, ux, consistency]
refs: []
---
**발견**: Idea 페이지의 기본형 체크박스는 선택 상태 가시성과 터치 사용성(44px)에서 일관성이 부족했다.
**원인**: 도메인 체크박스가 브라우저 기본 input 스타일에 가까워 토큰 기반 UI 계층과 분리되어 있었다.
**해결책**: 체크박스를 카드형 선택 컴포넌트로 재구성하고(선택 강조/포커스 링/메타 정보), 페이지에 선택 카운트·전체선택·필터·빈/로딩 상태를 추가해 흐름을 명확히 했다.
**파일**: packages/client/src/components/domain/Checkbox.tsx, packages/client/src/pages/IdeaPage.tsx
