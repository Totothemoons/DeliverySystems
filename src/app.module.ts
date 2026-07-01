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
import { DriverModule } from './driver/driver.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { CategoryModule } from './category/category.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { OrderModule } from './order/order.module';
import { CacheModule} from '@nestjs/cache-manager';
import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis';
@Module({

  imports: [ConfigModule.forRoot({
    isGlobal: true,
    validate: validateEnv,
  }), 
  PrismaModule,
  AuthModule,
  MaillerModule,
  UserModule,
  AddressModule,
  DriverModule,
  RestaurantsModule,
  CategoryModule,
  MenuItemsModule, 
  CloudinaryModule,
  OrderModule,
  CacheModule.registerAsync({
  isGlobal: true,
  inject: [ConfigService],
  useFactory: async (config: ConfigService) => {
    const host = config.get<string>('REDIS_HOST');
    const port = config.get<number>('REDIS_PORT');

    const keyv = new Keyv({
      store: new KeyvRedis(`redis://${host}:${port}`),
      namespace: undefined, 
      useKeyPrefix: false,  
    });

    return {
      stores: [keyv],
    };
  },
})

],

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


