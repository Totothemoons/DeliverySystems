import { Controller, Get, Post, Req, UseGuards, Param , Body, Patch} from '@nestjs/common';
import { MenuItemsService } from './menu-items.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { Role, UserRole } from '../auth/decorator/role.decorator';
import { CreateMenuItemDto } from './dto/create.menu-item.dto';
import { UpdateMenuItemDto } from './dto/update.menu-item.dto';

interface RequestWithUser extends Request {
  user: {sub : string , role: UserRole};
}

@UseGuards(AccessTokenGuard)
@Role(UserRole.SHOP)
@Controller('menu-items')
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  @Get(':restaurantId/all')
  async getMenuItems(@Param('restaurantId') restaurantId: string) {
    return this.menuItemsService.getMenuItems(restaurantId);
  }

  @Post(':restaurantId')
  async createMenuItem(
    @Req() req: RequestWithUser,
    @Param('restaurantId') restaurantId: string,
    @Body() createMenuItemDto: CreateMenuItemDto
  ){
    return this.menuItemsService.createMenuItem(req.user.sub, req.user.role,restaurantId, createMenuItemDto);
  }

  @Patch(':restaurantId/:menuItemId')
  async updateMenuItem(
    @Req() req: RequestWithUser,
    @Param('restaurantId') restaurantId: string,
    @Param('menuItemId') menuItemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.updateMenuItem(
      req.user.sub,
      restaurantId,
      menuItemId,
      dto,
    );
  }

}
