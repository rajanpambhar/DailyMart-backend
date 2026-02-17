// =====================================================
// CREATE ORDER DTO
// Migrated from: checkout.php validation
// =====================================================

import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsNumber,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(PaymentMethod, { message: 'Please select a valid payment method' })
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your full name' })
  @MaxLength(100)
  shippingName: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your shipping address' })
  shippingAddress: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your phone number' })
  @MaxLength(20)
  shippingPhone: string;

  @IsString()
  @IsOptional()
  couponCode?: string;

  @IsNumber()
  @IsOptional()
  discountAmount?: number;
}
