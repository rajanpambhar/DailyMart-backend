import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponsService {
    constructor(private prisma: PrismaService) { }

    async create(createCouponDto: CreateCouponDto) {
        const existingCoupon = await this.prisma.coupon.findUnique({
            where: { code: createCouponDto.code },
        });

        if (existingCoupon) {
            throw new BadRequestException('Coupon with this code already exists');
        }

        return this.prisma.coupon.create({
            data: createCouponDto,
        });
    }

    async findAll() {
        return this.prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { id },
        });

        if (!coupon) {
            throw new NotFoundException('Coupon not found');
        }

        return coupon;
    }

    async update(id: string, updateCouponDto: any) {
        return this.prisma.coupon.update({
            where: { id },
            data: updateCouponDto,
        });
    }

    async remove(id: string) {
        return this.prisma.coupon.delete({
            where: { id },
        });
    }

    async validateCoupon(code: string) {
        const coupon = await this.prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
        });

        if (!coupon) {
            throw new NotFoundException('Invalid coupon code');
        }

        if (!coupon.isActive) {
            throw new BadRequestException('This coupon is no longer active');
        }

        if (new Date(coupon.expiry) < new Date()) {
            throw new BadRequestException('This coupon has expired');
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            throw new BadRequestException('This coupon usage limit has been reached');
        }

        return coupon;
    }

    async incrementUsage(code: string) {
        return this.prisma.coupon.update({
            where: { code },
            data: {
                usageCount: {
                    increment: 1,
                },
            },
        });
    }
}
