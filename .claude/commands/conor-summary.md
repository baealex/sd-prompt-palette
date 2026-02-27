메모리 chunks에서 summary.md를 자동 갱신합니다.

다음 명령을 실행하세요:

```bash
npx team-conor summary
```

이 명령은 `.conor/memory/chunks/` 디렉토리의 모든 chunk 파일을 읽고,
타입별로 그룹화하여 `.conor/memory/summary.md` 인덱스를 자동 생성합니다.
