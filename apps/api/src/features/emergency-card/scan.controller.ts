import { Controller, Get, HttpCode, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_TOKEN_RE, type ScanDto } from '@helpjuy/contracts';
import type { Request } from 'express';
import type { User } from '../../generated/prisma/client.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { SESSION_COOKIE, SessionService } from '../auth/session.service.js';
import { ScanService } from './scan.service.js';

/** Lo llama la ficha pública al abrirse (la página está cacheada, así que no podemos contar del lado del servidor). */
@Controller('public/cards')
export class PublicScanController {
  constructor(
    private readonly scans: ScanService,
    private readonly sessions: SessionService,
  ) {}

  @Post(':token/scan')
  @HttpCode(204)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async scan(@Param('token') token: string, @Req() req: Request): Promise<void> {
    if (!PUBLIC_TOKEN_RE.test(token)) throw new NotFoundException({ error: 'not_found' });
    const viewer = await this.sessions.resolve(req.cookies?.[SESSION_COOKIE]);
    await this.scans.record(token, viewer?.id ?? null);
  }
}

@UseGuards(SessionGuard)
@Controller('scans')
export class ScansController {
  constructor(private readonly scans: ScanService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<ScanDto[]> {
    return this.scans.history(user.id);
  }
}
