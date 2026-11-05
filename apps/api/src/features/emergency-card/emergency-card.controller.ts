import { Controller, Get, Header, NotFoundException, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_TOKEN_RE, type PublicCardDto } from '@helpjuy/contracts';
import { MedicalCipher } from '../../shared/crypto/medical-cipher.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { MedicalRecordService } from '../medical-record/medical-record.service.js';
import { toPublicCard } from './public-card.mapper.js';

@Controller('public/cards')
export class EmergencyCardController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: MedicalCipher,
    private readonly records: MedicalRecordService,
  ) {}

  @Get(':token')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Header('X-Robots-Tag', 'noindex, nofollow')
  @Header('Cache-Control', 'no-store')
  async get(@Param('token') token: string): Promise<PublicCardDto> {
    if (!PUBLIC_TOKEN_RE.test(token)) throw new NotFoundException({ error: 'not_found' });
    const profile = await this.prisma.profile.findUnique({
      where: { publicToken: token },
      include: { medicalRecord: true },
    });
    if (!profile) throw new NotFoundException({ error: 'not_found' });
    const row = profile.medicalRecord;
    return toPublicCard(
      profile,
      row ? this.cipher.decrypt(row.ciphertext) : null,
      this.records.readVisibility(row?.visibility),
      row?.updatedAt ?? null,
    );
  }
}
