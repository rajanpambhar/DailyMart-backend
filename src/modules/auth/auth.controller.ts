// =====================================================
// AUTH CONTROLLER
// API endpoints for authentication
// =====================================================

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Get,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // =====================================================
  // POST /api/auth/register - User registration
  // Migrated from: signup.php
  // =====================================================
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.register(registerDto);

    // Set refresh token in HTTP-only cookie for security
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    };
  }

  // =====================================================
  // POST /api/auth/login - User login
  // Migrated from: login.php
  // =====================================================
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, tokens } = await this.authService.login(loginDto);

    // Set refresh token in HTTP-only cookie
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken: tokens.accessToken,
      },
    };
  }

  // =====================================================
  // POST /api/auth/logout - User logout
  // Migrated from: logout.php
  // =====================================================
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;
    await this.authService.logout(user.id, refreshToken);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  // =====================================================
  // POST /api/auth/refresh - Refresh access token
  // =====================================================
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Get refresh token from cookie
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return {
        success: false,
        message: 'Refresh token not provided',
      };
    }

    // The authService will look up the userId from the refresh token
    const tokens = await this.authService.refreshTokens(refreshToken);

    // Set new refresh token in cookie
    this.setRefreshTokenCookie(res, tokens.refreshToken);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    };
  }

  // =====================================================
  // GET /api/auth/me - Get current user profile
  // =====================================================
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: any) {
    return {
      success: true,
      data: user,
    };
  }

  // =====================================================
  // HELPER: Set refresh token cookie
  // =====================================================
  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }
}
