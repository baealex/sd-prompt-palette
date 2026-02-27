-- AlterTable
ALTER TABLE "Image" ADD COLUMN "fileCreatedAt" DATETIME;
ALTER TABLE "Image" ADD COLUMN "fileModifiedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Image_fileCreatedAt_idx" ON "Image"("fileCreatedAt");
CREATE INDEX "Image_fileModifiedAt_idx" ON "Image"("fileModifiedAt");
