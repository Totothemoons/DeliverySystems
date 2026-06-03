import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MenuItemsService {
    constructor(private readonly prisma: PrismaService) {}
}
