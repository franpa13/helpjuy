import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FamilyGroupsController, FamilyInvitesController } from './family.controller.js';
import { EmergencyAlertController, FamilyTestAlertController } from './emergency-alert.controller.js';
import { EmergencyAlertService } from './emergency-alert.service.js';
import { FamilyService } from './family.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FamilyGroupsController, FamilyInvitesController, EmergencyAlertController, FamilyTestAlertController],
  providers: [FamilyService, EmergencyAlertService],
  exports: [FamilyService],
})
export class FamilyModule {}
