import { RegisterDto } from './register.dto';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterDriverDto extends RegisterDto {
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
