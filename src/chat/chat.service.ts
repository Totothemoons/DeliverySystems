import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomNotFoundException } from '../common/exception/not-found.exception';

@Injectable()
export class ChatService {
    constructor(private readonly prisma: PrismaService) {}

    async saveMessage(data: {
        orderId: string;
        senderId: string;
        receiverId: string;
        message: string;
    }) {
        return this.prisma.message.create({
            data: {
                orderId: data.orderId,
                senderId: data.senderId,
                receiverId: data.receiverId,
                message: data.message,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullname: true,
                        profileImageUrl: true,
                        role: true,
                    },
                },
            },
        });
    }

    async getMessagesByOrder(orderId: string, userId: string){
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { restaurant: true}
        });

        if(!order) throw new CustomNotFoundException('Order not found');

        const isAllowed = 
            order.customerId === userId ||
            order.driverId === userId ||
            order.restaurant.ownerId === userId;

        if (!isAllowed) {
            throw new CustomForbiddenException('You do not have access to this chat');
        }

        return this.prisma.message.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        fullname: true,
                        profileImageUrl: true,
                        role: true,
                    },
                },
            },
        });
    }
}
