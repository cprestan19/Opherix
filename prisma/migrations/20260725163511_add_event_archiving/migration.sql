-- CreateEnum
CREATE TYPE "AutoArchiveDelay" AS ENUM ('OFF', 'IMMEDIATE', 'AFTER_1H', 'AFTER_24H');

-- AlterEnum
ALTER TYPE "EventStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "autoArchiveDelay" "AutoArchiveDelay" NOT NULL DEFAULT 'OFF';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "archivedAt" TIMESTAMP(3);
