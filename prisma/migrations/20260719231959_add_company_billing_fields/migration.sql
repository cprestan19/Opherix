-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "billingCycleDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "billingStatus" "BillingStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "planName" TEXT NOT NULL DEFAULT 'Free',
ADD COLUMN     "planPriceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0;
