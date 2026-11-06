import { Body, Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_TOKEN_RE, emergencyAlertSchema, type EmergencyAlertInput, type EmergencyAlertResultDto, type ReceivedAlertDto } from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { EmergencyAlertService } from './emergency-alert.service.js';

/** Público: lo usa quien escanea el QR. Límite estricto por IP para evitar abusos. */
@Controller('public/cards')
export class EmergencyAlertController {
  constructor(private readonly alerts: EmergencyAlertService) {}

  @Post(':token/emergency')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  trigger(
    @Param('token') token: string,
    @Body(new ZodValidationPipe(emergencyAlertSchema)) body: EmergencyAlertInput,
  ): Promise<EmergencyAlertResultDto> {
    if (!PUBLIC_TOKEN_RE.test(token)) throw new NotFoundException({ error: 'not_found' });
    return this.alerts.trigger(token, body);
  }
}

@UseGuards(SessionGuard)
@Controller('family-groups')
export class FamilyTestAlertController {
  constructor(private readonly alerts: EmergencyAlertService) {}

  @Post(':id/test-alert')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  test(@CurrentUser() user: User, @Param('id') id: string): Promise<EmergencyAlertResultDto> {
    return this.alerts.test(user.id, id);
  }
}

/** "Avisos recibidos": historial para el panel. */
@UseGuards(SessionGuard)
@Controller('alerts')
export class ReceivedAlertsController {
  constructor(private readonly alerts: EmergencyAlertService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<ReceivedAlertDto[]> {
    return this.alerts.history(user.id);
  }
}
