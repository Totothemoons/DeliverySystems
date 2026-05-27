import { Controller, Get, UseGuards, Req,Body,Post,Patch, Delete } from '@nestjs/common';
import { UserController } from '../user/user.controller';
import { DriverService } from './driver.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { Role, UserRole } from '../auth/decorator/role.decorator';
import { CreateDriverProfileDto } from './dto/create.dto';
import { UpdateDriverProfileDto } from './dto/update.dto';

interface RequestWithUser extends Request {
    user: {sub: string, role: UserRole};
}

@UseGuards(AccessTokenGuard)
@Role(UserRole.DRIVER)
@Controller('driver')
export class DriverController {
    constructor(
        private readonly driverService : DriverService,
    ) {}

    @Get('me')
    async getProfile(@Req() req: RequestWithUser) {
        return this.driverService.getProfile(req.user.sub);
    }

    @Post('me')
    async createProfile(
        @Req() req: RequestWithUser,
        @Body() dto: CreateDriverProfileDto,
    ) {
        return this.driverService.createProfile(req.user.sub, dto);
  }

   @Patch('me')
    async updateProfile(
        @Req() req: RequestWithUser,
        @Body() dto: UpdateDriverProfileDto,
    ) {
        return this.driverService.updateProfile(req.user.sub, dto);
  }
}
