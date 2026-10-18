import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY, UserRole } from '../decorator/role.decorator';

@Injectable()
export class RoleGuard extends AuthGuard('jwt') {
    constructor(private readonly reflector: Reflector) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if(!requiredRoles){
            return true;
        }

        await super.canActivate(context);

        const { user } = context.switchToHttp().getRequest();
        if (!user) {
            throw new UnauthorizedException();
        }

        return requiredRoles.includes(user.role);
    }  
}
