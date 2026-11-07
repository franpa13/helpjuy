import { Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';
import { MaintenanceService, type MaintenanceResult } from './maintenance.service.js';

const sameSecret = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Para un cron externo (cron-job.org, GitHub Actions): la API gratis se duerme y su cron interno no corre. */
@Controller('internal')
export class MaintenanceController {
  constructor(private readonly maintenance: MaintenanceService) {}

  @Post('maintenance')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  run(@Headers('x-maintenance-secret') sent?: string): Promise<MaintenanceResult> {
    const secret = process.env.MAINTENANCE_SECRET;
    if (!secret || !sent || !sameSecret(sent, secret)) throw new UnauthorizedException({ error: 'unauthorized' });
    return this.maintenance.run();
  }
}
