---
type: learning
date: 2026-03-08
tags: [backend, ingest, datetime]
refs: []
---
**Finding**: Prioritizing `birthtime` during ingest can shift timestamps to copy time and distort the original capture timeline.
**Cause**: On many file systems, `birthtime` reflects destination file creation time rather than source creation time.
**Fix**: Normalize fallback order to `EXIF -> mtime -> birthtime`, and align `generatedAt` to the same file-time fallback behavior.
**File**: packages/server/src/modules/live-images.utils.ts, packages/server/src/modules/live-images.utils.test.ts
