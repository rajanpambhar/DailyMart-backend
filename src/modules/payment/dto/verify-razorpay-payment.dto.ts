// =====================================================
// VERIFY RAZORPAY PAYMENT DTO
// =====================================================

import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyRazorpayPaymentDto {
    @IsString()
    @IsNotEmpty()
    razorpayOrderId!: string;

    @IsString()
    @IsNotEmpty()
    razorpayPaymentId!: string;

    @IsString()
    @IsNotEmpty()
    razorpaySignature!: string;

    @IsString()
    @IsNotEmpty()
    orderId!: string; // Our database order ID
}
