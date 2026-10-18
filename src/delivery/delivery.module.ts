import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { GoogleRoutesModule } from '../google-routes/google-routes.module';
import { DriverModule } from '../driver/driver.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, GoogleRoutesModule, DriverModule],
  providers: [DeliveryService],
  controllers: [DeliveryController]
})
export class DeliveryModule {}
