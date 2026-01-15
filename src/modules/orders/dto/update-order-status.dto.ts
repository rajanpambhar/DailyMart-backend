// =====================================================
// UPDATE ORDER STATUS DTO
// =====================================================

import { IsOptional, IsEnum } from 'class-validator';
import { PaymentStatus, DeliveryStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(DeliveryStatus)
  deliveryStatus?: DeliveryStatus;
}
