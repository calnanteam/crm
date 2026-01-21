-- CreateTable
CREATE TABLE "ContactSavedView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filtersJson" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSavedView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSavedView_userId_idx" ON "ContactSavedView"("userId");

-- AddForeignKey
ALTER TABLE "ContactSavedView" ADD CONSTRAINT "ContactSavedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
