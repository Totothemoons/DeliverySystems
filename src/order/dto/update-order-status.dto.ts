// src/order/dto/update-order-status.dto.ts

import { IsEnum } from 'class-validator';

export enum OrderStatus {
  PENDING="PENDING",
  CONFIRMED="CONFIRMED",
  PREPARING="PREPARING",
  PICKED_UP="PICKED_UP",
  DELIVERING="DELIVERING",
  COMPLETED="COMPLETED",
  CANCELLED="CANCELLED"
}
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}