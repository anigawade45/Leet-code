/*
  Warnings:

  - A unique constraint covering the columns `[problemNumber]` on the table `Problem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Problem" ADD COLUMN     "problemNumber" SERIAL NOT NULL,
ADD COLUMN     "status" "ProblemStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Problem_problemNumber_key" ON "Problem"("problemNumber");
