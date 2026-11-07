-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "lastScanEmailAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CardScan" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardScan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CardScan_profileId_createdAt_idx" ON "CardScan"("profileId", "createdAt");

-- CreateIndex
CREATE INDEX "CardScan_createdAt_idx" ON "CardScan"("createdAt");

-- AddForeignKey
ALTER TABLE "CardScan" ADD CONSTRAINT "CardScan_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
