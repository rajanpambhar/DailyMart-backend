
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
    constructor(private prisma: PrismaService) { }

    async getWishlist(userId: string) {
        const wishlistItems = await this.prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Transform to return just the products with an added property if needed, 
        // or just return the list of products.
        return wishlistItems.map(item => item.product);
    }

    async addToWishlist(userId: string, productId: string) {
        // Check if product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check if already in wishlist
        const existing = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (existing) {
            throw new ConflictException('Product already in wishlist');
        }

        return this.prisma.wishlist.create({
            data: {
                userId,
                productId,
            },
        });
    }

    async removeFromWishlist(userId: string, productId: string) {
        // Check if exists
        const existing = await this.prisma.wishlist.findUnique({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });

        if (!existing) {
            throw new NotFoundException('Product not in wishlist');
        }

        return this.prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId,
                },
            },
        });
    }
}
