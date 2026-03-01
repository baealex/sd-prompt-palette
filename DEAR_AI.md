
## 1) Required Read Order
아래 순서대로 읽고 작업을 시작합니다.

1. [.conor/CONOR.md](.conor/CONOR.md)
2. [docs/CODE_CONVENTION.md](docs/CODE_CONVENTION.md)
3. [docs/GIT_CONVENTION.md](docs/GIT_CONVENTION.md)

## 2) Core Execution Rules
- 작업 범위나 변경량이 커지면, 의미 단위로 중간 커밋을 자율적으로 수행하며 진행합니다.
- 요구사항이 애매하거나 판단이 필요한 경우, 먼저 [.conor/CONOR.md](.conor/CONOR.md)와 필요한 페르소나를 참조해서 기준을 맞춥니다.
- 작업 중에는 타입 체크와 린트 체크를 주기적으로 실행하고, 나온 피드백을 반영하면서 진행합니다.
- 기능 완료 전에는 관련 검증(타입/린트/테스트)을 최소 1회 실행하고 결과를 확인합니다.
- pre-commit 훅에서 `guard:agent-rules`와 `guard:ui-contract` 검사를 통과해야 합니다.
- pre-commit 훅의 `biome-format` 자동 수정 결과를 커밋에 포함합니다.

## 3) Absolute Do-Not Rules
아래 항목은 예외 없이 금지합니다.

- 필수 문서(`.conor/CONOR.md`, `docs/CODE_CONVENTION.md`, `docs/GIT_CONVENTION.md`)를 읽기 전에 파일 수정/명령 실행/결론 보고를 하지 않습니다.
- 요구사항 범위를 벗어난 파일을 임의로 수정하지 않습니다.
- 훅/가드레일/검증을 우회하거나 비활성화하지 않습니다.
- `lint`/`typecheck`/테스트 실패 상태를 "완료"로 보고하지 않습니다.
- 에러 로그를 생략하거나 실패 원인을 숨기지 않습니다.
- 의존성 변경 없이 lockfile만 수정하거나, lockfile 갱신 없이 의존성만 수정하지 않습니다.
- 사용자 명시 요청 없이 `git reset --hard`, `git checkout --`, 강제 푸시 등 파괴적 명령을 사용하지 않습니다.
