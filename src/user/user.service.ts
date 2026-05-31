import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { CustomBadRequestException } from '../common/exception/bad-request.exception.js';
import { CustomNotFoundException } from '../common/exception/not-found.exception.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class UserService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudinary: CloudinaryService) {}
  
    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullname: true,
                phone: true,
                role: true,
                authProvider: true,
                profileImageUrl: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    
        if (!user) {
            throw new CustomNotFoundException('User not found');
        }
    
        return user;
    }
    
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
    
        if (!user) {
            throw new CustomNotFoundException('User not found');
        }
    
        // Check phone uniqueness if provided
        if (dto.phone && dto.phone !== user.phone) {
            const phoneExists = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (phoneExists) {
                throw new CustomBadRequestException('Phone number already in use');
            }
        }
    
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.fullname && { fullname: dto.fullname }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
            },
            select: {
                id: true,
                email: true,
                fullname: true,
                phone: true,
                role: true,
                profileImageUrl: true,
                isActive: true,
                updatedAt: true,
            },
        });
    
        return updated;
    }
        
    async deactivateAccount(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
    
        if (!user) {
            throw new CustomNotFoundException('User not found');
        }
    
        if (!user.isActive) {
            throw new CustomBadRequestException('Account is already deactivated');
        }
    
        await this.prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });
    
        return { message: 'Account deactivated successfully' };
    }
    async uploadAvatar(userId: string, file: Express.Multer.File) {
        if (!file) throw new CustomBadRequestException('No file uploaded');

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new CustomBadRequestException('Only JPEG, PNG, WebP allowed');
        }

        const url = await this.cloudinary.uploadFile(file, 'avatars');

        return this.prisma.user.update({
            where: { id: userId },
            data: { profileImageUrl: url },
            select: { id: true, profileImageUrl: true, updatedAt: true },
        });
    }
}
