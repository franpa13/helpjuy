import { Injectable, NotFoundException } from '@nestjs/common';
import { completion, isActive, type CreateProfileInput, type ProfileDto, type UpdateProfileInput } from '@helpjuy/contracts';
import type { MedicalRecord, Profile } from '../../generated/prisma/client.js';
import { MedicalCipher } from '../../shared/crypto/medical-cipher.js';
import { randomToken } from '../../shared/crypto/tokens.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { ConsentService } from '../consent/consent.service.js';

export const newPublicToken = () => randomToken(16);

export type ProfileWithRecord = Profile & { medicalRecord?: MedicalRecord | null };

function baseDto(p: Profile): Omit<ProfileDto, 'completion' | 'active'> {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    relationship: p.relationship,
    isMinor: p.isMinor,
    publicToken: p.publicToken,
    createdAt: p.createdAt.toISOString(),
  };
}

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly consent: ConsentService,
    private readonly cipher: MedicalCipher,
  ) {}

  toDto(p: ProfileWithRecord): ProfileDto {
    const record = p.medicalRecord ? this.cipher.decrypt(p.medicalRecord.ciphertext) : null;
    return { ...baseDto(p), completion: record ? completion(record) : 0, active: record ? isActive(record) : false };
  }

  async list(ownerId: string): Promise<ProfileWithRecord[]> {
    return this.prisma.profile.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
      include: { medicalRecord: true },
    });
  }

  async create(ownerId: string, input: CreateProfileInput): Promise<Profile> {
    this.consent.assertValid(input.consent, input.isMinor);
    return this.prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          ownerId,
          firstName: input.firstName,
          lastName: input.lastName,
          relationship: input.relationship,
          isMinor: input.isMinor,
          publicToken: newPublicToken(),
        },
      });
      await this.consent.record(tx, {
        userId: ownerId,
        profileId: profile.id,
        version: input.consent.version,
        guardianDeclared: input.consent.guardianDeclared ?? false,
      });
      return profile;
    });
  }

  /** Busca un perfil del dueño; si es ajeno o no existe, 404 (no revela existencia). */
  async getOwned(ownerId: string, id: string): Promise<ProfileWithRecord> {
    const profile = await this.prisma.profile.findFirst({ where: { id, ownerId }, include: { medicalRecord: true } });
    if (!profile) throw new NotFoundException({ error: 'not_found' });
    return profile;
  }

  async update(ownerId: string, id: string, input: UpdateProfileInput): Promise<ProfileWithRecord> {
    await this.getOwned(ownerId, id);
    return this.prisma.profile.update({ where: { id }, data: input, include: { medicalRecord: true } });
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.getOwned(ownerId, id);
    await this.prisma.profile.delete({ where: { id } });
  }

  async rotateToken(ownerId: string, id: string): Promise<string> {
    await this.getOwned(ownerId, id);
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { publicToken: newPublicToken(), tokenRotatedAt: new Date() },
    });
    return updated.publicToken;
  }
}
