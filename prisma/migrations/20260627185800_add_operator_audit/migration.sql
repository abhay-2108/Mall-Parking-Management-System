-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_operators" ("createdAt", "id", "name", "password", "updatedAt", "username") SELECT "createdAt", "id", "name", "password", "updatedAt", "username" FROM "operators";
DROP TABLE "operators";
ALTER TABLE "new_operators" RENAME TO "operators";
CREATE UNIQUE INDEX "operators_username_key" ON "operators"("username");
CREATE TABLE "new_parking_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleNumberPlate" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "operatorId" TEXT,
    "entryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "billingType" TEXT NOT NULL,
    "billingAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parking_sessions_vehicleNumberPlate_fkey" FOREIGN KEY ("vehicleNumberPlate") REFERENCES "vehicles" ("numberPlate") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parking_sessions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parking_sessions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_parking_sessions" ("billingAmount", "billingType", "createdAt", "entryTime", "exitTime", "id", "slotId", "status", "updatedAt", "vehicleNumberPlate") SELECT "billingAmount", "billingType", "createdAt", "entryTime", "exitTime", "id", "slotId", "status", "updatedAt", "vehicleNumberPlate" FROM "parking_sessions";
DROP TABLE "parking_sessions";
ALTER TABLE "new_parking_sessions" RENAME TO "parking_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
