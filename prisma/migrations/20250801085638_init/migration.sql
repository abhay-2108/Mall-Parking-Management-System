-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numberPlate" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "parking_slots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slotNumber" TEXT NOT NULL,
    "slotType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "parking_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicleNumberPlate" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "entryTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "billingType" TEXT NOT NULL,
    "billingAmount" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "parking_sessions_vehicleNumberPlate_fkey" FOREIGN KEY ("vehicleNumberPlate") REFERENCES "vehicles" ("numberPlate") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parking_sessions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "parking_slots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "operators" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_numberPlate_key" ON "vehicles"("numberPlate");

-- CreateIndex
CREATE UNIQUE INDEX "parking_slots_slotNumber_key" ON "parking_slots"("slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "operators_username_key" ON "operators"("username");
