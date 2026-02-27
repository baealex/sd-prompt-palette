# Git Convention

## Commit Message Format
Use this format:

`<emoji> <imperative summary>`

- Write summary in English.
- Start with a verb (`Add`, `Update`, `Fix`, `Refactor`, `Remove`, `Move`).
- Keep the first line short (about 50-72 chars).
- Focus on one logical change per commit.

Examples:

- `⭐ Add realtime sync ingest and server directory browser`
- `📦 Update script order`
- `🐛 Fix Prisma client generation before dev startup`

## Emoji Guide
- `⭐` feature/user-visible change
- `🐛` bug fix
- `♻️` refactor without behavior change
- `📦` build/dependency/workspace/config change
- `📝` docs only
- `🚚` file/folder move or rename
- `🔥` remove code/files

## Commit Body (Optional)
Add a body when needed:

- Why the change was needed
- Key implementation details
- Migration or rollback notes

Example:

```
📦 Migrate to pnpm workspace package layout

- Move server to packages/server
- Move existing client to packages/legacy-client
- Add workspace root scripts for parallel dev/start
```

## Practical Rules
- Do not mix unrelated changes in one commit.
- Commit generated lockfile changes with dependency updates.
- Prefer small commits that pass local checks.
- Reference issues/tickets in body or footer when available.
