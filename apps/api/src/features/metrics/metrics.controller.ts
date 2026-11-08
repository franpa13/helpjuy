import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import type { AdminMetricsDto } from '@helpjuy/contracts';
import { AdminGuard } from '../auth/admin.js';
import { SessionGuard } from '../auth/session.guard.js';
import { MetricsService } from './metrics.service.js';

@UseGuards(SessionGuard, AdminGuard)
@Controller('admin/metrics')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @Header('Cache-Control', 'private, no-store')
  get(): Promise<AdminMetricsDto> {
    return this.metrics.compute();
  }
}
