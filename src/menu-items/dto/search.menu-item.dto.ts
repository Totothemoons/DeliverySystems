// user.dto.ts
import { IsOptional, IsString, IsInt, Min, IsNumber, IsIn, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMenuItem {
  @IsOptional()
  @IsString()
  search?: string; 
  
  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsIn(['name', 'price' ,'createdAt', 'updatedAt'])
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