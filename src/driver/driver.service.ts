import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomNotFoundException } from '../common/exception/not-found.exception';

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
}
