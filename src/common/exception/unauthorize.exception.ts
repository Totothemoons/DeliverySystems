import { UnauthorizedException } from '@nestjs/common';

export class CustomUnauthorizedException
   extends UnauthorizedException {

   constructor(
      message? : string
   ) {
      super({
         success: false,
         statusCode: 401,
         message: message || "unauthorized",
      });
   }
}