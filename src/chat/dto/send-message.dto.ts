import { IsString } from 'class-validator';

export class SendMessageDto {
    @IsString()
    orderId!: string;

    @IsString()
    receiverId!: string;

    @IsString()
    message!: string;
}