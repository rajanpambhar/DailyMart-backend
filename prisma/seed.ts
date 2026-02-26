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
    {
      name: 'Spinach (250g)',
      description: 'Fresh organic spinach leaves, perfect for salads and cooking',
      price: 25,
      slashedPrice: 0,
      stockQuantity: 100,
      categorySlug: 'vegetables',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772083686/dailymart_products/qigfihybs2aabsoz5oie.png',
      isBestSelling: true,
    },
    {
      name: 'Tomatoes (1kg)',
      description: 'Fresh red tomatoes, rich in vitamins and antioxidants',
      price: 40,
      slashedPrice: 0,
      stockQuantity: 150,
      categorySlug: 'vegetables',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772083722/dailymart_products/rxftdcu9njczfez2gvr1.png',
      isBestSelling: true,
    },
    {
      name: 'Potatoes (1kg)',
      description: 'Premium quality potatoes, versatile for all your cooking needs',
      price: 30,
      slashedPrice: 0,
      stockQuantity: 199,
      categorySlug: 'vegetables',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772083742/dailymart_products/sir4dq2kk2tryreaoubd.png',
      isBestSelling: true,
    },
    {
      name: 'Onions (1kg)',
      description: 'Fresh onions, essential ingredient for daily cooking',
      price: 35,
      slashedPrice: 0,
      stockQuantity: 179,
      categorySlug: 'vegetables',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772083957/dailymart_products/rqpchmsjnqframlqs7co.png',
      isBestSelling: true,
    },
    {
      name: 'Carrots (500g)',
      description: 'Crunchy and nutritious carrots, high in vitamin A',
      price: 28,
      slashedPrice: 0,
      stockQuantity: 120,
      categorySlug: 'vegetables',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084002/dailymart_products/jf7dcz19mmm3wwnjco0o.png',
      isBestSelling: true,
    },

    // Fruits
    {
      name: 'Bananas (1 dozen)',
      description: 'Fresh yellow bananas, great source of potassium and energy',
      price: 50,
      slashedPrice: 0,
      stockQuantity: 99,
      categorySlug: 'fruits',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084033/dailymart_products/hn8df2velwfk51mr8z5e.png',
      isBestSelling: true,
    },
    {
      name: 'Apples (1kg)',
      description: 'Crisp and juicy apples, perfect for snacking',
      price: 180,
      slashedPrice: 0,
      stockQuantity: 79,
      categorySlug: 'fruits',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084054/dailymart_products/unctfclaklhrqv645ihc.webp',
      isBestSelling: true,
    },
    {
      name: 'Oranges (1kg)',
      description: 'Juicy oranges packed with vitamin C',
      price: 80,
      slashedPrice: 0,
      stockQuantity: 89,
      categorySlug: 'fruits',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084072/dailymart_products/vo9ylp5lej7b6dgwy2j0.png',
      isBestSelling: true,
    },
    {
      name: 'Grapes (500g)',
      description: 'Sweet and seedless grapes, perfect for healthy snacking',
      price: 60,
      slashedPrice: 0,
      stockQuantity: 69,
      categorySlug: 'fruits',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084198/dailymart_products/jdal72yc4inmkmgqlzr9.png',
      isBestSelling: true,
    },

    // Home Essentials
    {
      name: 'Laundry Detergent (1L)',
      description: 'Powerful cleaning formula for fresh and clean clothes',
      price: 250,
      slashedPrice: 0,
      stockQuantity: 59,
      categorySlug: 'home-essentials',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084139/dailymart_products/io9mefp7xgnglvjlxvdy.png',
      isBestSelling: true,
    },
    {
      name: 'Dish Soap (500ml)',
      description: 'Effective dish cleaning liquid with lemon freshness',
      price: 85,
      slashedPrice: 0,
      stockQuantity: 100,
      categorySlug: 'home-essentials',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772085292/dailymart_products/sr2use2zejkoaxyfxd5t.png',
      isBestSelling: true,
    },

    // Men's Clothing
    {
      name: "Men's T-Shirt (Cotton)",
      description: 'Comfortable 100% cotton t-shirt for everyday wear',
      price: 599,
      slashedPrice: 799,
      stockQuantity: 48,
      categorySlug: 'mens-clothing',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084976/dailymart_products/ezrfnishk7aavk5hz8k2.png',
      isBestSelling: true,
    },
    {
      name: "Men's Jeans (Blue)",
      description: 'Classic blue denim jeans with perfect fit',
      price: 1299,
      slashedPrice: 1599,
      stockQuantity: 39,
      categorySlug: 'mens-clothing',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084952/dailymart_products/ib3oc0b5cqsjdegqcn4s.png',
      isBestSelling: true,
    },

    // Women's Clothing
    {
      name: "Women's Dress (Floral)",
      description: 'Beautiful floral print dress for elegant occasions',
      price: 1499,
      slashedPrice: 1999,
      stockQuantity: 28,
      categorySlug: 'womens-clothing',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084711/dailymart_products/h1oro2c0rpblv1uffwon.png',
      isBestSelling: true,
    },
    {
      name: "Women's Kurti",
      description: 'Traditional and stylish kurti for everyday comfort',
      price: 799,
      slashedPrice: 0,
      stockQuantity: 60,
      categorySlug: 'womens-clothing',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084601/dailymart_products/pzhkg6atzy0zvuw8pedn.png',
      isBestSelling: true,
    },

    // Electronics
    {
      name: 'Wireless Earbuds',
      description: 'Premium quality wireless earbuds with noise cancellation',
      price: 1999,
      slashedPrice: 2999,
      stockQuantity: 24,
      categorySlug: 'electronics',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084319/dailymart_products/n8teiesnhbqeetdxfneh.png',
      isBestSelling: true,
    },
    {
      name: 'Bluetooth Speaker',
      description: 'Portable Bluetooth speaker with amazing sound quality',
      price: 1499,
      slashedPrice: 0,
      stockQuantity: 30,
      categorySlug: 'electronics',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084303/dailymart_products/gybnaqnjtazj7ois5jml.png',
      isBestSelling: true,
    },

    // Kids
    {
      name: 'Building Blocks Set',
      description: 'Educational building blocks for creative play',
      price: 599,
      slashedPrice: 0,
      stockQuantity: 40,
      categorySlug: 'kids',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772084287/dailymart_products/v4s95kajs1w9rco3sr1d.png',
      isBestSelling: true,
    },
    {
      name: 'Coloring Book',
      description: 'Fun coloring book with various themes for kids',
      price: 149,
      slashedPrice: 0,
      stockQuantity: 97,
      categorySlug: 'kids',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772085237/dailymart_products/vezsdq2bzqip2v8in1nk.png',
      isBestSelling: true,
    },

    // Beauty Products
    {
      name: 'Face Cream (50ml)',
      description: 'Moisturizing face cream for glowing skin',
      price: 299,
      slashedPrice: 0,
      stockQuantity: 69,
      categorySlug: 'beauty-products',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772085109/dailymart_products/gsmh0njm0rkriobcr1yx.png',
      isBestSelling: true,
    },
    {
      name: 'Shampoo (250ml)',
      description: 'Nourishing shampoo for healthy and shiny hair',
      price: 199,
      slashedPrice: 0,
      stockQuantity: 83,
      categorySlug: 'beauty-products',
      image: 'https://res.cloudinary.com/drh1pyp2t/image/upload/v1772085154/dailymart_products/v8v0ltgcg91j444tdfos.png',
      isBestSelling: true,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        name: product.name,
        description: product.description || '',
        price: product.price,
        slashedPrice: product.slashedPrice || 0,
        stockQuantity: product.stockQuantity,
        categorySlug: product.categorySlug,
        image: product.image,
        isBestSelling: product.isBestSelling || false,
        isActive: true,
      },
    });
  }

  // Seed Users
  console.log('👥 Seeding users...');
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const hashedUserPassword = await bcrypt.hash('Rajan123', 12);

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
      fullname: 'Rajan Pambhar',
      email: 'rajanpambhar02@gmail.com',
      password: hashedUserPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('📧 Default credentials:');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
