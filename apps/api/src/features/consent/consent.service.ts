import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { CONSENT_VERSION, type ConsentAcceptance, type ConsentDto } from '@helpjuy/contracts';
import type { Prisma } from '../../generated/prisma/client.js';
import { CONSENT_TEXT } from './consent-text.js';

@Injectable()
export class ConsentService {
  current(): ConsentDto {
    return { version: CONSENT_VERSION, text: CONSENT_TEXT };
  }

  /** Valida que el consentimiento sea el vigente y, para menores, que haya declaración de tutor. */
  assertValid(consent: ConsentAcceptance, isMinor: boolean): void {
    if (consent.version !== CONSENT_VERSION) {
      throw new ConflictException({ error: 'consent_outdated', currentVersion: CONSENT_VERSION });
    }
    if (isMinor && consent.guardianDeclared !== true) {
      throw new BadRequestException({ error: 'guardian_required' });
    }
  }

  async record(
    tx: Prisma.TransactionClient,
    data: { userId: string; profileId: string; version: string; guardianDeclared: boolean },
  ): Promise<void> {
    await tx.consentRecord.create({ data });
  }
}
