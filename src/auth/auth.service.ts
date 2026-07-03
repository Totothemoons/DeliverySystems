import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { hash, compare } from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JWTTokens } from './auth.controller';
import { StringValue } from 'ms'
import { LogoutDto } from './dto/logout.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CustomUnauthorizedException } from '../common/exception/unauthorize.exception'
import { CustomBadRequestException } from '../common/exception/bad-request.exception'
import { CustomNotFoundException } from '../common/exception/not-found.exception'
import { forgotPasswordDto } from './dto/forgot-password.js';
import { Role } from './decorator/role.decorator';
import { MaillerService } from '../mailler/mailler.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './passport-strategy/access.token.strategy';
import * as crypto from 'crypto';

enum UserRole {
    CUSTOMER,
    DRIVER,
    SHOP,
    ADMIN,
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma : PrismaService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MaillerService
    ) {}

    async createUser(register : RegisterDto){
        const {email , password , confirmPassword, fullname} = register as RegisterDto;

        if(!email || !password || !fullname){
            throw new CustomBadRequestException("Email, fullname and password are required")
        }

        const existingUser = await this.prisma.user.findFirst({
            where : {email : register.email as string}
        });
        if( existingUser){
            throw new CustomBadRequestException("Email is already in used");
        }

        if(password !== confirmPassword) throw new CustomBadRequestException("Password is wrong");
        const hashPassword = await this.hashPassword(password);
        
        const token = crypto.randomBytes(32).toString("hex");
        await this.prisma.user.create({
            data: {
                email: email,
                password: hashPassword,
                fullname: fullname,
                role: "CUSTOMER",
                phone: register.phone,
                profileImageUrl: register.profileImageUrl
            }
        });
        await this.mailService.sendVerifyEmail(register.email!, token);
    }
    async login(loginDto: LoginDto) : Promise<JWTTokens>{
        const { email , password} = loginDto;

        if(!email || !password) throw new Error("Please Fill information");

        const existingUser = await this.prisma.user.findFirst({
            where: {email : email}
        });
        if(!existingUser){
            throw new CustomNotFoundException("Not Found this Account")
        }
        const isValid = await compare(loginDto.password, existingUser.password as string); 
        
        if(!isValid){
            throw new CustomUnauthorizedException("Invalid Credential")
        }
        const token = await this.getTokens(existingUser);
        const hashedRefreshToken = await this.hashPassword(token.refreshToken)


        await this.prisma.refreshToken.create({
            data: {
                userId: existingUser.id,
                token: hashedRefreshToken,
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
        if(!user) throw new CustomNotFoundException("User not found");

        const isMatch = await compare(currentPassword, user.password as string);
        if(!isMatch) throw new CustomUnauthorizedException("Invalid Credential");

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
    async refreshToken(token: string): Promise<JWTTokens> {
        try{
            if(!token) {
                throw new CustomUnauthorizedException("RefreshToken required!");
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET')
            });
            const findToken  = await this.prisma.refreshToken.findMany({
                where : {
                    userId: payload.sub,
                    revoked: false,
                    expiresAt: {
                        gt: new Date()
                    },
                },
                include: {
                    user: true
                },
            });
            let storedToken: (typeof findToken)[number] | null = null;
            for(const t of findToken){
                const match = await compare(token, t.token)
                if(match){
                    storedToken = t;
                    break;
                }
            }

            if (!storedToken) {
                throw new CustomNotFoundException();
            }
            
            const tokens = await this.getTokens(storedToken.user);
            const hashedToken = await this.hashPassword(tokens.refreshToken);

            await this.prisma.$transaction([
                this.prisma.refreshToken.delete({
                    where: {
                        id : storedToken.id
                    }    
                }),

                this.prisma.refreshToken.create({
                    data: {
                        userId: storedToken.user.id,
                        token: hashedToken,
                        expiresAt: new Date(
                            Date.now() + 7 * 24 * 60 * 60 * 1000,
                        ),
                    },
                })
            ]);

            return tokens

        }catch(err){
            throw new Error("Internal server");
        }

    }

    async logout(refreshToken: string, userid: string){
        if(!refreshToken) throw new Error("Refresh Token is required");
        const findToken = await this.prisma.refreshToken.findMany({
            where: {
                userId : userid,
                revoked: false,
                expiresAt: {
                    gt: new Date()
                },
            },
        });
        let storedToken : (typeof findToken)[number] | null = null; 
        for(const t of findToken){
            const match = await compare(refreshToken, t.token);
            if(match){
                storedToken = t;
                break;
            }
        }
        await this.prisma.refreshToken.delete({
            where: {id : storedToken?.id}
        })
    }
    async forgotPassword(forgotDto : forgotPasswordDto){

        const user = await this.prisma.user.findFirst({
            where: {
                email : forgotDto.email
            }
        });
        if(user){
            const resetToken = await this.jwtService.signAsync(
                {sub: user.id, role: user.role},
                {secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET'),
                    expiresIn: this.configService.get<StringValue>('JWT_RESET_PASSWORD_EXPIRATION')
                }
            );
            const hashToken = await this.hashPassword(resetToken);
            await this.prisma.passwordResetToken.create({
                data: {
                    userId: user.id,
                    token: hashToken,
                    expiresAt: new Date(
                        Date.now() + 15 * 60 * 1000
                    )
                }
            });
            await this.mailService.sendPasswordResetEmail(user.email!, resetToken);

        }
        return {message : "If the email is registered, you will receive a password reset link."};

    }
    async resetPassword(resetPasswordDto : ResetPasswordDto){
        const { newPassword , token} = resetPasswordDto;
        const payload : JwtPayload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('JWT_RESET_PASSWORD_SECRET')
        });
        
        const resetTokens =
            await this.prisma.passwordResetToken.findMany({
                where: {
                    userId: payload.sub,
                    used: false,
                    expiresAt: {
                    gt: new Date(),
                    },
                },
            });

        let validToken : (typeof resetTokens)[number] | null = null;

        for (const t of resetTokens) {
            const match = await compare(token, t.token);
            if (match) {
                validToken = t;
                break;
            }
        }

        if (!validToken) {
            throw new CustomNotFoundException();
        }
        const hashedPassword = await this.hashPassword(newPassword);
        await this.prisma.$transaction([
            this.prisma.user.update({
                where: {id: payload.sub},
                data: {
                    password: hashedPassword
                }
            }),
            this.prisma.refreshToken.updateMany({
                where: {userId : payload.sub},
                data: {
                    revoked: true
                }
            }),
            this.prisma.passwordResetToken.update({
                where: {id: validToken.id},
                data: {
                    used: true
                }
            })
        ]);
        return { message : "Password reset successful. Please login with your new password."}
    }

    async hashPassword(password: string): Promise<string>{
        return await hash(password, 10)
    }

}
