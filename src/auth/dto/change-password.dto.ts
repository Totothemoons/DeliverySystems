import {IsString,IsNotEmpty} from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    @IsNotEmpty({ message: 'Current password is required' })
    currentPassword!: string;

    @IsString()
    @IsNotEmpty({ message: 'New password is required' })
    newPassword!: string;
}