import { 
    Controller,
    Get,
    Post,
    Req,
    UseGuards,
    Body,
    Param,
    Delete,
    Patch,
    Query,
    UseInterceptors,
    UploadedFile
} from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantsDto } from './dto/create.restaurants.dto';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { Role, UserRole } from '../auth/decorator/role.decorator';
import { FindAllUsersDto } from './dto/search.restaurants.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

interface RequestWithUser extends Request {
    user: {sub : string, role: UserRole};
}

@UseGuards(AccessTokenGuard)
@Controller('restaurants')
export class RestaurantsController {
    constructor(private readonly restaurantsService: RestaurantsService) {}

    @Get()
    async searchRestaurants(
        @Query() query: FindAllUsersDto
    ) {
        return this.restaurantsService.searchRestaurants(query);
    }

    @Get('all')
    async getAllRestaurants(@Req() req: RequestWithUser) {
        return this.restaurantsService.getAllRestaurants(req.user.sub);
    }

    @Role(UserRole.SHOP)
    @Post()
    async createRestaurant(
        @Req() req: RequestWithUser,
        @Body() createRestaurantsDto: CreateRestaurantsDto
    ) {
        return this.restaurantsService.createRestaurant(createRestaurantsDto, req.user.sub);
    }

    @Role(UserRole.SHOP)
    @Post(':id/restaurant-image')
    @UseInterceptors(
        FileInterceptor('restaurant-image', {
            storage: memoryStorage(),
            limits: { fileSize: 5 * 1024 * 1024 }, 
        }),
    )

    @Role(UserRole.SHOP)
    async uploadRestaurantImage(
        @Req() req: RequestWithUser,
        @Param('id') restaurantId: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.restaurantsService.uploadRestaurantImage(restaurantId, req.user.sub,req.user.role, file);
    }

    @Role(UserRole.SHOP)
    @Patch(':id')
    async updateRestaurant(@Req() req: RequestWithUser, @Param('id') restaurantId: string, @Body() updateRestaurantsDto: Partial<CreateRestaurantsDto>) {
        return this.restaurantsService.updateRestaurant(restaurantId, req.user.sub, updateRestaurantsDto);
    }

    @Role(UserRole.SHOP)
    @Delete(':id')
    async deleteRestaurant(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.deleteRestaurant(restaurantId, req.user.sub);
    }

    @Role(UserRole.SHOP)
    @Post(':id/open')
    async setOpen(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.setOpen(restaurantId, req.user.sub);
    }

    @Role(UserRole.SHOP)
    @Post(':id/closed')
    async setClosed(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.setClosed(restaurantId, req.user.sub);
    }

    @Role(UserRole.SHOP)
    @Post(':id/busy')
    async setBusy(@Req() req: RequestWithUser, @Param('id') restaurantId: string) {
        return this.restaurantsService.setBusy(restaurantId, req.user.sub);
    }

}
