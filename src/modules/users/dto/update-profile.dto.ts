// =====================================================
// UPDATE PROFILE DTO
// =====================================================

import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Full name must be at most 100 characters' })
  fullname?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(255, { message: 'Email must be at most 255 characters' })
  email?: string;
}
