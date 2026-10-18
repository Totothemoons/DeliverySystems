// src/driver/driver-location.service.ts

import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class DriverLocationService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
  ) {}

  async updateLocation(
    driverId: string,
    latitude: number,
    longitude: number,
  ) {
    if (
      latitude < -90 ||
      latitude > 90
    ) {
      throw new BadRequestException(
        'Invalid latitude',
      );
    }

    if (
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException(
        'Invalid longitude',
      );
    }

    const location = {
      latitude,
      longitude,
      updatedAt: new Date(),
    };

    // -----------------------------
    // Redis
    // -----------------------------

    await this.cache.set(
      `driver:location:${driverId}`,
      location,
      30_000,
    );

    // -----------------------------
    // PostgreSQL
    // -----------------------------

    await this.prisma.driverLocation.upsert({
      where: {
        driverId,
      },

      create: {
        driverId,
        latitude,
        longitude,
      },

      update: {
        latitude,
        longitude,
      },
    });

    await this.prisma.driverProfile.update({
      where: {
        userId: driverId,
      },

      data: {
        lastActiveAt: new Date(),
      },
    });

    return location;
  }

  async getLocation(
    driverId: string,
  ) {
    const cached =
      await this.cache.get(
        `driver:location:${driverId}`,
      );

    if (cached) {
      return cached;
    }

    return this.prisma.driverLocation.findUnique({
      where: {
        driverId,
      },
    });
  }
}