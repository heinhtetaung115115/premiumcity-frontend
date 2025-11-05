-- AlterTable
ALTER TABLE "Product" ADD COLUMN "category" TEXT;

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "months" INTEGER,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StockItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "code" TEXT,
    "email" TEXT,
    "password" TEXT,
    "note" TEXT,
    "text" TEXT,
    "allocated" BOOLEAN NOT NULL DEFAULT false,
    "allocatedToId" TEXT,
    "allocatedAt" DATETIME,
    CONSTRAINT "StockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockItem" ("allocated", "allocatedAt", "allocatedToId", "code", "email", "id", "note", "password", "productId", "text") SELECT "allocated", "allocatedAt", "allocatedToId", "code", "email", "id", "note", "password", "productId", "text" FROM "StockItem";
DROP TABLE "StockItem";
ALTER TABLE "new_StockItem" RENAME TO "StockItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
