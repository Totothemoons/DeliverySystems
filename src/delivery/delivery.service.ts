// src/delivery/delivery.service.ts

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DriverService } from '../driver/driver.service';
import { OrderStatus } from "../order/dto/update-order-status.dto"
import { GoogleRoutesService } from '../google-routes/google-routes.service';

enum DeliveryStatus {
  WAITING="WAITING",
  ACCEPTED="ACCEPTED",
  PICKED_UP="PICKED_UP",
  DELIVERING="DELIVERING",
  DELIVERED="DELIVERED",
  CANCELLED="CANCELLED"
}

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly driverService: DriverService,
    private readonly googleRoutesService: GoogleRoutesService,
  ) {}

  // ======================================
  // Create Delivery
  // ======================================

  async createDelivery(
  orderId: string,
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

  if (
    order.orderStatus !==
    OrderStatus.PREPARING
  ) {
    throw new BadRequestException(
      'Order is not ready for delivery',
    );
  }

  const existing =
    await this.prisma.delivery.findUnique({
      where: {
        orderId,
      },
    });

  if (existing) {
    return existing;
  }

  return this.prisma.delivery.create({
    data: {
      orderId,
      driverId: null,
      status: DeliveryStatus.WAITING,
    },
  });
}

async acceptDelivery(
  deliveryId: string,
  driverId: string,
) {
  return this.prisma.$transaction(
    async (tx) => {
      const delivery =
        await tx.delivery.findUnique({
          where: {
            id: deliveryId,
          },
        });

      if (!delivery) {
        throw new NotFoundException(
          'Delivery not found',
        );
      }

      if (
        delivery.status !==
        DeliveryStatus.WAITING
      ) {
        throw new ConflictException(
          'Delivery is no longer available',
        );
      }

      const driver =
        await tx.driverProfile.findUnique({
          where: {
            userId: driverId,
          },
        });

      if (!driver) {
        throw new NotFoundException(
          'Driver profile not found',
        );
      }

      if (!driver.isVerified) {
        throw new BadRequestException(
          'Driver is not verified',
        );
      }

      if (!driver.isOnline) {
        throw new BadRequestException(
          'Driver is offline',
        );
      }

      if (driver.isBusy) {
        throw new ConflictException(
          'Driver is already busy',
        );
      }

      const updated =
        await tx.delivery.updateMany({
          where: {
            id: deliveryId,
            status: DeliveryStatus.WAITING,
            driverId: null,
          },
          data: {
            driverId,
            status: DeliveryStatus.ACCEPTED,
          },
        });

      if (updated.count !== 1) {
        throw new ConflictException(
          'Delivery was already accepted',
        );
      }

      await tx.driverProfile.update({
        where: {
          userId: driverId,
        },
        data: {
          isBusy: true,
        },
      });

      await tx.order.update({ where: { id: delivery.orderId }, data: { driverId, orderStatus: OrderStatus.PICKED_UP } });

      return tx.delivery.findUnique({
        where: {
          id: deliveryId,
        },
      });
    },
  );
}
async createDeliveryForOrder(
  orderId: string,
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

  return this.prisma.delivery.upsert({
    where: {
      orderId,
    },

    create: {
      orderId,
      driverId: null,
      status: DeliveryStatus.WAITING,
    },

    update: {},
  });
}

  async updateStatus(deliveryId: string, status: string, userId: string, role: string) {
    if (!Object.values(DeliveryStatus).includes(status as DeliveryStatus)) throw new BadRequestException('Invalid delivery status');
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    if (role !== 'ADMIN' && delivery.driverId !== userId) throw new BadRequestException('You are not assigned to this delivery');
    const data: any = { status };
    if (status === DeliveryStatus.PICKED_UP) data.pickedUpAt = new Date();
    if (status === DeliveryStatus.DELIVERED) data.deliveredAt = new Date();
    const updated = await this.prisma.delivery.update({ where: { id: deliveryId }, data });
    const mapped: any = { PICKED_UP: OrderStatus.PICKED_UP, DELIVERING: OrderStatus.DELIVERING, DELIVERED: OrderStatus.COMPLETED };
    if (mapped[status]) await this.prisma.order.update({ where: { id: delivery.orderId }, data: { orderStatus: mapped[status] } });
    if (status === DeliveryStatus.DELIVERED && delivery.driverId) await this.prisma.driverProfile.update({ where: { userId: delivery.driverId }, data: { isBusy: false } });
    return updated;
  }

async findDriversForDelivery(deliveryId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        order: {
          include: {
            restaurant: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Delivery not found');
    }

    const restaurant = delivery.order.restaurant;

    if (
      restaurant.latitude == null ||
      restaurant.longitude == null
    ) {
      throw new NotFoundException(
        'Restaurant location is unavailable',
      );
    }

    const availableDrivers =
      await this.driverService.getAvailableDrivers();

    const candidates = availableDrivers
      .filter((driver) => driver.driverLocation != null)
      .map((driver) => ({
        driverId: driver.id,
        latitude: Number(driver.driverLocation!.latitude),
        longitude: Number(driver.driverLocation!.longitude),
      }));

    // จำกัดจำนวนเพื่อควบคุม latency และ API usage
    // ถ้าต้องการรองรับคนขับจำนวนมาก ให้เพิ่มขั้นตอน candidate selection
    const rankedDrivers =
      await this.googleRoutesService.rankDriversByEta(
        candidates,
        {
          latitude: Number(restaurant.latitude),
          longitude: Number(restaurant.longitude),
        },
      );

    return rankedDrivers.map((driver) => ({
      driverId: driver.driverId,
      distanceMeters: driver.distanceMeters,
      estimatedMinutes: Math.ceil(
        driver.durationSeconds / 60,
      ),
    }));
  }
}
