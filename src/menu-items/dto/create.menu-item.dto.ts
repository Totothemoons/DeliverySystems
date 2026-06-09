import {IsNotEmpty, IsNumber, IsOptional, IsString, IsBoolean} from 'class-validator'

export class CreateMenuItemDto {

    @IsNotEmpty()
    @IsString()
    name!: string

    @IsNotEmpty()
    @IsString()
    @IsOptional()
    description?: string

    @IsNotEmpty()    
    @IsNumber()
    price!: number

    @IsNotEmpty()
    @IsNumber()
    sold!: number

    @IsString()
    @IsOptional()
    imageUrl?: string

    @IsBoolean()
    isAvailable!: boolean

    @IsNotEmpty()
    @IsString()
    categoryId!: string

}