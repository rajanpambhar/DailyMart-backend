
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AddressesService {
    constructor(private prisma: PrismaService) { }

    async createAddress(userId: string, data: any) {
        // If this is the first address or user marked it as default, handle default flag
        if (data.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        } else {
            // If it's the first address, force it to be default
            const count = await this.prisma.address.count({ where: { userId } });
            if (count === 0) {
                data.isDefault = true;
            }
        }

        return this.prisma.address.create({
            data: {
                ...data,
                userId,
            },
        });
    }

    async getUserAddresses(userId: string) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: { isDefault: 'desc' }, // Show default first
        });
    }

    async updateAddress(userId: string, addressId: string, data: any) {
        const address = await this.prisma.address.findUnique({
            where: { id: addressId },
        });

        if (!address || address.userId !== userId) {
            throw new NotFoundException('Address not found');
        }

        if (data.isDefault && !address.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        return this.prisma.address.update({
            where: { id: addressId },
            data,
        });
    }

    async deleteAddress(userId: string, addressId: string) {
        const address = await this.prisma.address.findUnique({
            where: { id: addressId },
        });

        if (!address || address.userId !== userId) {
            throw new NotFoundException('Address not found');
        }

        return this.prisma.address.delete({
            where: { id: addressId },
        });
    }
}
