import { Controller, Get , UseGuards,Req} from '@nestjs/common';
import { AddressService } from './address.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';


interface RequestWithUser extends Request {
    user: {sub: string; role: string};
}

@UseGuards(AccessTokenGuard)
@Controller('address')
export class AddressController {
    constructor(
        private readonly addressService: AddressService
    ) {}

    @Get()
    async getAddresses(@Req() req: RequestWithUser) {
        return this.addressService.getAddresses(req.user.sub);
    }
}
