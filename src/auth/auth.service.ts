import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { hash, compare } from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JWTTokens } from './auth.controller';
import { StringValue } from 'ms'
import { access } from 'fs';
import { LogoutDto } from './dto/logout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
enum UserRole {
    CUSTOMER,
    DRIVER,
    SHOP,
    ADMIN,
}
type User = {
    id: string
    email : string,
    password: string
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma : PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ) {}

    async createUser(register : RegisterDto){
        const {email , password , confirmPassword, fullname} = register as RegisterDto;

        if(!email || !password || !fullname){
            throw new Error("Please Fill information")
        }

        const existingUser = await this.prisma.user.findFirst({
            where : {email : register.email as string}
        });
        if( existingUser){
            throw new Error("Email is already in used");
        }

        if(password !== confirmPassword) throw new Error("Password is wrong");
        const hashPassword = await this.hashPassword(password);
        
        await this.prisma.user.create({
            data: {
                email: email,
                password: hashPassword,
                fullname: fullname,
                role: "CUSTOMER",
                phone: register.password,
                profileImageUrl: register.profileImageUrl
            }
        });
    }
    async login(loginDto: LoginDto) : Promise<JWTTokens>{
        const { email , password} = loginDto;

        if(!email || !password) throw new Error("Please Fill information");

        const existingUser = await this.prisma.user.findFirst({
            where: {email : email}
        });
        if(!existingUser){
            throw new Error("Not Found this Account")
        }
        // Delete Token that expires
        await this.prisma.refreshToken.deleteMany({
            where: { expiresAt: {lt: new Date()}}
        })
        const isValid = await compare(loginDto.password, existingUser.password as string); 
        
        if(!isValid){
            throw new Error("Password is wrong")
        }
        const token = await this.getTokens(existingUser);
        const hashedRefreshToken = await this.hashPassword(token.refreshToken)


        await this.prisma.refreshToken.create({
            data: {
                userId: existingUser.id,
                token: token.refreshToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }

        });
        return token;

    }
    async getTokens(user: any) {
        const payload = {
            sub: user.id,
            role: user.role
        }

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(
                payload,
                {secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
                    expiresIn: this.configService.getOrThrow<StringValue>(
                        'JWT_ACCESS_EXPIRATION'
                    ),
                },
            ),
            this.jwtService.signAsync(
                payload,
                {secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
                    expiresIn: this.configService.getOrThrow<StringValue>(
                        'JWT_REFRESH_EXPIRATION'
                    ),
                },
            ),
        ]);
        return {
            token: accessToken,
            refreshToken: refreshToken
        }
    }

    async changePassword(changePasswordDto: ChangePasswordDto, userId: string){
        const {currentPassword, newPassword} = changePasswordDto;
        const user = await this.prisma.user.findUnique({
            where: {id: userId}
        });
        if(!user) throw new Error("User not found");

        const isMatch = await compare(currentPassword, user.password as string);
        if(!isMatch) throw new Error("Current password is incorrect");

        const hashedNewPassword = await this.hashPassword(newPassword);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: {id: userId},
                data: {
                    password: hashedNewPassword
                },
            }),

            this.prisma.refreshToken.deleteMany({
                where: {
                    userId: userId
                },
            }),
        ]);
        return {message: "Password changed successfully"};

    }

    async logout(logoutDto: LogoutDto){
        const {refreshToken} = logoutDto;
        if(!refreshToken) throw new Error("Refresh Token is required");
        await this.prisma.refreshToken.deleteMany({
            where: {token: refreshToken}
        });
    }

    async hashPassword(password: string): Promise<string>{
        return await hash(password, 10)
    }

}
