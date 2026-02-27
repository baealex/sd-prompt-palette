# DESIGN GUIDE (AI EXECUTION CONTRACT)

## 0) Mission
- 이 문서는 UI/FE 작업을 위한 **실행 계약**입니다.
- 목표는 "멋진 화면"이 아니라 "**프롬프트를 빠르고 정확하게 만드는 작업 UX**"입니다.
- 이 문서 규칙을 어기면 결과물은 실패로 간주합니다.

## 1) Mandatory Read Order
아래 순서를 **반드시** 지키세요.
1. `docs/design/DESIGN_GUIDE.md`
2. `docs/design/design-2017-fluent.html`
3. `docs/design/design-2018-material-2.html`

## 2) Active Design Baseline
- design profile: `dashboard_enterprise`
- design refs: `design-2017-fluent`, `design-2018-material-2`
- baseline policy:
  - 정보 구조/가독성/밀도 제어는 Material 2 기준
  - 상호작용 피드백과 깊이감은 Fluent를 약하게 차용
  - 과장된 시각 효과보다 안정적 사용성을 우선

## 3) Hard Constraints (절대 금지)
다음 항목은 **무조건 금지**입니다.

1. 원격 레퍼런스 직접 의존 금지
- `https://raw.githubusercontent.com/...`를 기본 레퍼런스로 다시 사용하지 마세요.
- 반드시 `docs/design` 로컬 파일을 기준으로 판단하세요.

2. 브라우저 기본 대화상자 금지
- `window.alert`, `window.prompt`, `window.confirm` 사용 금지.
- 반드시 인앱 `Dialog` 또는 인라인 편집 UI로 대체하세요.

3. 모바일 1차 내비 숨김 금지
- 핵심 메뉴를 햄버거 안에만 넣지 마세요.
- 모바일에서도 1차 목적지는 항상 보이게 두세요.

4. 터치 타깃 축소 금지
- 주요 액션을 `44x44px` 미만으로 만들지 마세요.
- 작고 촘촘한 아이콘 버튼 남발 금지.

5. 무반응 UI 금지
- 복사/저장/삭제/실패 후 피드백이 없으면 안 됩니다.
- 최소 토스트/배너/버튼 상태 변화 중 하나는 반드시 제공하세요.

6. 상태 누락 금지
- 로딩/에러/빈 상태 중 하나라도 빠지면 안 됩니다.
- 사용자가 "지금 무슨 상태인지" 모르게 만들지 마세요.

7. 색상만으로 의미 전달 금지
- 성공/실패/경고를 색상만으로 표현하지 마세요.
- 텍스트/아이콘/패턴을 같이 제공하세요.

8. 패턴 불일치 금지
- 같은 동작(삭제, 저장, 편집)을 페이지마다 다른 UX로 만들지 마세요.
- 동일한 의미는 동일한 컴포넌트/패턴으로 통일하세요.

9. 섹션 전역 기능의 페이지 종속 금지
- 컬렉션 전역 설정(예: Realtime Settings)을 특정 뷰(List)에만 두지 마세요.
- 같은 섹션의 핵심 뷰(List/Grid)에서 동일하게 접근 가능해야 합니다.

## 4) Allowed And Recommended (해도 되는 것)
다음은 허용/권장 항목입니다.

1. 레이아웃과 위계
- 카드 기반 구조, 명확한 섹션 구분, 얇은 경계선 사용
- 1차 액션을 상단/우측 등 인지 쉬운 위치에 고정

2. 디자인 토큰
- 반경 체계: `4 / 8 / 16`
- 중립 배경 + 흰 표면 + 절제된 그림자
- 기존 브랜드 컬러(`brand`) 유지, 의미색은 기능적 용도만 사용

3. 타이포그래피
- 본문은 가독성 최우선
- 강조 텍스트는 제한적으로 사용
- 제목/본문 대비로 정보 위계를 만든다

4. 인터랙션
- 전환 시간 `150-220ms` 권장
- hover/press/focus 상태를 모두 정의
- 장식 모션보다 상태 전달 모션 우선

5. 접근성
- 키보드 포커스 가시성 유지(`focus-visible`)
- 의미 있는 ARIA/시맨틱 태그 사용
- 대비와 클릭 영역을 항상 검증

## 4.1) Tailwind Token Contract (필수)
UI/FE 구현 시 아래 토큰 계층을 기준으로 작성합니다.

1. semantic color
- `bg`, `surface.*`, `ink.*`, `line.*`를 우선 사용
- `brand.*`는 포인트 액션(Primary/Active/Focus)에만 사용
- 상태 색상은 `info/success/warning/danger`만 사용

