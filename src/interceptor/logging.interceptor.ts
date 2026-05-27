import {ExecutionContext ,Injectable, CallHandler, NestInterceptor, RequestTimeoutException} from '@nestjs/common';
import { Observable, tap, map, throwError, TimeoutError  } from 'rxjs';
import { timeout, catchError} from 'rxjs/operators';

@Injectable()

export class LoggingInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const now = Date.now();
        const request = context.switchToHttp().getRequest();
        const {method , url} = request;

        return next.handle().pipe(
            timeout(5000),
            map((data) => ({
                success: true,
                data,
            })),
            tap(() => {
                console.log(`Request to: ${method} ${url} - ${Date.now() - now}ms`);
            }),
            catchError((err) => {
                if(err instanceof TimeoutError){
                    return throwError(() => new RequestTimeoutException());
                }
                return throwError(() => err);
            }
        ))
    }
}