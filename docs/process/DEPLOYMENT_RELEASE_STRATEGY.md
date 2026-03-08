# Ocean Palette Deployment and Release Strategy

Updated: 2026-03-08

## 1. Scope
- This document defines deployment and operational release rules for `ocean-palette`.
- Current policy: **npm distribution is not used** for this project.

## 2. Deployment Channels (Current)
1. DockerHub image (primary)
- Image: `baealex/ocean-palette`
- Active tag policy: `latest` only
- Architectures: `linux/amd64`, `linux/arm64/v8`

2. Source-based run (local or self-managed host)
- `pnpm install && pnpm start`
- `pnpm start` runs client build and then starts server.

## 3. CI/CD Topology (As-Is)
1. CI workflow
- File: `.github/workflows/CI.yml`
- Triggers:
  - `push` to `main` (path-filtered)
  - `pull_request` to `main` (path-filtered)
  - `workflow_dispatch`
- Runtime: Node `21.x`
- Gates:
  - Server: lint, test, build
  - Client: lint, typecheck, react-compiler healthcheck, test, build

2. Image build workflow
- File: `.github/workflows/BUILD_IMAGE.yml`
- Trigger: `workflow_run` after `CI` on `main` with `success`
- Action: build and push Docker image from `packages/server/Dockerfile`
- Published tag: `baealex/ocean-palette:latest`

3. Important implication
- There is no `v*` tag-based release workflow.
- Merging validated changes into `main` is the deploy trigger for `latest`.

## 4. Runtime and Data Contracts
1. App port
- Container app port: `3332`
- Example host mapping in `docker-compose.yml`: `3000:3332`

2. Persistent volumes
- `/data`: database persistence
- `/assets`: image/static assets persistence

3. Startup migration behavior
- Server start path runs `prisma generate` and `prisma migrate deploy` before app boot.
- Any deployment target must provide writable persistent volume for DB files.

## 5. Deployment Runbook
1. Docker (recommended)
```bash
docker run \
  -v ./data:/data \
  -v ./assets:/assets \
  -p 3332:3332 \
  baealex/ocean-palette:latest
```

2. Docker Compose
```bash
docker compose up -d
```
- Uses `docker-compose.yml` image `baealex/ocean-palette` (default tag: `latest`).

3. Source run
```bash
pnpm install
pnpm start
```

## 6. Rollback Strategy (Latest-Only Policy)
1. Recommended for production-like environments
- Record image digest after each deployment.
- Deploy by digest for reproducibility:
  - `baealex/ocean-palette@sha256:<digest>`

2. If digest was not recorded
- Rollback reproducibility is limited with `latest`-only policy.
- Revert application changes in `main`, let CI pass, then let `BUILD IMAGE` publish a new `latest`.

## 7. Pre-Merge and Deploy Guardrails
1. Before merge to `main`
- CI checks for changed scope must pass.
- Confirm migration impact and data compatibility.

2. Before applying new container in production-like host
- Backup mounted `./data` volume.
- Confirm writable mount permissions for `/data` and `/assets`.

3. After deployment
- Verify container health and startup logs.
- Open the service URL and confirm core user flows (home, collection, image metadata read).

## 8. Required Secrets
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

## 9. Out of Scope (Current Policy)
- npm package publishing
- npm trusted publishing / OIDC release pipeline
- GitHub Releases auto-notes workflow
