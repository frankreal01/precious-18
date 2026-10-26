CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "Status" AS ENUM ('DRAFT', 'PREVIEW', 'PUBLISHED', 'UNPUBLISHED');
CREATE TYPE "SiteState" AS ENUM ('DRAFT', 'PREVIEW', 'PUBLISHED', 'UNPUBLISHED', 'MAINTENANCE');

CREATE TABLE "Admin" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'ADMIN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Recipient" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL DEFAULT 'PRECIOUS MELIKAM CHISOM',
  "birthDate" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BirthdayExperience" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "state" "SiteState" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BirthdayExperience_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ExperienceSettings" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "reasonsTitle" TEXT NOT NULL DEFAULT '18 Little Things That Make You, You',
  "musicMediaId" TEXT,
  "enabledSections" JSONB NOT NULL DEFAULT '{}',
  "closingMessage" TEXT NOT NULL DEFAULT '',
  CONSTRAINT "ExperienceSettings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Chapter" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'DRAFT',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Chapter_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BirthdayMessage" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "signature" TEXT,
  "status" "Status" NOT NULL DEFAULT 'DRAFT',
  CONSTRAINT "BirthdayMessage_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Memory" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "memoryDate" TIMESTAMP(3),
  "mediaId" TEXT,
  "position" INTEGER NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'DRAFT',
  CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Wish" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'DRAFT',
  CONSTRAINT "Wish_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Reason" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'DRAFT',
  CONSTRAINT "Reason_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Gift" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "selectable" BOOLEAN NOT NULL DEFAULT true,
  "selected" BOOLEAN NOT NULL DEFAULT false,
  "selectedAt" TIMESTAMP(3),
  "position" INTEGER NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'DRAFT',
  CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Media" (
  "id" TEXT NOT NULL,
  "experienceId" TEXT NOT NULL,
  "storageKey" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "kind" TEXT NOT NULL,
  "caption" TEXT,
  "inGallery" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RecipientResponse" (
  "id" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "message" TEXT,
  "reaction" TEXT,
  "mediaKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecipientResponse_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VerificationAttempt" (
  "id" TEXT NOT NULL,
  "ipHash" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationAttempt_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "adminId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT,
  "detail" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");
CREATE UNIQUE INDEX "BirthdayExperience_recipientId_key" ON "BirthdayExperience"("recipientId");
CREATE UNIQUE INDEX "ExperienceSettings_experienceId_key" ON "ExperienceSettings"("experienceId");
CREATE UNIQUE INDEX "Chapter_experienceId_number_key" ON "Chapter"("experienceId", "number");
CREATE UNIQUE INDEX "BirthdayMessage_experienceId_key" ON "BirthdayMessage"("experienceId");
CREATE INDEX "VerificationAttempt_ipHash_createdAt_idx" ON "VerificationAttempt"("ipHash", "createdAt");

ALTER TABLE "BirthdayExperience" ADD CONSTRAINT "BirthdayExperience_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExperienceSettings" ADD CONSTRAINT "ExperienceSettings_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Chapter" ADD CONSTRAINT "Chapter_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BirthdayMessage" ADD CONSTRAINT "BirthdayMessage_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Wish" ADD CONSTRAINT "Wish_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Reason" ADD CONSTRAINT "Reason_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Gift" ADD CONSTRAINT "Gift_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "BirthdayExperience"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecipientResponse" ADD CONSTRAINT "RecipientResponse_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
