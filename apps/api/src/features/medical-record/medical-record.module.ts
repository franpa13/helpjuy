import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProfilesModule } from '../profiles/profiles.module.js';
import { MedicalRecordController } from './medical-record.controller.js';
import { MedicalRecordService } from './medical-record.service.js';

@Module({
  imports: [AuthModule, ProfilesModule],
  controllers: [MedicalRecordController],
  providers: [MedicalRecordService],
  exports: [MedicalRecordService],
})
export class MedicalRecordModule {}
