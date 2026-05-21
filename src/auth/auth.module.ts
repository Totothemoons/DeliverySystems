import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController, PrismaModule],
  providers: [AuthService]
})
export class AuthModule {}
