import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DriverGateway } from './driver.gateway';
import { DriverLocationModule } from '../driver-location/driver-location.module';
import { WsJwtGuard } from '../auth/guard/ws-jwt.guard';

@Module({
  imports: [
    DriverLocationModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      }),
    }),
  ],
  providers: [DriverGateway, WsJwtGuard],
})
export class WebsocketModule {}
