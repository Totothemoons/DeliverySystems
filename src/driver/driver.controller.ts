import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserController } from '../user/user.controller';
import { DriverService } from './driver.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { Role, UserRole } from '../auth/decorator/role.decorator';

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
}
