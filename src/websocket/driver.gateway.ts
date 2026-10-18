import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { Socket } from 'socket.io';
import { DriverLocationService } from '../driver-location/driver-location.service';
import { UpdateDriverLocationDto } from '../driver-location/dto/update-driver-location.dto';
import { WsJwtGuard } from '../auth/guard/ws-jwt.guard';

@WebSocketGateway({
  namespace: '/driver',
  cors: {
    origin: '*',
  },
})
@UseGuards(WsJwtGuard)
export class DriverGateway {
  constructor(
    private readonly driverLocationService: DriverLocationService,
  ) {}

  handleConnection(socket: Socket) {
    // Makes it clear in the backend terminal which namespace instance accepted
    // the Postman connection and which events actually arrive on it.
    console.log(`[driver-ws] connected: ${socket.id}`);
    socket.onAny((event, ...args) => {
      console.log(`[driver-ws] received ${event}:`, ...args);
    });
  }

  @SubscribeMessage('driver:location')
  async updateLocation(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    dto: UpdateDriverLocationDto,
  ) {
    try {
      console.log('[driver-ws] location handler started', {
        user: socket.data.user,
        dto,
      });
      if (socket.data.user?.role !== 'DRIVER') {
        throw new WsException('Only drivers can update location');
      }

      const driverId = socket.data.user.sub;
      const location = await this.driverLocationService.updateLocation(
        driverId,
        dto.latitude,
        dto.longitude,
      );

      socket.emit('driver:location:updated', location);
      return location;
    } catch (error) {
      console.error('[driver-ws] location update failed:', error);
      socket.emit('driver:location:error', {
        message: error instanceof Error ? error.message : 'Location update failed',
      });
      throw error;
    }
  }
}
