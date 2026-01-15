// =====================================================
// USERS CONTROLLER
// API endpoints for user management
// =====================================================

import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // =====================================================
  // GET /api/users - Get all users (Admin only)
  // Migrated from: admin_users.php
  // =====================================================
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
    };
  }

  // =====================================================
  // GET /api/users/statistics - Get user statistics (Admin only)
  // Migrated from: admin_users.php statistics section
  // =====================================================
  @Get('statistics')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    const statistics = await this.usersService.getStatistics();
    return {
      success: true,
      data: statistics,
    };
  }

  // =====================================================
  // GET /api/users/profile - Get current user profile
  // Migrated from: profile.php
  // =====================================================
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.usersService.findById(user.id);
    return {
      success: true,
      data: profile,
    };
  }

  // =====================================================
  // PUT /api/users/profile - Update current user profile
  // Migrated from: profile.php (form submission)
  // =====================================================
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const updatedUser = await this.usersService.updateProfile(user.id, updateProfileDto);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    };
  }

  // =====================================================
  // PATCH /api/users/password - Change password
  // Migrated from: profile.php (password change section)
  // =====================================================
  @Patch('password')
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const result = await this.usersService.changePassword(user.id, changePasswordDto);
    return {
      success: true,
      message: result.message,
    };
  }

  // =====================================================
  // GET /api/users/:id - Get user by ID (Admin only)
  // =====================================================
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return {
      success: true,
      data: user,
    };
  }

  // =====================================================
  // PATCH /api/users/:id/toggle-role - Toggle user role (Admin only)
  // Migrated from: admin_users.php?action=toggle_role
  // =====================================================
  @Patch(':id/toggle-role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleRole(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    const updatedUser = await this.usersService.toggleRole(id, admin.id);
    return {
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    };
  }

  // =====================================================
  // DELETE /api/users/:id - Delete user (Admin only, soft delete)
  // Migrated from: admin_users.php?action=delete
  // =====================================================
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    const result = await this.usersService.deleteUser(id, admin.id);
    return {
      success: true,
      message: result.message,
    };
  }
}
