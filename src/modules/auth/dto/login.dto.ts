// =====================================================
// LOGIN DTO - Validation for login requests
// Migrated from: PHP login.php validation
// =====================================================

import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Please enter email' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter your password' })
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
