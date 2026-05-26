import { ForbiddenException } from '@nestjs/common';

export class CustomForbiddenException
   extends ForbiddenException {

   constructor(
      message? : string
   ) {
      super({
         success: false,
         statusCode: 403,
         message: message || "Forbidden",
      });
   }
}