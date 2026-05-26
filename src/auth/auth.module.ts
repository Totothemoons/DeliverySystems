import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { MaillerService } from '../mailler/mailler.service';
import { PassportModule } from '@nestjs/passport';
import { AccessStrategy } from './passport-strategy/access.token.strategy';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: { expiresIn: config.getOrThrow<string>('JWT_ACCESS_EXPIRATION') as any },
      })
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, MaillerService, AccessStrategy],
  exports: [AuthService]
})
export class AuthModule {}