-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "accessToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Client_accessToken_key" ON "Client"("accessToken");
