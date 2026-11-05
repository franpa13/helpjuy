import { BadRequestException, Injectable } from '@nestjs/common';
import { EmailTokenType } from '../../generated/prisma/client.js';
import { randomToken, sha256Hex } from '../../shared/crypto/tokens.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';

const TTL_MS: Record<EmailTokenType, number> = {
  VERIFY_EMAIL: 24 * 60 * 60 * 1000,
  RESET_PASSWORD: 60 * 60 * 1000,
};

@Injectable()
export class EmailTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea un token de un solo uso y devuelve el valor plano (va en el link). */
  async issue(userId: string, type: EmailTokenType): Promise<string> {
    const token = randomToken(32);
    await this.prisma.emailToken.create({
      data: { userId, type, tokenHash: sha256Hex(token), expiresAt: new Date(Date.now() + TTL_MS[type]) },
    });
    return token;
  }

  /** Marca el token como usado y devuelve el userId; si no sirve, 400 invalid_token. */
  async consume(token: string, type: EmailTokenType): Promise<string> {
    const now = new Date();
    const record = await this.prisma.emailToken.findUnique({ where: { tokenHash: sha256Hex(token) } });
    if (!record || record.type !== type || record.usedAt || record.expiresAt <= now) {
      throw new BadRequestException({ error: 'invalid_token' });
    }
    // updateMany con usedAt: null evita que dos usos simultáneos pasen los dos.
    const { count } = await this.prisma.emailToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: now },
    });
    if (count === 0) throw new BadRequestException({ error: 'invalid_token' });
    return record.userId;
  }
}
