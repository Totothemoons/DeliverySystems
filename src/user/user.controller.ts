
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
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { UserService } from './user.service';
import { Request } from 'express';
import { UpdateProfileDto } from './dto/update-profile.dto'
import { AccessTokenGuard } from '../auth/guard/access-token.guard'
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

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

  @Post('me/avatar')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: memoryStorage(),                    
            limits: { fileSize: 5 * 1024 * 1024 },      
        }),
    )
    async uploadAvatar(
        @Req() req: RequestWithUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.userService.uploadAvatar(req.user.sub, file);
    }
 
  @Patch('me/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivateAccount(@Req() req: RequestWithUser) {
    return this.userService.deactivateAccount(req.user.sub);
  }

}
