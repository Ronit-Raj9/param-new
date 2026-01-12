-- AlterTable
ALTER TABLE "credentials" ADD COLUMN     "certificateType" TEXT,
ADD COLUMN     "exitReason" TEXT,
ADD COLUMN     "exitYear" INTEGER,
ADD COLUMN     "yearsCompleted" INTEGER;
