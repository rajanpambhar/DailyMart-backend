
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
    constructor(private readonly addressesService: AddressesService) { }

    @Post()
    createAddress(@CurrentUser('id') userId: string, @Body() body: any) {
        return this.addressesService.createAddress(userId, body);
    }

    @Get()
    getUserAddresses(@CurrentUser('id') userId: string) {
        return this.addressesService.getUserAddresses(userId);
    }

    @Put(':id')
    updateAddress(
        @CurrentUser('id') userId: string,
        @Param('id') addressId: string,
        @Body() body: any,
    ) {
        return this.addressesService.updateAddress(userId, addressId, body);
    }

    @Delete(':id')
    deleteAddress(
        @CurrentUser('id') userId: string,
        @Param('id') addressId: string,
    ) {
        return this.addressesService.deleteAddress(userId, addressId);
    }
}
