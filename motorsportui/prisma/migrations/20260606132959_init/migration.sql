-- CreateTable
CREATE TABLE "Lap" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lapNumber" INTEGER NOT NULL,
    "driverName" TEXT,
    "circuitName" TEXT,
    "car" TEXT,
    "isBestLap" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "TelemetryPacket" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "packetId" INTEGER NOT NULL,
    "lapId" INTEGER NOT NULL,
    "gas" DECIMAL NOT NULL,
    "brake" DECIMAL NOT NULL,
    "fuel" DECIMAL NOT NULL,
    "gear" INTEGER NOT NULL,
    "rpms" INTEGER NOT NULL,
    "steerAngle" DECIMAL NOT NULL,
    "speedKmh" DECIMAL NOT NULL,
    "lapNumber" INTEGER NOT NULL,
    "time" INTEGER NOT NULL,
    CONSTRAINT "TelemetryPacket_lapId_fkey" FOREIGN KEY ("lapId") REFERENCES "Lap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
