import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/decorator/role.decorator';

@Injectable()
export class DriverService {
  constructor(private readonly prisma: PrismaService) {}

  async createProfile(userId: string, data: { licenseNumber: string; vehicleType: string; vehiclePlate: string }) {
    return this.prisma.driverProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }

  async setAvailability(userId: string, value: boolean) {
    return this.prisma.driverProfile.update({ where: { userId }, data: { isOnline: value } });
  }

  async setVerification(userId: string, isVerified: boolean) {
    const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver profile not found');
    return this.prisma.driverProfile.update({ where: { userId }, data: { isVerified } });
  }

  async getAvailableDrivers() {
    const freshAfter = new Date(Date.now() - 30_000);

    return this.prisma.user.findMany({
      where: {
        role: UserRole.DRIVER,
        isActive: true,

        driverProfile: {
          is: {
            isVerified: true,
            isOnline: true,
            isBusy: false,
          },
        },

        driverLocation: {
          is: {
            updatedAt: {
              gte: freshAfter,
            },
          },
        },
      },

      include: {
        driverProfile: true,
        driverLocation: true,
      },
    });
  }

  async findNearestDrivers(
    restaurantLatitude: number,
    restaurantLongitude: number,
  ) {
    const drivers = await this.getAvailableDrivers();

    const driversWithDistance = drivers.map((driver) => {
      if (!driver.driverLocation) {
        return null;
      }

      const distance = this.calculateDistance(
        restaurantLatitude,
        restaurantLongitude,
        Number(driver.driverLocation.latitude),
        Number(driver.driverLocation.longitude),
      );

      return {
        driverId: driver.id,
        fullname: driver.fullname,
        distance,
        location: {
          latitude: driver.driverLocation.latitude,
          longitude: driver.driverLocation.longitude,
        },
      };
    });

    return driversWithDistance
      .filter((driver) => driver !== null)
      .sort((a, b) => a!.distance - b!.distance);
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusKm = 6371;

    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180;
  }
}
