-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "batchId" TEXT;

-- CreateIndex
CREATE INDEX "Event_companyId_batchId_idx" ON "Event"("companyId", "batchId");
