import {Request, Response, NextFunction} from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class Loggermiddlware implements NestMiddleware {
    constructor(private readonly logger: Logger) {}

    use(req: Request, res: Response, next: NextFunction){
        const { method, path } = req;
        const startTime = new Date().getTime();
        const { statusCode } = res;
        const resTime = new Date().getTime();
        if( statusCode == 200 || statusCode == 201){
            this.logger.log(`${method} ${path} ${statusCode} - ${resTime - startTime}ms`);
        }

        next();
    }
}