// =====================================================
// CART SERVICE
// Business logic for cart validation and stock checking
// =====================================================

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface ValidatedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  available: boolean;
  stockQuantity: number;
  subtotal: number;
}

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // VALIDATE CART ITEMS
  // Check product availability and stock for all cart items
  // =====================================================
  async validateCart(items: CartItem[]): Promise<{
    items: ValidatedCartItem[];
    total: number;
    allAvailable: boolean;
  }> {
    const validatedItems: ValidatedCartItem[] = [];
    let total = 0;
    let allAvailable = true;

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.deletedAt || !product.isActive) {
        validatedItems.push({
          productId: item.productId,
          name: 'Product not found',
          price: 0,
          quantity: item.quantity,
          available: false,
          stockQuantity: 0,
          subtotal: 0,
        });
        allAvailable = false;
        continue;
      }

      const available = product.stockQuantity >= item.quantity;
      const subtotal = product.price * item.quantity;

      if (!available) {
        allAvailable = false;
      } else {
        total += subtotal;
      }

      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        available,
        stockQuantity: product.stockQuantity,
        subtotal,
      });
    }

    return {
      items: validatedItems,
      total,
      allAvailable,
    };
  }

  // =====================================================
  // CHECK SINGLE PRODUCT STOCK
  // =====================================================
  async checkStock(
    productId: string,
    quantity: number,
  ): Promise<{
    available: boolean;
    stockQuantity: number;
    requestedQuantity: number;
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.deletedAt || !product.isActive) {
      return {
        available: false,
        stockQuantity: 0,
        requestedQuantity: quantity,
      };
    }

    return {
      available: product.stockQuantity >= quantity,
      stockQuantity: product.stockQuantity,
      requestedQuantity: quantity,
    };
  }
}
