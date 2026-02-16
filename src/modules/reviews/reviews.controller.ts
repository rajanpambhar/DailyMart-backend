
import { Controller, Get, Post, Body, Param, UseGuards, ParseIntPipe, Delete } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    @Post(':productId')
    @UseGuards(JwtAuthGuard)
    createReview(
        @CurrentUser('id') userId: string,
        @Param('productId') productId: string,
        @Body('rating', ParseIntPipe) rating: number,
        @Body('comment') comment?: string,
    ) {
        return this.reviewsService.createReview(userId, productId, rating, comment);
    }

    @Get(':productId')
    getProductReviews(@Param('productId') productId: string) {
        return this.reviewsService.getProductReviews(productId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    deleteReview(
        @CurrentUser('id') userId: string,
        @Param('id') reviewId: string,
    ) {
        return this.reviewsService.deleteReview(userId, reviewId);
    }
}
