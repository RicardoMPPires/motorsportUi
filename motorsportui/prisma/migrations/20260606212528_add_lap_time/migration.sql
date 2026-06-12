/*
  Warnings:

  - You are about to drop the column `endTime` on the `Lap` table. All the data in the column will be lost.
  - You are about to drop the column `startTime` on the `Lap` table. All the data in the column will be lost.
  - Added the required column `lapTime` to the `Lap` table without a default value. This is not possible if the table is not empty.

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
    "lapTime" REAL NOT NULL
);
INSERT INTO "new_Lap" ("car", "circuitName", "createdAt", "driverName", "id", "isBestLap", "lapNumber") SELECT "car", "circuitName", "createdAt", "driverName", "id", "isBestLap", "lapNumber" FROM "Lap";
DROP TABLE "Lap";
ALTER TABLE "new_Lap" RENAME TO "Lap";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
