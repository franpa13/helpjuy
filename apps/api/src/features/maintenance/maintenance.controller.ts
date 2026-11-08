import { Controller, Headers, HttpCode, Post, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { timingSafeEqual } from 'node:crypto';
import { MetricsService } from '../metrics/metrics.service.js';
import { MaintenanceService, type MaintenanceResult } from './maintenance.service.js';

const sameSecret = (a: string, b: string) => {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
};

/** Para un cron externo (cron-job.org, GitHub Actions): la API gratis se duerme y su cron interno no corre. */
@Controller('internal')
export class MaintenanceController {
  constructor(
    private readonly maintenance: MaintenanceService,
    private readonly metrics: MetricsService,
  ) {}

  @Post('maintenance')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async run(@Headers('x-maintenance-secret') sent?: string): Promise<MaintenanceResult> {
    const secret = process.env.MAINTENANCE_SECRET;
    if (!secret || !sent || !sameSecret(sent, secret)) throw new UnauthorizedException({ error: 'unauthorized' });
    const result = await this.maintenance.run();
    // De paso, la foto diaria de las métricas (la API gratis se duerme y su cron interno no corre).
    await this.metrics.snapshot();
    return result;
  }
}
