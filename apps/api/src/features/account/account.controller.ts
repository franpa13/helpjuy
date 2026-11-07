import { Body, Controller, Delete, Get, Header, HttpCode, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { deleteAccountSchema, type DeleteAccountInput } from '@helpjuy/contracts';
import type { Response } from 'express';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { SESSION_COOKIE, sessionCookieOptions } from '../auth/session.service.js';
import { AccountService } from './account.service.js';

@UseGuards(SessionGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('export')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Header('Cache-Control', 'private, no-store')
  async export(@CurrentUser() user: User, @Res({ passthrough: true }) res: Response) {
    const day = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="helpjuy-mis-datos-${day}.json"`);
    return this.account.export(user.id);
  }

  @Delete()
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async remove(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(deleteAccountSchema)) _body: DeleteAccountInput,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.account.remove(user.id);
    res.clearCookie(SESSION_COOKIE, sessionCookieOptions());
  }
}
