import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@helpjuy/contracts';

@Controller('health')
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: 'ok' };
  }
}
