/*
  Warnings:

  - You are about to drop the column `dailyLimit` on the `chat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "chat" DROP COLUMN "dailyLimit";

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "annualIncome" TEXT,
ADD COLUMN     "chatsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dailyLimit" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "datingGoals" TEXT,
ADD COLUMN     "dob" TIMESTAMP(3),
ADD COLUMN     "educationDegree" TEXT,
ADD COLUMN     "educationSchool" TEXT,
ADD COLUMN     "educationYear" TEXT,
ADD COLUMN     "employmentDetails" TEXT,
ADD COLUMN     "instaUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "profilePrompted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seekingReason" TEXT,
ADD COLUMN     "xUrl" TEXT;
