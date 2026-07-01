import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CategoryService } from './category.service.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Role, UserRole } from '../auth/decorator/role.decorator.js';
import { CreateCategoryDto } from './dto/create.category.dto.js';
import { CacheTTL } from '@nestjs/cache-manager';

interface RequestWithUser extends Request {
  user: { sub: string; role: string };
}

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get()
    @CacheTTL(6000)
    async getCategories() {
        return this.categoryService.getCategories();
    }

  @Post()
  @UseGuards(AccessTokenGuard)
  @Role(UserRole.ADMIN)
  async createCategory(@Body() dto: CreateCategoryDto, @Req() req: RequestWithUser) {
    return this.categoryService.createCategory(dto, req.user.sub);
  }
}
