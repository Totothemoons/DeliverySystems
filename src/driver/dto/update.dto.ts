import { IsString, IsOptional, MaxLength } from 'class-validator';

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
}