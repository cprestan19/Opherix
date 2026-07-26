-- RenameColumn (se guarda en claro, no hasheado — ver comentario en schema.prisma)
ALTER TABLE "Event" RENAME COLUMN "accessTokenHash" TO "accessToken";

-- RenameIndex
ALTER INDEX "Event_accessTokenHash_key" RENAME TO "Event_accessToken_key";
