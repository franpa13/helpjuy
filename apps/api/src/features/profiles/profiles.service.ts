import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MAX_PROFILES_PER_ACCOUNT } from '@helpjuy/contracts';
import {
  DEFAULT_VISIBILITY,
  completion,
  isActive,
  printFingerprintInput,
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
import { ImageFetcher, isGooglePhotoUrl, largeGooglePhotoUrl } from './image-fetcher.js';
import { processPhoto } from './photo.js';

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
    photoVersion: p.photoUpdatedAt ? String(p.photoUpdatedAt.getTime()) : null,
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
    private readonly images: ImageFetcher,
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
    return sha256Hex(printFingerprintInput(p.publicToken, printableData(p, record, this.visibilityOf(p))));
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
  async markPrinted(ownerId: string, id: string, shown: string): Promise<{ printStatus: PrintStatus; printedAt: string }> {
    const p = await this.getOwned(ownerId, id);
    const record = p.medicalRecord ? this.cipher.decrypt(p.medicalRecord.ciphertext) : null;
    const current = this.printFingerprint(p, record);
    // La página manda la huella de lo que mostró: si los datos cambiaron mientras imprimía, el papel quedó viejo.
    if (shown !== current) throw new ConflictException({ error: 'print_outdated' });
    const printedAt = new Date();
    await this.prisma.profile.update({ where: { id }, data: { printedHash: current, printedAt } });
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
      // Primero tu ficha: la de otra persona solo se crea si ya tenés la propia, y la propia es una sola.
      // Lock por cuenta: dos altas simultáneas no pueden dejar dos fichas propias.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'self:' + ownerId}))`;
      const hasSelf = (await tx.profile.count({ where: { ownerId, relationship: 'SELF' } })) > 0;
      if (input.relationship === 'SELF' && hasSelf) throw new ConflictException({ error: 'self_profile_exists' });
      if (input.relationship !== 'SELF' && !hasSelf) throw new ConflictException({ error: 'self_profile_required' });
      // Tope por cuenta: alcanza para una familia grande y evita que alguien cree fichas en masa.
      if ((await tx.profile.count({ where: { ownerId } })) >= MAX_PROFILES_PER_ACCOUNT) {
        throw new ConflictException({ error: 'profile_limit' });
      }
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
    const current = await this.getOwned(ownerId, id);
    // La ficha propia no se convierte en la de otra persona, ni al revés.
    if (input.relationship && (input.relationship === 'SELF') !== (current.relationship === 'SELF')) {
      throw new ConflictException({ error: 'self_profile_locked' });
    }
    const updated = await this.prisma.profile.update({ where: { id }, data: input, include: { medicalRecord: true } });
    await this.invalidateCard([updated.publicToken]);
    return updated;
  }

  async remove(ownerId: string, id: string): Promise<void> {
    const profile = await this.getOwned(ownerId, id);
    // Sin la ficha propia, las de la familia quedarían "sueltas": primero se borran esas.
    if (profile.relationship === 'SELF' && (await this.prisma.profile.count({ where: { ownerId, NOT: { id } } })) > 0) {
      throw new ConflictException({ error: 'self_profile_has_dependents' });
    }
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

  // ---------- Foto ----------

  /** Guarda una foto subida por el titular (ya normalizada y sin metadatos). */
  async setPhoto(ownerId: string, id: string, image: Buffer): Promise<ProfileWithRecord> {
    await this.getOwned(ownerId, id);
    return this.savePhoto(id, await processPhoto(image));
  }

  /** Copia la foto de la cuenta de Google a la ficha propia (una sola vez: después ya no depende de Google). */
  async setGooglePhoto(owner: { id: string; googlePictureUrl: string | null }, id: string): Promise<ProfileWithRecord> {
    const profile = await this.getOwned(owner.id, id);
    if (profile.relationship !== 'SELF') throw new ConflictException({ error: 'photo_self_only' });
    const url = owner.googlePictureUrl;
    if (!url || !isGooglePhotoUrl(url)) throw new ConflictException({ error: 'google_photo_unavailable' });
    let image: Buffer;
    try {
      image = await this.images.fetch(largeGooglePhotoUrl(url));
    } catch (err) {
      this.logger.warn(`No se pudo descargar la foto de Google: ${(err as Error).message}`);
      throw new ConflictException({ error: 'google_photo_unavailable' });
    }
    return this.savePhoto(id, await processPhoto(image));
  }

  async removePhoto(ownerId: string, id: string): Promise<void> {
    const profile = await this.getOwned(ownerId, id);
    await this.prisma.profile.update({ where: { id }, data: { photoCipher: null, photoUpdatedAt: null } });
    await this.invalidateCard([profile.publicToken]);
  }

  /** La foto del titular para el editor (descifrada). */
  async getPhoto(ownerId: string, id: string): Promise<Buffer> {
    const profile = await this.getOwned(ownerId, id);
    if (!profile.photoCipher) throw new NotFoundException({ error: 'not_found' });
    return this.cipher.decryptBytes(profile.photoCipher);
  }

  private async savePhoto(id: string, webp: Buffer): Promise<ProfileWithRecord> {
    const updated = await this.prisma.profile.update({
      where: { id },
      data: { photoCipher: this.cipher.encryptBytes(webp), photoUpdatedAt: new Date() },
      include: { medicalRecord: true },
    });
    await this.invalidateCard([updated.publicToken]);
    return updated;
  }
}
