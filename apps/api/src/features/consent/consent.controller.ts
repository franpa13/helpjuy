import { Controller, Get } from '@nestjs/common';
import type { ConsentDto } from '@helpjuy/contracts';
import { ConsentService } from './consent.service.js';

@Controller('consent')
export class ConsentController {
  constructor(private readonly consent: ConsentService) {}

  @Get('current')
  current(): ConsentDto {
    return this.consent.current();
  }
}
