// =====================================================
// REFRESH TOKEN DTO
// =====================================================

import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  refreshToken?: string;
}
