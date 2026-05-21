import { IsEmail, IsOptional, IsString, IsPhoneNumber, MinLength, Matches } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 6 characters and contain letters and numbers';

export class RegisterDto {
    @IsEmail({}, { message: 'Invalid email format' })
    @IsOptional()
    email?: string;

    @IsString()
    @MinLength(6, { message: 'Password should be more than six characters' })
    @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    @IsOptional()
    password?: string;

    @IsString()
    @MinLength(6, { message: 'Password should be more than six characters' })
    @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    @IsOptional()
    confirmPassword?: string;

    @IsString()
    @MinLength(5)
    fullname!: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    profileImageUrl?: string;
}