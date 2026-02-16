
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
    constructor(private prisma: PrismaService) { }

    async createReview(userId: string, productId: string, rating: number, comment?: string) {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                comment,
            },
            include: {
                user: {
                    select: {
                        fullname: true,
                    },
                },
            },
        });
    }

    async getProductReviews(productId: string) {
        return this.prisma.review.findMany({
            where: { productId },
            include: {
                user: {
                    select: {
                        fullname: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async deleteReview(userId: string, reviewId: string) {
        const review = await this.prisma.review.findUnique({
            where: { id: reviewId },
        });

        if (!review) {
            throw new NotFoundException('Review not found');
        }

        if (review.userId !== userId) {
            // Check if user is admin could be added here
            throw new ForbiddenException('You can only delete your own reviews');
        }

        return this.prisma.review.delete({
            where: { id: reviewId },
        });
    }
}
