import { BadRequestException} from '@nestjs/common';

export class CustomBadRequestException
   extends BadRequestException {

   constructor(
      message? : string
   ) {
      super({
         success: false,
         statusCode: 400,
         message: message || "Bad Request",
      });
   }
}