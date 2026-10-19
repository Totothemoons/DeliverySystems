import { MiddlewareConsumer, Module, NestModule, Global, ExecutionContext } from '@nestjs/common';
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
import { ThrottlerModule, seconds, minutes, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { GatewayModule } from './gateway/gateway.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notification/notification.module';
import { DriverLocationModule } from './driver-location/driver-location.module';
import { DeliveryModule } from './delivery/delivery.module';
import { GoogleRoutesModule } from './google-routes/google-routes.module';
import { WebsocketModule } from './websocket/websocket.module';
import { RoleGuard } from './auth/guard/authorization.guard';

function getRedisUrl(config: ConfigService): string {
  const redisUrl = config.get<string>('REDIS_URL');
  if (redisUrl) {
    return redisUrl;
  }

  const host = config.get<string>('REDIS_HOST');
  const port = config.get<number>('REDIS_PORT');
  if (!host || !port) {
    throw new Error('Set REDIS_URL or both REDIS_HOST and REDIS_PORT');
  }

  // REDIS_HOST must be a hostname here; use REDIS_URL for a full URL.
  return `redis://${host}:${port}`;
}

@Global()
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
      const keyv = new Keyv({
        store: new KeyvRedis(getRedisUrl(config)),
        namespace: undefined, 
        useKeyPrefix: false,  
      });

      return {
        stores: [keyv],
      };
    },
}),
  ThrottlerModule.forRootAsync({
    inject: [ConfigService],
    useFactory: async (config: ConfigService) => ({
      storage: new ThrottlerStorageRedisService(getRedisUrl(config)),
      throttlers: [
        {
          name: 'short',
          limit: 7,
          ttl: seconds(5),
          blockDuration: minutes(10),
        },
        {
          name: 'medium',
          limit: 25,
          ttl: minutes(1),
          blockDuration: minutes(30),
        },
        {
          name: 'long',
          limit: 100,
          ttl: minutes(2),
          blockDuration: minutes(60),
        }
      ],
      errorMessage: 'Too many requests, please try again later.',

      // getTracker: (req: Record<string, unknown>, context: ExecutionContext) => {
      //   return req.headers['x-tenant-id'];
      // }
    })
  }),
  GatewayModule,
  ChatModule,
  NotificationModule,
  DriverLocationModule,
  DeliveryModule,
  GoogleRoutesModule,
  WebsocketModule,
],

  controllers: [AppController],
  providers: [AppService,
    {
      provide: 'APP_GUARD',
      useClass: ThrottlerGuard,
    },
    { provide: 'APP_GUARD', useClass: RoleGuard },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(Loggermiddlware)
      .forRoutes('*');
  }
}


