-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "photoCipher" TEXT,
ADD COLUMN     "photoUpdatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googlePictureUrl" TEXT;
