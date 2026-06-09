/*
  Warnings:

  - You are about to drop the column `stock` on the `menu_items` table. All the data in the column will be lost.
  - Added the required column `sold` to the `menu_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "menu_items" DROP COLUMN "stock",
ADD COLUMN     "image_public_id" TEXT,
ADD COLUMN     "sold" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "restaurant_image_public_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profile_image_public_id" TEXT;
