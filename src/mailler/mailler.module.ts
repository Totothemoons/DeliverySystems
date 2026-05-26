import { Module } from '@nestjs/common';
import { MaillerService } from './mailler.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [MaillerService]
})
export class MaillerModule {}
