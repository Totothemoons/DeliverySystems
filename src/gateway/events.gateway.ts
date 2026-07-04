import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
@WebSocketGateway({
    namespace: '/events',
    cors: { origin: '*' },
})

export class EventsGateway implements OnGatewayConnection , OnGatewayDisconnect {
    @WebSocketServer()
    server!: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    handleConnection(client: Socket){
        try{
            const token = 
                 client.handshake.auth.token ||
                 client.handshake.headers.authorization?.replace('Bearer ', '');

            if(!token) {
                client.disconnect();
                return;
            }

            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
            });

            client.data.user = payload;
            client.join(`user:${payload.sub}`);
            console.log(`[Events] Connected: ${payload.sub}`);

        }catch{
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket){
        console.log(`[Events] Disconnected: ${client.data.user?.sub}`);
    }

    @SubscribeMessage('join-order')
    handleJoinOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string},
    ){
        client.join(`order:${data.orderId}`);
        client.emit('joined-order', { orderId: data.orderId });
    }

    @SubscribeMessage('leave-order')
    handleLeaveOrder(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { orderId: string},
    ){
        client.leave(`order:${data.orderId}`);
    }

    notifyNewOrder(shopId: string, order: any){
        this.server.to(`user:${shopId}`).emit('notification', {
            type: 'NEW_ORDER',
            title: 'New Order!',
            message: `You have a new order`,
            data: order,
            createdAt: new Date(),
        });
    }

    notifyOrderStatus(customerId: string, payload: {
        orderId: string;
        status: string;
        message: string;
    }) {
        this.server.to(`user:${customerId}`).emit('notification', {
            type: 'ORDER_STATUS',
            title: 'Order Update',
            ...payload,
            createdAt: new Date(),
        });
    }

    notifyDriverAssigned(driverId: string, order: any){
        this.server.to(`user:${driverId}`).emit('notification', {
            type: 'DELIVERY_REQUEST',
            title: 'New Delivery Request!',
            message: 'You have a new delivery',
            data: order,
            createdAt: new Date(),
        });
    }

    notifyPayment(userId: string, payload: {
        orderId: string;
        status: string;
        amount: number;
    }) {
        this.server.to(`user:${userId}`).emit('notification', {
            type: 'PAYMENT',
            title: 'Payment Update',
            ...payload,
            createdAt: new Date(),
        });
    }

    notifyDriverLocation(orderId: string, location: {
        driverId: string;
        latitude: number;
        longitude: number;
    }) {
        this.server.to(`order:${orderId}`).emit('driver-location', location);
    }
}
