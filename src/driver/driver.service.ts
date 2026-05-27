import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CreateDriverProfileDto } from './dto/create.dto';
import { ConflictException } from '@nestjs/common';
import { UpdateDriverProfileDto } from './dto/update.dto';
import { CustomBadRequestException } from '../common/exception/bad-request.exception';
@Injectable()
export class DriverService {
    constructor(private readonly prisma : PrismaService) {}

    async getProfile(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            email: true,
            phone: true,
            profileImageUrl: true,
          },
        },
      },
    });
 
    if (!profile) {
      throw new CustomNotFoundException('Driver profile not found');
    }
 
    return profile;
  }

  async createProfile(userId: string, dto: CreateDriverProfileDto) {

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new CustomNotFoundException('User not found');
    if (user.role !== 'DRIVER') {
      throw new CustomForbiddenException('Only users with DRIVER role can create a driver profile');
    }
 
    const existing = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('Driver profile already exists');
    }
 
    return this.prisma.driverProfile.create({
      data: {
        userId,
        licenseNumber: dto.licenseNumber,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateDriverProfileDto) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
 
    if (!profile) throw new CustomNotFoundException('Driver profile not found');
 
    return this.prisma.driverProfile.update({
      where: { userId },
      data: {
        ...(dto.licenseNumber && { licenseNumber: dto.licenseNumber }),
        ...(dto.vehicleType && { vehicleType: dto.vehicleType }),
        ...(dto.vehiclePlate && { vehiclePlate: dto.vehiclePlate }),
      },
    });
  }

  async setOnline(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
  
    if (!profile) throw new CustomNotFoundException('Driver profile not found');
    if (!profile.isVerified) {
      throw new CustomForbiddenException('Driver must be verified before going online');
    }
 
    return this.prisma.driverProfile.update({
      where: { userId },
      data: {
        isOnline: true,
        lastActiveAt: new Date(),
      },
    });
  }
 
  async setOffline(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
 
    if (!profile) throw new CustomNotFoundException('Driver profile not found');
    if (profile.isBusy) {
      throw new CustomBadRequestException('Cannot go offline while delivering an order');
    }
 
    return this.prisma.driverProfile.update({
      where: { userId },
      data: { isOnline: false },
    });
  }
  
  async setBusy(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
 
    if (!profile) throw new CustomNotFoundException('Driver profile not found');
    if (!profile.isOnline) {
      throw new CustomBadRequestException('Driver must be online to set busy');
    }
 
    return this.prisma.driverProfile.update({
      where: { userId },
      data: { isBusy: true },
    });
  }
 
  async setFree(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
    });
 
    if (!profile) throw new CustomNotFoundException('Driver profile not found');
 
    return this.prisma.driverProfile.update({
      where: { userId },
      data: { isBusy: false },
    });
  }

  async getRating(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      select: { rating: true },
    });
 
    if (!profile) throw new CustomNotFoundException('Driver profile not found');
 
    return { rating: profile.rating };
  }
}
