import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { hash, verify } from '@node-rs/argon2';
import type { LoginInput, MeResponse, RegisterInput } from '@helpjuy/contracts';
import { EmailTokenType, Prisma, type User } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { Mailer } from '../mail/mailer.js';
import { resetPasswordMessage, verifyEmailMessage } from './auth-emails.js';
import { EmailTokenService } from './email-token.service.js';
import { SessionService } from './session.service.js';

// Hash real de una clave descartable: igualamos el tiempo de respuesta cuando el email no existe.
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hash('helpjuy-dummy-password'));

export function toMe(user: User): MeResponse {
  return { id: user.id, email: user.email, emailVerified: user.emailVerifiedAt !== null };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly emailTokens: EmailTokenService,
    private readonly mailer: Mailer,
  ) {}

  async register(input: RegisterInput): Promise<{ user: User; token: string }> {
    const passwordHash = await hash(input.password);
    let user: User;
    try {
      user = await this.prisma.user.create({ data: { email: input.email, passwordHash } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException({ error: 'email_taken' });
      }
      throw e;
    }
    await this.onRegistered(user);
    return { user, token: await this.sessions.create(user.id) };
  }

  async login(input: LoginInput): Promise<{ user: User; token: string }> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    const storedHash = user?.passwordHash ?? (await getDummyHash());
    const ok = await verify(storedHash, input.password).catch(() => false);
    if (!user || !user.passwordHash || !ok) {
      throw new UnauthorizedException({ error: 'invalid_credentials' });
    }
    return { user, token: await this.sessions.create(user.id) };
  }

  async sendVerification(user: User): Promise<void> {
    const token = await this.emailTokens.issue(user.id, EmailTokenType.VERIFY_EMAIL);
    await this.mailer.send(verifyEmailMessage(user.email, token));
  }

  async verifyEmail(token: string): Promise<void> {
    const userId = await this.emailTokens.consume(token, EmailTokenType.VERIFY_EMAIL);
    await this.prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  }

  /** Siempre termina bien: no revela si el email tiene cuenta. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = await this.emailTokens.issue(user.id, EmailTokenType.RESET_PASSWORD);
    await this.mailer.send(resetPasswordMessage(user.email, token));
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const userId = await this.emailTokens.consume(token, EmailTokenType.RESET_PASSWORD);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(password) } });
    await this.sessions.revokeAll(userId);
  }

  private async onRegistered(user: User): Promise<void> {
    await this.sendVerification(user);
  }
}
