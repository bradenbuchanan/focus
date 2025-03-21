-- prisma/migrations/20250321000000_add_accomplishments/migration.sql

-- Create Accomplishment table
CREATE TABLE "Accomplishment" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "categories" TEXT,

    CONSTRAINT "Accomplishment_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "Accomplishment" ADD CONSTRAINT "Accomplishment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Accomplishment" ADD CONSTRAINT "Accomplishment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FocusSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "Accomplishment_userId_idx" ON "Accomplishment"("userId");
CREATE INDEX "Accomplishment_sessionId_idx" ON "Accomplishment"("sessionId");