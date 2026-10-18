import { IsString, IsOptional, MaxLength, IsLatitude, IsLongitude, } from 'class-validator';

export class UpdateDriverProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  licenseNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vehicleType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vehiclePlate?: string;

  @IsLatitude()
  latitude!: number;

  @IsLongitude()
  longitude!: number;
}