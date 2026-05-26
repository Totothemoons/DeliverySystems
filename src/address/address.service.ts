import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create.dto';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { UpdateAddressDto } from './dto/update.dto';

@Injectable()
export class AddressService {
    constructor(private readonly prisma: PrismaService) {}

    async createAddress(userId: string, dto: CreateAddressDto) {
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }   
    
        const count = await this.prisma.address.count({ where: { userId } });
        const shouldBeDefault = dto.isDefault ?? count === 0;
    
        const address = await this.prisma.address.create({
            data: {
                userId,
                address: dto.address,
                latitude: dto.latitude,
                longitude: dto.longitude,
                label: dto.label,
                isDefault: shouldBeDefault,
            },
        });
    
        return address;
  }

    async getAddresses(userId: string) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
        const address = await this.prisma.address.findUnique({
            where: { id: addressId },
        });
    
        if (!address) {
            throw new CustomNotFoundException('Address not found');
        }
    
        if (address.userId !== userId) {
            throw new CustomForbiddenException('You do not have permission to update this address');
        }
    
        return this.prisma.address.update({
            where: { id: addressId },
            data: {
                ...(dto.address && { address: dto.address }),
                ...(dto.latitude !== undefined && { latitude: dto.latitude }),
                ...(dto.longitude !== undefined && { longitude: dto.longitude }),
                ...(dto.label !== undefined && { label: dto.label }),
            },
        });
    }
    async setDefaultAddress(userId: string, addressId: string) {
        const address = await this.prisma.address.findUnique({
        where: { id: addressId },
        });
    
        if (!address) {
            throw new CustomNotFoundException('Address not found');
        }
    
        if (address.userId !== userId) {
            throw new CustomForbiddenException('You do not have permission to update this address');
        }
    
        await this.prisma.$transaction([
            this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            }),
            this.prisma.address.update({
                where: { id: addressId },
                data: { isDefault: true },
            }),
        ]);
    
        return { message: 'Default address updated successfully' };
  }
}
