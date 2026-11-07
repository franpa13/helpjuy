import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FamilyModule } from '../family/family.module.js';
import { MedicalRecordModule } from '../medical-record/medical-record.module.js';
import { AccountController } from './account.controller.js';
import { AccountService } from './account.service.js';

@Module({
  imports: [AuthModule, FamilyModule, MedicalRecordModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
