import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreatedInviteDto, FamilyGroupDto, FamilyInviteDto, InvitePreviewDto } from '@helpjuy/contracts';
import { Prisma } from '../../generated/prisma/client.js';
import { randomToken, sha256Hex } from '../../shared/crypto/tokens.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const userWithProfiles = {
  select: {
    id: true,
    email: true,
    profiles: { select: { firstName: true, lastName: true, relationship: true }, orderBy: { createdAt: 'asc' as const } },
  },
};

const groupInclude = {
  members: { include: { user: userWithProfiles }, orderBy: { joinedAt: 'asc' as const } },
} satisfies Prisma.FamilyGroupInclude;

type GroupWithMembers = Prisma.FamilyGroupGetPayload<{ include: typeof groupInclude }>;
type UserLite = { email: string; profiles: { firstName: string; lastName: string; relationship: string }[] };

/**
 * El nombre que ven los demás: solo el de su propia ficha ("Yo"). Nunca el de un hijo a cargo
 * ni el email, que son datos que la persona no eligió compartir con el grupo.
 */
export function displayName(user: UserLite): string {
  const self = user.profiles.find((p) => p.relationship === 'SELF');
  return self ? `${self.firstName} ${self.lastName}` : 'Miembro sin ficha propia';
}

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  toDto(group: GroupWithMembers, meId: string): FamilyGroupDto {
    const me = group.members.find((m) => m.userId === meId)!;
    return {
      id: group.id,
      name: group.name,
      myRole: me.role,
      muted: me.muted,
      createdAt: group.createdAt.toISOString(),
      members: group.members.map((m) => ({
        userId: m.userId,
        name: displayName(m.user),
        role: m.role,
        isMe: m.userId === meId,
        joinedAt: m.joinedAt.toISOString(),
      })),
    };
  }

  async list(userId: string): Promise<FamilyGroupDto[]> {
    const groups = await this.prisma.familyGroup.findMany({
      where: { members: { some: { userId } } },
      include: groupInclude,
      orderBy: { createdAt: 'asc' },
    });
    return groups.map((g) => this.toDto(g, userId));
  }

  async get(userId: string, groupId: string): Promise<FamilyGroupDto> {
    return this.toDto(await this.loadForMember(userId, groupId), userId);
  }

  async create(userId: string, name: string): Promise<FamilyGroupDto> {
    const group = await this.prisma.familyGroup.create({
      data: { name, members: { create: { userId, role: 'ADMIN' } } },
      include: groupInclude,
    });
    return this.toDto(group, userId);
  }

  async rename(userId: string, groupId: string, name: string): Promise<FamilyGroupDto> {
    await this.requireAdmin(userId, groupId);
    const group = await this.prisma.familyGroup.update({ where: { id: groupId }, data: { name }, include: groupInclude });
    return this.toDto(group, userId);
  }

  async remove(userId: string, groupId: string): Promise<void> {
    await this.requireAdmin(userId, groupId);
    await this.prisma.familyGroup.delete({ where: { id: groupId } });
  }

  async setMuted(userId: string, groupId: string, muted: boolean): Promise<FamilyGroupDto> {
    await this.loadForMember(userId, groupId);
    await this.prisma.familyMember.update({ where: { groupId_userId: { groupId, userId } }, data: { muted } });
    return this.get(userId, groupId);
  }

  // ---------- Invitaciones ----------

  async createInvite(userId: string, groupId: string): Promise<CreatedInviteDto> {
    await this.requireAdmin(userId, groupId);
    const token = randomToken(32);
    const invite = await this.prisma.familyInvite.create({
      data: { groupId, invitedById: userId, tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + INVITE_TTL_MS) },
    });
    const web = process.env.WEB_URL ?? 'http://localhost:3000';
    return { url: `${web}/unirme/${token}`, expiresAt: invite.expiresAt.toISOString() };
  }

  async listInvites(userId: string, groupId: string): Promise<FamilyInviteDto[]> {
    await this.requireAdmin(userId, groupId);
    const invites = await this.prisma.familyInvite.findMany({
      where: { groupId, usedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      include: { invitedBy: userWithProfiles },
      orderBy: { createdAt: 'asc' },
    });
    return invites.map((i) => ({
      id: i.id,
      invitedByName: displayName(i.invitedBy),
      createdAt: i.createdAt.toISOString(),
      expiresAt: i.expiresAt.toISOString(),
    }));
  }

  async revokeInvite(userId: string, groupId: string, inviteId: string): Promise<void> {
    await this.requireAdmin(userId, groupId);
    const { count } = await this.prisma.familyInvite.updateMany({
      where: { id: inviteId, groupId, usedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (count === 0) throw new NotFoundException({ error: 'not_found' });
  }

  private async validInvite(token: string) {
    const invite = await this.prisma.familyInvite.findUnique({
      where: { tokenHash: sha256Hex(token) },
      include: { group: { include: { _count: { select: { members: true } } } }, invitedBy: userWithProfiles },
    });
    if (!invite || invite.usedAt || invite.revokedAt || invite.expiresAt <= new Date()) {
      throw new BadRequestException({ error: 'invalid_token' });
    }
    return invite;
  }

  async preview(token: string): Promise<InvitePreviewDto> {
    const invite = await this.validInvite(token);
    return {
      groupName: invite.group.name,
      inviterName: displayName(invite.invitedBy),
      memberCount: invite.group._count.members,
    };
  }

  async accept(userId: string, token: string): Promise<FamilyGroupDto> {
    const invite = await this.validInvite(token);
    // Si ya es miembro (por ejemplo, tocó el link que se mandó a un grupo de WhatsApp), no gastamos la invitación.
    const already = await this.prisma.familyMember.findUnique({ where: { groupId_userId: { groupId: invite.groupId, userId } } });
    if (already) return this.get(userId, invite.groupId);
    await this.prisma.$transaction(async (tx) => {
      // updateMany con usedAt: null: dos aceptaciones simultáneas no pasan las dos.
      const { count } = await tx.familyInvite.updateMany({
        where: { id: invite.id, usedAt: null, revokedAt: null },
        data: { usedAt: new Date() },
      });
      if (count === 0) throw new BadRequestException({ error: 'invalid_token' });
      await tx.familyMember.upsert({
        where: { groupId_userId: { groupId: invite.groupId, userId } },
        create: { groupId: invite.groupId, userId, role: 'MEMBER' },
        update: {},
      });
    });
    return this.get(userId, invite.groupId);
  }

  // ---------- Miembros ----------

  /** Salir (uno mismo) o sacar a alguien (solo admin). Mantiene siempre un admin o borra el grupo vacío. */
  async removeMember(actorId: string, groupId: string, targetId: string): Promise<void> {
    if (actorId !== targetId) await this.requireAdmin(actorId, groupId);
    else await this.loadForMember(actorId, groupId);

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.familyMember.deleteMany({ where: { groupId, userId: targetId } });
      if (count === 0) throw new NotFoundException({ error: 'not_found' });
      const rest = await tx.familyMember.findMany({ where: { groupId }, orderBy: { joinedAt: 'asc' } });
      if (rest.length === 0) {
        await tx.familyGroup.delete({ where: { id: groupId } });
      } else if (!rest.some((m) => m.role === 'ADMIN')) {
        await tx.familyMember.update({
          where: { groupId_userId: { groupId, userId: rest[0].userId } },
          data: { role: 'ADMIN' },
        });
      }
    });
  }

  // ---------- Permisos ----------

  private async loadForMember(userId: string, groupId: string): Promise<GroupWithMembers> {
    const group = await this.prisma.familyGroup.findFirst({
      where: { id: groupId, members: { some: { userId } } },
      include: groupInclude,
    });
    if (!group) throw new NotFoundException({ error: 'not_found' });
    return group;
  }

  async requireAdmin(userId: string, groupId: string): Promise<GroupWithMembers> {
    const group = await this.loadForMember(userId, groupId);
    if (group.members.find((m) => m.userId === userId)?.role !== 'ADMIN') {
      throw new ForbiddenException({ error: 'forbidden' });
    }
    return group;
  }
}
