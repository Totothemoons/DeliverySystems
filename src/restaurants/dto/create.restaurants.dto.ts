import { IsDecimal, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum RestaurantStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  BUSY = 'BUSY'
}

export class CreateRestaurantsDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  restaurantImageUrl?: string;

  @IsString()
  @IsNotEmpty()
  address!: string;

  @IsDecimal()
  latitude!: string;

  @IsDecimal()
  longitude!: string;

  @IsString()
  @IsNotEmpty()
  status!: RestaurantStatus;
}