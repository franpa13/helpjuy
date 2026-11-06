import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_VISIBILITY,
  completion,
  isActive,
  printableData,
  visibilitySchema,
  type CreateProfileInput,
  type MedicalRecord as Record_,
  type PrintStatus,
  type ProfileDto,
  type UpdateProfileInput,
  type Visibility,
} from '@helpjuy/contracts';
import type { MedicalRecord, Profile } from '../../generated/prisma/client.js';
import { MedicalCipher } from '../../shared/crypto/medical-cipher.js';
import { randomToken, sha256Hex } from '../../shared/crypto/tokens.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { ConsentService } from '../consent/consent.service.js';
import { CardCache } from '../emergency-card/card-cache.js';

export const newPublicToken = () => randomToken(16);

export type ProfileWithRecord = Profile & { medicalRecord?: MedicalRecord | null };

function baseDto(p: Profile): Omit<ProfileDto, 'completion' | 'active' | 'printStatus' | 'printedAt'> {
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
  private readonly logger = new Logger('Profiles');

  constructor(
    private readonly prisma: PrismaService,
    private readonly consent: ConsentService,
    private readonly cipher: MedicalCipher,
    private readonly cardCache: CardCache,
  ) {}

  /** Invalida la ficha pública cacheada; un fallo se loguea y no rompe la operación. */
  private async invalidateCard(tokens: string[]): Promise<void> {
    await this.cardCache.invalidate(tokens).catch((err: Error) => {
      this.logger.warn(`No se pudo invalidar la ficha pública: ${err.message}`);
    });
  }

  private visibilityOf(p: ProfileWithRecord): Visibility {
    const parsed = visibilitySchema.safeParse({ ...DEFAULT_VISIBILITY, ...((p.medicalRecord?.visibility as object) ?? {}) });
    return parsed.success ? parsed.data : DEFAULT_VISIBILITY;
  }

  /** Huella de lo que va impreso (token + datos impresos). Si cambia, hay que reimprimir. */
  printFingerprint(p: ProfileWithRecord, record: Record_ | null): string {
    return sha256Hex(JSON.stringify({ token: p.publicToken, printable: printableData(p, record, this.visibilityOf(p)) }));
  }

  toDto(p: ProfileWithRecord): ProfileDto {
    const record = p.medicalRecord ? this.cipher.decrypt(p.medicalRecord.ciphertext) : null;
    const printStatus: PrintStatus = !p.printedHash ? 'never' : p.printedHash === this.printFingerprint(p, record) ? 'ok' : 'outdated';
    return {
      ...baseDto(p),
      completion: record ? completion(record) : 0,
      active: record ? isActive(record) : false,
      printStatus,
      printedAt: p.printedAt ? p.printedAt.toISOString() : null,
    };
  }

  /** "Ya lo imprimí": guarda la huella calculada en el servidor (no se confía en el cliente). */
  async markPrinted(ownerId: string, id: string): Promise<{ printStatus: PrintStatus; printedAt: string }> {
    const p = await this.getOwned(ownerId, id);
    const record = p.medicalRecord ? this.cipher.decrypt(p.medicalRecord.ciphertext) : null;
    const printedAt = new Date();
    await this.prisma.profile.update({ where: { id }, data: { printedHash: this.printFingerprint(p, record), printedAt } });
    return { printStatus: 'ok', printedAt: printedAt.toISOString() };
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
    const updated = await this.prisma.profile.update({ where: { id }, data: input, include: { medicalRecord: true } });
    await this.invalidateCard([updated.publicToken]);
    return updated;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const profile = await this.getOwned(ownerId, id);
    await this.prisma.profile.delete({ where: { id } });
    await this.invalidateCard([profile.publicToken]);
  }

  async rotateToken(ownerId: string, id: string): Promise<string> {
    const profile = await this.getOwned(ownerId, id);
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { publicToken: newPublicToken(), tokenRotatedAt: new Date() },
    });
    await this.invalidateCard([profile.publicToken, updated.publicToken]);
    return updated.publicToken;
  }
}
