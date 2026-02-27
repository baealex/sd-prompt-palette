-- CreateTable
CREATE TABLE "LiveSyncConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "watchDir" TEXT NOT NULL,
    "ingestMode" TEXT NOT NULL DEFAULT 'copy',
    "deleteSourceOnDelete" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default config row
INSERT OR IGNORE INTO "LiveSyncConfig" (
    "id",
    "watchDir",
    "ingestMode",
    "deleteSourceOnDelete",
    "enabled",
    "updatedAt"
) VALUES (
    1,
    'watch',
    'copy',
    false,
    false,
    CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LiveSyncSourceLink" (
    "imageId" INTEGER NOT NULL PRIMARY KEY,
    "sourcePath" TEXT NOT NULL,
    CONSTRAINT "LiveSyncSourceLink_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
