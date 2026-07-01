import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../auth/decorator/role.decorator';
import { CustomBadRequestException } from '../common/exception/bad-request.exception';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomNotFoundException } from '../common/exception/not-found.exception';
import { CreateMenuItemDto } from './dto/create.menu-item.dto';
import { UpdateMenuItemDto } from './dto/update.menu-item.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { QueryMenuItem } from './dto/search.menu-item.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class MenuItemsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinaryService: CloudinaryService,
        @Inject(CACHE_MANAGER)
        private cacheManager : Cache,
    ) {}
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
                sold: 0, // default 0
                isAvailable: createMenuItemDto.isAvailable,
                restaurantId: restaurantId,
                categoryId: createMenuItemDto.categoryId, 
            }
        });
        await this.cacheManager.del(`menu-item:${restaurantId}`);

        return { message: 'Menu item created successfully' };
    }

    async getMenuItems(restaurantId: string) {
        const key = `menu-item:${restaurantId}`;
    
        const cache = await this.cacheManager.get(key);
        if (cache) {
            console.log('CACHE HIT');
            return cache;
        }

        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
        });
        if (!restaurant) throw new CustomNotFoundException('Restaurant not found');
    
        const data = await this.prisma.menuItem.findMany({
            where: {
                restaurantId,
                deletedAt: null, 
            },
            include: {
                category: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        await this.cacheManager.set(key, data, 60000);
        console.log('CACHE SET:', key);
        
        return data;
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
    async deleteMenuItem(
        ownerId: string,
        restaurantId: string,
        menuItemId: string,
    ) {
        await this.validateRestaurantOwner(ownerId, restaurantId);
        await this.validateMenuItem(menuItemId, restaurantId);
    
        await this.prisma.menuItem.delete({
            where: { id: menuItemId },
        });
    
        return { message: 'Menu item deleted successfully' };
    }

    async uploadMenuItemImage(ownerId: string, restaurantId: string, menuItemId: string, file: Express.Multer.File) {
        if (!file) throw new CustomBadRequestException('No file uploaded');
        
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new CustomBadRequestException('Only JPEG, PNG, WebP allowed');
        }

        await this.validateRestaurantOwner(ownerId, restaurantId);
        const menu_item = await this.validateMenuItem(menuItemId, restaurantId);

        if (menu_item.imageUrl) {
            const publicId = this.cloudinaryService.extractPublicId(menu_item.imageUrl);
            await this.cloudinaryService.deleteFile(publicId);
        }

        const url = await this.cloudinaryService.uploadFile(file, 'menu-items');

        return this.prisma.menuItem.update({
            where: { id: menuItemId },
            data: { imageUrl: url },
            include: {
                category: { select: { id: true, name: true } },
            },
        });
    }

    async searchMenuItem(query : QueryMenuItem){
        const { search , price , isAvailable, sortBy, sortOrder, page = 1, limit = 10 } = query;

        const validSortFields = ['name', 'price' , 'createdAt', 'updatedAt'];
        const orderField : string = validSortFields.includes(sortBy ?? '') ? sortBy! : 'createdAt';
        const orderDirection = sortOrder ?? 'desc';

        return await this.prisma.menuItem.findMany({
            where : {
                ...(isAvailable && {isAvailable}),
                ...(price && {
                    price : { gte : 0}
                }),
                ...(search  && {
                    name: { contains: search, mode: 'insensitive'}
                })
            },
            orderBy: { [orderField] : orderDirection},
            skip: (page - 1) * limit,
            take: limit,

        });
    }
}
        
    
