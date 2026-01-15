// =====================================================
// PRODUCTS SERVICE
// Business logic for product management
// =====================================================

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // GET ALL PRODUCTS WITH FILTERING AND PAGINATION
  // =====================================================
  async findAll(query: ProductQueryDto) {
    const {
      category,
      isActive,
      isBestSelling,
      search,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Remove deletedAt: null as it fails in MongoDB Prisma
    const where: any = {};

    if (category) {
      where.categorySlug = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isBestSelling !== undefined) {
      where.isBestSelling = isBestSelling;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Fetch ALL matching products (without pagination) to filter soft-deletes manually
    const allMatchingProducts = await this.prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { [sortBy]: sortOrder },
    });

    // Filter out soft-deleted products
    const filteredProducts = allMatchingProducts.filter(p => !p.deletedAt);
    
    // Apply pagination in memory
    const total = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =====================================================
  // GET BEST SELLING PRODUCTS
  // =====================================================
  async findBestSelling(limit: number = 6) {
    // Fetch more than limit to account for potential soft deletes, then filter
    // For safety with seeded data, we'll fetch all matching active/bestselling
    const products = await this.prisma.product.findMany({
      where: { isActive: true, isBestSelling: true },
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return products.filter(p => !p.deletedAt).slice(0, limit);
  }

  // =====================================================
  // GET PRODUCTS BY CATEGORY
  // =====================================================
  async findByCategory(slug: string) {
    const products = await this.prisma.product.findMany({
      where: { categorySlug: slug, isActive: true },
      include: {
        category: { select: { name: true, slug: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    return products.filter(p => !p.deletedAt);
  }

  // =====================================================
  // GET PRODUCT BY ID
  // =====================================================
  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    if (!product || product.deletedAt) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // =====================================================
  // CREATE PRODUCT
  // =====================================================
  async create(createProductDto: CreateProductDto) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { slug: createProductDto.categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    this.logger.log(`Product created: ${product.name}`);
    return product;
  }

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findById(id); // Use findById to check existence and deletedAt

    // Verify category if being updated
    if (updateProductDto.categorySlug) {
      const category = await this.prisma.category.findUnique({
        where: { slug: updateProductDto.categorySlug },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    this.logger.log(`Product updated: ${id}`);
    return updatedProduct;
  }

  // =====================================================
  // DELETE PRODUCT (Soft delete)
  // =====================================================
  async delete(id: string) {
    const product = await this.findById(id); // Use findById to check existence and deletedAt

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Product soft deleted: ${id}`);
    return { message: 'Product deleted successfully' };
  }

  // =====================================================
  // TOGGLE BEST SELLING STATUS
  // =====================================================
  async toggleBestSelling(id: string) {
    const product = await this.findById(id); // Use findById to check existence and deletedAt

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { isBestSelling: !product.isBestSelling },
      include: {
        category: { select: { name: true, slug: true } },
      },
    });

    this.logger.log(`Product best selling toggled: ${id} -> ${updatedProduct.isBestSelling}`);
    return updatedProduct;
  }
}
