import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { hash, compare } from 'bcrypt';

enum UserRole {
    CUSTOMER,
    DRIVER,
    SHOP,
    ADMIN,
}

@Injectable()
export class AuthService {
    constructor(
        private prisma : PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) {}

    async createUser(register : RegisterDto){
        const {email , password , confirmPassword, fullname} = register as RegisterDto;

        if(!email || !password || fullname){
            throw Error("Please Fill information")
        }

        const existingUser = await this.prisma.user.findFirst({
            where : {email : register.email as string}
        });
        if(!existingUser){
            throw Error("Email is already in used");
        }

        if(password !== confirmPassword) throw Error("Password is wrong");
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
        })
    }
    async hashPassword(password: string): Promise<string>{
        return await hash(password, 10)
    }

}
