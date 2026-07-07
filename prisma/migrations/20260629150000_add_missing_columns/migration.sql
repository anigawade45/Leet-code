-- Add missing columns to Problem table
ALTER TABLE "Problem" ADD COLUMN "solutionCode" JSONB;

-- Add missing columns to Submission table
ALTER TABLE "Submission" ADD COLUMN "error" TEXT;
ALTER TABLE "Submission" ADD COLUMN "failedInput" TEXT;
ALTER TABLE "Submission" ADD COLUMN "failedActual" TEXT;
ALTER TABLE "Submission" ADD COLUMN "failedExpected" TEXT;
