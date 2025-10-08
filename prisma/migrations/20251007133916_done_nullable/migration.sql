-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Video" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL DEFAULT 'tiktok',
    "operationId" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "isPosted" BOOLEAN DEFAULT false,
    "prompt" TEXT NOT NULL,
    "uri" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Video" ("createdAt", "done", "id", "isPosted", "operationId", "prompt", "type", "uri") SELECT "createdAt", coalesce("done", false) AS "done", "id", "isPosted", "operationId", "prompt", "type", "uri" FROM "Video";
DROP TABLE "Video";
ALTER TABLE "new_Video" RENAME TO "Video";
CREATE UNIQUE INDEX "Video_operationId_key" ON "Video"("operationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
