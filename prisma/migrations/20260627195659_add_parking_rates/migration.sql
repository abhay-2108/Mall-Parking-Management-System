-- CreateTable
CREATE TABLE "parking_rates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "minHours" REAL,
    "maxHours" REAL,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'hourly',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "parking_rates_name_key" ON "parking_rates"("name");
