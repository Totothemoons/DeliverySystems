import { Module } from '@nestjs/common';
import { DriverLocationService } from './driver-location.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DriverLocationService],
  exports: [DriverLocationService],
})
export class DriverLocationModule {}
