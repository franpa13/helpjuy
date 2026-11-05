import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  familyGroupNameSchema,
  familyMuteSchema,
  type CreatedInviteDto,
  type FamilyGroupDto,
  type FamilyGroupNameInput,
  type FamilyInviteDto,
  type InvitePreviewDto,
} from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { FamilyService } from './family.service.js';

@UseGuards(SessionGuard)
@Controller('family-groups')
export class FamilyGroupsController {
  constructor(private readonly family: FamilyService) {}

  @Get()
  list(@CurrentUser() user: User): Promise<FamilyGroupDto[]> {
    return this.family.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(familyGroupNameSchema)) body: FamilyGroupNameInput,
  ): Promise<FamilyGroupDto> {
    return this.family.create(user.id, body.name);
  }

  @Patch(':id')
  rename(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(familyGroupNameSchema)) body: FamilyGroupNameInput,
  ): Promise<FamilyGroupDto> {
    return this.family.rename(user.id, id, body.name);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    return this.family.remove(user.id, id);
  }

  @Patch(':id/me')
  mute(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(familyMuteSchema)) body: { muted: boolean },
  ): Promise<FamilyGroupDto> {
    return this.family.setMuted(user.id, id, body.muted);
  }

  @Post(':id/invites')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  invite(@CurrentUser() user: User, @Param('id') id: string): Promise<CreatedInviteDto> {
    return this.family.createInvite(user.id, id);
  }

  @Get(':id/invites')
  invites(@CurrentUser() user: User, @Param('id') id: string): Promise<FamilyInviteDto[]> {
    return this.family.listInvites(user.id, id);
  }

  @Delete(':id/invites/:inviteId')
  @HttpCode(204)
  revoke(@CurrentUser() user: User, @Param('id') id: string, @Param('inviteId') inviteId: string): Promise<void> {
    return this.family.revokeInvite(user.id, id, inviteId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(204)
  removeMember(@CurrentUser() user: User, @Param('id') id: string, @Param('userId') userId: string): Promise<void> {
    return this.family.removeMember(user.id, id, userId);
  }
}

@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('family-invites')
export class FamilyInvitesController {
  constructor(private readonly family: FamilyService) {}

  /** Vista previa pública: para mostrar "Ana te invita a Familia Paredes" antes de ingresar. */
  @Get(':token')
  preview(@Param('token') token: string): Promise<InvitePreviewDto> {
    return this.family.preview(token);
  }

  @Post(':token/accept')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  accept(@CurrentUser() user: User, @Param('token') token: string): Promise<FamilyGroupDto> {
    return this.family.accept(user.id, token);
  }
}
