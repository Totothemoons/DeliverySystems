import { Controller, Get , UseGuards,Req, Post, Body, Patch, Param,Delete, HttpCode, HttpStatus} from '@nestjs/common';
import { AddressService } from './address.service';
import { AccessTokenGuard } from '../auth/guard/access-token.guard';
import { CreateAddressDto } from './dto/create.dto';
import { UpdateAddressDto } from './dto/update.dto';

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

    @Patch(':id')
    async updateAddress(
        @Req() req: RequestWithUser,
        @Param('id') addressId: string,
        @Body() dto: UpdateAddressDto,
    ) {
        return this.addressService.updateAddress(req.user.sub, addressId, dto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async deleteAddress(
        @Req() req: RequestWithUser,
        @Param('id') addressId: string,
    ) {
        return this.addressService.deleteAddress(req.user.sub, addressId);
  }

  @Patch(':id/default')
    async setDefaultAddress(
        @Req() req: RequestWithUser,
        @Param('id') addressId: string,
    ) {
        return this.addressService.setDefaultAddress(req.user.sub, addressId);
  }
}
