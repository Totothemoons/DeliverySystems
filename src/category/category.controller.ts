import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CategoryService } from './category.service.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Role, UserRole } from '../auth/decorator/role.decorator.js';
 
interface RequestWithUser extends Request {
  user: { sub: string; role: string };
}

@Controller('category')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get()
    async getCategories() {
        return this.categoryService.getCategories();
    }
}
