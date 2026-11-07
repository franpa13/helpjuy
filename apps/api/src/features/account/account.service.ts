import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { MedicalCipher } from '../../shared/crypto/medical-cipher.js';
import { CardCache } from '../emergency-card/card-cache.js';
import { FamilyService } from '../family/family.service.js';
import { MedicalRecordService } from '../medical-record/medical-record.service.js';

/**
 * Derechos del titular (Ley 25.326, arts. 14 y 16): acceso a sus datos y supresión.
 */
@Injectable()
export class AccountService {
  private readonly logger = new Logger('Account');

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: MedicalCipher,
    private readonly records: MedicalRecordService,
    private readonly family: FamilyService,
    private readonly cardCache: CardCache,
  ) {}

  /** Todo lo que guardamos de la cuenta, legible. Nada de otras personas (de los grupos, solo nombre y tu rol). */
  async export(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profiles: {
          orderBy: { createdAt: 'asc' },
          include: {
            medicalRecord: true,
            photo: true,
            consents: { orderBy: { acceptedAt: 'asc' } },
            alerts: { where: { suppressed: false, test: false }, orderBy: { createdAt: 'desc' } },
            scans: { orderBy: { createdAt: 'desc' } },
          },
        },
        familyMembers: { include: { group: { include: { _count: { select: { members: true } } } } } },
      },
    });
    return {
      exportedAt: new Date().toISOString(),
      about: 'Tus datos en HelpJuy. Este archivo tiene datos de salud: guardalo en un lugar seguro.',
      account: {
        email: user.email,
        emailVerified: user.emailVerifiedAt !== null,
        createdAt: user.createdAt.toISOString(),
        signInWithGoogle: user.googleId !== null,
        hasPassword: user.passwordHash !== null,
      },
      profiles: user.profiles.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        relationship: p.relationship,
        isMinor: p.isMinor,
        createdAt: p.createdAt.toISOString(),
        publicLinkToken: p.publicToken,
        record: p.medicalRecord ? this.cipher.decrypt(p.medicalRecord.ciphertext) : null,
        visibility: this.records.readVisibility(p.medicalRecord?.visibility),
        photo: p.photo ? `data:image/webp;base64,${this.cipher.decryptBytes(p.photo.cipher).toString('base64')}` : null,
        printedAt: p.printedAt?.toISOString() ?? null,
        consents: p.consents.map((c) => ({ version: c.version, acceptedAt: c.acceptedAt.toISOString(), guardianDeclared: c.guardianDeclared })),
        emergencyAlerts: p.alerts.map((a) => ({
          at: a.createdAt.toISOString(),
          location: a.lat !== null && a.lng !== null ? { lat: a.lat, lng: a.lng } : null,
          notified: a.notified,
        })),
        scans: p.scans.map((s) => s.createdAt.toISOString()),
      })),
      familyGroups: user.familyMembers.map((m) => ({
        name: m.group.name,
        role: m.role,
        muted: m.muted,
        joinedAt: m.joinedAt.toISOString(),
        members: m.group._count.members,
      })),
    };
  }

  /** Borra la cuenta y todo lo que cuelga de ella. En los grupos compartidos deja otro administrador. */
  async remove(userId: string): Promise<void> {
    const memberships = await this.prisma.familyMember.findMany({ where: { userId }, select: { groupId: true } });
    for (const m of memberships) await this.family.removeMember(userId, m.groupId, userId);
    const tokens = (await this.prisma.profile.findMany({ where: { ownerId: userId }, select: { publicToken: true } })).map(
      (p) => p.publicToken,
    );
    // Fichas, registros, consentimientos, avisos, escaneos, sesiones y tokens se van en cascada.
    await this.prisma.user.delete({ where: { id: userId } });
    if (tokens.length) {
      await this.cardCache.invalidate(tokens).catch((err: Error) => this.logger.warn(`No se pudo invalidar: ${err.message}`));
    }
  }
}
