import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

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

    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res({passthrough : true}) res): Promise<{token : string}>{
        const {token , refreshToken} = await this.authService.login(loginDto);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            samesite: 'strict',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return {token};
    }
}
