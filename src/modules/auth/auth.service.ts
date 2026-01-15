// =====================================================
// AUTH SERVICE
// Handles authentication logic - migrated from PHP login.php, signup.php
// =====================================================

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRole } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullname: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // =====================================================
  // REGISTER - Migrated from PHP signup.php
  // =====================================================
  async register(registerDto: RegisterDto): Promise<{ user: any; tokens: AuthTokens }> {
    const { fullname, email, password, confirmPassword } = registerDto;

    // Validate password confirmation
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email already exists (from PHP: email uniqueness check)
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('This email is already taken');
    }

    // Validate password length (from PHP: strlen check >= 6)
    if (password.length < 6) {
      throw new BadRequestException('Password must have at least 6 characters');
    }

    // Hash password with bcrypt (matches PHP PASSWORD_DEFAULT)
    const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '12'), 10);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        fullname,
        email,
        password: hashedPassword,
        role: UserRole.USER,
      },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    this.logger.log(`New user registered: ${email}`);

    return { user, tokens };
  }

  // =====================================================
  // LOGIN - Migrated from PHP login.php
  // =====================================================
  async login(loginDto: LoginDto): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password } = loginDto;

    this.logger.log(`Login attempt for: ${email}`);

    // Find user by email (from PHP: SELECT with email)
    // Note: MongoDB Prisma doesn't handle deletedAt: null properly, so we check it manually
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    this.logger.log(`User found: ${user ? user.email : 'NOT FOUND'}`);

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password (from PHP: password_verify)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    this.logger.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate tokens (replaces PHP session)
    const tokens = await this.generateTokens(user);

    this.logger.log(`User logged in: ${email}`);

    return {
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  // =====================================================
  // LOGOUT - Migrated from PHP logout.php
  // =====================================================
  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Invalidate refresh token if provided
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    this.logger.log(`User logged out: ${userId}`);
  }

  // =====================================================
  // REFRESH TOKENS
  // =====================================================
  async refreshTokens(userId: string, refreshToken: string): Promise<AuthTokens> {
    // Find the refresh token in database
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        userId,
        token: refreshToken,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete the used refresh token (rotation)
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    return this.generateTokens(storedToken.user);
  }

  // =====================================================
  // TOKEN GENERATION
  // =====================================================
  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      fullname: user.fullname,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const expiresAt = this.calculateExpiry(refreshExpiresIn);

    // Store refresh token in database
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // =====================================================
  // VALIDATE USER (for JWT Strategy)
  // =====================================================
  async validateUser(userId: string): Promise<any> {
    // Note: MongoDB Prisma doesn't handle deletedAt: null properly, so we check it manually
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('User not found');
    }

    // Remove deletedAt from the returned object
    const { deletedAt, ...userWithoutDeletedAt } = user;
    return userWithoutDeletedAt;
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================
  private calculateExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([smhd])$/);
    
    if (!match) {
      // Default to 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return new Date(now.getTime() + value * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
