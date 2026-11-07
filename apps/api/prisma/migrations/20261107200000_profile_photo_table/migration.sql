-- La foto pasa a su propia tabla: así no viaja en cada consulta de fichas.
CREATE TABLE "ProfilePhoto" (
    "profileId" TEXT NOT NULL,
    "cipher" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("profileId")
);

ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Copiamos las fotos que ya existen antes de borrar la columna vieja.
INSERT INTO "ProfilePhoto" ("profileId", "cipher", "updatedAt")
SELECT "id", "photoCipher", COALESCE("photoUpdatedAt", CURRENT_TIMESTAMP)
FROM "Profile"
WHERE "photoCipher" IS NOT NULL;

ALTER TABLE "Profile" DROP COLUMN "photoCipher";

-- Índice para la limpieza diaria de ubicaciones viejas.
CREATE INDEX "EmergencyAlert_createdAt_idx" ON "EmergencyAlert"("createdAt");
