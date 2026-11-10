import { Controller, Get, Header, Query, UseGuards } from '@nestjs/common';
import { adminAccountsQuerySchema, type AdminAccountsDto, type AdminAccountsQuery, type AdminMetricsDto } from '@helpjuy/contracts';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { AdminGuard } from '../auth/admin.js';
import { SessionGuard } from '../auth/session.guard.js';
import { MetricsService } from './metrics.service.js';

@UseGuards(SessionGuard, AdminGuard)
@Controller('admin')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @Header('Cache-Control', 'private, no-store')
  get(): Promise<AdminMetricsDto> {
    return this.metrics.compute();
  }

  /** Cuentas registradas (email, alta y avance). Nunca datos médicos. */
  @Get('accounts')
  @Header('Cache-Control', 'private, no-store')
  accounts(@Query(new ZodValidationPipe(adminAccountsQuerySchema)) query: AdminAccountsQuery): Promise<AdminAccountsDto> {
    return this.metrics.accounts(query);
  }
}
