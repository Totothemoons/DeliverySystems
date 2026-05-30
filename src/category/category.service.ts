import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class CategoryService {
    constructor(private readonly prisma: PrismaService){}

    async getCategories() {
        return this.prisma.category.findMany({
        orderBy: { name: 'asc' },
    });
  }
}
