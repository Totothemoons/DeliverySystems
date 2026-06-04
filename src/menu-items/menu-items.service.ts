import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/decorator/role.decorator';
import { CustomBadRequestException } from '../common/exception/bad-request.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CreateMenuItemDto } from './dto/create.menu-item.dto';
@Injectable()
export class MenuItemsService {
    constructor(private readonly prisma: PrismaService) {}

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

        await this.prisma.menuItem.create({
            data: {
                name: createMenuItemDto.name,
                description: createMenuItemDto.description,
                price: createMenuItemDto.price,
                stock: createMenuItemDto.sold,
                isAvailable: createMenuItemDto.isAvailable,
                restaurantId: restaurantId,
                categoryId: createMenuItemDto.categoryId, 
            }
        });

        return { message: 'Menu item created successfully' };
    }
}
