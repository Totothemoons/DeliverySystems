import { Request, Response, NextFunction } from 'express';
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';

@Injectable()
export class Loggermiddlware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, path } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const resTime = Date.now() - startTime;
      if (statusCode === 200 || statusCode === 201) {
        this.logger.log(`${method} ${path} ${statusCode} - ${resTime}ms`);
      }
    });

    next();
  }
}