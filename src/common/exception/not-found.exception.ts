import { NotFoundException } from '@nestjs/common';

export class CustomNotFoundException
   extends NotFoundException {

   constructor(
      message?: string
   ) {
      super({
         success: false,
         statusCode: 404,
         message: message || "Not Found",
      });
   }
}