import { Body, Controller, Delete, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { AccessTokenGuard } from './guard/access-token.guard.js';

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
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return {token};
    }
    @Post('refresh-token')
    async refreshToken(@Req() req, @Res({passthrough:true}) res) : Promise<{token : string}>{
        const refreshToken = req.cookies['refreshToken'];

        const tokens = await this.authService.refreshToken(refreshToken);
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return {token: tokens.token}
    }

    @UseGuards(AccessTokenGuard)
    @Post('change-password')
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req){
        return await this.authService.changePassword(changePasswordDto, req.user.sub); 
    }

    @UseGuards(AccessTokenGuard)
    @Post('logout')
    async logout(@Req() req, @Res({passthrough:true}) res) {
        const refreshToken = req.cookies['refreshToken'] as LogoutDto;
        res.clearCookie('refreshToken');
        return await this.authService.logout(refreshToken, req.user.sub);
    }
}
