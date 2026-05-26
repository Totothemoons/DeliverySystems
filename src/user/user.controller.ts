
import {
    Controller,
    Get,
    Patch,
    Post,
    Delete,
    Body,
    Req,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AccessTokenGuard } from '../auth/guard/access-token.guard'

interface RequestWithUser extends Request {
  user: { sub: string; [key: string]: any };
}
 
@UseGuards(AccessTokenGuard)
@Controller('user')
export class UserController {
    constructor(
        private readonly userService : UserService
    ){}
 // ------------------- GET ----------------------------
  
  @Get('me')
  async getProfile(@Req() req: RequestWithUser) {
    return this.userService.getProfile(req.user.sub);
  }
 
  // ------------------- PATCH ----------------------------
 
  @Patch('me')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(req.user.sub, dto);
  }
 
  @Patch('me/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(@Req() req: RequestWithUser) {
    return this.userService.deactivateAccount(req.user.sub);
  }

}
