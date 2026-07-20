/*
  Warnings:

  - You are about to drop the column `specialty` on the `Worker` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Worker_companyId_specialty_idx";

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "specialty",
ADD COLUMN     "specialties" "Specialty"[] DEFAULT ARRAY['OTHER']::"Specialty"[];

-- CreateIndex
CREATE INDEX "Worker_specialties_idx" ON "Worker" USING GIN ("specialties");
