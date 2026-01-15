// =====================================================
// REGISTER DTO - Validation for registration requests
// Migrated from: PHP signup.php validation
// =====================================================

import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Please enter your full name' })
  @MaxLength(100, { message: 'Full name must be at most 100 characters' })
  fullname: string;

  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Please enter an email' })
  @MaxLength(255, { message: 'Email must be at most 255 characters' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Please enter a password' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Please confirm password' })
  confirmPassword: string;
}
