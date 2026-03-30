-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT,
    "companyRegistration" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "idNumber" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseStatus" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseComment" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaseComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "contentType" TEXT,
    "size" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "customerId" TEXT,
    "caseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractionDraft" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "date" TEXT,
    "referenceNo" TEXT,
    "rawJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovedData" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "date" TEXT,
    "referenceNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovedData_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionDraft_uploadId_key" ON "ExtractionDraft"("uploadId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovedData_uploadId_key" ON "ApprovedData"("uploadId");

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseComment" ADD CONSTRAINT "CaseComment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtractionDraft" ADD CONSTRAINT "ExtractionDraft_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovedData" ADD CONSTRAINT "ApprovedData_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;
