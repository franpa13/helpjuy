import { Global, Injectable, Module } from '@nestjs/common';
import { medicalRecordSchema, type MedicalRecord } from '@helpjuy/contracts';
import { decryptJson, encryptJson, loadMedicalKey } from './field-cipher.js';

/** Cifra y descifra fichas médicas con la clave de la app. */
@Injectable()
export class MedicalCipher {
  private readonly key = loadMedicalKey();

  encrypt(record: MedicalRecord): string {
    return encryptJson(record, this.key);
  }

  /** Descifra y vuelve a validar (aplica defaults si el contrato sumó campos). */
  decrypt(ciphertext: string): MedicalRecord {
    return medicalRecordSchema.parse(decryptJson(ciphertext, this.key));
  }
}

@Global()
@Module({ providers: [MedicalCipher], exports: [MedicalCipher] })
export class CryptoModule {}
