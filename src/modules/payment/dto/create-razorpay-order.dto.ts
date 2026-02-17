// =====================================================
// CREATE RAZORPAY ORDER DTO
// =====================================================

import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class CreateRazorpayOrderDto {
    @IsNumber()
    @IsPositive()
    amount!: number; // Amount in INR

    @IsOptional()
    @IsString()
    orderId?: string; // Optional: Link to existing order
}
