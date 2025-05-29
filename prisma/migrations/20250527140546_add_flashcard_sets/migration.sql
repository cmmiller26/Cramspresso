/*
  Warnings:

  - You are about to drop the column `userId` on the `Flashcard` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[question,setId]` on the table `Flashcard` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `setId` to the `Flashcard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Flashcard` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Flashcard" DROP CONSTRAINT "Flashcard_userId_fkey";

-- AlterTable
ALTER TABLE "Flashcard" DROP COLUMN "userId",
ADD COLUMN     "setId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "FlashcardSet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashcardSet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlashcardSet_name_userId_key" ON "FlashcardSet"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Flashcard_question_setId_key" ON "Flashcard"("question", "setId");

-- AddForeignKey
ALTER TABLE "FlashcardSet" ADD CONSTRAINT "FlashcardSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flashcard" ADD CONSTRAINT "Flashcard_setId_fkey" FOREIGN KEY ("setId") REFERENCES "FlashcardSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
