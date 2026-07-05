import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const client: Socket = context.switchToWs().getClient();

        if (client.data.user) return true;

        const token =
            client.handshake.auth?.token ||
            client.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) throw new WsException('Unauthorized');

        try {
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
            });
            client.data.user = payload;
            return true;
        } catch {
            throw new WsException('Unauthorized');
        }
    }
}