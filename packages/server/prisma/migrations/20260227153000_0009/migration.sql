-- CreateTable
CREATE TABLE "ImageMeta" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "imageId" INTEGER NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'unknown',
    "prompt" TEXT,
    "negativePrompt" TEXT,
    "model" TEXT,
    "modelHash" TEXT,
    "baseSampler" TEXT,
    "baseScheduler" TEXT,
    "baseSteps" INTEGER,
    "baseCfgScale" REAL,
    "baseSeed" TEXT,
    "upscaleSampler" TEXT,
    "upscaleScheduler" TEXT,
    "upscaleSteps" INTEGER,
    "upscaleCfgScale" REAL,
    "upscaleSeed" TEXT,
    "upscaleFactor" REAL,
    "upscaler" TEXT,
    "sizeWidth" INTEGER,
    "sizeHeight" INTEGER,
    "clipSkip" INTEGER,
    "vae" TEXT,
    "denoiseStrength" REAL,
    "createdAtFromMeta" DATETIME,
    "parseWarningsJson" TEXT NOT NULL DEFAULT '[]',
    "parseVersion" TEXT NOT NULL DEFAULT '',
    "rawJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ImageMeta_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ImageMeta_imageId_key" ON "ImageMeta"("imageId");
