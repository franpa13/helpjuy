import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    // Pocas conexiones por instancia: en Neon gratis el pooler reparte; acá no hace falta más.
    const max = Number(process.env.DB_POOL_MAX) || 5;
    super({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL, max, idleTimeoutMillis: 30_000 }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
