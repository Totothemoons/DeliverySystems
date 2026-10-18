import { SetMetadata } from '@nestjs/common';
import { User } from '../../generated/prisma/client';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    DRIVER = 'DRIVER',
    SHOP = 'SHOP',
    ADMIN = 'ADMIN',
}
export const ROLES_KEY = 'roles';
export const Role = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
