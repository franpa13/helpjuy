-- AlterTable
ALTER TABLE "EmergencyAlert" ADD COLUMN     "familyNotified" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "FamilyGroup" ADD COLUMN     "lastTestAlertAt" TIMESTAMP(3);
