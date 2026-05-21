import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

export interface JWTTokens {
    token: string,
    refreshToken: string
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService ) {}

    @Post('register')
    async register(@Body() registerDto : RegisterDto) {
        return await this.authService.createUser(registerDto);
    }
}
