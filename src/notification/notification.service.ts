import { Injectable } from '@nestjs/common';
import { EventsGateway} from '../gateway/events.gateway';

@Injectable()
export class NotificationService {
    constructor(private readonly eventsGateway: EventsGateway) {}

    newOrder(shopId: string, order: any){
        this.eventsGateway.notifyNewOrder(shopId, order);
    }

    orderConfirmed(customerId: string, orderId: string){
        this.eventsGateway.notifyOrderStatus(customerId, {
            orderId,
            status: 'CONFIRMED',
            message: 'Your order has been confirmed by the restaurant.',
        });
    }
    
    orderPrepared(customerId: string, orderId: string){
        this.eventsGateway.notifyOrderStatus(customerId, {
            orderId,
            status: 'PREPARED',
            message: 'Your order is prepared and ready for pickup.',
        });
    }

    driverAssigned(driverId: string, order: any, customerId: string){
        this.eventsGateway.notifyDriverAssigned(driverId, order);

        this.eventsGateway.notifyOrderStatus(customerId, {
            orderId: order.id,
            status: 'PICKED_UP',
            message: 'Driver is on the way',
        });
    }
    orderDelivered(customerId: string, orderId: string) {
        this.eventsGateway.notifyOrderStatus(customerId, {
            orderId,
            status: 'COMPLETED',
            message: 'Your order has been delivered!',
        });
    }

    paymentUpdate(userId: string, payload: {
        orderId: string;
        status: string;
        amount: number;
    }) {
        this.eventsGateway.notifyPayment(userId, payload);
    }

    driverLocationUpdate(orderId: string, location: {
        driverId: string;
        latitude: number;
        longitude: number;
    }) {
        this.eventsGateway.notifyDriverLocation(orderId, location);
    }
}
