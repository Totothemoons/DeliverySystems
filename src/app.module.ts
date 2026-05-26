import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { PrismaModule } from './prisma/prisma.module';
import { Loggermiddlware } from './middleware/logger.middleware';
import { AuthModule } from './auth/auth.module';
import { MaillerModule } from './mailler/mailler.module';
import { UserModule } from './user/user.module';
import { AddressModule } from './address/address.module';

@Module({

  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validate: validateEnv,
  }), PrismaModule, AuthModule, MaillerModule, UserModule, AddressModule],

  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(Loggermiddlware)
      .forRoutes('*');
  }
}


