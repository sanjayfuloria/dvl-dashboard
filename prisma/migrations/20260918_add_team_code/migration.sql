-- Team code: e.g. MPBTA1 (MPB, Team, Section A, #1), MPBIA1 (MPB, Individual, Section A, #1)
ALTER TABLE "Team" ADD COLUMN "code" TEXT;
CREATE UNIQUE INDEX "Team_code_key" ON "Team"("code");
