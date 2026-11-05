import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  createProfileSchema,
  updateProfileSchema,
  type CreateProfileInput,
  type ProfileDto,
  type UpdateProfileInput,
} from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { ProfilesService, toProfileDto } from './profiles.service.js';

@UseGuards(SessionGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  async list(@CurrentUser() user: User): Promise<ProfileDto[]> {
    return (await this.profiles.list(user.id)).map(toProfileDto);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createProfileSchema)) body: CreateProfileInput,
  ): Promise<ProfileDto> {
    return toProfileDto(await this.profiles.create(user.id, body));
  }

  @Get(':id')
  async get(@CurrentUser() user: User, @Param('id') id: string): Promise<ProfileDto> {
    return toProfileDto(await this.profiles.getOwned(user.id, id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<ProfileDto> {
    return toProfileDto(await this.profiles.update(user.id, id, body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    await this.profiles.remove(user.id, id);
  }

  @Post(':id/rotate-token')
  @HttpCode(200)
  async rotate(@CurrentUser() user: User, @Param('id') id: string): Promise<{ publicToken: string }> {
    return { publicToken: await this.profiles.rotateToken(user.id, id) };
  }
}
