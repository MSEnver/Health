-- CreateTable
CREATE TABLE "IntakeBatch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sourceFileName" TEXT,
    "sourceText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IntakeBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IntakeBatch_status_updatedAt_idx" ON "IntakeBatch"("status", "updatedAt");
