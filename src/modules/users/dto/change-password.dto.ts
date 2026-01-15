// =====================================================
// CHANGE PASSWORD DTO
// Migrated from: profile.php password validation
// =====================================================

import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Please enter your current password' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter a new password' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm your new password' })
  confirmNewPassword: string;
}
