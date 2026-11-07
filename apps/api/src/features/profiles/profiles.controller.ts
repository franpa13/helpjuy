import { Body, Controller, Delete, Get, Header, HttpCode, Param, Patch, Post, Put, StreamableFile, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createProfileSchema,
  markPrintedSchema,
  profilePhotoSchema,
  updateProfileSchema,
  type CreateProfileInput,
  type ProfileDto,
  type ProfilePhotoInput,
  type UpdateProfileInput,
} from '@helpjuy/contracts';
import type { User } from '../../generated/prisma/client.js';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { SessionGuard } from '../auth/session.guard.js';
import { ProfilesService } from './profiles.service.js';

@UseGuards(SessionGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get()
  async list(@CurrentUser() user: User): Promise<ProfileDto[]> {
    return (await this.profiles.list(user.id)).map((p) => this.profiles.toDto(p));
  }

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async create(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(createProfileSchema)) body: CreateProfileInput,
  ): Promise<ProfileDto> {
    return this.profiles.toDto(await this.profiles.create(user, body));
  }

  @Get(':id')
  async get(@CurrentUser() user: User, @Param('id') id: string): Promise<ProfileDto> {
    return this.profiles.toDto(await this.profiles.getOwned(user.id, id));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<ProfileDto> {
    return this.profiles.toDto(await this.profiles.update(user.id, id, body));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    await this.profiles.remove(user.id, id);
  }

  @Post(':id/printed')
  @HttpCode(200)
  printed(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(markPrintedSchema)) body: { fingerprint: string },
  ) {
    return this.profiles.markPrinted(user.id, id, body.fingerprint);
  }

  @Post(':id/rotate-token')
  @HttpCode(200)
  async rotate(@CurrentUser() user: User, @Param('id') id: string): Promise<{ publicToken: string }> {
    return { publicToken: await this.profiles.rotateToken(user.id, id) };
  }

  // ---------- Foto ----------

  @Put(':id/photo')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async setPhoto(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(profilePhotoSchema)) body: ProfilePhotoInput,
  ): Promise<ProfileDto> {
    const image = Buffer.from(body.image.replace(/^data:[^,]*,/, ''), 'base64');
    return this.profiles.toDto(await this.profiles.setPhoto(user.id, id, image));
  }

  @Post(':id/photo/google')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async setGooglePhoto(@CurrentUser() user: User, @Param('id') id: string): Promise<ProfileDto> {
    return this.profiles.toDto(await this.profiles.setGooglePhoto(user, id));
  }

  @Delete(':id/photo')
  @HttpCode(204)
  async removePhoto(@CurrentUser() user: User, @Param('id') id: string): Promise<void> {
    await this.profiles.removePhoto(user.id, id);
  }

  @Get(':id/photo')
  @Header('Content-Type', 'image/webp')
  @Header('Cache-Control', 'private, no-store')
  async photo(@CurrentUser() user: User, @Param('id') id: string): Promise<StreamableFile> {
    return new StreamableFile(await this.profiles.getPhoto(user.id, id));
  }
}
