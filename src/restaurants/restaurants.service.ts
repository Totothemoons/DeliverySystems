import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantsDto, RestaurantStatus } from './dto/create.restaurants.dto';
import { UserRole } from '../auth/decorator/role.decorator';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomBadRequestException } from '../common/exception/bad-request.exception';
import { ConflictException } from '@nestjs/common';
import { FindAllUsersDto } from './dto/search.restaurants.dto';

@Injectable()
export class RestaurantsService {
    constructor(private readonly prisma: PrismaService){}

    async getAllRestaurants(ownerId: string) {
        const restaurants = await this.prisma.restaurant.findMany({
            where: { ownerId: ownerId },
        });
        if(!restaurants) {
            throw new CustomNotFoundException('No restaurants found for this owner');
        }
        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        if (!isOwner) throw new CustomNotFoundException('Owner not found');
        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to view these restaurants');
        }
        
        return restaurants;
    }

    async createRestaurant(createRestaurantsDto: CreateRestaurantsDto, ownerId: string) {
        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        
        if (!isOwner) throw new CustomNotFoundException('Owner not found');

        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to create a restaurant');
        }

        const existing = await this.prisma.restaurant.findFirst({
            where: { name: createRestaurantsDto.name },
        });
        if (existing) {
            throw new ConflictException('Restaurant with this name already exists');
        }

        return this.prisma.restaurant.create({
            data: {
                name: createRestaurantsDto.name,
                description: createRestaurantsDto.description,
                phone: createRestaurantsDto.phone,
                restaurantImageUrl: createRestaurantsDto.restaurantImageUrl,
                address: createRestaurantsDto.address,
                latitude: createRestaurantsDto.latitude,
                longitude: createRestaurantsDto.longitude,
                ownerId: ownerId,
                status: RestaurantStatus.OPEN
            },
        });
    }

    async setOpen(restaurantId: string, ownerId: string) {
        if (!restaurantId) {
            throw new CustomBadRequestException('Restaurant ID is required');
        }

        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');

        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        if (!isOwner) throw new CustomNotFoundException('Owner not found');
        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to update this restaurant');
        }

        return this.prisma.restaurant.update({
            where: { id: restaurantId },
            data: { status: RestaurantStatus.OPEN },
        });
        
    }

    async setClosed(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });

        if (!isOwner) throw new CustomNotFoundException('Owner not found');
        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to update this restaurant');
        }

        return this.prisma.restaurant.update({
            where: { id: restaurantId },
            data: { status: RestaurantStatus.CLOSED },
        });
    }

    async setBusy(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        
        if (!isOwner) throw new CustomNotFoundException('Owner not found');
        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to update this restaurant');
        }

        return this.prisma.restaurant.update({
            where: { id: restaurantId },
            data: { status: RestaurantStatus.BUSY },
        });
    }

    async searchRestaurants(ownerId: string, query: FindAllUsersDto) {
        const { search, status, sortBy, sortOrder, page = 1, limit = 10 } = query;

        const validSortFields = ['name', 'createdAt', 'updatedAt'];
        const orderByField: string = validSortFields.includes(sortBy ?? '') ? sortBy! : 'createdAt';
        const orderDirection = sortOrder ?? 'desc';

        return this.prisma.restaurant.findMany({
            where: {    
                ...(status && { status }),
                ...(search && {
                    name: { contains: search, mode: 'insensitive' },
                }),
            },
            orderBy: { [orderByField]: orderDirection }, 
            skip: (page - 1) * limit,
            take: limit,
        });
    }
    
    async deleteRestaurant(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');

        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        if (!isOwner) throw new CustomNotFoundException('Owner not found');
        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to delete this restaurant');
        }
        return this.prisma.restaurant.delete({
            where: { id: restaurantId },
        });
    }

    async updateRestaurant(restaurantId: string, ownerId: string, updateRestaurantsDto: Partial<CreateRestaurantsDto>) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });

        if (!isOwner) throw new CustomNotFoundException('Owner not found');
        if(isOwner.role !== UserRole.SHOP) {
            throw new CustomForbiddenException('You do not have permission to update this restaurant');
        }

        return this.prisma.restaurant.update({
            where: { id: restaurantId },
            data: {
                name: updateRestaurantsDto.name ?? restaurant.name,
                description: updateRestaurantsDto.description ?? restaurant.description,
                phone: updateRestaurantsDto.phone ?? restaurant.phone,
                restaurantImageUrl: updateRestaurantsDto.restaurantImageUrl ?? restaurant.restaurantImageUrl,
                address: updateRestaurantsDto.address ?? restaurant.address,
                latitude: updateRestaurantsDto.latitude ?? restaurant.latitude,
                longitude: updateRestaurantsDto.longitude ?? restaurant.longitude,
                status: updateRestaurantsDto.status ?? restaurant.status
            },
        });
    }
}
