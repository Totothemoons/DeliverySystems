// user.dto.ts
import { IsOptional, IsString, IsInt, Min, IsNumber, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { RestaurantStatus } from './create.restaurants.dto';

export class FindAllUsersDto {
  @IsOptional()
  @IsString()
  search?: string; 

  @IsOptional()
  @IsEnum(RestaurantStatus) 
  status?: RestaurantStatus;

  @IsOptional()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  sortBy: string = 'createdAt';
  
  @IsOptional()
  @IsIn(['asc', 'desc']) 
  sortOrder: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}