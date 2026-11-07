import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MedicalRecordModule } from '../medical-record/medical-record.module.js';
import { EmergencyCardController } from './emergency-card.controller.js';
import { PublicScanController, ScansController } from './scan.controller.js';
import { ScanService } from './scan.service.js';

@Module({
  imports: [AuthModule, MedicalRecordModule],
  controllers: [EmergencyCardController, PublicScanController, ScansController],
  providers: [ScanService],
})
export class EmergencyCardModule {}
