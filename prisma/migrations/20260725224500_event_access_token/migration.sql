-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "accessClosedAt" TIMESTAMP(3),
ADD COLUMN     "accessTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "accessTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Event_accessTokenHash_key" ON "Event"("accessTokenHash");
