// =====================================================
// CATEGORIES CONTROLLER
// =====================================================

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // =====================================================
  // GET /api/categories - Get all categories
  // =====================================================
  @Get()
  @Public()
  async findAll(@Query('includeInactive') includeInactive?: boolean) {
    const categories = await this.categoriesService.findAll(includeInactive);
    return {
      success: true,
      data: categories,
    };
  }

  // =====================================================
  // GET /api/categories/:slug - Get category by slug
  // =====================================================
  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug);
    return {
      success: true,
      data: category,
    };
  }

  // =====================================================
  // POST /api/categories - Create category (Admin only)
  // =====================================================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return {
      success: true,
      message: 'Category created successfully',
      data: category,
    };
  }

  // =====================================================
  // PUT /api/categories/:id - Update category (Admin only)
  // =====================================================
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    return {
      success: true,
      message: 'Category updated successfully',
      data: category,
    };
  }

  // =====================================================
  // DELETE /api/categories/:id - Delete category (Admin only)
  // =====================================================
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    const result = await this.categoriesService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }

  // =====================================================
  // PATCH /api/categories/:id/toggle-active - Toggle active status (Admin)
  // =====================================================
  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleActive(@Param('id') id: string) {
    const category = await this.categoriesService.toggleActive(id);
    return {
      success: true,
      message: 'Category status updated',
      data: category,
    };
  }
}
