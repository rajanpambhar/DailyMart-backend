// =====================================================
// PAYMENT CONTROLLER
// Handles Razorpay payment endpoints
// =====================================================

import {
    Controller,
    Post,
    Body,
    Get,
    Headers,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreateRazorpayOrderDto } from './dto/create-razorpay-order.dto';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    // =====================================================
    // CREATE RAZORPAY ORDER
    // POST /payment/create-order
    // =====================================================
    @Post('create-order')
    @UseGuards(JwtAuthGuard)
    async createOrder(@Body() createOrderDto: CreateRazorpayOrderDto) {
        return this.paymentService.createRazorpayOrder(createOrderDto);
    }

    // =====================================================
    // VERIFY RAZORPAY PAYMENT
    // POST /payment/verify
    // =====================================================
    @Post('verify')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async verifyPayment(@Body() verifyDto: VerifyRazorpayPaymentDto) {
        return this.paymentService.verifyRazorpayPayment(verifyDto);
    }

    // =====================================================
    // RAZORPAY WEBHOOK
    // POST /payment/webhook
    // =====================================================
    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleWebhook(
        @Body() body: any,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        return this.paymentService.handleWebhook(body, signature);
    }

    // =====================================================
    // GET RAZORPAY KEY ID
    // GET /payment/key
    // =====================================================
    @Get('key')
    getRazorpayKey() {
        return this.paymentService.getRazorpayKeyId();
    }
}
