<!-- TEAM CONOR AGENT v1.1.0 -->
이 프로젝트는 Team Conor AI 팀 페르소나 시스템을 사용합니다.
**모든 작업 전에 반드시 [.conor/CONOR.md](.conor/CONOR.md) 파일을 읽어야 합니다.** 이 파일을 읽기 전에는 어떤 작업도 시작하지 마세요.
<!-- END TEAM CONOR AGENT -->

## 1) Required Read Order
아래 순서대로 읽고 작업을 시작합니다.

1. [.conor/CONOR.md](.conor/CONOR.md)
3. [docs/CODE_CONVENTION.md](docs/CODE_CONVENTION.md)
4. [docs/GIT_CONVENTION.md](docs/GIT_CONVENTION.md)

## 2) Core Execution Rules
- 작업 범위나 변경량이 커지면, 의미 단위로 중간 커밋을 자율적으로 수행하며 진행합니다.
- 요구사항이 애매하거나 판단이 필요한 경우, 먼저 [.conor/CONOR.md](.conor/CONOR.md)와 필요한 페르소나를 참조해서 기준을 맞춥니다.
- 작업 중에는 타입 체크와 린트 체크를 주기적으로 실행하고, 나온 피드백을 반영하면서 진행합니다.
- 기능 완료 전에는 관련 검증(타입/린트/테스트)을 최소 1회 실행하고 결과를 확인합니다.

## 3) UI/FE Design Reference Rules
UI/FE 작업 시에는 아래 1번 디자인 가이드를 참조합니다.
구체적인 코드가 필요한 경우 2번, 3번 레퍼런스 파일을 참조합니다.

1. `docs/design/DESIGN_GUIDE.md`
2. `docs/design/design-2017-fluent.html`
3. `docs/design/design-2018-material-2.html`

## 4) UI/FE Output Contract
UI/FE 작업 결과에는 아래 항목을 반드시 명시합니다.

- `design profile: <taskProfileId>`
- `design refs: <slug1>, <slug2>`
- `applied decisions: <3-6 concrete points>`
