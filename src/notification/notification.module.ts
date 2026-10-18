import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
    imports: [GatewayModule],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}