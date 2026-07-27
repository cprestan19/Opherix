-- AlterTable
ALTER TABLE "PaymentRecord" DROP COLUMN "holidayHours",
DROP COLUMN "overtimeHours",
DROP COLUMN "regularHours",
DROP COLUMN "sundayHours",
ADD COLUMN     "assignmentCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "hourlyRate";

-- AlterTable
ALTER TABLE "WorkerAssignment" ADD COLUMN     "specialty" "Specialty";

-- CreateTable
CREATE TABLE "ClientSpecialtyRate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "specialty" "Specialty" NOT NULL,
    "payToWorker" DECIMAL(10,2) NOT NULL,
    "chargeToClient" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientSpecialtyRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientSpecialtyRate_companyId_idx" ON "ClientSpecialtyRate"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientSpecialtyRate_clientId_specialty_key" ON "ClientSpecialtyRate"("clientId", "specialty");

-- AddForeignKey
ALTER TABLE "ClientSpecialtyRate" ADD CONSTRAINT "ClientSpecialtyRate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientSpecialtyRate" ADD CONSTRAINT "ClientSpecialtyRate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

