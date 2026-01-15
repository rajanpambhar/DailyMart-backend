// =====================================================
// CATEGORIES SERVICE
// Migrated from: admin_categories.php
// =====================================================

import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // GET ALL CATEGORIES
  // =====================================================
  async findAll(includeInactive: boolean = false) {
    // MongoDB/Prisma workaround: Fetch all and filter manually for soft delete
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.filter(category => {
      // Exclude soft-deleted
      if (category.deletedAt) return false;
      // Exclude inactive if not requested
      if (!includeInactive && !category.isActive) return false;
      return true;
    });
  }

  // =====================================================
  // GET CATEGORY BY SLUG
  // =====================================================
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // =====================================================
  // GET CATEGORY BY ID
  // =====================================================
  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // =====================================================
  // CREATE CATEGORY (Admin only)
  // Migrated from: admin_categories.php (add_category)
  // =====================================================
  async create(createCategoryDto: CreateCategoryDto) {
    // Check if slug already exists
    const existing = await this.prisma.category.findUnique({
      where: { slug: createCategoryDto.slug },
    });

    if (existing) {
      throw new ConflictException('Category slug already exists');
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    this.logger.log(`Category created: ${category.slug}`);
    return category;
  }

  // =====================================================
  // UPDATE CATEGORY (Admin only)
  // Migrated from: admin_categories.php (edit_category)
  // =====================================================
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findById(id);

    // Check if new slug conflicts with existing
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: updateCategoryDto.slug },
      });

      if (existing && existing.id !== id) {
        throw new ConflictException('Category slug already exists');
      }
    }

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    this.logger.log(`Category updated: ${id}`);
    return updatedCategory;
  }

  // =====================================================
  // DELETE CATEGORY (Admin only, Soft delete)
  // Migrated from: admin_categories.php (delete)
  // =====================================================
  async delete(id: string) {
    const category = await this.findById(id);

    // Check if category has products
    if (category._count.products > 0) {
      throw new ConflictException('Cannot delete category with existing products');
    }

    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Category soft deleted: ${id}`);
    return { message: 'Category deleted successfully' };
  }

  // =====================================================
  // TOGGLE CATEGORY ACTIVE STATUS
  // =====================================================
  async toggleActive(id: string) {
    const category = await this.findById(id);

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    this.logger.log(`Category active status toggled: ${id} -> ${updatedCategory.isActive}`);
    return updatedCategory;
  }
}
