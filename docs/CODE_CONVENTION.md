# Code Convention

## Principles
- Readability first: 코드 의도를 빠르게 이해할 수 있어야 합니다.
- Type safety first: `any` 사용은 금지하고, 필요한 경우 명시적으로 타입을 좁힙니다.
- Small units: 함수/컴포넌트는 단일 책임을 유지합니다.
- Export policy: 기본은 `named export`를 사용하고 `default export`는 사용하지 않습니다.

## TypeScript
- `strict` 기준을 유지합니다.
- `any`는 절대 사용하지 않습니다.
- 공개 함수/훅은 입력/출력 타입을 명확히 선언합니다.
- 에러 처리는 `unknown`/`Error` 분기 후 메시지를 다룹니다.

## React
- 페이지(`pages`)는 조합 중심, 로직은 `features`/`modules`로 분리합니다.
- 재사용 UI는 `components/ui`, 도메인 조합은 `components/domain`에 둡니다.
- 상태는 서버 상태와 UI 상태를 분리합니다.
- 컴포넌트 선언은 `const ComponentName = () => {}` 형태를 기본으로 사용합니다.

## Styling
- 기본은 Tailwind 유틸리티 클래스 사용.
- 예외 스타일만 `*.module.css`/`*.module.scss` 사용.
- 접근성(포커스, 키보드, ARIA)을 기본 요구사항으로 봅니다.

## Naming
- 파일: `kebab-case` (예: `use-home-overview.ts`)
- React 컴포넌트: `PascalCase`
- 변수/함수: `camelCase`
- 상수: `UPPER_SNAKE_CASE` (전역 상수/환경값)

## Testing and Checks
- 변경 중 주기적으로 `typecheck`와 `lint`를 실행합니다.
- 기능 완료 전 최소 1회 관련 테스트/검증 명령을 실행합니다.
- `lint`는 Biome 기준으로 실행합니다.
- 기본 포맷/정렬은 Biome 자동 수정(`biome format --write`)을 우선 사용합니다.
