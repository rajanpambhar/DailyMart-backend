// =====================================================
// CHECK STOCK DTO
// =====================================================

import { IsString, IsNumber, Min, IsNotEmpty } from 'class-validator';

export class CheckStockDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
