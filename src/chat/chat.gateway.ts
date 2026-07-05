import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { JoinRoomDto } from './dto/join-room.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';

@WebSocketGateway({
    namespace: '/chat',
    cors: { origin: '*'},
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    handleConnection(client: Socket) {
        try{
            const token = 
                client.handshake.auth?.token ||
                client.handshake.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
            })

            client.data.user = payload;
            console.log(`Client connected: ${client.id}, User ID: ${payload.sub}`);
        } catch {
            client.disconnect();
        }

    }

    handleDisconnect(client: Socket){
        console.log(`Client disconnected: ${client.id}`);
    }

    @UseGuards(AccessTokenGuard)
    @SubscribeMessage('join-room')
    handleJoinRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: JoinRoomDto,
    ){
        client.join(`chat-${dto.orderId}`);
        client.emit('joined-room', {
            orderId: dto.orderId,
            message: `Joined room for order ${dto.orderId}`,
        });
    }

    @UseGuards(AccessTokenGuard)
    @SubscribeMessage('leave-room')
    handleLeaveRoom(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: JoinRoomDto,
    ) {
        client.leave(`chat:${dto.orderId}`);
        client.emit('left-room', { orderId: dto.orderId });
    }

    @UseGuards(AccessTokenGuard)
    @SubscribeMessage('send-message')
    async handleSendMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: SendMessageDto,
    ) {
        // ดึง senderId จาก token ป้องกันปลอม
        const senderId = client.data.user.sub;

        const message = await this.chatService.saveMessage({
            orderId: dto.orderId,
            senderId,
            receiverId: dto.receiverId,
            message: dto.message,
        });

        // ส่งให้ทุกคนใน room
        this.server.to(`chat:${dto.orderId}`).emit('new-message', message);

        return { success: true };
    }
}