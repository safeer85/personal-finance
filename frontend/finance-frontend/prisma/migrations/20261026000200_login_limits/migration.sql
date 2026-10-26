CREATE TABLE "LoginAttempt" (
  "id" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);
