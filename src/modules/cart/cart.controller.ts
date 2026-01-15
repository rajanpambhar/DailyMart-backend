// =====================================================
// CART CONTROLLER
// API endpoints for cart validation
// =====================================================

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { CartService, CartItem } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ValidateCartDto } from './dto/validate-cart.dto';
import { CheckStockDto } from './dto/check-stock.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // =====================================================
  // POST /api/cart/validate - Validate cart items
  // Migrated from: cart.php validation logic
  // =====================================================
  @Post('validate')
  async validateCart(@Body() validateCartDto: ValidateCartDto) {
    const result = await this.cartService.validateCart(validateCartDto.items);
    return {
      success: true,
      data: result,
    };
  }

  // =====================================================
  // POST /api/cart/check-stock - Check single product stock
  // =====================================================
  @Post('check-stock')
  async checkStock(@Body() checkStockDto: CheckStockDto) {
    const result = await this.cartService.checkStock(
      checkStockDto.productId,
      checkStockDto.quantity,
    );
    return {
      success: true,
      data: result,
    };
  }
}
