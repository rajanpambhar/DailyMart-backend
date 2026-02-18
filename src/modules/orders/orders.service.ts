// =====================================================
// ORDERS SERVICE
// Business logic for order management
// =====================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { PaymentStatus, DeliveryStatus } from '@prisma/client';

import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly couponsService: CouponsService
  ) { }

  // =====================================================
  // CREATE ORDER
  // =====================================================
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { items, paymentMethod, shippingName, shippingAddress, shippingPhone, couponCode } = createOrderDto;

    // Validate all products and calculate total
    let totalAmount = 0;
    const orderItems: { productId: string; quantity: number; price: number; subtotal: number }[] = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || product.deletedAt || !product.isActive) {
        throw new BadRequestException(`Product not found: ${item.productId}`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(`Insufficient stock for product: ${product.name}`);
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        subtotal,
      });
    }

    // Handle Coupon Logic
    let discountAmount = 0;
    let finalAmount = totalAmount;
    let validCoupon = null;

    if (couponCode) {
      try {
        const coupon = await this.couponsService.validateCoupon(couponCode);
        validCoupon = coupon;

        if (coupon.type === 'PERCENTAGE') {
          discountAmount = (totalAmount * coupon.discount) / 100;
        } else {
          // If FIXED, ensure discount doesn't exceed total
          discountAmount = Math.min(coupon.discount, totalAmount);
        }

        finalAmount = Math.max(0, totalAmount - discountAmount);
      } catch (error) {
        // Should we fail if coupon is invalid? Probably yes, to avoid confusion.
        // Or just ignore it? The user explicitly provided a couponCode, so failing is better.
        throw error;
      }
    }

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          discountAmount,
          finalAmount,
          couponCode: validCoupon ? validCoupon.code : null,
          paymentMethod,
          shippingName,
          shippingAddress,
          shippingPhone,
          orderItems: {
            create: orderItems,
          },
        },
        include: {
          orderItems: {
            include: {
              product: { select: { name: true, image: true } },
            },
          },
        },
      });

      // Decrease stock quantities
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
      }

      // Increment coupon usage
      if (validCoupon) {
        await tx.coupon.update({
          where: { id: validCoupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    this.logger.log(`Order created: ${order.id} by user ${userId}`);
    return order;
  }

  // =====================================================
  // GET ALL ORDERS (Admin)
  // =====================================================
  async findAll(query: OrderQueryDto) {
    const { status, deliveryStatus, userId, page = 1, limit = 20 } = query;

    const where: any = {};

    if (status) {
      where.paymentStatus = status;
    }

    if (deliveryStatus) {
      where.deliveryStatus = deliveryStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, fullname: true, email: true } },
          orderItems: {
            include: {
              product: { select: { name: true, image: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // =====================================================
  // GET USER ORDERS
  // =====================================================
  async findUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================================
  // GET ORDER BY ID
  // =====================================================
  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullname: true, email: true } },
        orderItems: {
          include: {
            product: { select: { name: true, image: true, price: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // =====================================================
  // GET STATISTICS (Admin)
  // =====================================================
  async getStatistics() {
    // Get today's date in IST (India Standard Time - UTC+5:30)
    const today = new Date();
    // Convert to IST by adding 5 hours 30 minutes offset
    const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
    const istDate = new Date(today.getTime() + istOffset);
    istDate.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC for database query
    const todayStart = new Date(istDate.getTime() - istOffset);

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      todayOrders,
      totalRevenue,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      this.prisma.order.count({ where: { paymentStatus: PaymentStatus.COMPLETED } }),
      this.prisma.order.count({
        where: {
          orderDate: { gte: todayStart },
        },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullname: true, email: true } },
        },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      todayOrders,
      cancelledOrders: await this.prisma.order.count({
        where: { paymentStatus: PaymentStatus.CANCELLED },
      }),
      totalRevenue: totalRevenue._sum.finalAmount || 0,
      recentOrders,
    };
  }

  // =====================================================
  // GET REVENUE TRENDS (Last 7 days)
  // =====================================================
  async getRevenueTrends() {
    const days = 7;
    const trends = [];
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds

    for (let i = days - 1; i >= 0; i--) {
      // Calculate date in IST
      const now = new Date();
      const istNow = new Date(now.getTime() + istOffset);
      istNow.setUTCDate(istNow.getUTCDate() - i);
      istNow.setUTCHours(0, 0, 0, 0);

      // Convert to UTC for database query
      const dateStart = new Date(istNow.getTime() - istOffset);
      const dateEnd = new Date(dateStart);
      dateEnd.setDate(dateEnd.getDate() + 1);

      const [revenue, orders] = await Promise.all([
        this.prisma.order.aggregate({
          where: {
            paymentStatus: PaymentStatus.COMPLETED,
            orderDate: {
              gte: dateStart,
              lt: dateEnd,
            },
          },
          _sum: { finalAmount: true },
        }),
        this.prisma.order.count({
          where: {
            orderDate: {
              gte: dateStart,
              lt: dateEnd,
            },
          },
        }),
      ]);

      // Format date in IST for display
      const displayDate = new Date(istNow.getTime());
      trends.push({
        date: displayDate.toISOString().split('T')[0],
        revenue: revenue._sum.finalAmount || 0,
        orders,
      });
    }

    return trends;
  }

  // =====================================================
  // GET TOP SELLING PRODUCTS
  // =====================================================
  async getTopProducts(limit: number = 5) {
    const orderItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    const productsWithDetails = await Promise.all(
      orderItems.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        });

        return {
          product,
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: item._sum.subtotal || 0,
        };
      })
    );

    return productsWithDetails.filter(item => item.product !== null);
  }

  // =====================================================
  // UPDATE PAYMENT STATUS
  // =====================================================
  async updatePaymentStatus(id: string, status: PaymentStatus) {
    const order = await this.findById(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: status },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
    });

    this.logger.log(`Order ${id} payment status updated to ${status}`);
    return updatedOrder;
  }

  // =====================================================
  // UPDATE DELIVERY STATUS
  // =====================================================
  async updateDeliveryStatus(id: string, status: DeliveryStatus) {
    const order = await this.findById(id);

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { deliveryStatus: status },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, image: true } },
          },
        },
      },
    });

    this.logger.log(`Order ${id} delivery status updated to ${status}`);
    return updatedOrder;
  }

  // =====================================================
  // CANCEL ORDER
  // =====================================================
  async cancelOrder(id: string, userId?: string) {
    const order = await this.findById(id);

    // If userId is provided, verify ownership
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You cannot cancel this order');
    }

    // Only pending orders can be cancelled
    if (order.paymentStatus !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Cancel order and restore stock
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: PaymentStatus.CANCELLED,
          deliveryStatus: DeliveryStatus.CANCELLED,
        },
      });

      // Restore stock quantities
      for (const item of order.orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
          },
        });
      }
    });

    this.logger.log(`Order ${id} cancelled`);
    return { message: 'Order cancelled successfully' };
  }
}
