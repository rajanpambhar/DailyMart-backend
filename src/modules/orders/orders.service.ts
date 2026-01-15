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

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // CREATE ORDER
  // =====================================================
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    const { items, paymentMethod, shippingName, shippingAddress, shippingPhone } = createOrderDto;

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

    // Create order with items in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
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
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { paymentStatus: PaymentStatus.PENDING } }),
      this.prisma.order.count({ where: { paymentStatus: PaymentStatus.COMPLETED } }),
      this.prisma.order.aggregate({
        where: { paymentStatus: PaymentStatus.COMPLETED },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders: await this.prisma.order.count({
        where: { paymentStatus: PaymentStatus.CANCELLED },
      }),
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
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
