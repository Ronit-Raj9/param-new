/*
  Warnings:

  - A unique constraint covering the columns `[onChainId]` on the table `programs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[onChainId]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SemesterType" AS ENUM ('EVEN', 'ODD', 'SUMMER');

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "onChainId" INTEGER;

-- AlterTable
ALTER TABLE "semester_results" ADD COLUMN     "semesterType" "SemesterType" NOT NULL DEFAULT 'EVEN';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "departmentId" TEXT,
ADD COLUMN     "onChainId" INTEGER;

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "onChainId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_onChainId_key" ON "departments"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "programs_onChainId_key" ON "programs"("onChainId");

-- CreateIndex
CREATE UNIQUE INDEX "students_onChainId_key" ON "students"("onChainId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
