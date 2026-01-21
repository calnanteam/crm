-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "phoneNormalized" TEXT;

-- CreateIndex
CREATE INDEX "Contact_phoneNormalized_idx" ON "Contact"("phoneNormalized");

-- CreateIndex
CREATE INDEX "Contact_firstName_idx" ON "Contact"("firstName");

-- CreateIndex
CREATE INDEX "Contact_lastName_idx" ON "Contact"("lastName");

-- CreateIndex
CREATE INDEX "Contact_displayName_idx" ON "Contact"("displayName");

-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- Backfill phoneNormalized for existing contacts
UPDATE "Contact"
SET "phoneNormalized" = regexp_replace(phone, '[^0-9]', '', 'g')
WHERE phone IS NOT NULL AND phone != '';
