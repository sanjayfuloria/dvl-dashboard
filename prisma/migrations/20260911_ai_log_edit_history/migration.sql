-- Add edit tracking columns to AIBuildLog
ALTER TABLE "AIBuildLog" ADD COLUMN "createdByName" TEXT;
ALTER TABLE "AIBuildLog" ADD COLUMN "editedAt" TIMESTAMP(3);
ALTER TABLE "AIBuildLog" ADD COLUMN "editedByName" TEXT;
ALTER TABLE "AIBuildLog" ADD COLUMN "archivedAt" TIMESTAMP(3);
ALTER TABLE "AIBuildLog" ADD COLUMN "archivedByName" TEXT;

-- Version history table: one row per pre-edit snapshot of an AIBuildLog entry
CREATE TABLE "AIBuildLogVersion" (
    "id" TEXT NOT NULL,
    "aiBuildLogId" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "toolUsed" TEXT NOT NULL,
    "purpose" TEXT,
    "promptSummary" TEXT,
    "outputGenerated" TEXT,
    "humanValidation" TEXT,
    "finalImplementation" TEXT,
    "editedByName" TEXT,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIBuildLogVersion_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AIBuildLogVersion" ADD CONSTRAINT "AIBuildLogVersion_aiBuildLogId_fkey"
    FOREIGN KEY ("aiBuildLogId") REFERENCES "AIBuildLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
