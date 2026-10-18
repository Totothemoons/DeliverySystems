import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from "../order/dto/update-order-status.dto"
import { CreateOrderDto } from './dto/create-order.dto';

export enum PaymentStatus {
  PENDING="PENDING",
  COMPLETED="COMPLETED",
  FAILED="FAILED",
  REFUNDED="REFUNDED"
}

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createOrder(
    customerId: string,
    dto: CreateOrderDto,
  ) {
    const {
      restaurantId,
      addressId,
      items,
      paymentMethod,
      note,
    } = dto;

    if (!items.length) {
      throw new BadRequestException(
        'Order must contain at least one item',
      );
    }

    // --------------------------------
    // 1. Validate restaurant
    // --------------------------------

    const restaurant = await this.prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
    });

    if (!restaurant) {
      throw new NotFoundException(
        'Restaurant not found',
      );
    }

    if (restaurant.status === 'CLOSED') {
      throw new BadRequestException(
        'Restaurant is currently closed',
      );
    }

    // --------------------------------
    // 2. Validate address
    // --------------------------------

    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId: customerId,
      },
    });

    if (!address) {
      throw new NotFoundException(
        'Delivery address not found',
      );
    }

    // --------------------------------
    // 3. Get menu items
    // --------------------------------

    const menuItemIds = [
      ...new Set(
        items.map((item) => item.menuItemId),
      ),
    ];

    const menuItems =
      await this.prisma.menuItem.findMany({
        where: {
          id: {
            in: menuItemIds,
          },
          restaurantId,
          isAvailable: true,
          deletedAt: null,
        },
      });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException(
        'Some menu items are unavailable',
      );
    }

    // --------------------------------
    // 4. Calculate price
    // --------------------------------

    let totalPrice = 0;

    const orderItems = items.map((item) => {
      const menuItem = menuItems.find(
        (menu) => menu.id === item.menuItemId,
      );

      if (!menuItem) {
        throw new BadRequestException(
          `Menu item ${item.menuItemId} not found`,
        );
      }

      const price = Number(menuItem.price);

      const subtotal =
        price * item.quantity;

      totalPrice += subtotal;

      return {
        menuItemId: menuItem.id,
        quantity: item.quantity,
        price: menuItem.price,
      };
    });

    // --------------------------------
    // 5. Delivery fee
    // --------------------------------

    const deliveryFee = 30;

    const finalTotal =
      totalPrice + deliveryFee;

    // --------------------------------
    // 6. Transaction
    // --------------------------------

    const order =
      await this.prisma.$transaction(
        async (tx) => {
          const newOrder =
            await tx.order.create({
              data: {
                customerId,
                restaurantId,
                addressId,

                totalPrice,
                deliveryFee,

                orderStatus:
                  OrderStatus.PENDING,

                note,

                orderItems: {
                  create: orderItems,
                },
              },

              include: {
                orderItems: {
                  include: {
                    menuItem: true,
                  },
                },
                restaurant: true,
                address: true,
              },
            });

          await tx.payment.create({
            data: {
              orderId: newOrder.id,
              method: paymentMethod,
              amount: finalTotal,
              status: PaymentStatus.PENDING,
            },
          });

          return newOrder;
        },
      );

    return order;
  }

  // --------------------------------
  // Get customer order
  // --------------------------------

  async getCustomerOrder(
    orderId: string,
    userId: string,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },

        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
          restaurant: true,
          address: true,
          delivery: {
            include: {
              driver: {
                include: {
                  driverProfile: true,
                  driverLocation: true,
                },
              },
            },
          },
          payment: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (order.customerId !== userId) {
      throw new ForbiddenException();
    }

    return order;
  }

  // --------------------------------
  // Restaurant / internal status
  // --------------------------------

  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ) {
    const order =
      await this.prisma.order.findUnique({
        where: {
          id: orderId,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        orderStatus: status,
      },
    });
  }
}