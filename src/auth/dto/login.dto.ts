import { IsEmail, IsOptional, IsString, MinLength, Matches } from 'class-validator';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
const PASSWORD_MESSAGE = 'Password must be at least 6 characters and contain letters and numbers';

export class LoginDto {
    @IsEmail({}, { message: 'Invalid email format' })
    email!: string;

    @IsString()
    @MinLength(6, { message: 'Password should be more than six characters' })
    @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
    password!: string;
}