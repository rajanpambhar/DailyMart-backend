// =====================================================
// DATABASE SEED SCRIPT - MongoDB Version
// Seeds categories, products, and admin user
// =====================================================

import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // Seed Categories
  console.log('📁 Seeding categories...');
  const categories = [
    { slug: 'vegetables', name: 'Vegetables', description: 'Fresh vegetables' },
    { slug: 'fruits', name: 'Fruits', description: 'Fresh fruits' },
    { slug: 'home-essentials', name: 'Home Essentials', description: 'Home essentials and utilities' },
    { slug: 'mens-clothing', name: "Men's Clothing", description: 'Fashion for men' },
    { slug: 'womens-clothing', name: "Women's Clothing", description: 'Fashion for women' },
    { slug: 'electronics', name: 'Electronics', description: 'Gadgets and electronics' },
    { slug: 'kids', name: 'Kids', description: 'Products for kids' },
    { slug: 'beauty-products', name: 'Beauty Products', description: 'Beauty and personal care' },
  ];

  for (const cat of categories) {
    await prisma.category.create({ data: cat });
  }

  // Seed Products
  console.log('📦 Seeding products...');
  const products = [
    // Vegetables
    { name: 'Spinach (250g)', price: 25, stockQuantity: 100, categorySlug: 'vegetables', isBestSelling: true },
    { name: 'Tomatoes (1kg)', price: 40, stockQuantity: 150, categorySlug: 'vegetables', isBestSelling: true },
    { name: 'Potatoes (1kg)', price: 30, stockQuantity: 200, categorySlug: 'vegetables' },
    { name: 'Onions (1kg)', price: 35, stockQuantity: 180, categorySlug: 'vegetables' },
    { name: 'Carrots (500g)', price: 28, stockQuantity: 120, categorySlug: 'vegetables' },
    
    // Fruits
    { name: 'Bananas (1 dozen)', price: 50, stockQuantity: 100, categorySlug: 'fruits', isBestSelling: true },
    { name: 'Apples (1kg)', price: 180, stockQuantity: 80, categorySlug: 'fruits', isBestSelling: true },
    { name: 'Oranges (1kg)', price: 80, stockQuantity: 90, categorySlug: 'fruits' },
    { name: 'Grapes (500g)', price: 60, stockQuantity: 70, categorySlug: 'fruits' },
    
    // Home Essentials
    { name: 'Laundry Detergent (1L)', price: 250, stockQuantity: 60, categorySlug: 'home-essentials' },
    { name: 'Dish Soap (500ml)', price: 85, stockQuantity: 100, categorySlug: 'home-essentials' },
    
    // Men's Clothing
    { name: "Men's T-Shirt (Cotton)", price: 599, slashedPrice: 799, stockQuantity: 50, categorySlug: 'mens-clothing', isBestSelling: true },
    { name: "Men's Jeans (Blue)", price: 1299, slashedPrice: 1599, stockQuantity: 40, categorySlug: 'mens-clothing' },
    
    // Women's Clothing
    { name: "Women's Dress (Floral)", price: 1499, slashedPrice: 1999, stockQuantity: 30, categorySlug: 'womens-clothing', isBestSelling: true },
    { name: "Women's Kurti", price: 799, stockQuantity: 60, categorySlug: 'womens-clothing' },
    
    // Electronics
    { name: 'Wireless Earbuds', price: 1999, slashedPrice: 2999, stockQuantity: 25, categorySlug: 'electronics', isBestSelling: true },
    { name: 'Bluetooth Speaker', price: 1499, stockQuantity: 30, categorySlug: 'electronics' },
    
    // Kids
    { name: 'Building Blocks Set', price: 599, stockQuantity: 40, categorySlug: 'kids', isBestSelling: true },
    { name: 'Coloring Book', price: 149, stockQuantity: 100, categorySlug: 'kids' },
    
    // Beauty Products
    { name: 'Face Cream (50ml)', price: 299, stockQuantity: 70, categorySlug: 'beauty-products', isBestSelling: true },
    { name: 'Shampoo (250ml)', price: 199, stockQuantity: 90, categorySlug: 'beauty-products' },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        price: product.price,
        slashedPrice: product.slashedPrice,
        stockQuantity: product.stockQuantity,
        categorySlug: product.categorySlug,
        isBestSelling: product.isBestSelling || false,
        isActive: true,
      },
    });
  }

  // Seed Users
  console.log('👥 Seeding users...');
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const hashedUserPassword = await bcrypt.hash('user123', 12);

  await prisma.user.create({
    data: {
      fullname: 'Admin User',
      email: 'admin@dailymart.com',
      password: hashedAdminPassword,
      role: UserRole.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      fullname: 'Test User',
      email: 'user@dailymart.com',
      password: hashedUserPassword,
      role: UserRole.USER,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📧 Default credentials:');
  console.log('   Admin: admin@dailymart.com / admin123');
  console.log('   User:  user@dailymart.com / user123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
