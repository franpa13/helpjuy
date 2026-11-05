import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { SESSION_COOKIE, SessionService } from './session.service.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const user = await this.sessions.resolve(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException({ error: 'unauthenticated' });
    req.user = user;
    return true;
  }
}
