// =====================================================
// MONGODB DATABASE EXPORT SCRIPT
// Exports all collections to JSON files
// =====================================================

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportDatabase() {
  const exportDir = path.join(process.cwd(), 'database-exports');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const exportPath = path.join(exportDir, timestamp);

  // Create export directory
  if (!fs.existsSync(exportPath)) {
    fs.mkdirSync(exportPath, { recursive: true });
  }

  console.log('🚀 Starting database export...');
  console.log(`📁 Export location: ${exportPath}\n`);

  try {
    // Export Users
    console.log('📤 Exporting users...');
    const users = await prisma.user.findMany();
    fs.writeFileSync(
      path.join(exportPath, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    console.log(`✅ Exported ${users.length} users`);

    // Export Categories
    console.log('📤 Exporting categories...');
    const categories = await prisma.category.findMany();
    fs.writeFileSync(
      path.join(exportPath, 'categories.json'),
      JSON.stringify(categories, null, 2)
    );
    console.log(`✅ Exported ${categories.length} categories`);

    // Export Products
    console.log('📤 Exporting products...');
    const products = await prisma.product.findMany({
      include: {
        category: true,
        reviews: true,
      },
    });
    fs.writeFileSync(
      path.join(exportPath, 'products.json'),
      JSON.stringify(products, null, 2)
    );
    console.log(`✅ Exported ${products.length} products`);

    // Export Orders
    console.log('📤 Exporting orders...');
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
    fs.writeFileSync(
      path.join(exportPath, 'orders.json'),
      JSON.stringify(orders, null, 2)
    );
    console.log(`✅ Exported ${orders.length} orders`);

    // Export Order Items
    console.log('📤 Exporting order items...');
    const orderItems = await prisma.orderItem.findMany();
    fs.writeFileSync(
      path.join(exportPath, 'order-items.json'),
      JSON.stringify(orderItems, null, 2)
    );
    console.log(`✅ Exported ${orderItems.length} order items`);

    // Export Addresses
    console.log('📤 Exporting addresses...');
    const addresses = await prisma.address.findMany();
    fs.writeFileSync(
      path.join(exportPath, 'addresses.json'),
      JSON.stringify(addresses, null, 2)
    );
    console.log(`✅ Exported ${addresses.length} addresses`);

    // Export Reviews
    console.log('📤 Exporting reviews...');
    const reviews = await prisma.review.findMany({
      include: {
        user: true,
        product: true,
      },
    });
    fs.writeFileSync(
      path.join(exportPath, 'reviews.json'),
      JSON.stringify(reviews, null, 2)
    );
    console.log(`✅ Exported ${reviews.length} reviews`);

    // Export Wishlists
    console.log('📤 Exporting wishlists...');
    const wishlists = await prisma.wishlist.findMany({
      include: {
        user: true,
        product: true,
      },
    });
    fs.writeFileSync(
      path.join(exportPath, 'wishlists.json'),
      JSON.stringify(wishlists, null, 2)
    );
    console.log(`✅ Exported ${wishlists.length} wishlist items`);

    // Export Coupons
    console.log('📤 Exporting coupons...');
    const coupons = await prisma.coupon.findMany();
    fs.writeFileSync(
      path.join(exportPath, 'coupons.json'),
      JSON.stringify(coupons, null, 2)
    );
    console.log(`✅ Exported ${coupons.length} coupons`);

    // Export Refresh Tokens
    console.log('📤 Exporting refresh tokens...');
    const refreshTokens = await prisma.refreshToken.findMany();
    fs.writeFileSync(
      path.join(exportPath, 'refresh-tokens.json'),
      JSON.stringify(refreshTokens, null, 2)
    );
    console.log(`✅ Exported ${refreshTokens.length} refresh tokens`);

    // Create a summary file
    const summary = {
      exportDate: new Date().toISOString(),
      collections: {
        users: users.length,
        categories: categories.length,
        products: products.length,
        orders: orders.length,
        orderItems: orderItems.length,
        addresses: addresses.length,
        reviews: reviews.length,
        wishlists: wishlists.length,
        coupons: coupons.length,
        refreshTokens: refreshTokens.length,
      },
      totalDocuments:
        users.length +
        categories.length +
        products.length +
        orders.length +
        orderItems.length +
        addresses.length +
        reviews.length +
        wishlists.length +
        coupons.length +
        refreshTokens.length,
    };

    fs.writeFileSync(
      path.join(exportPath, '_export-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log('\n✨ Export completed successfully!');
    console.log(`📊 Total documents exported: ${summary.totalDocuments}`);
    console.log(`📁 Files saved to: ${exportPath}`);
  } catch (error) {
    console.error('❌ Error during export:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the export
exportDatabase()
  .then(() => {
    console.log('\n✅ Database export finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Export failed:', error);
    process.exit(1);
  });
