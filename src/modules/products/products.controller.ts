// =====================================================
// PRODUCTS CONTROLLER
// API endpoints for products
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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '@prisma/client';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  // =====================================================
  // GET /api/products - Get all products with filtering
  // Public endpoint for browsing products
  // =====================================================
  @Get()
  @Public()
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.productsService.findAll(query);
    return {
      success: true,
      data: result.products,
      pagination: result.pagination,
    };
  }

  // =====================================================
  // GET /api/products/best-selling - Get best selling products
  // Migrated from: index.php (best selling section)
  // =====================================================
  @Get('best-selling')
  @Public()
  async findBestSelling(@Query('limit') limit?: number) {
    const products = await this.productsService.findBestSelling(limit || 6);
    return {
      success: true,
      data: products,
    };
  }

  // =====================================================
  // GET /api/products/category/:slug - Get products by category
  // Migrated from: vegetables.php, fruits.php, etc.
  // =====================================================
  @Get('category/:slug')
  @Public()
  async findByCategory(@Param('slug') slug: string) {
    const products = await this.productsService.findByCategory(slug);
    return {
      success: true,
      data: products,
    };
  }

  // =====================================================
  // GET /api/products/:id - Get single product
  // =====================================================
  @Get(':id')
  @Public()
  async findById(@Param('id') id: string) {
    const product = await this.productsService.findById(id);
    return {
      success: true,
      data: product,
    };
  }

  // =====================================================
  // POST /api/products - Create new product (Admin only)
  // Migrated from: admin_products.php (add_product)
  // =====================================================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      createProductDto.image = result.secure_url;
    }
    const product = await this.productsService.create(createProductDto);
    return {
      success: true,
      message: 'Product created successfully',
      data: product,
    };
  }

  // =====================================================
  // PUT /api/products/:id - Update product (Admin only)
  // Migrated from: admin_products.php (edit_product)
  // =====================================================
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      const result = await this.cloudinaryService.uploadImage(file);
      updateProductDto.image = result.secure_url;
    }
    const product = await this.productsService.update(id, updateProductDto);
    return {
      success: true,
      message: 'Product updated successfully',
      data: product,
    };
  }

  // =====================================================
  // DELETE /api/products/:id - Delete product (Admin only)
  // Migrated from: admin_products.php (delete)
  // =====================================================
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async delete(@Param('id') id: string) {
    const result = await this.productsService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }

  // =====================================================
  // PATCH /api/products/:id/toggle-best-selling - Toggle best selling (Admin)
  // Migrated from: admin_best_selling.php
  // =====================================================
  @Patch(':id/toggle-best-selling')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleBestSelling(@Param('id') id: string) {
    const product = await this.productsService.toggleBestSelling(id);
    return {
      success: true,
      message: 'Best selling status updated',
      data: product,
    };
  }
}
