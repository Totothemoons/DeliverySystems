import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/decorator/role.decorator';
import { CustomBadRequestException } from '../common/exception/bad-request.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CreateMenuItemDto } from './dto/create.menu-item.dto';
import { UpdateMenuItemDto } from './dto/update.menu-item.dto';
@Injectable()
export class MenuItemsService {
    constructor(private readonly prisma: PrismaService) {}

    private async validateRestaurantOwner(ownerId: string, restaurantId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        if (restaurant.ownerId !== ownerId) {
            throw new CustomForbiddenException('You do not own this restaurant');
        }
        return restaurant;
    }
 
    private async validateMenuItem(menuItemId: string, restaurantId: string) {
        const menuItem = await this.prisma.menuItem.findUnique({
            where: { id: menuItemId },
        });
        if (!menuItem) throw new CustomNotFoundException('Menu item not found');
        if (menuItem.restaurantId !== restaurantId) {
            throw new CustomForbiddenException('Menu item does not belong to this restaurant');
        }
        return menuItem;
    }

    async createMenuItem(ownerId: string, role: UserRole, restaurantId: string, createMenuItemDto: CreateMenuItemDto) {
        if (role !== UserRole.SHOP) {
            throw new CustomForbiddenException('Only users with SHOP role can create menu items');
        }
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });

        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
        if (restaurant.ownerId !== ownerId) {
            throw new CustomForbiddenException('You do not own this restaurant');
        }

        const category = await this.prisma.category.findUnique({
            where: { id: createMenuItemDto.categoryId }
        });

        if (!category) {
            throw new CustomNotFoundException('Category not found');
        }

        if (createMenuItemDto.price !== undefined && createMenuItemDto.price < 0) {
            throw new CustomBadRequestException('Price cannot be negative');
        }

        await this.prisma.menuItem.create({
            data: {
                name: createMenuItemDto.name,
                description: createMenuItemDto.description,
                price: createMenuItemDto.price,
                stock: 0, // default 0
                isAvailable: createMenuItemDto.isAvailable,
                restaurantId: restaurantId,
                categoryId: createMenuItemDto.categoryId, 
            }
        });

        return { message: 'Menu item created successfully' };
    }

    async getMenuItems(restaurantId: string) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
    
        return this.prisma.menuItem.findMany({
            where: {
                restaurantId,
                deletedAt: null, 
            },
            include: {
                category: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateMenuItem(
        ownerId: string,
        restaurantId: string,
        menuItemId: string,
        dto: UpdateMenuItemDto,
    ) {
        await this.validateRestaurantOwner(ownerId, restaurantId);
        await this.validateMenuItem(menuItemId, restaurantId);
    
        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) throw new CustomNotFoundException('Category not found');
        }

        if (dto.price !== undefined && dto.price < 0) {
            throw new CustomBadRequestException('Price cannot be negative');
        }
    
        return this.prisma.menuItem.update({
            where: { id: menuItemId },
            data: {
                ...(dto.name && { name: dto.name }),
                ...(dto.description && { description: dto.description }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.sold !== undefined && { stock: dto.sold }),
                ...(dto.isAvailable !== undefined && { isAvailable: dto.isAvailable }),
                ...(dto.categoryId && { categoryId: dto.categoryId }),
            },
            include: {
                category: { select: { id: true, name: true } },
            },
        });
    }
}
