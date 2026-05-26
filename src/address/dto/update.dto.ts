import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}