2. radius and shadow
- 반경은 `rounded-token-sm | rounded-token-md | rounded-token-lg`만 사용
- 그림자는 `shadow-surface | shadow-raised | shadow-overlay`만 사용

3. global utility
- 포커스는 `ui-focus-ring` 사용
- 아이콘/터치 타깃은 `ui-touch` 또는 동등 크기(최소 44x44) 유지

## 4.2) Atomic Component Contract (필수)
페이지/도메인 컴포넌트는 아래 원자 컴포넌트를 우선 사용합니다.

1. input and actions
- 버튼: `components/ui/Button`
- 아이콘 버튼: `components/ui/IconButton`
- 텍스트 입력: `components/ui/Input`

2. structure and state
- 카드/서피스: `components/ui/Card`
- 배지: `components/ui/Badge`
- 상태 메시지: `components/ui/Notice`

3. blocking interactions
- 확인 모달: `components/ui/ConfirmDialog`
- 텍스트 입력 모달: `components/ui/PromptDialog`

4. usage rule
- 동일한 의미의 UI는 동일한 atomic 컴포넌트를 사용
- 페이지에서 raw class로 버튼/인풋/알림을 새로 정의하지 않음
- 예외가 필요하면 먼저 가이드에 예외 사유를 기록

## 4.3) Collection UX Rule (필수)
1. 검색
- List/Grid 검색은 공통 컴포넌트(동일 입력 패턴, 동일 버튼, 동일 clear 동작)를 사용합니다.
- 검색은 키보드 Enter와 버튼 클릭 모두 지원해야 합니다.

2. realtime control
- Realtime Settings와 Sync Now는 컬렉션 전역 컨트롤로 취급합니다.
- 최소 List/Grid 양쪽에서 동일한 위치/패턴으로 노출합니다.

## 5) Execution Plan (Current)
1. P0 - Flow Fix
- prompt/confirm 패턴 제거
- 인앱 다이얼로그 + 성공/실패 피드백 도입

2. P1 - Navigation And Touch
- 모바일 1차 내비 상시 노출 구조 적용
- 소형 액션 버튼 타깃 확장

3. P2 - Visual System Cleanup
- 카드/버튼/배지 위계 통일
- 페이지 문구를 사용자 작업 중심으로 정리

## 6) Output Contract (항상 포함)
UI/FE 결과 보고에는 아래 3줄을 반드시 포함하세요.
- `design profile: <taskProfileId>`
- `design refs: <slug1>, <slug2>`
- `applied decisions: <3-6 concrete points>`

## 7) Final Checklist
작업 종료 전 아래를 모두 체크하세요.
- [ ] `DESIGN_GUIDE.md` + 지정 HTML 2개를 읽고 시작했다.
- [ ] 금지 규칙(Hard Constraints) 위반이 없다.
- [ ] 1차 액션이 즉시 보이고, 부가 액션은 분리되어 있다.
- [ ] 로딩/에러/빈 상태가 모두 존재한다.
- [ ] 복사/저장/삭제 결과 피드백이 즉시 보인다.
- [ ] 모바일에서 1차 내비가 숨겨지지 않는다.
- [ ] 주요 터치 타깃이 44x44 이상이다.
- [ ] 색상 외 수단(텍스트/아이콘)으로 상태를 전달한다.
- [ ] 결과 보고에 Output Contract 3줄이 포함되어 있다.

## 8) Image Load UX Rule (Required)
- Use `components/ui/FileInput` for image upload interactions in Image Load flows.
- Use product naming that SD users can identify quickly (`Prompt Info`), not file-type-only naming (`PNG Info`).
- Always show selected file name and local image preview before saving.
- Render prompt/negative prompt as full raw text blocks; do not tokenize by comma for display.
- Do not expose a separate manual upload action in this flow; primary action is save-to-collection.
- The `Clear` action must reset preview and page state together (`base64`, parsed prompt, uploaded image, saved collection id, error).
- Do not use raw `<input type="file">` directly in page-level components.

## 9) Feedback Rule (Required)
- Use toast notifications for transient feedback (`copy`, `save`, `remove`, and `error`), especially on long/scrollable pages.
- Avoid inline status banners for short-lived feedback because they cause layout shift and are easy to miss.

## 10) Collection Pagination Rule (Required)
- Collection List and Collection Grid must use numbered pagination with explicit controls.
- Use URL query state for pagination (`page`) so back/forward navigation restores the exact list state.
- Infinite scroll and scroll-bottom auto-fetch are forbidden on collection browsing surfaces.
