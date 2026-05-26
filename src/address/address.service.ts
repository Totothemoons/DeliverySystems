import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create.dto';

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

}
