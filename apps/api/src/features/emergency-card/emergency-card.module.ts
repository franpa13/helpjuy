import { Module } from '@nestjs/common';
import { MedicalRecordModule } from '../medical-record/medical-record.module.js';
import { EmergencyCardController } from './emergency-card.controller.js';

@Module({
  imports: [MedicalRecordModule],
  controllers: [EmergencyCardController],
})
export class EmergencyCardModule {}
