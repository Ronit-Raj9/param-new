-- CreateTable
CREATE TABLE "activation_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activation_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "activation_tokens_token_key" ON "activation_tokens"("token");

-- CreateIndex
CREATE INDEX "activation_tokens_token_idx" ON "activation_tokens"("token");

-- CreateIndex
CREATE INDEX "activation_tokens_userId_idx" ON "activation_tokens"("userId");

-- CreateIndex
CREATE INDEX "activation_tokens_expiresAt_idx" ON "activation_tokens"("expiresAt");

-- AddForeignKey
ALTER TABLE "activation_tokens" ADD CONSTRAINT "activation_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
