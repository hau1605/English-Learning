/*
  Warnings:

  - A unique constraint covering the columns `[fileKey]` on the table `media_files` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "media_files_fileKey_key" ON "media_files"("fileKey");
