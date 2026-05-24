import { Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, UserRole } from '../decorator/role.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private readonly reflector: Reflector){}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole>
        (ROLES_KEY, [
            context.getHandler(),
            context.getClass()
        ]);

        if(!requiredRoles){
            return true;
        }
        
        const {user} = context.switchToHttp().getRequest();
        return user.role === requiredRoles;
    }  
}