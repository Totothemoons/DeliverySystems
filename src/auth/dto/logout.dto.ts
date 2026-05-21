import { IsEmail, IsOptional, IsString, MinLength, Matches, IsNotEmpty } from 'class-validator';

export class LogoutDto {
    @IsString()
    @IsNotEmpty({ message: 'Refresh token is required' })
    refreshToken!: string;
}
