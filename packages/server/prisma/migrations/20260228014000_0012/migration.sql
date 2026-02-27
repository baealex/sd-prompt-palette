-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Image" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "url" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Image" (
    "id",
    "url",
    "hash",
    "width",
    "height",
    "createdAt",
    "generatedAt"
)
SELECT
    "id",
    "url",
    "hash",
    "width",
    "height",
    "createdAt",
    COALESCE(
        CASE
            WHEN "fileCreatedAt" IS NULL AND "fileModifiedAt" IS NULL THEN NULL
            WHEN "fileCreatedAt" IS NULL THEN "fileModifiedAt"
            WHEN "fileModifiedAt" IS NULL THEN "fileCreatedAt"
            WHEN "fileCreatedAt" <= "fileModifiedAt" THEN "fileCreatedAt"
            ELSE "fileModifiedAt"
        END,
        "createdAt"
    ) AS "generatedAt"
FROM "Image";
DROP TABLE "Image";
ALTER TABLE "new_Image" RENAME TO "Image";
CREATE UNIQUE INDEX "Image_url_key" ON "Image"("url");
CREATE UNIQUE INDEX "Image_hash_key" ON "Image"("hash");
CREATE INDEX "Image_generatedAt_idx" ON "Image"("generatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
