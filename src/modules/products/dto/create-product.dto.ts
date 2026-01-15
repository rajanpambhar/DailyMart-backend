// =====================================================
// CREATE PRODUCT DTO
// Migrated from: admin_products.php validation
// =====================================================

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Product name is required' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price must be non-negative' })
  @Type(() => Number)
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Slashed price must be a number' })
  @Min(0, { message: 'Slashed price must be non-negative' })
  @Type(() => Number)
  slashedPrice?: number;

  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  @MaxLength(100)
  categorySlug: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Stock quantity must be non-negative' })
  @Type(() => Number)
  stockQuantity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isBestSelling?: boolean;
}
