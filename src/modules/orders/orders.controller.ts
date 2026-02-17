// =====================================================
// ORDERS CONTROLLER
// API endpoints for orders
// =====================================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, PaymentStatus, DeliveryStatus } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  // =====================================================
  // POST /api/orders - Create new order (checkout)
  // Migrated from: checkout.php (place_order)
  // =====================================================
  @Post()
  async createOrder(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const order = await this.ordersService.createOrder(user.id, createOrderDto);
    return {
      success: true,
      message: 'Order placed successfully',
      data: order,
    };
  }

  // =====================================================
  // GET /api/orders - Get all orders (Admin only)
  // Migrated from: admin_orders.php
  // =====================================================
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(@Query() query: OrderQueryDto) {
    const result = await this.ordersService.findAll(query);
    return {
      success: true,
      data: result.orders,
      pagination: result.pagination,
    };
  }

  // =====================================================
  // GET /api/orders/my-orders - Get current user's orders
  // =====================================================
  @Get('my-orders')
  async getMyOrders(@CurrentUser() user: any) {
    const orders = await this.ordersService.findUserOrders(user.id);
    return {
      success: true,
      data: orders,
    };
  }

  // =====================================================
  // GET /api/orders/statistics - Get order statistics (Admin)
  // Migrated from: admin_index.php dashboard
  // =====================================================
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    const statistics = await this.ordersService.getStatistics();
    return {
      success: true,
      data: statistics,
    };
  }

  // =====================================================
  // GET /api/orders/analytics/revenue-trends - Get revenue trends (Admin)
  // =====================================================
  @Get('analytics/revenue-trends')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getRevenueTrends() {
    const trends = await this.ordersService.getRevenueTrends();
    return {
      success: true,
      data: trends,
    };
  }

  // =====================================================
  // GET /api/orders/analytics/top-products - Get top selling products (Admin)
  // =====================================================
  @Get('analytics/top-products')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getTopProducts(@Query('limit') limit?: number) {
    const products = await this.ordersService.getTopProducts(limit || 5);
    return {
      success: true,
      data: products,
    };
  }

  // =====================================================
  // GET /api/orders/:id - Get order details
  // Migrated from: admin_orders.php?action=view
  // =====================================================
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const order = await this.ordersService.findById(id);

    // Non-admin users can only view their own orders
    if (user.role !== UserRole.ADMIN && order.userId !== user.id) {
      return {
        success: false,
        message: 'Order not found',
      };
    }

    return {
      success: true,
      data: order,
    };
  }

  // =====================================================
  // PATCH /api/orders/:id/payment-status - Update payment status (Admin)
  // Migrated from: admin_orders.php (update_status)
  // =====================================================
  @Patch(':id/payment-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updatePaymentStatus(
      id,
      updateDto.paymentStatus as PaymentStatus,
    );
    return {
      success: true,
      message: 'Payment status updated successfully',
      data: order,
    };
  }

  // =====================================================
  // PATCH /api/orders/:id/delivery-status - Update delivery status (Admin)
  // Migrated from: admin_orders.php (update_delivery_status)
  // =====================================================
  @Patch(':id/delivery-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    const order = await this.ordersService.updateDeliveryStatus(
      id,
      updateDto.deliveryStatus as DeliveryStatus,
    );
    return {
      success: true,
      message: 'Delivery status updated successfully',
      data: order,
    };
  }

  // =====================================================
  // POST /api/orders/:id/cancel - Cancel order
  // =====================================================
  @Post(':id/cancel')
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    // Admin can cancel any order, users can only cancel their own
    const userId = user.role === UserRole.ADMIN ? undefined : user.id;
    const result = await this.ordersService.cancelOrder(id, userId);
    return {
      success: true,
      message: result.message,
    };
  }
}
