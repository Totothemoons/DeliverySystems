import { IsString } from 'class-validator';

export class JoinRoomDto {
    @IsString()
    orderId!: string;
}