import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding coupons...');

    const coupons = [
        {
            code: 'WELCOME50',
            discount: 50,
            type: 'PERCENTAGE', // 50% OFF
            expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
            usageLimit: 100,
            isActive: true,
        },
        {
            code: 'FLAT100',
            discount: 100,
            type: 'FIXED', // ₹100 OFF
            expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            usageLimit: 50,
            isActive: true,
        },
        {
            code: 'SAVE20',
            discount: 20,
            type: 'PERCENTAGE',
            expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            isActive: true,
        },
    ];

    for (const coupon of coupons) {
        const exists = await prisma.coupon.findUnique({
            where: { code: coupon.code },
        });

        if (!exists) {
            await prisma.coupon.create({
                data: coupon,
            });
            console.log(`Created coupon: ${coupon.code}`);
        } else {
            console.log(`Coupon already exists: ${coupon.code}`);
        }
    }

    console.log('Coupons seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
