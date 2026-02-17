// =====================================================
// PAYMENT SERVICE
// Handles Razorpay payment integration
// =====================================================

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Import Razorpay using require for CommonJS compatibility
const Razorpay = require('razorpay');
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private razorpay: any;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        // Initialize Razorpay instance
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID') || '',
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET') || '',
        });
    }

    // =====================================================
    // CREATE RAZORPAY ORDER
    // =====================================================
    async createRazorpayOrder(createOrderDto: CreateRazorpayOrderDto) {
        try {
            const { amount, orderId } = createOrderDto;

            // Create Razorpay order
            const options = {
                amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
                currency: 'INR',
                receipt: orderId || `receipt_${Date.now()}`,
                notes: {
                    orderId: orderId || '',
                },
            };

            const razorpayOrder = await this.razorpay.orders.create(options);

            this.logger.log(`Razorpay order created: ${razorpayOrder.id}`);

            // If orderId is provided, update the order with razorpayOrderId
            if (orderId) {
                await this.prisma.order.update({
                    where: { id: orderId },
                    data: { razorpayOrderId: razorpayOrder.id },
                });
            }

            return {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                keyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
            };
        } catch (error: any) {
            this.logger.error(`Failed to create Razorpay order: ${error.message}`);
            throw new BadRequestException('Failed to create payment order');
        }
    }

    // =====================================================
    // VERIFY RAZORPAY PAYMENT
    // =====================================================
    async verifyRazorpayPayment(verifyDto: VerifyRazorpayPaymentDto) {
        try {
            const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = verifyDto;

            // Generate signature for verification
            const generatedSignature = crypto
                .createHmac('sha256', this.configService.get<string>('RAZORPAY_KEY_SECRET') || '')
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex');

            // Verify signature
            if (generatedSignature !== razorpaySignature) {
                this.logger.error(`Payment verification failed for order: ${orderId}`);
                throw new BadRequestException('Invalid payment signature');
            }

            // Update order with payment details and mark as completed
            const updatedOrder = await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    razorpayOrderId,
                    razorpayPaymentId,
                    razorpaySignature,
                    paymentStatus: 'COMPLETED',
                },
                include: {
                    orderItems: {
                        include: {
                            product: { select: { name: true, image: true } },
                        },
                    },
                },
            });

            this.logger.log(`Payment verified successfully for order: ${orderId}`);

            return {
                success: true,
                message: 'Payment verified successfully',
                order: updatedOrder,
            };
        } catch (error: any) {
            this.logger.error(`Payment verification error: ${error.message}`);
            throw new BadRequestException(error.message || 'Payment verification failed');
        }
    }

    // =====================================================
    // HANDLE RAZORPAY WEBHOOK
    // =====================================================
    async handleWebhook(body: any, signature: string) {
        try {
            const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET') || '';

            // Verify webhook signature
            const generatedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(body))
                .digest('hex');

            if (generatedSignature !== signature) {
                this.logger.error('Invalid webhook signature');
                throw new BadRequestException('Invalid webhook signature');
            }

            const event = body.event;
            const payload = body.payload.payment.entity;

            this.logger.log(`Webhook received: ${event}`);

            // Handle different webhook events
            switch (event) {
                case 'payment.captured':
                    await this.handlePaymentCaptured(payload);
                    break;
                case 'payment.failed':
                    await this.handlePaymentFailed(payload);
                    break;
                default:
                    this.logger.log(`Unhandled webhook event: ${event}`);
            }

            return { success: true };
        } catch (error: any) {
            this.logger.error(`Webhook handling error: ${error.message}`);
            throw new BadRequestException('Webhook processing failed');
        }
    }

    // =====================================================
    // HANDLE PAYMENT CAPTURED
    // =====================================================
    private async handlePaymentCaptured(payload: any) {
        const orderId = payload.notes?.orderId;

        if (orderId) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'COMPLETED',
                    razorpayPaymentId: payload.id,
                },
            });

            this.logger.log(`Payment captured for order: ${orderId}`);
        }
    }

    // =====================================================
    // HANDLE PAYMENT FAILED
    // =====================================================
    private async handlePaymentFailed(payload: any) {
        const orderId = payload.notes?.orderId;

        if (orderId) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: {
                    paymentStatus: 'FAILED',
                },
            });

            this.logger.log(`Payment failed for order: ${orderId}`);
        }
    }

    // =====================================================
    // GET RAZORPAY KEY ID (For Frontend)
    // =====================================================
    getRazorpayKeyId() {
        return {
            keyId: this.configService.get<string>('RAZORPAY_KEY_ID'),
        };
    }
}
