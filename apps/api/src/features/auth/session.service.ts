import { Injectable } from '@nestjs/common';
import type { User } from '../../generated/prisma/client.js';
import { randomToken, sha256Hex } from '../../shared/crypto/tokens.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

export const SESSION_COOKIE = 'hj_session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
});

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string): Promise<string> {
    const token = randomToken(32);
    await this.prisma.session.create({
      data: { userId, tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
    });
    return token;
  }

  async resolve(token: string | undefined): Promise<User | null> {
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256Hex(token) },
      include: { user: true },
    });
    if (!session || session.expiresAt.getTime() <= Date.now()) return null;
    return session.user;
  }

  async revoke(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.session.deleteMany({ where: { tokenHash: sha256Hex(token) } });
  }

  async revokeAll(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
