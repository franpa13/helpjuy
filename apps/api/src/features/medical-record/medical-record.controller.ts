import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { saveMedicalRecordSchema, type MedicalRecordResponse } from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { MedicalRecordService } from './medical-record.service.js';

@UseGuards(SessionGuard)
@Controller('profiles/:id/record')
export class MedicalRecordController {
  constructor(private readonly records: MedicalRecordService) {}

  @Get()
  get(@CurrentUser() user: User, @Param('id') id: string): Promise<MedicalRecordResponse> {
    return this.records.get(user.id, id);
  }

  @Put()
  save(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(saveMedicalRecordSchema)) body: ReturnType<typeof saveMedicalRecordSchema.parse>,
  ): Promise<MedicalRecordResponse> {
    return this.records.save(user.id, id, body);
  }
}
