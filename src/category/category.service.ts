import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create.category.dto';
import { ConflictException } from '@nestjs/common';
import { CustomForbiddenException } from '../common/exception/forbidden.exception';
import { CustomNotFoundException } from '../common/exception/not-found.exception';

@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService){}

    async getCategories() {
        return this.prisma.category.findMany({
            orderBy: { name: 'asc' },
        });
    }

    async createCategory(dto: CreateCategoryDto, userId: string) {
        const isAdmin = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!isAdmin) throw new CustomNotFoundException('User not found');
        if (isAdmin.role !== 'ADMIN') {
            throw new CustomForbiddenException('You do not have permission to create a category');
        }

        const existing = await this.prisma.category.findFirst({
            where: { name: { equals: dto.name, mode: 'insensitive' } },
        });
    
        if (existing) {
            throw new ConflictException(`Category "${dto.name}" already exists`);
        }
    
        return this.prisma.category.create({
            data: { name: dto.name },
        });
  }
}
