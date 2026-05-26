import { SetMetadata } from '@nestjs/common';

export enum UserRole {
    CUSTOMER = 'CUSTOMER',
    DRIVER = 'DRIVER',
    SHOP = 'SHOP',
    ADMIN = 'ADMIN',
}
export const ROLES_KEY = 'roles';
export const Role = (UserRole: UserRole) => SetMetadata(ROLES_KEY, UserRole);