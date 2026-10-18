import { IsUUID } from 'class-validator';

export class AcceptDeliveryDto {
  @IsUUID()
  deliveryId!: string;
}