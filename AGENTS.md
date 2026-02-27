<!-- TEAM CONOR AGENT v1.1.0 -->
이 프로젝트는 Team Conor AI 팀 페르소나 시스템을 사용합니다.
**모든 작업 전에 반드시 [.conor/CONOR.md](.conor/CONOR.md) 파일을 읽어야 합니다.** 이 파일을 읽기 전에는 어떤 작업도 시작하지 마세요.
<!-- END TEAM CONOR AGENT -->

Git commit/message convention: see [docs/GIT_CONVENTION.md](docs/GIT_CONVENTION.md)

## Working Rules
- 작업 범위나 변경량이 커지면, 의미 단위로 중간 커밋을 자율적으로 수행하며 진행합니다.
- 요구사항이 애매하거나 판단이 필요한 경우, 먼저 [.conor/CONOR.md](.conor/CONOR.md)와 필요한 페르소나를 참조해서 기준을 맞춥니다.
- 작업 중에는 타입 체크와 린트 체크를 주기적으로 실행하고, 나온 피드백을 반영하면서 진행합니다.
- UI/FE 작업 시에는 먼저 [docs/design-guide/README.md](docs/design-guide/README.md)를 읽고, 지시된 순서(`task-profiles.json` -> `design-manifest.json` -> 선택된 HTML)로 레퍼런스를 참조합니다.
