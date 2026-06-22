-- CreateEnum
CREATE TYPE "RemovalReason" AS ENUM ('expired', 'damaged', 'low_demand');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "removalReason" "RemovalReason",
ADD COLUMN     "removedAt" TIMESTAMP(3);
