import type { PrismaService } from '../../src/shared/prisma/prisma.service.js';

const TABLES = ['CardScan', 'EmergencyAlert', 'FamilyInvite', 'FamilyMember', 'FamilyGroup', 'MedicalRecord', 'ConsentRecord', 'Profile', 'EmailToken', 'Session', 'User'];

export async function resetDb(prisma: PrismaService): Promise<void> {
  const list = TABLES.map((t) => `"${t}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}
