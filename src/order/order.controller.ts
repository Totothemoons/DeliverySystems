// src/order/order.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';

import {
  Role,
  UserRole,
} from '../auth/decorator/role.decorator';

import { CreateOrderDto } from './dto/create-order.dto';

@UseGuards(AccessTokenGuard)
@Controller('order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
  ) {}

  @Post()
  @Role(UserRole.CUSTOMER)
  createOrder(
    @Req() req: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(
      req.user.sub || req.user.id,
      dto,
    );
  }

  @Patch(':orderId/status')
  @Role(UserRole.SHOP, UserRole.DRIVER, UserRole.ADMIN)
  updateStatus(@Param('orderId') orderId: string, @Body() body: { status: any }) {
    return this.orderService.updateStatus(orderId, body.status);
  }

  // @Get(':orderId')
  // @Role(UserRole.CUSTOMER,
  //   UserRole.DRIVER,
  //   UserRole.SHOP,
  //   UserRole.ADMIN,)
  // getOrder(
  //   @Req() req: any,
  //   @Param('orderId') orderId: string,
  // ) {
  //   return this.orderService.getOrder(
  //     orderId,
  //     req.user.id,
  //   );
  // }
}
