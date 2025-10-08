/*
  Warnings:

  - A unique constraint covering the columns `[operationId]` on the table `Video` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Video_operationId_key" ON "Video"("operationId");
