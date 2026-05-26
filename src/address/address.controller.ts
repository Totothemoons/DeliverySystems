import { Controller, Get , UseGuards,Req, Post, Body} from '@nestjs/common';
import { AddressService } from './address.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { CreateAddressDto } from './dto/create.dto';


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

    @Post()
    async createAddress(
        @Req() req: RequestWithUser,
        @Body() dto: CreateAddressDto,
    ) {
        return this.addressService.createAddress(req.user.sub, dto);
    }
    
}
