/*
  Warnings:

  - You are about to drop the `EventOtpRequest` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "EventOtpRequest" DROP CONSTRAINT "EventOtpRequest_companyId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "ipAddress" TEXT;

-- DropTable
DROP TABLE "EventOtpRequest";
