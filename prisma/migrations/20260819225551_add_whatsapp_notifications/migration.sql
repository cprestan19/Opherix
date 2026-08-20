-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "workOrderSentAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "clientId" TEXT,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Notification_companyId_clientId_status_idx" ON "Notification"("companyId", "clientId", "status");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
