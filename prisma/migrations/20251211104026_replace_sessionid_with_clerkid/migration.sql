-- Delete all existing users (and cascade delete their decks and cards)
-- This is necessary because existing users used anonymous sessions and don't have Clerk IDs
DELETE FROM "User";

-- AlterTable: Drop sessionId column and add clerkId column
ALTER TABLE "User" DROP COLUMN "sessionId";
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT NOT NULL;

-- CreateIndex: Add unique constraint on clerkId
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");
