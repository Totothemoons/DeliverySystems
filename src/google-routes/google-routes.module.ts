
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleRoutesService } from './google-routes.service';

@Module({
  imports: [ConfigModule],
  providers: [GoogleRoutesService],
  exports: [GoogleRoutesService],
})
export class GoogleRoutesModule {}
