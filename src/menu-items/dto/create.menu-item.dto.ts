import {IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator'

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

    @IsOptional()
    isAvailable!: boolean

    @IsNotEmpty()
    @IsString()
    categoryId!: string

}