import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';
import { createTestApp } from './helpers/app.js';
import { resetDb } from './helpers/db.js';

describe('db (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('resetDb deja las tablas vacías', async () => {
    await prisma.user.create({ data: { email: 'a@a.com' } });
    await resetDb(prisma);
    expect(await prisma.user.count()).toBe(0);
  });
});
