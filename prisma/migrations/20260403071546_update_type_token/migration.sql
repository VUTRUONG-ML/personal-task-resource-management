/*
  Warnings:

  - You are about to alter the column `token` on the `RefreshToken` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "RefreshToken" ALTER COLUMN "token" SET DATA TYPE VARCHAR(255);
