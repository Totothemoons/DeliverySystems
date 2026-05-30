import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantsDto, RestaurantStatus } from './dto/create.restaurants.dto';
import { UserRole } from '../auth/decorator/role.decorator';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomBadRequestException } from '../common/exception/bad-request.exception';
import { ConflictException } from '@nestjs/common';

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
        
        return restaurants;
    }

    async createRestaurant(createRestaurantsDto: CreateRestaurantsDto, ownerId: string) {
        const isOwner = await this.prisma.user.findUnique({
            where: { id: ownerId },
        });
        
        if (!isOwner) throw new CustomNotFoundException('Owner not found');

        if(ownerId !== isOwner.id) {
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
        if(restaurant.ownerId !== ownerId) {
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
        if(restaurant.ownerId !== ownerId) {
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
        if(restaurant.ownerId !== ownerId) {
            throw new CustomForbiddenException('You do not have permission to update this restaurant');
        }
        return this.prisma.restaurant.update({
            where: { id: restaurantId },
            data: { status: RestaurantStatus.BUSY },
        });
    }

    async getRestaurantById(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        if(restaurant.ownerId !== ownerId) {
            throw new CustomForbiddenException('You do not have permission to view this restaurant');
        }
        return restaurant;
    }
    
    async deleteRestaurant(restaurantId: string, ownerId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId, ownerId: ownerId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        if(restaurant.ownerId !== ownerId) {
            throw new CustomForbiddenException('You do not have permission to delete this restaurant');
        }
        return this.prisma.restaurant.delete({
            where: { id: restaurantId },
        });
    }
}
