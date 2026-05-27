import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DriverService } from './driver.service';

@Module({
  imports: [PrismaModule],
  controllers: [DriverController],
  providers: [DriverService]
})
export class DriverModule {}
