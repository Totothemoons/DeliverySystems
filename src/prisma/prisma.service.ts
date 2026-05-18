import dotenv from 'dotenv';
dotenv.config();

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
@Injectable()
export class PrismaService 
    extends PrismaClient 
    implements OnModuleInit, OnModuleDestroy 
{
    constructor(private configService: ConfigService) {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        if (!databaseUrl) {
            throw new Error('DATABASE_URL is not defined in environment variables');
        }

        const pool = new Pool({
            connectionString: databaseUrl,
        })

        const adapter = new PrismaPg(pool);
        super({
            adapter,
            log: 
                configService.get<string>('NODE_ENV') === 'production'
                ? ['error']
                : ['query', 'error', 'warn'],
        });
    }
    

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }

}
