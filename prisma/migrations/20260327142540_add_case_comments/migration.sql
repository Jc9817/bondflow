/*
  Warnings:

  - You are about to drop the column `confirmedAt` on the `ApprovedData` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `ApprovedData` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ContactPerson` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ExtractionDraft` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "CaseComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaseComment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApprovedData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "amount" REAL,
    "currency" TEXT,
    "date" TEXT,
    "referenceNo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovedData_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ApprovedData" ("amount", "currency", "date", "id", "referenceNo", "uploadId") SELECT "amount", "currency", "date", "id", "referenceNo", "uploadId" FROM "ApprovedData";
DROP TABLE "ApprovedData";
ALTER TABLE "new_ApprovedData" RENAME TO "ApprovedData";
CREATE UNIQUE INDEX "ApprovedData_uploadId_key" ON "ApprovedData"("uploadId");
CREATE TABLE "new_ContactPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContactPerson_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ContactPerson" ("createdAt", "customerId", "email", "id", "name", "phone") SELECT "createdAt", "customerId", "email", "id", "name", "phone" FROM "ContactPerson";
DROP TABLE "ContactPerson";
ALTER TABLE "new_ContactPerson" RENAME TO "ContactPerson";
CREATE TABLE "new_ExtractionDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "amount" REAL,
    "currency" TEXT,
    "date" TEXT,
    "referenceNo" TEXT,
    "rawJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExtractionDraft_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExtractionDraft" ("amount", "currency", "date", "id", "referenceNo", "uploadId") SELECT "amount", "currency", "date", "id", "referenceNo", "uploadId" FROM "ExtractionDraft";
DROP TABLE "ExtractionDraft";
ALTER TABLE "new_ExtractionDraft" RENAME TO "ExtractionDraft";
CREATE UNIQUE INDEX "ExtractionDraft_uploadId_key" ON "ExtractionDraft"("uploadId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
