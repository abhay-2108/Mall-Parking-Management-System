-- CreateTable
CREATE TABLE "malls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mallId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "multiplier" REAL NOT NULL DEFAULT 1.0,
    "daysOfWeek" TEXT,
    "timeStart" TEXT,
    "timeEnd" TEXT,
    "dateStart" DATETIME,
    "dateEnd" DATETIME,
    "minOccupancyPct" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pricing_rules_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "holidays" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mallId" TEXT,
    "name" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "multiplier" REAL NOT NULL DEFAULT 1.5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "holidays_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "mallId" TEXT,
    "sessionId" TEXT,
    "slotType" TEXT NOT NULL,
    "entryTime" DATETIME NOT NULL,
    "exitTime" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "paymentId" TEXT,
    "qrCode" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "parking_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operatorId" TEXT,
    "mallId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "createdAt", "details", "id", "operatorId") SELECT "action", "createdAt", "details", "id", "operatorId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE TABLE "new_operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "mallId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "operators_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_operators" ("createdAt", "id", "name", "password", "role", "updatedAt", "username") SELECT "createdAt", "id", "name", "password", "role", "updatedAt", "username" FROM "operators";
DROP TABLE "operators";
ALTER TABLE "new_operators" RENAME TO "operators";
CREATE UNIQUE INDEX "operators_username_key" ON "operators"("username");
CREATE TABLE "new_parking_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "mallId" TEXT,
    "minHours" REAL,
    "maxHours" REAL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'hourly',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parking_rates_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_parking_rates" ("amount", "createdAt", "id", "isActive", "maxHours", "minHours", "name", "type", "updatedAt") SELECT "amount", "createdAt", "id", "isActive", "maxHours", "minHours", "name", "type", "updatedAt" FROM "parking_rates";
DROP TABLE "parking_rates";
ALTER TABLE "new_parking_rates" RENAME TO "parking_rates";
CREATE UNIQUE INDEX "parking_rates_name_mallId_key" ON "parking_rates"("name", "mallId");
CREATE TABLE "new_parking_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleNumberPlate" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "operatorId" TEXT,
    "mallId" TEXT,
    "entryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "billingType" TEXT NOT NULL,
    "billingAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parking_sessions_vehicleNumberPlate_fkey" FOREIGN KEY ("vehicleNumberPlate") REFERENCES "vehicles" ("numberPlate") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parking_sessions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parking_sessions_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "operators" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "parking_sessions_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_parking_sessions" ("billingAmount", "billingType", "createdAt", "entryTime", "exitTime", "id", "operatorId", "slotId", "status", "updatedAt", "vehicleNumberPlate") SELECT "billingAmount", "billingType", "createdAt", "entryTime", "exitTime", "id", "operatorId", "slotId", "status", "updatedAt", "vehicleNumberPlate" FROM "parking_sessions";
DROP TABLE "parking_sessions";
ALTER TABLE "new_parking_sessions" RENAME TO "parking_sessions";
CREATE TABLE "new_parking_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotNumber" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "mallId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parking_slots_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_parking_slots" ("createdAt", "id", "slotNumber", "slotType", "status", "updatedAt") SELECT "createdAt", "id", "slotNumber", "slotType", "status", "updatedAt" FROM "parking_slots";
DROP TABLE "parking_slots";
ALTER TABLE "new_parking_slots" RENAME TO "parking_slots";
CREATE UNIQUE INDEX "parking_slots_slotNumber_key" ON "parking_slots"("slotNumber");
CREATE TABLE "new_vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numberPlate" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "mallId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vehicles_mallId_fkey" FOREIGN KEY ("mallId") REFERENCES "malls" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vehicles" ("createdAt", "id", "numberPlate", "updatedAt", "vehicleType") SELECT "createdAt", "id", "numberPlate", "updatedAt", "vehicleType" FROM "vehicles";
DROP TABLE "vehicles";
ALTER TABLE "new_vehicles" RENAME TO "vehicles";
CREATE UNIQUE INDEX "vehicles_numberPlate_key" ON "vehicles"("numberPlate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "holidays_mallId_date_key" ON "holidays"("mallId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_sessionId_key" ON "bookings"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_paymentId_key" ON "bookings"("paymentId");
