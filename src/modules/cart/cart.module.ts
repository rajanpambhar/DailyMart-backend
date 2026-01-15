// =====================================================
// CART MODULE
// Note: Cart is managed client-side in the React app
// This module provides helper endpoints for cart validation
// =====================================================

import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [ProductsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
