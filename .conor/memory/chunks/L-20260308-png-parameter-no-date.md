---
type: learning
date: 2026-03-08
tags: [backend, metadata, datetime]
refs: []
---
**Finding**: A sample SD PNG (`parameters` text chunk) had no embedded creation date, so the pipeline had to rely on filesystem timestamps.
**Cause**: The PNG contained one `tEXt` chunk (`parameters`) with prompt/style content only and no year/date token or EXIF date tags.
**Fix**: Date selection now aggregates all available timestamp candidates (EXIF + atime/mtime/ctime/birthtime and ms fields) and picks the minimum valid timestamp.
**File**: packages/server/src/modules/live-images.utils.ts, packages/server/src/modules/live-images.utils.test.ts
