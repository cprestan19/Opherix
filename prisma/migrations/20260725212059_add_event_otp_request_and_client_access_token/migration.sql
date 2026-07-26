-- CreateTable
CREATE TABLE "EventOtpRequest" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "eventTitle" TEXT NOT NULL,
    "eventType" TEXT,
    "address" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "staffNeeded" JSONB NOT NULL,
    "otpHash" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ipAddress" TEXT,
    "consumedAt" TIMESTAMP(3),
    "eventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventOtpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientAccessToken" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventOtpRequest_companyId_contactEmail_createdAt_idx" ON "EventOtpRequest"("companyId", "contactEmail", "createdAt");

-- CreateIndex
CREATE INDEX "EventOtpRequest_ipAddress_createdAt_idx" ON "EventOtpRequest"("ipAddress", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClientAccessToken_tokenHash_key" ON "ClientAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientAccessToken_tokenHash_idx" ON "ClientAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "ClientAccessToken_clientId_idx" ON "ClientAccessToken"("clientId");

-- AddForeignKey
ALTER TABLE "EventOtpRequest" ADD CONSTRAINT "EventOtpRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAccessToken" ADD CONSTRAINT "ClientAccessToken_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientAccessToken" ADD CONSTRAINT "ClientAccessToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
