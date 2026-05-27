import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
 
export class CreateDriverProfileDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  licenseNumber!: string;
 
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  vehicleType!: string;
 
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  vehiclePlate!: string;
}