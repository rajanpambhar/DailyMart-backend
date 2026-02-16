
import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    getWishlist(@CurrentUser('id') userId: string) {
        return this.wishlistService.getWishlist(userId);
    }

    @Post(':productId')
    addToWishlist(
        @CurrentUser('id') userId: string,
        @Param('productId') productId: string,
    ) {
        return this.wishlistService.addToWishlist(userId, productId);
    }

    @Delete(':productId')
    removeFromWishlist(
        @CurrentUser('id') userId: string,
        @Param('productId') productId: string,
    ) {
        return this.wishlistService.removeFromWishlist(userId, productId);
    }
}
