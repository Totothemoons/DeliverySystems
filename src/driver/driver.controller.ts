import { Controller, Post, Patch, Req, Body, Param, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { Role, UserRole } from '../auth/decorator/role.decorator';
import { CreateDriverProfileDto } from './dto/create.dto';
import { IsBoolean } from 'class-validator';

class UpdateDriverVerificationDto {
  @IsBoolean()
  isVerified!: boolean;
}

@UseGuards(AccessTokenGuard)
@Controller('driver')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}
  @Post('me')
  @Role(UserRole.DRIVER)
  createProfile(@Req() req: any, @Body() dto: CreateDriverProfileDto) { return this.driverService.createProfile(req.user.sub, dto); }
  @Patch('me/online')
  @Role(UserRole.DRIVER)
  setOnline(@Req() req: any) { return this.driverService.setAvailability(req.user.sub, true); }
  @Patch('me/offline')
  @Role(UserRole.DRIVER)
  setOffline(@Req() req: any) { return this.driverService.setAvailability(req.user.sub, false); }

  @Patch(':driverId/verification')
  @Role(UserRole.ADMIN)
  setVerification(@Param('driverId') driverId: string, @Body() dto: UpdateDriverVerificationDto) {
    return this.driverService.setVerification(driverId, dto.isVerified);
  }
}
