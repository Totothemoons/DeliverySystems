import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  Get
  ,Patch
  ,BadRequestException
} from '@nestjs/common';

import { DeliveryService } from './delivery.service';

import { AccessTokenGuard } from '../auth/guard/access-token.guard';

import {
  Role,
  UserRole,
} from '../auth/decorator/role.decorator';

import { AcceptDeliveryDto } from './dto/accept-delivery.dto';

@UseGuards(AccessTokenGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
  ) {}

  @Get(':deliveryId/drivers')
  @Role(UserRole.ADMIN, UserRole.SHOP)
  findDrivers(
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.deliveryService.findDriversForDelivery(
      deliveryId,
    );
  }

  @Post(':deliveryId/accept')
  @Role(UserRole.DRIVER)
  acceptDelivery(
    @Req() req: any,
    @Param('deliveryId') deliveryId: string,
  ) {
    return this.deliveryService.acceptDelivery(
      deliveryId,
      req.user.sub || req.user.id,
    );
  }

  @Post('order/:orderId')
  @Role(UserRole.SHOP, UserRole.ADMIN)
  createForOrder(@Param('orderId') orderId: string) {
    return this.deliveryService.createDelivery(orderId);
  }

  @Patch(':deliveryId/status')
  @Role(UserRole.DRIVER, UserRole.ADMIN)
  updateStatus(@Req() req: any, @Param('deliveryId') deliveryId: string, @Body() body?: { status?: string }) {
    if (!body?.status) {
      throw new BadRequestException('Request body must include a status field');
    }
    return this.deliveryService.updateStatus(deliveryId, body.status, req.user.sub || req.user.id, req.user.role);
  }
  
}
