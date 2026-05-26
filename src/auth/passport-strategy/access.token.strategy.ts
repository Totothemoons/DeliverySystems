import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole} from '../decorator/role.decorator';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
export interface JwtPayload {
    sub: string;
    role: UserRole;
}

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt'){
    constructor(configService: ConfigService){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
        })
    }

    validate(payload: JwtPayload){
        return payload;
    }
}