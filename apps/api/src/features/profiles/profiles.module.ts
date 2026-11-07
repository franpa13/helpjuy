import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ConsentModule } from '../consent/consent.module.js';
import { ProfilesController } from './profiles.controller.js';
import { HttpImageFetcher, ImageFetcher } from './image-fetcher.js';
import { ProfilesService } from './profiles.service.js';

@Module({
  imports: [AuthModule, ConsentModule],
  controllers: [ProfilesController],
  providers: [ProfilesService, { provide: ImageFetcher, useClass: HttpImageFetcher }],
  exports: [ProfilesService],
})
export class ProfilesModule {}
