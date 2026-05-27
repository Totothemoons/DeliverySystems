import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CreateDriverProfileDto } from './dto/create.dto';
import { ConflictException } from '@nestjs/common';
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
}
