-- AlterEnum
ALTER TYPE "JobType" ADD VALUE 'WALLET_CREATE';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "walletAddress" TEXT,
ADD COLUMN     "walletCreatedAt" TIMESTAMP(3),
ADD COLUMN     "walletId" TEXT;

-- CreateIndex
CREATE INDEX "students_walletAddress_idx" ON "students"("walletAddress");
