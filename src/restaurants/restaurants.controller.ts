import { Controller, Get, Post, Req, UseGuards,Body,Param, Delete, Patch } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantsDto } from './dto/create.restaurants.dto';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { Role, UserRole } from '../auth/decorator/role.decorator';

interface RequestWithUser extends Request {
    user: {sub : string, role: UserRole};
}

@UseGuards(AccessTokenGuard)
@Role(UserRole.SHOP)
@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Get()
    async getAllRestaurants(@Req() req: RequestWithUser) {
        return this.restaurantsService.getAllRestaurants(req.user.sub);
    }

    @Post()
    async createRestaurant(
        @Req() req: RequestWithUser,
        @Body() createRestaurantsDto: CreateRestaurantsDto
    ) {
        return this.restaurantsService.createRestaurant(createRestaurantsDto, req.user.sub);
    }

    @Get(':id')
    async getRestaurantById(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.getRestaurantById(restaurantId, req.user.sub);
    }

    @Patch(':id')
    async updateRestaurant(@Req() req: RequestWithUser, @Param('id') restaurantId: string, @Body() updateRestaurantsDto: Partial<CreateRestaurantsDto>) {
        return this.restaurantsService.updateRestaurant(restaurantId, req.user.sub, updateRestaurantsDto);
    }

    @Delete(':id')
    async deleteRestaurant(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.deleteRestaurant(restaurantId, req.user.sub);
    }

    @Post(':id/open')
    async setOpen(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.setOpen(restaurantId, req.user.sub);
    }

    @Post(':id/closed')
    async setClosed(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.setClosed(restaurantId, req.user.sub);
    }

    @Post(':id/busy')
    async setBusy(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.setBusy(restaurantId, req.user.sub);
    }
}
