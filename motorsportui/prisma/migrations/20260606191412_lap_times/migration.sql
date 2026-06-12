/*
  Warnings:

  - Added the required column `startTime` to the `Lap` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Lap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lapNumber" INTEGER NOT NULL,
    "driverName" TEXT,
    "circuitName" TEXT,
    "car" TEXT,
    "isBestLap" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME
);
INSERT INTO "new_Lap" ("car", "circuitName", "createdAt", "driverName", "id", "isBestLap", "lapNumber") SELECT "car", "circuitName", "createdAt", "driverName", "id", "isBestLap", "lapNumber" FROM "Lap";
DROP TABLE "Lap";
ALTER TABLE "new_Lap" RENAME TO "Lap";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
