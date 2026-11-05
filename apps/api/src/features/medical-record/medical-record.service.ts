import { Injectable, Logger } from '@nestjs/common';
import {
  DEFAULT_VISIBILITY,
  medicalRecordSchema,
  visibilitySchema,
  type MedicalRecord,
  type MedicalRecordResponse,
  type SaveMedicalRecordInput,
  type Visibility,
} from '@helpjuy/contracts';
import type { MedicalRecord as Row } from '../../generated/prisma/client.js';
import { MedicalCipher } from '../../shared/crypto/medical-cipher.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { CardCache } from '../emergency-card/card-cache.js';
import { ProfilesService } from '../profiles/profiles.service.js';

export const EMPTY_RECORD: MedicalRecord = medicalRecordSchema.parse({});

@Injectable()
export class MedicalRecordService {
  private readonly logger = new Logger('MedicalRecord');

  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfilesService,
    private readonly cipher: MedicalCipher,
    private readonly cardCache: CardCache,
  ) {}

  toResponse(row: Row | null): MedicalRecordResponse {
    if (!row) return { data: EMPTY_RECORD, visibility: DEFAULT_VISIBILITY, updatedAt: null };
    return {
      data: this.cipher.decrypt(row.ciphertext),
      visibility: this.readVisibility(row.visibility),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  readVisibility(raw: unknown): Visibility {
    const parsed = visibilitySchema.safeParse({ ...DEFAULT_VISIBILITY, ...(raw as object) });
    return parsed.success ? parsed.data : DEFAULT_VISIBILITY;
  }

  async get(ownerId: string, profileId: string): Promise<MedicalRecordResponse> {
    await this.profiles.getOwned(ownerId, profileId);
    return this.toResponse(await this.prisma.medicalRecord.findUnique({ where: { profileId } }));
  }

  async save(ownerId: string, profileId: string, input: { data: MedicalRecord; visibility: Visibility }): Promise<MedicalRecordResponse> {
    const profile = await this.profiles.getOwned(ownerId, profileId);
    const ciphertext = this.cipher.encrypt(input.data);
    const row = await this.prisma.medicalRecord.upsert({
      where: { profileId },
      create: { profileId, ciphertext, visibility: input.visibility },
      update: { ciphertext, visibility: input.visibility },
    });
    await this.cardCache.invalidate([profile.publicToken]).catch((err: Error) => {
      this.logger.warn(`No se pudo invalidar la ficha pública: ${err.message}`);
    });
    return this.toResponse(row);
  }
}

export type { SaveMedicalRecordInput };
