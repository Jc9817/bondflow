-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "companyRegistration" TEXT;
ALTER TABLE "Customer" ADD COLUMN "contactPerson" TEXT;
ALTER TABLE "Customer" ADD COLUMN "notes" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Upload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "caseId" TEXT,
    "customerId" TEXT,
    CONSTRAINT "Upload_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Upload_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Upload" ("caseId", "contentType", "createdAt", "fileName", "filePath", "id", "size", "status", "updatedAt") SELECT "caseId", "contentType", "createdAt", "fileName", "filePath", "id", "size", "status", "updatedAt" FROM "Upload";
DROP TABLE "Upload";
ALTER TABLE "new_Upload" RENAME TO "Upload";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
